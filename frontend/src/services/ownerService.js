
import api from "./api";

// Get all documents belonging to the logged-in Owner
export const getOwnerDocuments = async () => {
    const response = await api.get("/owner/documents");
    return response.data;
};

// Upload a document
export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
        "/owner/documents",
        formData
    );

    return response.data;
};

// Get document details
export const getDocumentDetails = async (documentId) => {
    const response = await api.get(
        `/owner/documents/${documentId}`
    );

    return response.data;
};

// Rename a document
export const renameDocument = async (documentId, documentName) => {
    const response = await api.patch(
        `/owner/documents/${documentId}`,
        { document_name: documentName }
    );

    return response.data;
};

// Archive a document
export const archiveDocument = async (documentId) => {
    const response = await api.delete(
        `/owner/documents/${documentId}`
    );

    return response.data;
};

// Share a document with a Viewer
export const shareDocument = async (
    documentId,
    viewerEmail,
    canView,
    canDownload,
    expiresAt = null
) => {
    const response = await api.post(
        `/owner/documents/${documentId}/share`,
        {
            viewer_email: viewerEmail,
            can_view: canView,
            can_download: canDownload,
            expires_at: expiresAt
        }
    );

    return response.data;
};

// Revoke document permission
export const revokePermission = async (permissionId) => {
    const response = await api.delete(
        `/owner/permissions/${permissionId}`
    );

    return response.data;
};

// Get sharing permissions for a document
export const getDocumentPermissions = async (documentId) => {
    const response = await api.get(
        `/owner/documents/${documentId}/permissions`
    );

    return response.data;
};

export const getOwnerActivity = async () => {
    const response = await api.get("/owner/activity");
    return response.data;
};