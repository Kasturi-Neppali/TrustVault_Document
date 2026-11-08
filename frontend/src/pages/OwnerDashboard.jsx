
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getOwnerDocuments,
    uploadDocument,
    renameDocument,
    archiveDocument,
    shareDocument,
    revokePermission,
    getDocumentPermissions,
    getOwnerActivity
} from "../services/ownerService";

function OwnerDashboard() {
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const [viewerEmail, setViewerEmail] = useState("");
    const [canView, setCanView] = useState(true);
    const [canDownload, setCanDownload] = useState(false);
    const [expiresAt, setExpiresAt] = useState("");

    const [newDocumentName, setNewDocumentName] = useState("");

    const [permissions, setPermissions] = useState([]);
    const [permissionDocumentId, setPermissionDocumentId] = useState("");
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Load Owner documents
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

    // Upload document
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

            if (
                String(permissionDocumentId) === String(documentId)
            ) {
                setPermissionDocumentId("");
                setPermissions([]);
            }

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

            if (
                String(permissionDocumentId) ===
                String(selectedDocument.document_id)
            ) {
                await loadPermissions(selectedDocument.document_id);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to share document."
            );
        }
    };

    // Load document permissions
    const loadPermissions = async (documentId) => {
        if (!documentId) {
            setPermissions([]);
            return;
        }

        setPermissionsLoading(true);
        setError("");

        try {
            const data = await getDocumentPermissions(documentId);
            setPermissions(data.permissions || []);
        } catch (err) {
            setPermissions([]);

            setError(
                err.response?.data?.message ||
                "Unable to load document permissions."
            );
        } finally {
            setPermissionsLoading(false);
        }
    };

    // Revoke Viewer permission
    const handleRevoke = async (permissionId) => {
        const confirmed = window.confirm(
            "Are you sure you want to revoke this Viewer's access?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await revokePermission(permissionId);

            setMessage("Document permission revoked successfully.");
            await loadPermissions(permissionDocumentId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to revoke permission."
            );
        }
    };

    // Load activity history
    const loadOwnerActivity = async () => {
        setActivityLoading(true);
        setError("");

        try {
            const data = await getOwnerActivity();
            setActivities(data.activities || []);
        } catch (err) {
            setActivities([]);

            setError(
                err.response?.data?.message ||
                "Unable to load activity history."
            );
        } finally {
            setActivityLoading(false);
        }
    };

    // Change dashboard tab
    const changeTab = (tab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
        setError("");
        setMessage("");

        if (tab === "activity") {
            loadOwnerActivity();
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    return (
        <div className="owner-layout">

            <div className="owner-mobile-header">
                <h2>TrustWorld</h2>

                <button
                    type="button"
                    className="owner-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? "✕" : "☰"}
                </button>
            </div>

            <aside
                className={`owner-sidebar ${
                    mobileMenuOpen ? "mobile-open" : ""
                }`}
            >
                <div className="owner-brand">
                    <h2>TrustWorld</h2>
                    <p className="owner-sidebar-subtitle">
                        Owner Panel
                    </p>
                </div>

                <nav className="owner-navigation">
                    <button
                        className={activeTab === "overview" ? "active" : ""}
                        onClick={() => changeTab("overview")}
                    >
                        📊 Overview
                    </button>

                    <button
                        className={activeTab === "upload" ? "active" : ""}
                        onClick={() => changeTab("upload")}
                    >
                        ⬆️ Upload Document
                    </button>

                    <button
                        className={activeTab === "documents" ? "active" : ""}
                        onClick={() => changeTab("documents")}
                    >
                        📁 My Documents
                    </button>

                    <button
                        className={activeTab === "share" ? "active" : ""}
                        onClick={() => changeTab("share")}
                    >
                        🔗 Share Documents
                    </button>

                    <button
                        className={activeTab === "permissions" ? "active" : ""}
                        onClick={() => changeTab("permissions")}
                    >
                        🔐 Manage Permissions
                    </button>

                    <button
                        className={activeTab === "activity" ? "active" : ""}
                        onClick={() => changeTab("activity")}
                    >
                        📜 Activity History
                    </button>
                </nav>

                <button
                    className="owner-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </aside>
                        <main className="owner-main">

                <header className="owner-header">
                    <div>
                        <h1>Owner Dashboard</h1>
                        <p>Manage your documents securely</p>
                    </div>

                    <span className="owner-role">OWNER</span>
                </header>

                {error && (
                    <div className="dashboard-error">{error}</div>
                )}

                {message && (
                    <div className="dashboard-success">{message}</div>
                )}

                {loading && (
                    <p className="loading-text">Loading...</p>
                )}

                {/* Overview */}
                {!loading && activeTab === "overview" && (
                    <section className="owner-section">
                        <h2>Overview</h2>

                        <div className="owner-overview-grid">
                            <div className="owner-stat-card">
                                <span>📁</span>
                                <div>
                                    <p>Total Active Documents</p>
                                    <h2>{documents.length}</h2>
                                </div>
                            </div>

                            <div className="owner-stat-card">
                                <span>🔐</span>
                                <div>
                                    <p>Document Security</p>
                                    <h3>Access Controlled</h3>
                                </div>
                            </div>
                        </div>

                        <div className="owner-welcome-card">
                            <h2>Welcome to TrustWorld!</h2>
                            <p>
                                Upload your private documents, share them
                                with selected Viewers, and control their
                                access permissions.
                            </p>
                        </div>
                    </section>
                )}

                {/* Upload Document */}
                {!loading && activeTab === "upload" && (
                    <section className="owner-section">
                        <h2>Upload Document</h2>

                        <form
                            className="owner-form"
                            onSubmit={handleUpload}
                        >
                            <label htmlFor="owner-file">
                                Select a document
                            </label>

                            <input
                                id="owner-file"
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.xlsx,.csv"
                                onChange={(e) =>
                                    setSelectedFile(
                                        e.target.files[0] || null
                                    )
                                }
                                required
                            />

                            {selectedFile && (
                                <p className="selected-file">
                                    Selected: {selectedFile.name}
                                </p>
                            )}

                            <button type="submit" disabled={loading}>
                                {loading ? "Uploading..." : "Upload Document"}
                            </button>
                        </form>
                    </section>
                )}

                {/* My Documents */}
                {!loading && activeTab === "documents" && (
                    <section className="owner-section">
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
                                                <div className="owner-action-buttons">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDocument(doc);
                                                            setNewDocumentName(
                                                                doc.document_name
                                                            );
                                                            setError("");
                                                            setMessage("");
                                                        }}
                                                    >
                                                        Rename
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="archive-button"
                                                        onClick={() =>
                                                            handleArchive(
                                                                doc.document_id
                                                            )
                                                        }
                                                    >
                                                        Archive
                                                    </button>
                                                </div>
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
                            <div className="owner-form rename-form">
                                <h3>Rename Document</h3>

                                <input
                                    type="text"
                                    value={newDocumentName}
                                    onChange={(e) =>
                                        setNewDocumentName(e.target.value)
                                    }
                                    placeholder="Enter new document name"
                                />

                                <div className="owner-action-buttons">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRename(
                                                selectedDocument.document_id
                                            )
                                        }
                                    >
                                        Save New Name
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() => {
                                            setSelectedDocument(null);
                                            setNewDocumentName("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Share Document */}
                {!loading && activeTab === "share" && (
                    <section className="owner-section">
                        <h2>Share Document</h2>

                        <form
                            className="owner-form"
                            onSubmit={handleShare}
                        >
                            <label htmlFor="share-document">
                                Select Document
                            </label>

                            <select
                                id="share-document"
                                value={selectedDocument?.document_id || ""}
                                onChange={(e) => {
                                    const doc = documents.find(
                                        (item) =>
                                            String(item.document_id) ===
                                            e.target.value
                                    );

                                    setSelectedDocument(doc || null);
                                }}
                                required
                            >
                                <option value="">Select a document</option>

                                {documents.map((doc) => (
                                    <option
                                        key={doc.document_id}
                                        value={doc.document_id}
                                    >
                                        {doc.document_name}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="viewer-email">
                                Viewer Email
                            </label>

                            <input
                                id="viewer-email"
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

                            <label htmlFor="permission-expiry">
                                Permission Expiry (Optional)
                            </label>

                            <input
                                id="permission-expiry"
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

                {/* Manage Permissions */}
                {!loading && activeTab === "permissions" && (
                    <section className="owner-section">
                        <h2>Manage Document Permissions</h2>

                        <p>
                            View the users who have access to your
                            documents and revoke their permissions.
                        </p>

                        <div className="owner-form">
                            <label htmlFor="permission-document">
                                Select Document
                            </label>

                            <select
                                id="permission-document"
                                value={permissionDocumentId}
                                onChange={(e) => {
                                    const documentId = e.target.value;

                                    setPermissionDocumentId(documentId);
                                    setError("");
                                    setMessage("");

                                    loadPermissions(documentId);
                                }}
                            >
                                <option value="">Select a document</option>

                                {documents.map((doc) => (
                                    <option
                                        key={doc.document_id}
                                        value={doc.document_id}
                                    >
                                        {doc.document_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {permissionsLoading && (
                            <p className="loading-text">
                                Loading permissions...
                            </p>
                        )}

                        {!permissionsLoading && permissionDocumentId && (
                            <div className="owner-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Viewer</th>
                                            <th>Email</th>
                                            <th>Can View</th>
                                            <th>Can Download</th>
                                            <th>Granted At</th>
                                            <th>Expiry</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {permissions.map((permission) => {
                                            const isExpired =
                                                permission.expires_at &&
                                                new Date(permission.expires_at) <
                                                    new Date();

                                            const status = permission.revoked_at
                                                ? "Revoked"
                                                : isExpired
                                                    ? "Expired"
                                                    : "Active";

                                            return (
                                                <tr key={permission.permission_id}>
                                                    <td>
                                                        {permission.viewer_name || "-"}
                                                    </td>

                                                    <td>
                                                        {permission.viewer_email || "-"}
                                                    </td>

                                                    <td>
                                                        {permission.can_view
                                                            ? "Yes"
                                                            : "No"}
                                                    </td>

                                                    <td>
                                                        {permission.can_download
                                                            ? "Yes"
                                                            : "No"}
                                                    </td>

                                                    <td>
                                                        {permission.granted_at
                                                            ? new Date(
                                                                permission.granted_at
                                                            ).toLocaleDateString()
                                                            : "-"}
                                                    </td>

                                                    <td>
                                                        {permission.expires_at
                                                            ? new Date(
                                                                permission.expires_at
                                                            ).toLocaleString()
                                                            : "No expiry"}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                status === "Active"
                                                                    ? "permission-active"
                                                                    : "permission-inactive"
                                                            }
                                                        >
                                                            {status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {status === "Active" ? (
                                                            <button
                                                                type="button"
                                                                className="archive-button"
                                                                onClick={() =>
                                                                    handleRevoke(
                                                                        permission.permission_id
                                                                    )
                                                                }
                                                            >
                                                                Revoke
                                                            </button>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {permissions.length === 0 && (
                                            <tr>
                                                <td colSpan="8">
                                                    No permissions found for this document.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!permissionDocumentId && (
                            <p>
                                Select a document to view its permissions.
                            </p>
                        )}
                    </section>
                )}
                                {/* Activity History */}
                {!loading && activeTab === "activity" && (
                    <section className="owner-section">
                        <h2>Document Activity History</h2>

                        <p>
                            Monitor who accessed your documents and
                            whether their access was allowed or denied.
                        </p>

                        <button
                            type="button"
                            onClick={loadOwnerActivity}
                            disabled={activityLoading}
                        >
                            {activityLoading
                                ? "Refreshing..."
                                : "Refresh Activity"}
                        </button>

                        {activityLoading && (
                            <p className="loading-text">
                                Loading activity history...
                            </p>
                        )}

                        {!activityLoading && (
                            <div className="owner-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Document</th>
                                            <th>User</th>
                                            <th>Action</th>
                                            <th>Result</th>
                                            <th>Reason</th>
                                            <th>Date and Time</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {activities.map((activity) => (
                                            <tr key={activity.log_id}>
                                                <td>
                                                    {activity.document_name || "-"}
                                                </td>

                                                <td>
                                                    {activity.user_name || "Unknown"}
                                                    <br />
                                                    {activity.user_email || "-"}
                                                </td>

                                                <td>{activity.action}</td>

                                                <td>
                                                    <span
                                                        className={
                                                            activity.result === "ALLOWED"
                                                                ? "activity-allowed"
                                                                : "activity-denied"
                                                        }
                                                    >
                                                        {activity.result}
                                                    </span>
                                                </td>

                                                <td>
                                                    {activity.reason || "-"}
                                                </td>

                                                <td>
                                                    {activity.timestamp
                                                        ? new Date(
                                                            activity.timestamp
                                                        ).toLocaleString()
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}

                                        {activities.length === 0 && (
                                            <tr>
                                                <td colSpan="6">
                                                    No document activity found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

            </main>
        </div>
    );
}

export default OwnerDashboard;
