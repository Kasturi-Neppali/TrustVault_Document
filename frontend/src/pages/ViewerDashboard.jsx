
import { useEffect, useState } from "react";

import {
    getSharedDocuments,
    viewSharedDocument,
    downloadSharedDocument,
    getViewerActivity
} from "../services/viewerService";

function ViewerDashboard() {

    const [activeTab, setActiveTab] = useState("overview");

    const [documents, setDocuments] = useState([]);
    const [activities, setActivities] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Load shared documents
    const loadDocuments = async () => {
        const data = await getSharedDocuments();
        setDocuments(data.documents || []);
    };

    // Load personal activity
    const loadActivities = async () => {
        const data = await getViewerActivity();
        setActivities(data.activities || []);
    };

    // Load dashboard data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");

            try {
                await Promise.all([
                    loadDocuments(),
                    loadActivities()
                ]);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load Viewer dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Open document using authenticated API request
    const handleView = async (document) => {
        setError("");
        setMessage("");

        try {
            const fileBlob = await viewSharedDocument(
                document.document_id
            );

            // Create a temporary browser URL
            const fileUrl = URL.createObjectURL(fileBlob);

            const newWindow = window.open(fileUrl, "_blank");

            if (!newWindow) {
                URL.revokeObjectURL(fileUrl);
                setError("Please allow pop-ups to open documents.");
                return;
            }

            setMessage("Document opened successfully.");

            // Refresh activity after successful access
            await loadActivities();

            // Release temporary URL when the new tab is closed
            const cleanup = window.setInterval(() => {
                if (newWindow.closed) {
                    URL.revokeObjectURL(fileUrl);
                    window.clearInterval(cleanup);
                }
            }, 1000);

        } catch (err) {
            setError(
                err.response?.status === 403
                    ? "You do not have permission to view this document."
                    : err.response?.data?.message ||
                      "Unable to open document."
            );

            await loadActivities();
        }
    };

    // Download document
    const handleDownload = async (document) => {
        setError("");
        setMessage("");

        try {
            const fileBlob = await downloadSharedDocument(
                document.document_id
            );

            const fileUrl = URL.createObjectURL(fileBlob);

            const link = documentRef(fileUrl, document.document_name);

            link.click();

            URL.revokeObjectURL(fileUrl);

            setMessage("Document download started.");

            await loadActivities();

        } catch (err) {
            setError(
                err.response?.status === 403
                    ? "You do not have permission to download this document."
                    : err.response?.data?.message ||
                      "Unable to download document."
            );

            await loadActivities();
        }
    };

    // Create download link
    const documentRef = (fileUrl, fileName) => {
        const link = window.document.createElement("a");

        link.href = fileUrl;
        link.download = fileName;

        return link;
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <div className="viewer-layout">

            {/* Sidebar */}
            <aside className="viewer-sidebar">

                <h2>TrustWorld</h2>

                <p className="viewer-sidebar-subtitle">
                    Viewer Panel
                </p>

                <nav>

                    <button
                        className={
                            activeTab === "overview" ? "active" : ""
                        }
                        onClick={() => setActiveTab("overview")}
                    >
                        📊 Overview
                    </button>

                    <button
                        className={
                            activeTab === "documents" ? "active" : ""
                        }
                        onClick={() => setActiveTab("documents")}
                    >
                        📁 Shared Documents
                    </button>

                    <button
                        className={
                            activeTab === "activity" ? "active" : ""
                        }
                        onClick={() => setActiveTab("activity")}
                    >
                        🕒 My Activity
                    </button>

                </nav>

                <button
                    className="viewer-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </aside>

            {/* Main content */}
            <main className="viewer-main">

                <header className="viewer-header">
                    <div>
                        <h1>Viewer Dashboard</h1>
                        <p>
                            Access documents shared with you securely
                        </p>
                    </div>

                    <span className="viewer-role">VIEWER</span>
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
                        Loading dashboard...
                    </p>
                )}

                {/* Overview */}
                {!loading && activeTab === "overview" && (
                    <section>

                        <h2>Overview</h2>

                        <div className="viewer-stat-card">
                            <span>📁</span>

                            <div>
                                <p>Available Shared Documents</p>
                                <h2>{documents.length}</h2>
                            </div>
                        </div>

                        <div className="viewer-welcome-card">
                            <h2>Welcome to TrustWorld!</h2>

                            <p>
                                You can access documents that Owners
                                have shared with you. Your permissions
                                determine whether you can view or
                                download each document.
                            </p>
                        </div>

                    </section>
                )}

                {/* Shared Documents */}
                {!loading && activeTab === "documents" && (
                    <section>

                        <h2>Shared Documents</h2>

                        <div className="viewer-table-container">

                            <table>
                                <thead>
                                    <tr>
                                        <th>Document ID</th>
                                        <th>Document Name</th>
                                        <th>Owner</th>
                                        <th>View</th>
                                        <th>Download</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {documents.map((doc) => (
                                        <tr key={doc.document_id}>

                                            <td>{doc.document_id}</td>

                                            <td>{doc.document_name}</td>

                                            <td>{doc.owner_name}</td>

                                            <td>
                                                {doc.can_view
                                                    ? "Allowed"
                                                    : "Denied"}
                                            </td>

                                            <td>
                                                {doc.can_download
                                                    ? "Allowed"
                                                    : "Denied"}
                                            </td>

                                            <td>
                                                <button
                                                    onClick={() =>
                                                        handleView(doc)
                                                    }
                                                    disabled={!doc.can_view}
                                                >
                                                    View
                                                </button>

                                                <button
                                                    className="viewer-download"
                                                    onClick={() =>
                                                        handleDownload(doc)
                                                    }
                                                    disabled={
                                                        !doc.can_view ||
                                                        !doc.can_download
                                                    }
                                                >
                                                    Download
                                                </button>
                                            </td>

                                        </tr>
                                    ))}

                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan="6">
                                                No documents have been
                                                shared with you.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>

                        </div>

                    </section>
                )}

                {/* Activity */}
                {!loading && activeTab === "activity" && (
                    <section>

                        <h2>My Activity History</h2>

                        <div className="viewer-table-container">

                            <table>
                                <thead>
                                    <tr>
                                        <th>Log ID</th>
                                        <th>Document</th>
                                        <th>Action</th>
                                        <th>Result</th>
                                        <th>Reason</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {activities.map((activity) => (
                                        <tr key={activity.log_id}>

                                            <td>{activity.log_id}</td>

                                            <td>
                                                {activity.document_name ||
                                                    activity.document_id ||
                                                    "-"}
                                            </td>

                                            <td>{activity.action}</td>

                                            <td>{activity.result}</td>

                                            <td>{activity.reason}</td>

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
                                                No activity recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>

                        </div>

                    </section>
                )}

            </main>
        </div>
    );
}

export default ViewerDashboard;

