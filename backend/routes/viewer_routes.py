

import os

from flask import (
    Blueprint,
    jsonify,
    g,
    current_app,
    request,
    send_file
)

from db import get_db_connection
from middleware.permissions import role_required
from services.audit_service import record_audit_event

viewer_bp = Blueprint(
    "viewer",
    __name__,
    url_prefix="/api/viewer"
)


# 1. View documents shared with the logged-in Viewer
@viewer_bp.route("/documents", methods=["GET"])
@role_required("VIEWER")
def get_shared_documents():

    connection = None
    cursor = None

    try:
        # Connect to MySQL
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the logged-in Viewer's ID from the JWT middleware
        viewer_id = g.current_user["user_id"]

        # Find documents shared with this Viewer
        query = """
            SELECT
                d.document_id,
                d.document_name,
                d.created_at,
                u.name AS owner_name,
                p.can_view,
                p.can_download,
                p.expires_at
            FROM document_permissions p
            JOIN documents d
                ON p.document_id = d.document_id
            JOIN users u
                ON d.owner_id = u.user_id
            WHERE
                p.viewer_id = %s
                AND p.can_view = TRUE
                AND p.revoked_at IS NULL
                AND (p.expires_at IS NULL
                     OR p.expires_at > CURRENT_TIMESTAMP)
                AND d.is_deleted = FALSE
            ORDER BY p.granted_at DESC
        """

        cursor.execute(query, (viewer_id,))
        documents = cursor.fetchall()

        # Convert dates into JSON-friendly strings
        for document in documents:
            if document["created_at"]:
                document["created_at"] = document["created_at"].isoformat()

            if document["expires_at"]:
                document["expires_at"] = document["expires_at"].isoformat()

        return jsonify({
            "success": True,
            "count": len(documents),
            "documents": documents
        }), 200

    except Exception as error:
        print("Viewer documents error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to retrieve shared documents"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# 2. Securely open a shared document
@viewer_bp.route(
    "/documents/<int:document_id>/view",
    methods=["GET"]
)
@role_required("VIEWER")
def view_shared_document(document_id):

    connection = None
    cursor = None

    viewer_id = g.current_user["user_id"]
    ip_address = request.remote_addr

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # First, find the document
        cursor.execute("""
            SELECT
                document_id,
                document_name,
                storage_path
            FROM documents
            WHERE document_id = %s
              AND is_deleted = FALSE
        """, (document_id,))

        document = cursor.fetchone()

        # Document does not exist or is archived
        if not document:
            record_audit_event(
                viewer_id,
                None,
                "DOCUMENT_VIEW",
                "DENIED",
                "DOCUMENT_NOT_AVAILABLE",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "Document is not available"
            }), 404

        # Check this Viewer's active viewing permission
        cursor.execute("""
            SELECT permission_id
            FROM document_permissions
            WHERE document_id = %s
              AND viewer_id = %s
              AND can_view = TRUE
              AND revoked_at IS NULL
              AND (
                    expires_at IS NULL
                    OR expires_at > CURRENT_TIMESTAMP
              )
            LIMIT 1
        """, (document_id, viewer_id))

        permission = cursor.fetchone()

        # Permission missing, revoked or expired
        if not permission:
            record_audit_event(
                viewer_id,
                document_id,
                "DOCUMENT_VIEW",
                "DENIED",
                "VIEW_PERMISSION_MISSING_OR_EXPIRED",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "You do not have permission to view this document"
            }), 403

        # Get the private upload folder
        upload_folder = os.path.realpath(
            current_app.config["UPLOAD_FOLDER"]
        )

        # Only use the stored filename, never a client-supplied path
        stored_name = os.path.basename(document["storage_path"])

        file_path = os.path.realpath(
            os.path.join(upload_folder, stored_name)
        )

        # Make sure the file is inside the private upload folder
        if os.path.commonpath([upload_folder, file_path]) != upload_folder:
            raise RuntimeError("Invalid document storage path")

        # Check that the file actually exists
        if not os.path.isfile(file_path):
            record_audit_event(
                viewer_id,
                document_id,
                "DOCUMENT_VIEW",
                "DENIED",
                "FILE_NOT_FOUND",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "Document file is unavailable"
            }), 404

        # Record successful access before serving the file
        record_audit_event(
            viewer_id,
            document_id,
            "DOCUMENT_VIEW",
            "ALLOWED",
            "VIEW_PERMISSION_VERIFIED",
            ip_address
        )

        return send_file(
            file_path,
            as_attachment=False,
            download_name=document["document_name"],
            conditional=True
        )

    except Exception as error:
        print("Secure document viewing error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to open document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# 3. Securely download a shared document
@viewer_bp.route(
    "/documents/<int:document_id>/download",
    methods=["GET"]
)
@role_required("VIEWER")
def download_shared_document(document_id):

    connection = None
    cursor = None

    viewer_id = g.current_user["user_id"]
    ip_address = request.remote_addr

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Step 1: Check whether the document exists
        cursor.execute("""
            SELECT
                document_id,
                document_name,
                storage_path
            FROM documents
            WHERE document_id = %s
              AND is_deleted = FALSE
        """, (document_id,))

        document = cursor.fetchone()

        if not document:
            record_audit_event(
                viewer_id,
                None,
                "DOCUMENT_DOWNLOAD",
                "DENIED",
                "DOCUMENT_NOT_AVAILABLE",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "Document is not available"
            }), 404

        # Step 2: Check both viewing and downloading permissions
        cursor.execute("""
            SELECT permission_id
            FROM document_permissions
            WHERE document_id = %s
              AND viewer_id = %s
              AND can_view = TRUE
              AND can_download = TRUE
              AND revoked_at IS NULL
              AND (
                    expires_at IS NULL
                    OR expires_at > CURRENT_TIMESTAMP
              )
            LIMIT 1
        """, (document_id, viewer_id))

        permission = cursor.fetchone()

        # Step 3: Reject users without download permission
        if not permission:
            record_audit_event(
                viewer_id,
                document_id,
                "DOCUMENT_DOWNLOAD",
                "DENIED",
                "DOWNLOAD_PERMISSION_MISSING_OR_EXPIRED",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "You do not have permission to download this document"
            }), 403

        # Step 4: Resolve the private file path
        upload_folder = os.path.realpath(
            current_app.config["UPLOAD_FOLDER"]
        )

        stored_name = os.path.basename(document["storage_path"])

        file_path = os.path.realpath(
            os.path.join(upload_folder, stored_name)
        )

        # Prevent path traversal outside private storage
        if os.path.commonpath(
            [upload_folder, file_path]
        ) != upload_folder:
            raise RuntimeError("Invalid document storage path")

        # Step 5: Check whether the file exists
        if not os.path.isfile(file_path):
            record_audit_event(
                viewer_id,
                document_id,
                "DOCUMENT_DOWNLOAD",
                "DENIED",
                "FILE_NOT_FOUND",
                ip_address
            )

            return jsonify({
                "success": False,
                "message": "Document file is unavailable"
            }), 404

        # Step 6: Record successful download authorization
        record_audit_event(
            viewer_id,
            document_id,
            "DOCUMENT_DOWNLOAD",
            "ALLOWED",
            "DOWNLOAD_PERMISSION_VERIFIED",
            ip_address
        )

        # Step 7: Send the file as a download
        return send_file(
            file_path,
            as_attachment=True,
            download_name=document["document_name"],
            conditional=True
        )

    except Exception as error:
        print("Secure document download error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to download document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# 4. View the logged-in Viewer's own activity history
@viewer_bp.route("/activity", methods=["GET"])
@role_required("VIEWER")
def get_viewer_activity():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        viewer_id = g.current_user["user_id"]

        # Retrieve only this Viewer's audit records
        cursor.execute("""
            SELECT
                a.log_id,
                a.document_id,
                d.document_name,
                a.action,
                a.result,
                a.reason,
                a.timestamp
            FROM audit_logs a
            LEFT JOIN documents d
                ON a.document_id = d.document_id
            WHERE a.user_id = %s
            ORDER BY a.log_id DESC
            LIMIT 100
        """, (viewer_id,))

        activities = cursor.fetchall()

        # Convert timestamps for JSON
        for activity in activities:
            if activity["timestamp"]:
                activity["timestamp"] = (
                    activity["timestamp"].isoformat()
                )

        return jsonify({
            "success": True,
            "count": len(activities),
            "activities": activities
        }), 200

    except Exception as error:
        print("Viewer activity error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to retrieve activity history"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
