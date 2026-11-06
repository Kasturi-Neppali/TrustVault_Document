

from functools import wraps

from flask import jsonify, g
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt_identity
)

from db import get_db_connection


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            connection = None
            cursor = None

            try:
                # Step 1: Verify JWT token
                verify_jwt_in_request()

                # Step 2: Get logged-in user ID
                user_id = get_jwt_identity()

                # Step 3: Connect to database
                connection = get_db_connection()
                cursor = connection.cursor(dictionary=True)

                # Step 4: Get current role and account status
                cursor.execute(
                    """
                    SELECT
                        users.user_id,
                        users.name,
                        users.email,
                        users.status,
                        roles.role_name
                    FROM users
                    JOIN roles
                    ON users.role_id = roles.role_id
                    WHERE users.user_id = %s
                    """,
                    (user_id,)
                )

                user = cursor.fetchone()

                # Step 5: Check user existence
                if not user:
                    return jsonify({
                        "message": "User account not found"
                    }), 401

                # Step 6: Check account status
                if user["status"] != "ACTIVE":
                    return jsonify({
                        "message": "Account is not active"
                    }), 403

                # Step 7: Check user role
                if user["role_name"] not in allowed_roles:
                    return jsonify({
                        "message": "You are not authorized to access this resource"
                    }), 403

                # Step 8: Store user details for the route
                g.current_user = user

            except Exception as error:
                from flask_jwt_extended.exceptions import JWTExtendedException

                if isinstance(error, JWTExtendedException):
                    return jsonify({
                        "message": "Invalid or expired authentication token"
                    }), 401

                return jsonify({
                    "message": "Authorization service unavailable"
                }), 500

            finally:
                if cursor:
                    cursor.close()

                if connection and connection.is_connected():
                    connection.close()

            # Step 9: Allow authorized request
            return function(*args, **kwargs)

        return wrapper

    return decorator
