

import os
from datetime import datetime, timezone

from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    g
)

from db import get_db_connection

from middleware.permissions import role_required

from services.file_service import (
    allowed_file,
    save_uploaded_file
)


owner_bp = Blueprint(
    "owner",
    __name__,
    url_prefix="/api/owner"
)



@owner_bp.route("/documents", methods=["POST"])
@role_required("OWNER")
def upload_document():

    uploaded_file = request.files.get("file")

    if not uploaded_file or not uploaded_file.filename:
        return jsonify({
            "message": "Please select a document"
        }), 400

    if not allowed_file(uploaded_file.filename):
        return jsonify({
            "message": "Unsupported file type"
        }), 400

    file_info = None
    connection = None
    cursor = None

    try:
        upload_folder = current_app.config["UPLOAD_FOLDER"]

        # Save file privately and calculate its hash
        file_info = save_uploaded_file(
            uploaded_file,
            upload_folder
        )

        connection = get_db_connection()
        cursor = connection.cursor()

        # Store document metadata in MySQL
        cursor.execute(
            """
            INSERT INTO documents
            (
                owner_id,
                document_name,
                storage_path,
                file_hash
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                g.current_user["user_id"],
                file_info["original_name"],
                file_info["storage_name"],
                file_info["file_hash"]
            )
        )

        document_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "message": "Document uploaded successfully",
            "document_id": document_id,
            "document_name": file_info["original_name"],
            "file_hash": file_info["file_hash"]
        }), 201

    except Exception:

        if connection and connection.is_connected():
            connection.rollback()

        # Remove uploaded file if database operation fails
        if file_info and os.path.exists(file_info["file_path"]):
            os.remove(file_info["file_path"])

        return jsonify({
            "message": "Document upload failed"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@owner_bp.route("/documents", methods=["GET"])
@role_required("OWNER")
def get_my_documents():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                document_id,
                document_name,
                file_hash,
                created_at,
                updated_at
            FROM documents
            WHERE owner_id = %s
              AND is_deleted = FALSE
            ORDER BY created_at DESC
            """,
            (g.current_user["user_id"],)
        )

        documents = cursor.fetchall()

        return jsonify({
            "total_documents": len(documents),
            "documents": documents
        }), 200

    except Exception:
        return jsonify({
            "message": "Unable to fetch documents"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()



@owner_bp.route("/documents/<int:document_id>", methods=["GET"])
@role_required("OWNER")
def get_document_details(document_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                document_id,
                document_name,
                file_hash,
                created_at,
                updated_at
            FROM documents
            WHERE document_id = %s
              AND owner_id = %s
              AND is_deleted = FALSE
            """,
            (
                document_id,
                g.current_user["user_id"]
            )
        )

        document = cursor.fetchone()

        if not document:
            return jsonify({
                "message": "Document not found"
            }), 404

        return jsonify({
            "document": document
        }), 200

    except Exception:
        return jsonify({
            "message": "Unable to retrieve document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@owner_bp.route("/documents/<int:document_id>", methods=["PATCH"])
@role_required("OWNER")
def update_document(document_id):

    data = request.get_json(silent=True) or {}

    new_name = data.get("document_name", "").strip()

    if not new_name or len(new_name) > 255:
        return jsonify({
            "message": "Enter a valid document name"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE documents
            SET document_name = %s
            WHERE document_id = %s
              AND owner_id = %s
              AND is_deleted = FALSE
            """,
            (
                new_name,
                document_id,
                g.current_user["user_id"]
            )
        )

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "message": "Document not found"
            }), 404

        connection.commit()

        return jsonify({
            "message": "Document renamed successfully",
            "document_name": new_name
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({
            "message": "Unable to rename document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()



@owner_bp.route("/documents/<int:document_id>", methods=["DELETE"])
@role_required("OWNER")
def archive_document(document_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE documents
            SET is_deleted = TRUE,
                deleted_at = CURRENT_TIMESTAMP
            WHERE document_id = %s
              AND owner_id = %s
              AND is_deleted = FALSE
            """,
            (
                document_id,
                g.current_user["user_id"]
            )
        )

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "message": "Document not found"
            }), 404

        # Revoke all active permissions for this document
        cursor.execute(
            """
            UPDATE document_permissions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE document_id = %s
              AND revoked_at IS NULL
            """,
            (document_id,)
        )

        connection.commit()

        return jsonify({
            "message": "Document archived successfully"
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Unable to archive document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()




@owner_bp.route(
    "/documents/<int:document_id>/share",
    methods=["POST"]
)
@role_required("OWNER")
def share_document(document_id):

    data = request.get_json(silent=True) or {}

    viewer_email = data.get(
        "viewer_email", ""
    ).strip().lower()

    can_view = data.get("can_view", True)
    can_download = data.get("can_download", False)
    expires_at = data.get("expires_at")

    if not viewer_email:
        return jsonify({
            "message": "Viewer email is required"
        }), 400

    if not isinstance(can_view, bool) or not isinstance(can_download, bool):
        return jsonify({
            "message": "Permissions must be true or false"
        }), 400

    if not can_view:
        return jsonify({
            "message": "A shared document must allow viewing"
        }), 400

    # Validate optional expiry date
    if expires_at is not None:
        try:
            expiry = datetime.fromisoformat(
                expires_at.replace("Z", "+00:00")
            )

            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)

            if expiry <= datetime.now(timezone.utc):
                return jsonify({
                    "message": "Expiry date must be in the future"
                }), 400

            expires_at = expiry.astimezone(
                timezone.utc
            ).replace(tzinfo=None)

        except (ValueError, AttributeError):
            return jsonify({
                "message": "Invalid expiry date"
            }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()

        cursor = connection.cursor(dictionary=True)

        # Verify document ownership
        cursor.execute(
            """
            SELECT document_id
            FROM documents
            WHERE document_id = %s
              AND owner_id = %s
              AND is_deleted = FALSE
            """,
            (
                document_id,
                g.current_user["user_id"]
            )
        )

        document = cursor.fetchone()

        if not document:
            connection.rollback()

            return jsonify({
                "message": "Document not found"
            }), 404

        # Find the Viewer
        cursor.execute(
            """
            SELECT users.user_id
            FROM users
            JOIN roles
            ON users.role_id = roles.role_id
            WHERE users.email = %s
              AND roles.role_name = 'VIEWER'
              AND users.status = 'ACTIVE'
            """,
            (viewer_email,)
        )

        viewer = cursor.fetchone()

        if not viewer:
            connection.rollback()

            return jsonify({
                "message": "Active Viewer account not found"
            }), 404

        # Check for an existing active permission
        cursor.execute(
            """
            SELECT permission_id
            FROM document_permissions
            WHERE document_id = %s
              AND viewer_id = %s
              AND revoked_at IS NULL
            FOR UPDATE
            """,
            (document_id, viewer["user_id"])
        )

        existing_permission = cursor.fetchone()

        if existing_permission:
            connection.rollback()

            return jsonify({
                "message": "This document is already shared with this Viewer"
            }), 409

        # Create permission
        cursor.execute(
            """
            INSERT INTO document_permissions
            (
                document_id,
                viewer_id,
                can_view,
                can_download,
                expires_at
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                document_id,
                viewer["user_id"],
                can_view,
                can_download,
                expires_at
            )
        )

        permission_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "message": "Document shared successfully",
            "permission_id": permission_id,
            "viewer_email": viewer_email,
            "can_view": can_view,
            "can_download": can_download
        }), 201

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "message": "Unable to share document"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@owner_bp.route(
    "/permissions/<int:permission_id>",
    methods=["DELETE"]
)
@role_required("OWNER")
def revoke_permission(permission_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE document_permissions
            JOIN documents
                ON document_permissions.document_id =
                   documents.document_id
            SET document_permissions.revoked_at =
                CURRENT_TIMESTAMP
            WHERE document_permissions.permission_id = %s
              AND documents.owner_id = %s
              AND documents.is_deleted = FALSE
              AND document_permissions.revoked_at IS NULL
            """,
            (
                permission_id,
                g.current_user["user_id"]
            )
        )

        if cursor.rowcount == 0:
            connection.rollback()

            return jsonify({
                "message": "Permission not found or already revoked"
            }), 404

        connection.commit()

        return jsonify({
            "message": "Viewer access revoked successfully"
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({
            "message": "Unable to revoke permission"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# Get sharing permissions for an Owner's document
@owner_bp.route(
    "/documents/<int:document_id>/permissions",
    methods=["GET"]
)
@role_required("OWNER")
def get_document_permissions(document_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        owner_id = g.current_user["user_id"]

        # Verify that this document belongs to the logged-in Owner
        cursor.execute("""
            SELECT document_id
            FROM documents
            WHERE document_id = %s
              AND owner_id = %s
              AND is_deleted = FALSE
        """, (document_id, owner_id))

        document = cursor.fetchone()

        if not document:
            return jsonify({
                "success": False,
                "message": "Document not found"
            }), 404

        # Retrieve sharing permissions
        cursor.execute("""
            SELECT
                p.permission_id,
                p.viewer_id,
                u.name AS viewer_name,
                u.email AS viewer_email,
                p.can_view,
                p.can_download,
                p.granted_at,
                p.expires_at,
                p.revoked_at
            FROM document_permissions p
            JOIN users u
                ON p.viewer_id = u.user_id
            WHERE p.document_id = %s
            ORDER BY p.granted_at DESC
        """, (document_id,))

        permissions = cursor.fetchall()

        # Convert dates into JSON-compatible strings
        for permission in permissions:
            for field in ["granted_at", "expires_at", "revoked_at"]:
                if permission[field]:
                    permission[field] = permission[field].isoformat()

        return jsonify({
            "success": True,
            "permissions": permissions
        }), 200

    except Exception as error:
        print("Permission retrieval error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to retrieve permissions"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

@owner_bp.route("/activity", methods=["GET"])
@role_required("OWNER")
def get_owner_activity():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        owner_id = g.current_user["user_id"]

        query = """
            SELECT
                al.log_id,
                al.document_id,
                d.document_name,
                al.user_id,
                u.name AS user_name,
                u.email AS user_email,
                al.action,
                al.result,
                al.reason,
                al.ip_address,
                al.timestamp
            FROM audit_logs al
            INNER JOIN documents d
                ON al.document_id = d.document_id
            LEFT JOIN users u
                ON al.user_id = u.user_id
            WHERE d.owner_id = %s
            ORDER BY al.log_id DESC
            LIMIT 200
        """

        cursor.execute(query, (owner_id,))
        activities = cursor.fetchall()

        for activity in activities:
            if activity["timestamp"]:
                activity["timestamp"] = (
                    activity["timestamp"].isoformat()
                )

        return jsonify({
            "message": "Owner activity retrieved successfully.",
            "activities": activities
        }), 200

    except Exception as e:
        print("Owner activity error:", str(e))

        return jsonify({
            "message": "Unable to retrieve document activity."
        }), 500

    finally:
        cursor.close()
        connection.close()