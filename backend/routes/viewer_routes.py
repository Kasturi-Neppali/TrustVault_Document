

from io import BytesIO

from flask import (
    Blueprint,
    jsonify,
    g,
    request,
    send_file
)

from db import get_db_connection
from middleware.permissions import role_required
from services.audit_service import record_audit_event
from services.file_service import download_file


viewer_bp = Blueprint(
    "viewer",
    __name__,
    url_prefix="/api/viewer"
)


# --------------------------------------------------
# 1. VIEW DOCUMENTS SHARED WITH THE VIEWER
# --------------------------------------------------

@viewer_bp.route("/documents", methods=["GET"])
@role_required("VIEWER")
def get_shared_documents():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        viewer_id = g.current_user["user_id"]

        cursor.execute(
            """
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
                AND (
                    p.expires_at IS NULL
                    OR p.expires_at > CURRENT_TIMESTAMP
                )
                AND d.is_deleted = FALSE
            ORDER BY p.granted_at DESC
            """,
            (viewer_id,)
        )

        documents = cursor.fetchall()

        # Convert dates into JSON-friendly strings
        for document in documents:

            if document["created_at"]:
                document["created_at"] = (
                    document["created_at"].isoformat()
                )

            if document["expires_at"]:
                document["expires_at"] = (
                    document["expires_at"].isoformat()
                )

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

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# 2. SECURELY VIEW A SHARED DOCUMENT
# --------------------------------------------------

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
        cursor = connection.cursor()

        # Step 1: Find the document
        cursor.execute(
            """
            SELECT
                document_id,
                document_name,
                storage_path
            FROM documents
            WHERE document_id = %s
              AND is_deleted = FALSE
            """,
            (document_id,)
        )

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

        # Step 2: Check active viewing permission
        cursor.execute(
            """
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
            """,
            (document_id, viewer_id)
        )

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

        # Step 3: Retrieve the document from private Supabase Storage
        file_content = download_file(document["storage_path"])

        # Step 5: Record successful authorization
        record_audit_event(
            viewer_id,
            document_id,
            "DOCUMENT_VIEW",
            "ALLOWED",
            "VIEW_PERMISSION_VERIFIED",
            ip_address
        )

        # Step 6: Send document for viewing
        return send_file(
            BytesIO(file_content),
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

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# 3. SECURELY DOWNLOAD A SHARED DOCUMENT
# --------------------------------------------------

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
        cursor = connection.cursor()

        # Step 1: Check whether document exists
        cursor.execute(
            """
            SELECT
                document_id,
                document_name,
                storage_path
            FROM documents
            WHERE document_id = %s
              AND is_deleted = FALSE
            """,
            (document_id,)
        )

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

        # Step 2: Check viewing and downloading permissions
        cursor.execute(
            """
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
            """,
            (document_id, viewer_id)
        )

        permission = cursor.fetchone()

        # Step 3: Reject unauthorized download
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

        # Step 4: Retrieve the document from private Supabase Storage
        file_content = download_file(document["storage_path"])

        # Step 6: Record successful download authorization
        record_audit_event(
            viewer_id,
            document_id,
            "DOCUMENT_DOWNLOAD",
            "ALLOWED",
            "DOWNLOAD_PERMISSION_VERIFIED",
            ip_address
        )

        # Step 7: Send file as download
        return send_file(
            BytesIO(file_content),
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

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# 4. VIEW VIEWER ACTIVITY HISTORY
# --------------------------------------------------

@viewer_bp.route("/activity", methods=["GET"])
@role_required("VIEWER")
def get_viewer_activity():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        viewer_id = g.current_user["user_id"]

        # Retrieve only this Viewer's audit records
        cursor.execute(
            """
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
            """,
            (viewer_id,)
        )

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

        if connection and not connection.closed:
            connection.close()
