


from flask import Blueprint, jsonify, request, g

from middleware.permissions import role_required
from db import get_db_connection
from services.audit_verification import verify_audit_chain


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# --------------------------------------------------
# ADMIN DASHBOARD
# --------------------------------------------------

@admin_bp.route("/dashboard", methods=["GET"])
@role_required("ADMIN")
def dashboard():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Total registered users
        cursor.execute(
            "SELECT COUNT(*) AS total_users FROM users"
        )
        total_users = cursor.fetchone()["total_users"]

        # Total documents
        cursor.execute(
            "SELECT COUNT(*) AS total_documents FROM documents"
        )
        total_documents = cursor.fetchone()["total_documents"]

        # Failed login attempts
        cursor.execute(
            """
            SELECT COUNT(*) AS failed_logins
            FROM login_attempts
            WHERE status = 'FAILURE'
            """
        )
        failed_logins = cursor.fetchone()["failed_logins"]

        # Denied document access attempts
        cursor.execute(
            """
            SELECT COUNT(*) AS denied_access
            FROM audit_logs
            WHERE result = 'DENIED'
            """
        )
        denied_access = cursor.fetchone()["denied_access"]

        return jsonify({
            "total_users": total_users,
            "total_documents": total_documents,
            "failed_logins": failed_logins,
            "denied_access": denied_access
        }), 200

    except Exception as error:
        print("Admin dashboard error:", error)

        return jsonify({
            "message": "Unable to load dashboard"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# GET ALL USERS / SEARCH USERS
# --------------------------------------------------

@admin_bp.route("/users", methods=["GET"])
@role_required("ADMIN")
def get_users():

    connection = None
    cursor = None

    try:
        # Optional search keyword
        search = request.args.get("search", "").strip()

        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                users.user_id,
                users.name,
                users.email,
                users.status,
                users.created_at,
                roles.role_name
            FROM users
            JOIN roles
            ON users.role_id = roles.role_id
            WHERE users.name ILIKE %s
               OR users.email ILIKE %s
            ORDER BY users.user_id DESC
        """

        keyword = f"%{search}%"

        cursor.execute(query, (keyword, keyword))

        users = cursor.fetchall()

        return jsonify({
            "total_users": len(users),
            "users": users
        }), 200

    except Exception as error:
        print("Get users error:", error)

        return jsonify({
            "message": "Unable to fetch users"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# UPDATE USER ROLE
# --------------------------------------------------

@admin_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@role_required("ADMIN")
def update_user_role(user_id):

    data = request.get_json(silent=True) or {}

    new_role = data.get("role", "")

    if not isinstance(new_role, str):
        return jsonify({
            "message": "Invalid role format"
        }), 400

    new_role = new_role.strip().upper()

    # Prevent creation of Admin accounts
    if new_role not in ["OWNER", "VIEWER"]:
        return jsonify({
            "message": "Only OWNER and VIEWER roles can be assigned here"
        }), 400

    # Prevent Admin from changing their own role
    if user_id == g.current_user["user_id"]:
        return jsonify({
            "message": "You cannot change your own role"
        }), 403

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check target user
        cursor.execute(
            """
            SELECT user_id
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        target_user = cursor.fetchone()

        if not target_user:
            connection.rollback()

            return jsonify({
                "message": "User not found"
            }), 404

        # Get role ID
        cursor.execute(
            """
            SELECT role_id
            FROM roles
            WHERE role_name = %s
            """,
            (new_role,)
        )

        role = cursor.fetchone()

        if not role:
            connection.rollback()

            return jsonify({
                "message": "Role not found"
            }), 404

        # Update role
        cursor.execute(
            """
            UPDATE users
            SET role_id = %s
            WHERE user_id = %s
            """,
            (role["role_id"], user_id)
        )

        connection.commit()

        return jsonify({
            "message": "User role updated successfully",
            "user_id": user_id,
            "new_role": new_role
        }), 200

    except Exception as error:
        if connection and not connection.closed:
            connection.rollback()

        print("Update user role error:", error)

        return jsonify({
            "message": "Unable to update user role"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# UPDATE USER ACCOUNT STATUS
# --------------------------------------------------

@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@role_required("ADMIN")
def update_user_status(user_id):

    data = request.get_json(silent=True) or {}

    new_status = data.get("status", "")

    if not isinstance(new_status, str):
        return jsonify({
            "message": "Invalid account status format"
        }), 400

    new_status = new_status.strip().upper()

    allowed_statuses = [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "message": "Invalid account status"
        }), 400

    if user_id == g.current_user["user_id"]:
        return jsonify({
            "message": "You cannot change your own account status"
        }), 403

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Lock the target user row during this transaction
        cursor.execute(
            """
            SELECT
                users.user_id,
                users.status,
                roles.role_name
            FROM users
            JOIN roles
            ON users.role_id = roles.role_id
            WHERE users.user_id = %s
            FOR UPDATE
            """,
            (user_id,)
        )

        target_user = cursor.fetchone()

        if not target_user:
            connection.rollback()

            return jsonify({
                "message": "User not found"
            }), 404

        # Protect the last active Admin
        if (
            target_user["role_name"] == "ADMIN"
            and new_status != "ACTIVE"
            and target_user["status"] == "ACTIVE"
        ):

            cursor.execute(
                """
                SELECT COUNT(*) AS active_admins
                FROM users
                JOIN roles
                ON users.role_id = roles.role_id
                WHERE roles.role_name = 'ADMIN'
                  AND users.status = 'ACTIVE'
                """
            )

            count = cursor.fetchone()["active_admins"]

            if count <= 1:
                connection.rollback()

                return jsonify({
                    "message": "Cannot deactivate the last active Admin"
                }), 403

        # Update status
        cursor.execute(
            """
            UPDATE users
            SET status = %s
            WHERE user_id = %s
            """,
            (new_status, user_id)
        )

        connection.commit()

        return jsonify({
            "message": "Account status updated successfully",
            "user_id": user_id,
            "status": new_status
        }), 200

    except Exception as error:
        if connection and not connection.closed:
            connection.rollback()

        print("Update user status error:", error)

        return jsonify({
            "message": "Unable to update account status"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# GET ALL DOCUMENTS
# ADMIN CAN VIEW METADATA ONLY
# --------------------------------------------------

@admin_bp.route("/documents", methods=["GET"])
@role_required("ADMIN")
def get_all_documents():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                documents.document_id,
                documents.document_name,
                documents.file_hash,
                documents.created_at,
                documents.updated_at,
                users.user_id AS owner_id,
                users.name AS owner_name,
                users.email AS owner_email
            FROM documents
            JOIN users
            ON documents.owner_id = users.user_id
            ORDER BY documents.created_at DESC
            """
        )

        documents = cursor.fetchall()

        return jsonify({
            "total_documents": len(documents),
            "documents": documents
        }), 200

    except Exception as error:
        print("Get documents error:", error)

        return jsonify({
            "message": "Unable to fetch documents"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# VIEW SECURITY LOGS
# --------------------------------------------------

@admin_bp.route("/security-logs", methods=["GET"])
@role_required("ADMIN")
def security_logs():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get login history
        cursor.execute(
            """
            SELECT
                attempt_id,
                user_id,
                email,
                status,
                ip_address,
                attempted_at
            FROM login_attempts
            ORDER BY attempted_at DESC
            LIMIT 100
            """
        )

        login_history = cursor.fetchall()

        # Get document access history
        cursor.execute(
            """
            SELECT
                audit_logs.log_id,
                audit_logs.user_id,
                users.name AS user_name,
                audit_logs.document_id,
                documents.document_name,
                audit_logs.action,
                audit_logs.result,
                audit_logs.reason,
                audit_logs.ip_address,
                audit_logs.timestamp
            FROM audit_logs
            LEFT JOIN users
                ON audit_logs.user_id = users.user_id
            LEFT JOIN documents
                ON audit_logs.document_id = documents.document_id
            ORDER BY audit_logs.timestamp DESC
            LIMIT 100
            """
        )

        access_history = cursor.fetchall()

        return jsonify({
            "login_history": login_history,
            "document_access_history": access_history
        }), 200

    except Exception as error:
        print("Security logs error:", error)

        return jsonify({
            "message": "Unable to fetch security logs"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# VERIFY COMPLETE AUDIT HASH CHAIN
# --------------------------------------------------

@admin_bp.route("/audit/verify", methods=["GET"])
@role_required("ADMIN")
def verify_system_audit():

    try:
        result = verify_audit_chain()

        status_code = 200 if result["valid"] else 409

        return jsonify({
            "success": result["valid"],
            "audit_verification": result
        }), status_code

    except Exception as error:

        print("Admin audit verification error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to verify audit records"
        }), 500

