

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

    // --------------------------------------------------
    // STATE VARIABLES
    // --------------------------------------------------
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);

    const [activeTab, setActiveTab] = useState("overview");

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);

    // Sharing states
    const [viewerEmail, setViewerEmail] = useState("");
    const [canView, setCanView] = useState(true);
    const [canDownload, setCanDownload] = useState(false);
    const [expiresAt, setExpiresAt] = useState("");

    // Rename state
    const [newDocumentName, setNewDocumentName] = useState("");

    // Permission management states
    const [permissions, setPermissions] = useState([]);
    const [permissionDocumentId, setPermissionDocumentId] = useState("");
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    // Activity history states
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    // General states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");


    // --------------------------------------------------
    // LOAD OWNER DOCUMENTS
    // --------------------------------------------------

    const loadDocuments = async () => {

        const data = await getOwnerDocuments();

        setDocuments(data.documents || []);
    };


    // Load documents when dashboard opens
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


    // --------------------------------------------------
    // UPLOAD DOCUMENT
    // --------------------------------------------------

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


    // --------------------------------------------------
    // RENAME DOCUMENT
    // --------------------------------------------------

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


    // --------------------------------------------------
    // ARCHIVE DOCUMENT
    // --------------------------------------------------

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

            // Clear permission selection if archived document was selected
            if (String(permissionDocumentId) === String(documentId)) {

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


    // --------------------------------------------------
    // SHARE DOCUMENT
    // --------------------------------------------------

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

            // Reset form
            setViewerEmail("");
            setCanView(true);
            setCanDownload(false);
            setExpiresAt("");
            setSelectedDocument(null);

            // Refresh permissions if this document is currently selected
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


    // --------------------------------------------------
    // LOAD DOCUMENT PERMISSIONS
    // --------------------------------------------------

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


    // --------------------------------------------------
    // REVOKE VIEWER PERMISSION
    // --------------------------------------------------

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

            // Refresh the permissions table
            await loadPermissions(permissionDocumentId);

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Unable to revoke permission."
            );
        }
    };


    // --------------------------------------------------
    // LOAD OWNER ACTIVITY HISTORY
    // --------------------------------------------------

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


    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
};

    // --------------------------------------------------
    // RENDER DASHBOARD
    // --------------------------------------------------

    return (

        <div className="owner-layout">

            {/* ==========================================
                SIDEBAR
            ========================================== */}

            <aside className="owner-sidebar">

                <h2>TrustWorld</h2>

                <p className="owner-sidebar-subtitle">
                    Owner Panel
                </p>

                <nav>

                    <button
                        className={
                            activeTab === "overview" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("overview");
                            setError("");
                            setMessage("");
                        }}
                    >
                        📊 Overview
                    </button>


                    <button
                        className={
                            activeTab === "upload" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("upload");
                            setError("");
                            setMessage("");
                        }}
                    >
                        ⬆️ Upload Document
                    </button>


                    <button
                        className={
                            activeTab === "documents" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("documents");
                            setError("");
                            setMessage("");
                        }}
                    >
                        📁 My Documents
                    </button>


                    <button
                        className={
                            activeTab === "share" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("share");
                            setError("");
                            setMessage("");
                        }}
                    >
                        🔗 Share Documents
                    </button>


                    <button
                        className={
                            activeTab === "permissions" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("permissions");
                            setError("");
                            setMessage("");
                        }}
                    >
                        🔐 Manage Permissions
                    </button>


                    <button
                        className={
                            activeTab === "activity" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("activity");
                            setError("");
                            setMessage("");
                            loadOwnerActivity();
                        }}
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


            {/* ==========================================
                MAIN CONTENT
            ========================================== */}

            <main className="owner-main">


                {/* HEADER */}

                <header className="owner-header">

                    <div>

                        <h1>Owner Dashboard</h1>

                        <p>
                            Manage your documents securely
                        </p>

                    </div>

                    <span className="owner-role">
                        OWNER
                    </span>

                </header>


                {/* ERROR MESSAGE */}

                {error && (

                    <div className="dashboard-error">
                        {error}
                    </div>

                )}


                {/* SUCCESS MESSAGE */}

                {message && (

                    <div className="dashboard-success">
                        {message}
                    </div>

                )}


                {/* GENERAL LOADING */}

                {loading && (

                    <p className="loading-text">
                        Loading...
                    </p>

                )}


                {/* ======================================
                    OVERVIEW
                ====================================== */}

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


                        <div className="owner-stat-card">

                            <span>🔐</span>

                            <div>

                                <p>Document Security</p>

                                <h3>Access Controlled</h3>

                            </div>

                        </div>

                    </section>

                )}


                {/* ======================================
                    UPLOAD DOCUMENT
                ====================================== */}

                {!loading && activeTab === "upload" && (

                    <section>

                        <h2>Upload Document</h2>

                        <form
                            className="owner-form"
                            onSubmit={handleUpload}
                        >

                            <label>
                                Select a document
                            </label>


                            <input
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
                                    : "Upload Document"
                                }

                            </button>

                        </form>

                    </section>

                )}


                {/* ======================================
                    MY DOCUMENTS
                ====================================== */}

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

                                            <td>
                                                {doc.document_id}
                                            </td>


                                            <td>
                                                {doc.document_name}
                                            </td>


                                            <td>

                                                {doc.created_at
                                                    ? new Date(
                                                        doc.created_at
                                                    ).toLocaleDateString()
                                                    : "-"
                                                }

                                            </td>


                                            <td>

                                                <button
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


                        {/* RENAME FORM */}

                        {selectedDocument && (

                            <div className="owner-form">

                                <h3>Rename Document</h3>


                                <input
                                    type="text"
                                    value={newDocumentName}
                                    onChange={(e) =>
                                        setNewDocumentName(e.target.value)
                                    }
                                    placeholder="Enter new document name"
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


                {/* ======================================
                    SHARE DOCUMENT
                ====================================== */}

                {!loading && activeTab === "share" && (

                    <section>

                        <h2>Share Document</h2>


                        <form
                            className="owner-form"
                            onSubmit={handleShare}
                        >

                            <label>
                                Select Document
                            </label>


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


                            <label>
                                Viewer Email
                            </label>


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


                            <label>
                                Permission Expiry (Optional)
                            </label>


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


                {/* ======================================
                    MANAGE PERMISSIONS
                ====================================== */}

                {!loading && activeTab === "permissions" && (

                    <section>

                        <h2>Manage Document Permissions</h2>

                        <p>
                            View the users who have access to your
                            documents and revoke their permissions.
                        </p>


                        <div className="owner-form">

                            <label>
                                Select Document
                            </label>


                            <select
                                value={permissionDocumentId}
                                onChange={(e) => {

                                    const documentId = e.target.value;

                                    setPermissionDocumentId(documentId);

                                    setError("");
                                    setMessage("");

                                    loadPermissions(documentId);

                                }}
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
                                                new Date(
                                                    permission.expires_at
                                                ) < new Date();

                                            const status =
                                                permission.revoked_at
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
                                                            : "No"
                                                        }
                                                    </td>


                                                    <td>
                                                        {permission.can_download
                                                            ? "Yes"
                                                            : "No"
                                                        }
                                                    </td>


                                                    <td>
                                                        {permission.granted_at
                                                            ? new Date(
                                                                permission.granted_at
                                                            ).toLocaleDateString()
                                                            : "-"
                                                        }
                                                    </td>


                                                    <td>
                                                        {permission.expires_at
                                                            ? new Date(
                                                                permission.expires_at
                                                            ).toLocaleString()
                                                            : "No expiry"
                                                        }
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


                {/* ======================================
                    OWNER ACTIVITY HISTORY
                ====================================== */}

                {!loading && activeTab === "activity" && (

                    <section>

                        <h2>Document Activity History</h2>

                        <p>
                            Monitor who accessed your documents and
                            whether their access was allowed or denied.
                        </p>


                        <button
                            onClick={loadOwnerActivity}
                            disabled={activityLoading}
                        >
                            {activityLoading
                                ? "Refreshing..."
                                : "Refresh Activity"
                            }
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


                                                <td>
                                                    {activity.action}
                                                </td>


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
                                                        : "-"
                                                    }

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
