

from flask import Blueprint, request, jsonify
from db import get_db_connection
import bcrypt
import traceback

from flask_jwt_extended import create_access_token
from datetime import timedelta


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# USER REGISTRATION
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role_name = data.get("role", "VIEWER").strip().upper()

    # Validate input
    if not name or not email or not password:
        return jsonify({
            "message": "All fields are required"
        }), 400

    if role_name not in ["OWNER", "VIEWER"]:
        return jsonify({
            "message": "Invalid registration role"
        }), 400

    if len(password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check whether email already exists
        cursor.execute(
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "message": "Email already registered"
            }), 409

        # Get role ID
        cursor.execute(
            "SELECT role_id FROM roles WHERE role_name = %s",
            (role_name,)
        )

        role = cursor.fetchone()

        if not role:
            return jsonify({
                "message": "Role not found"
            }), 400

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Insert user
        cursor.execute(
            """
            INSERT INTO users
            (name, email, password_hash, role_id)
            VALUES (%s, %s, %s, %s)
            """,
            (name, email, password_hash, role["role_id"])
        )

        connection.commit()

        return jsonify({
            "message": "Registration successful",
            "role": role_name
        }), 201

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({
            "message": "Registration failed due to a server error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# USER LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

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

        # Check password
        password_valid = False

        if user:
            password_valid = bcrypt.checkpw(
                password.encode("utf-8"),
                user["password_hash"].encode("utf-8")
            )

        if not user or not password_valid:

            cursor.execute(
                """
                INSERT INTO login_attempts
                (user_id, email, status)
                VALUES (%s, %s, 'FAILURE')
                """,
                (
                    user["user_id"] if user else None,
                    email
                )
            )

            connection.commit()

            return jsonify({
                "message": "Invalid email or password"
            }), 401

        # Check account status
        if user["status"] != "ACTIVE":

            cursor.execute(
                """
                INSERT INTO login_attempts
                (user_id, email, status)
                VALUES (%s, %s, 'FAILURE')
                """,
                (user["user_id"], email)
            )

            connection.commit()

            return jsonify({
                "message": "Account is not active"
            }), 403

        # Record successful login
        cursor.execute(
            """
            INSERT INTO login_attempts
            (user_id, email, status)
            VALUES (%s, %s, 'SUCCESS')
            """,
            (user["user_id"], email)
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
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role_name"]
            }
        }), 200

    except Exception as error:
        print("\n===== LOGIN ERROR =====")
        print(error)
        traceback.print_exc()
        print("=======================\n")

        return jsonify({
            "success": False,
            "message": "Login failed due to a server error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
