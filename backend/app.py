

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from dotenv import load_dotenv
import os

from routes.auth_routes import auth_bp
from routes.role_routes import role_bp
from routes.admin_routes import admin_bp
from routes.owner_routes import owner_bp
from routes.viewer_routes import viewer_bp

load_dotenv()

app = Flask(__name__)

# JWT configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 1800

# Initialize extensions
jwt = JWTManager(app)

# React frontend communication
CORS(app, origins=["http://localhost:5173"])

# Register authentication routes
app.register_blueprint(auth_bp)
app.register_blueprint(role_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(owner_bp)
app.register_blueprint(viewer_bp)

@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to TrustWorld API"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "running",
        "project": "TrustWorld"
    })


if __name__ == "__main__":
    app.run(debug=False, port=5000)
