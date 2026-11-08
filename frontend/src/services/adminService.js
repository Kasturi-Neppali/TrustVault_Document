
import api from "./api";

// Get Admin dashboard statistics
export const getAdminDashboard = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};

// Get all users
export const getAllUsers = async (search = "") => {
    const response = await api.get("/admin/users", {
        params: { search }
    });

    return response.data;
};

// Change a user's role
export const updateUserRole = async (userId, role) => {
    const response = await api.patch(
        `/admin/users/${userId}/role`,
        { role }
    );

    return response.data;
};

// Change a user's account status
export const updateUserStatus = async (userId, status) => {
    const response = await api.patch(
        `/admin/users/${userId}/status`,
        { status }
    );

    return response.data;
};

// Get document metadata
export const getAllDocuments = async () => {
    const response = await api.get("/admin/documents");
    return response.data;
};

// Get security logs
export const getSecurityLogs = async () => {
    const response = await api.get("/admin/security-logs");
    return response.data;
};

// Verify SHA-256 audit chain
export const verifyAuditChain = async () => {
    const response = await api.get("/admin/audit/verify");
    return response.data;
};
