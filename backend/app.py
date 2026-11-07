


import os
from datetime import timedelta

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

from routes.auth_routes import auth_bp
from routes.role_routes import role_bp
from routes.admin_routes import admin_bp
from routes.owner_routes import owner_bp
from routes.viewer_routes import viewer_bp


# Load environment variables from backend/.env
load_dotenv()

app = Flask(__name__)


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

# JWT configuration
jwt_secret = os.getenv("JWT_SECRET_KEY")

if not jwt_secret:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing from the backend .env file."
    )

app.config["JWT_SECRET_KEY"] = jwt_secret

# JWT access token expires after 30 minutes
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)

# Maximum upload size: 25 MB
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

# Supports multiple frontend URLs separated by commas.
# Example:
# CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app

allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
)

allowed_origins = [
    origin.strip()
    for origin in allowed_origins.split(",")
    if origin.strip()
]

CORS(
    app,
    origins=allowed_origins,
    supports_credentials=True
)


# --------------------------------------------------
# INITIALIZE JWT
# --------------------------------------------------

jwt = JWTManager(app)


# --------------------------------------------------
# REGISTER BLUEPRINTS
# --------------------------------------------------

app.register_blueprint(auth_bp)
app.register_blueprint(role_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(owner_bp)
app.register_blueprint(viewer_bp)


# --------------------------------------------------
# HOME ROUTE
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Welcome to TrustWorld API",
        "status": "success"
    }), 200


# --------------------------------------------------
# HEALTH CHECK ROUTE
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "running",
        "project": "TrustWorld"
    }), 200


# --------------------------------------------------
# FILE SIZE ERROR HANDLER
# --------------------------------------------------

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "success": False,
        "message": "File size exceeds the maximum allowed limit of 25 MB."
    }), 413


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    debug_mode = os.getenv(
        "FLASK_DEBUG",
        "false"
    ).lower() == "true"

    port = int(os.getenv("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug_mode
    )

