


from flask import Blueprint, request, jsonify
from db import get_db_connection

import bcrypt
import traceback
import re

from flask_jwt_extended import create_access_token
from datetime import timedelta


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# --------------------------------------------------
# HELPER: VALIDATE EMAIL
# --------------------------------------------------

def is_valid_email(email):
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return re.match(pattern, email) is not None


# --------------------------------------------------
# USER REGISTRATION
# --------------------------------------------------

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "")
    email = data.get("email", "")
    password = data.get("password", "")
    role_name = data.get("role", "VIEWER")

    # Validate input types
    if not all(
        isinstance(value, str)
        for value in [name, email, password, role_name]
    ):
        return jsonify({
            "message": "Invalid input format."
        }), 400

    # Clean input
    name = name.strip()
    email = email.strip().lower()
    role_name = role_name.strip().upper()

    # Required fields
    if not name or not email or not password:
        return jsonify({
            "message": "All fields are required."
        }), 400

    # Validate email
    if not is_valid_email(email):
        return jsonify({
            "message": "Enter a valid email address."
        }), 400

    # Public registration only allows OWNER and VIEWER
    if role_name not in ["OWNER", "VIEWER"]:
        return jsonify({
            "message": "Invalid registration role. Only OWNER and VIEWER can register."
        }), 400

    # Validate password length
    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters."
        }), 400

    # bcrypt supports passwords up to 72 UTF-8 bytes
    if len(password.encode("utf-8")) > 72:
        return jsonify({
            "message": "Password must not exceed 72 UTF-8 bytes."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether email already exists
        cursor.execute(
            """
            SELECT user_id
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "message": "Email already registered."
            }), 409

        # Get role ID
        cursor.execute(
            """
            SELECT role_id
            FROM roles
            WHERE role_name = %s
            """,
            (role_name,)
        )

        role = cursor.fetchone()

        if not role:
            return jsonify({
                "message": "Selected role does not exist."
            }), 400

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Insert new user
        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password_hash,
                role_id
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                name,
                email,
                password_hash,
                role["role_id"]
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful.",
            "role": role_name
        }), 201

    except Exception as error:

        if connection and not connection.closed:
            connection.rollback()

        print("Registration error:", error)
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": "Registration failed due to a server error."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()


# --------------------------------------------------
# USER LOGIN
# --------------------------------------------------

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "")
    password = data.get("password", "")

    # Validate input types
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({
            "message": "Invalid input format."
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    if len(password.encode("utf-8")) > 72:
        return jsonify({
            "message": "Invalid email or password."
        }), 401

    ip_address = request.remote_addr

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Find user and role
        cursor.execute(
            """
            SELECT
                users.user_id,
                users.name,
                users.email,
                users.password_hash,
                users.status,
                roles.role_name
            FROM users
            JOIN roles
                ON users.role_id = roles.role_id
            WHERE users.email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        # Verify password safely
        password_valid = False

        if user:
            try:
                password_valid = bcrypt.checkpw(
                    password.encode("utf-8"),
                    user["password_hash"].encode("utf-8")
                )

            except (ValueError, TypeError, AttributeError):
                password_valid = False

        # Invalid email or password
        if not user or not password_valid:

            cursor.execute(
                """
                INSERT INTO login_attempts
                (
                    user_id,
                    email,
                    status,
                    ip_address
                )
                VALUES (%s, %s, 'FAILURE', %s)
                """,
                (
                    user["user_id"] if user else None,
                    email,
                    ip_address
                )
            )

            connection.commit()

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        # Check account status
        if user["status"] != "ACTIVE":

            cursor.execute(
                """
                INSERT INTO login_attempts
                (
                    user_id,
                    email,
                    status,
                    ip_address
                )
                VALUES (%s, %s, 'FAILURE', %s)
                """,
                (
                    user["user_id"],
                    email,
                    ip_address
                )
            )

            connection.commit()

            return jsonify({
                "success": False,
                "message": "Account is not active."
            }), 403

        # Record successful login
        cursor.execute(
            """
            INSERT INTO login_attempts
            (
                user_id,
                email,
                status,
                ip_address
            )
            VALUES (%s, %s, 'SUCCESS', %s)
            """,
            (
                user["user_id"],
                email,
                ip_address
            )
        )

        connection.commit()

        # Generate JWT token
        access_token = create_access_token(
            identity=str(user["user_id"]),
            additional_claims={
                "role": user["role_name"]
            },
            expires_delta=timedelta(minutes=30)
        )

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "access_token": access_token,
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role_name"]
            }
        }), 200

    except Exception as error:

        if connection and not connection.closed:
            connection.rollback()

        print("\n===== LOGIN ERROR =====")
        print(error)
        traceback.print_exc()
        print("=======================\n")

        return jsonify({
            "success": False,
            "message": "Login failed due to a server error."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()

