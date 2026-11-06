

import { useEffect, useState } from "react";

import {
    getOwnerDocuments,
    uploadDocument,
    renameDocument,
    archiveDocument,
    shareDocument,
    revokePermission
} from "../services/ownerService";

function OwnerDashboard() {

    const [documents, setDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const [viewerEmail, setViewerEmail] = useState("");
    const [canView, setCanView] = useState(true);
    const [canDownload, setCanDownload] = useState(false);
    const [expiresAt, setExpiresAt] = useState("");

    const [newDocumentName, setNewDocumentName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Load Owner's documents
    const loadDocuments = async () => {
        const data = await getOwnerDocuments();
        setDocuments(data.documents || []);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                await loadDocuments();
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load documents."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Upload selected document
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setError("Please select a file first.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await uploadDocument(selectedFile);

            setSelectedFile(null);
            e.target.reset();

            await loadDocuments();

            setMessage("Document uploaded successfully.");
            setActiveTab("documents");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Document upload failed."
            );
        } finally {
            setLoading(false);
        }
    };

    // Rename document
    const handleRename = async (documentId) => {
        const documentName = newDocumentName.trim();

        if (!documentName) {
            setError("Enter a document name.");
            return;
        }

        setError("");
        setMessage("");

        try {
            await renameDocument(documentId, documentName);

            await loadDocuments();

            setNewDocumentName("");
            setSelectedDocument(null);

            setMessage("Document renamed successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to rename document."
            );
        }
    };

    // Archive document
    const handleArchive = async (documentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to archive this document?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await archiveDocument(documentId);

            await loadDocuments();

            setMessage("Document archived successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to archive document."
            );
        }
    };

    // Share document
    const handleShare = async (e) => {
        e.preventDefault();

        if (!selectedDocument) {
            setError("Please select a document.");
            return;
        }

        if (!viewerEmail.trim()) {
            setError("Enter the Viewer's email address.");
            return;
        }

        if (!canView) {
            setError(
                "Viewing permission is required before sharing a document."
            );
            return;
        }

        setError("");
        setMessage("");

        try {
            await shareDocument(
                selectedDocument.document_id,
                viewerEmail.trim(),
                canView,
                canDownload,
                expiresAt || null
            );

            setMessage("Document shared successfully.");

            setViewerEmail("");
            setCanView(true);
            setCanDownload(false);
            setExpiresAt("");
            setSelectedDocument(null);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to share document."
            );
        }
    };

    // Revoke permission
    const handleRevoke = async () => {
        const permissionId = window.prompt(
            "Enter the permission ID you want to revoke:"
        );

        if (!permissionId) return;

        if (!/^\d+$/.test(permissionId)) {
            setError("Enter a valid permission ID.");
            return;
        }

        setError("");
        setMessage("");

        try {
            await revokePermission(permissionId);

            setMessage("Document permission revoked successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to revoke permission."
            );
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <div className="owner-layout">

            {/* Sidebar */}
            <aside className="owner-sidebar">

                <h2>TrustWorld</h2>
                <p className="owner-sidebar-subtitle">
                    Owner Panel
                </p>

                <nav>
                    <button
                        className={activeTab === "overview" ? "active" : ""}
                        onClick={() => setActiveTab("overview")}
                    >
                        📊 Overview
                    </button>

                    <button
                        className={activeTab === "upload" ? "active" : ""}
                        onClick={() => setActiveTab("upload")}
                    >
                        ⬆️ Upload Document
                    </button>

                    <button
                        className={activeTab === "documents" ? "active" : ""}
                        onClick={() => setActiveTab("documents")}
                    >
                        📁 My Documents
                    </button>

                    <button
                        className={activeTab === "share" ? "active" : ""}
                        onClick={() => setActiveTab("share")}
                    >
                        🔗 Share Documents
                    </button>

                    <button
                        className={activeTab === "permissions" ? "active" : ""}
                        onClick={() => setActiveTab("permissions")}
                    >
                        🔐 Manage Permissions
                    </button>
                </nav>

                <button
                    className="owner-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </aside>

            {/* Main content */}
            <main className="owner-main">

                <header className="owner-header">
                    <div>
                        <h1>Owner Dashboard</h1>
                        <p>Manage your documents securely</p>
                    </div>

                    <span className="owner-role">OWNER</span>
                </header>

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="dashboard-success">
                        {message}
                    </div>
                )}

                {loading && (
                    <p className="loading-text">
                        Loading...
                    </p>
                )}

                {/* Overview */}
                {!loading && activeTab === "overview" && (
                    <section>
                        <h2>Overview</h2>

                        <div className="owner-stat-card">
                            <span>📁</span>

                            <div>
                                <p>Total Active Documents</p>
                                <h2>{documents.length}</h2>
                            </div>
                        </div>

                        <div className="owner-welcome-card">
                            <h2>Welcome to TrustWorld!</h2>

                            <p>
                                Upload your private documents,
                                share them with selected Viewers,
                                and control their access permissions.
                            </p>
                        </div>
                    </section>
                )}

                {/* Upload */}
                {!loading && activeTab === "upload" && (
                    <section>
                        <h2>Upload Document</h2>

                        <form
                            className="owner-form"
                            onSubmit={handleUpload}
                        >
                            <label>Select a document</label>

                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.xlsx,.csv"
                                onChange={(e) =>
                                    setSelectedFile(e.target.files[0] || null)
                                }
                                required
                            />

                            {selectedFile && (
                                <p>
                                    Selected: {selectedFile.name}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Uploading..."
                                    : "Upload Document"}
                            </button>
                        </form>
                    </section>
                )}

                {/* My Documents */}
                {!loading && activeTab === "documents" && (
                    <section>
                        <h2>My Documents</h2>

                        <div className="owner-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Document Name</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.document_id}>
                                            <td>{doc.document_id}</td>

                                            <td>{doc.document_name}</td>

                                            <td>
                                                {doc.created_at
                                                    ? new Date(
                                                        doc.created_at
                                                    ).toLocaleDateString()
                                                    : "-"}
                                            </td>

                                            <td>
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocument(doc);
                                                        setNewDocumentName(
                                                            doc.document_name
                                                        );
                                                    }}
                                                >
                                                    Rename
                                                </button>

                                                <button
                                                    className="archive-button"
                                                    onClick={() =>
                                                        handleArchive(
                                                            doc.document_id
                                                        )
                                                    }
                                                >
                                                    Archive
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan="4">
                                                No documents uploaded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {selectedDocument && (
                            <div className="owner-form">
                                <h3>Rename Document</h3>

                                <input
                                    type="text"
                                    value={newDocumentName}
                                    onChange={(e) =>
                                        setNewDocumentName(e.target.value)
                                    }
                                />

                                <button
                                    onClick={() =>
                                        handleRename(
                                            selectedDocument.document_id
                                        )
                                    }
                                >
                                    Save New Name
                                </button>

                                <button
                                    className="cancel-button"
                                    onClick={() => {
                                        setSelectedDocument(null);
                                        setNewDocumentName("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* Share Document */}
                {!loading && activeTab === "share" && (
                    <section>
                        <h2>Share Document</h2>

                        <form
                            className="owner-form"
                            onSubmit={handleShare}
                        >
                            <label>Select Document</label>

                            <select
                                value={
                                    selectedDocument?.document_id || ""
                                }
                                onChange={(e) => {
                                    const doc = documents.find(
                                        item =>
                                            item.document_id ===
                                            Number(e.target.value)
                                    );

                                    setSelectedDocument(doc || null);
                                }}
                                required
                            >
                                <option value="">
                                    Select a document
                                </option>

                                {documents.map((doc) => (
                                    <option
                                        key={doc.document_id}
                                        value={doc.document_id}
                                    >
                                        {doc.document_name}
                                    </option>
                                ))}
                            </select>

                            <label>Viewer Email</label>

                            <input
                                type="email"
                                placeholder="viewer@example.com"
                                value={viewerEmail}
                                onChange={(e) =>
                                    setViewerEmail(e.target.value)
                                }
                                required
                            />

                            <label className="owner-checkbox">
                                <input
                                    type="checkbox"
                                    checked={canView}
                                    onChange={(e) =>
                                        setCanView(e.target.checked)
                                    }
                                />
                                Allow viewing
                            </label>

                            <label className="owner-checkbox">
                                <input
                                    type="checkbox"
                                    checked={canDownload}
                                    onChange={(e) =>
                                        setCanDownload(e.target.checked)
                                    }
                                />
                                Allow downloading
                            </label>

                            <label>Permission Expiry (Optional)</label>

                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) =>
                                    setExpiresAt(e.target.value)
                                }
                            />

                            <button type="submit">
                                Share Document
                            </button>
                        </form>
                    </section>
                )}

                {/* Permissions */}
                {!loading && activeTab === "permissions" && (
                    <section>
                        <h2>Manage Permissions</h2>

                        <div className="owner-welcome-card">
                            <p>
                                Revoke an existing document-sharing
                                permission using its permission ID.
                            </p>

                            <button
                                className="archive-button"
                                onClick={handleRevoke}
                            >
                                Revoke Permission
                            </button>
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}

export default OwnerDashboard;
