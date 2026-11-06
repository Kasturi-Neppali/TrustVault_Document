

from flask import Blueprint, jsonify, g
from flask_jwt_extended import jwt_required

from middleware.permissions import role_required


role_bp = Blueprint("roles", __name__)


# Common authenticated user route
@role_bp.route("/api/me", methods=["GET"])
@jwt_required()
@role_required("ADMIN", "OWNER", "VIEWER")
def my_profile():

    return jsonify({
        "message": "Authentication successful",
        "user": {
            "user_id": g.current_user["user_id"],
            "name": g.current_user["name"],
            "email": g.current_user["email"],
            "role": g.current_user["role_name"]
        }
    }), 200


# ADMIN DASHBOARD
@role_bp.route("/api/admin/dashboard", methods=["GET"])
@jwt_required()
@role_required("ADMIN")
def admin_dashboard():

    return jsonify({
        "message": "Welcome to Admin Dashboard",
        "features": [
            "Manage users",
            "Manage roles",
            "Monitor security",
            "View all audit logs"
        ]
    }), 200


# OWNER DASHBOARD
@role_bp.route("/api/owner/dashboard", methods=["GET"])
@jwt_required()
@role_required("OWNER")
def owner_dashboard():

    return jsonify({
        "message": "Welcome to Owner Dashboard",
        "features": [
            "Upload documents",
            "Manage own documents",
            "Share documents",
            "Manage permissions"
        ]
    }), 200


# VIEWER DASHBOARD
@role_bp.route("/api/viewer/dashboard", methods=["GET"])
@jwt_required()
@role_required("VIEWER")
def viewer_dashboard():

    return jsonify({
        "message": "Welcome to Viewer Dashboard",
        "features": [
            "View shared documents",
            "Download permitted documents",
            "View own access history"
        ]
    }), 200
