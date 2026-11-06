

import api from "./api";

// Get documents shared with the logged-in Viewer
export const getSharedDocuments = async () => {
    const response = await api.get("/viewer/documents");
    return response.data;
};

// Open a shared document securely
export const viewSharedDocument = async (documentId) => {
    const response = await api.get(
        `/viewer/documents/${documentId}/view`,
        {
            responseType: "blob"
        }
    );

    return response.data;
};

// Download a shared document securely
export const downloadSharedDocument = async (documentId) => {
    const response = await api.get(
        `/viewer/documents/${documentId}/download`,
        {
            responseType: "blob"
        }
    );

    return response.data;
};

// Get the logged-in Viewer's activity
export const getViewerActivity = async () => {
    const response = await api.get("/viewer/activity");
    return response.data;
};
