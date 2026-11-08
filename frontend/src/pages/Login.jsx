
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await loginUser(email, password);

            const token = data.access_token;
            const role = data.role || data.user?.role;

            if (!token || !role) {
                throw new Error(
                    "Login response is missing the access token or user role."
                );
            }

            localStorage.setItem("token", token);
            localStorage.setItem("role", role);

            if (data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }

            if (role === "ADMIN") {
                navigate("/admin");
            } else if (role === "OWNER") {
                navigate("/owner");
            } else if (role === "VIEWER") {
                navigate("/viewer");
            } else {
                throw new Error("Unknown user role.");
            }

        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please try again.";

            setError(message);

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("user");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <div className="auth-heading">
                    <h1>TrustVault</h1>
                    <p>Secure Document Management</p>
                </div>

                <h2>Welcome Back</h2>
                <p className="auth-subtitle">
                    Sign in to access your account
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>

                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/register">Register here</Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
