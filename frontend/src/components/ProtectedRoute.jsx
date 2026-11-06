

import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRole, children }) {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // User is not logged in
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // User has a different role
    if (role !== allowedRole) {
        if (role === "ADMIN") {
            return <Navigate to="/admin" replace />;
        }

        if (role === "OWNER") {
            return <Navigate to="/owner" replace />;
        }

        if (role === "VIEWER") {
            return <Navigate to="/viewer" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
