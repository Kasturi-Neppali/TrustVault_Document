

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getAdminDashboard,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    getAllDocuments,
    getSecurityLogs,
    verifyAuditChain
} from "../services/adminService";

function AdminDashboard() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("overview");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [dashboard, setDashboard] = useState({});
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);

    const [search, setSearch] = useState("");
    const [auditResult, setAuditResult] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadDashboard = async () => {
        const data = await getAdminDashboard();
        setDashboard(data.dashboard || data.statistics || data);
    };

    const loadUsers = async (searchText = "") => {
        const data = await getAllUsers(searchText);
        setUsers(data.users || []);
    };

    const loadDocuments = async () => {
        const data = await getAllDocuments();
        setDocuments(data.documents || []);
    };

    const loadSecurityLogs = async () => {
        const data = await getSecurityLogs();

        setSecurityLogs(
            data.security_logs ||
            data.audit_logs ||
            data.logs ||
            []
        );
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError("");

            try {
                await Promise.all([
                    loadDashboard(),
                    loadUsers(),
                    loadDocuments(),
                    loadSecurityLogs()
                ]);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load Admin dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
        setError("");
        setMessage("");
    };

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearch(value);

        try {
            await loadUsers(value);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to search users."
            );
        }
    };

    const handleRoleChange = async (userId, role) => {
        setError("");
        setMessage("");

        try {
            await updateUserRole(userId, role);
            await loadUsers(search);
            setMessage("User role updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update user role."
            );
        }
    };

    const handleStatusChange = async (userId, status) => {
        setError("");
        setMessage("");

        try {
            await updateUserStatus(userId, status);
            await loadUsers(search);
            await loadDashboard();
            setMessage("User status updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update user status."
            );
        }
    };

    const handleAuditVerification = async () => {
        setAuditResult(null);
        setError("");
        setMessage("");

        try {
            const data = await verifyAuditChain();

            setAuditResult(
                data.audit_verification || data
            );
        } catch (err) {
            if (err.response?.data?.audit_verification) {
                setAuditResult(
                    err.response.data.audit_verification
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to verify audit chain."
                );
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    const statistics = [
        {
            title: "Total Users",
            value: dashboard.total_users ?? 0,
            icon: "👥"
        },
        {
            title: "Total Documents",
            value: dashboard.total_documents ?? 0,
            icon: "📁"
        },
        {
            title: "Failed Logins",
            value: dashboard.failed_logins ?? 0,
            icon: "🔐"
        },
        {
            title: "Denied Access",
            value:
                dashboard.denied_access ??
                dashboard.denied_audit_logs ??
                0,
            icon: "🚫"
        }
    ];

    const navigationItems = [
        { id: "overview", label: "📊 Overview" },
        { id: "users", label: "👥 User Management" },
        { id: "documents", label: "📁 Documents" },
        { id: "security", label: "🔒 Security Logs" },
        { id: "audit", label: "🛡️ Audit Verification" }
    ];

    return (
        <div className="admin-layout">

            {/* Mobile header */}
            <div className="admin-mobile-header">
                <h2>TrustVault</h2>

                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={() =>
                        setMobileMenuOpen(!mobileMenuOpen)
                    }
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`admin-sidebar ${
                    mobileMenuOpen ? "mobile-open" : ""
                }`}
            >
                <div className="admin-brand">
                    <h2>TrustVault</h2>
                    <p className="sidebar-subtitle">Admin Panel</p>
                </div>

                <nav className="admin-navigation">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={
                                activeTab === item.id ? "active" : ""
                            }
                            onClick={() => handleTabChange(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </aside>

            {/* Main content */}
            <main className="admin-main">

                <header className="admin-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>Manage and monitor TrustVault</p>
                    </div>

                    <span className="admin-role">ADMIN</span>
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
                    <section className="admin-section">
                        <h2>System Overview</h2>

                        <div className="stats-grid">
                            {statistics.map((item) => (
                                <div
                                    className="stat-card"
                                    key={item.title}
                                >
                                    <span className="stat-icon">
                                        {item.icon}
                                    </span>

                                    <div>
                                        <p>{item.title}</p>
                                        <h2>{item.value}</h2>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="welcome-card">
                            <h2>Welcome to TrustVault</h2>
                            <p>
                                Monitor users, documents and security
                                activities from one place.
                            </p>
                        </div>
                    </section>
                )}

                {/* User Management */}
                {!loading && activeTab === "users" && (
                    <section className="admin-section">
                        <h2>User Management</h2>

                        <input
                            className="search-input"
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={handleSearch}
                        />

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.user_id}>
                                            <td>{user.user_id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>

                                            <td>
                                                {user.role_name === "ADMIN" ? (
                                                    "ADMIN"
                                                ) : (
                                                    <select
                                                        value={user.role_name}
                                                        onChange={(e) =>
                                                            handleRoleChange(
                                                                user.user_id,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="OWNER">
                                                            OWNER
                                                        </option>

                                                        <option value="VIEWER">
                                                            VIEWER
                                                        </option>
                                                    </select>
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    value={user.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            user.user_id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="ACTIVE">
                                                        ACTIVE
                                                    </option>

                                                    <option value="INACTIVE">
                                                        INACTIVE
                                                    </option>

                                                    <option value="SUSPENDED">
                                                        SUSPENDED
                                                    </option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}

                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="5">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Documents */}
                {!loading && activeTab === "documents" && (
                    <section className="admin-section">
                        <h2>Document Metadata</h2>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Document ID</th>
                                        <th>Document Name</th>
                                        <th>Owner ID</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.document_id}>
                                            <td>{doc.document_id}</td>
                                            <td>{doc.document_name}</td>
                                            <td>{doc.owner_id}</td>
                                            <td>
                                                {doc.created_at
                                                    ? new Date(
                                                        doc.created_at
                                                    ).toLocaleString()
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))}

                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan="4">
                                                No documents found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <p className="security-note">
                            Admins can inspect document metadata but
                            cannot automatically read private document contents.
                        </p>
                    </section>
                )}

                {/* Security Logs */}
                {!loading && activeTab === "security" && (
                    <section className="admin-section">
                        <h2>Security Logs</h2>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Log ID</th>
                                        <th>User ID</th>
                                        <th>Document ID</th>
                                        <th>Action</th>
                                        <th>Result</th>
                                        <th>Reason</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {securityLogs.map((log) => (
                                        <tr key={log.log_id}>
                                            <td>{log.log_id}</td>
                                            <td>{log.user_id ?? "-"}</td>
                                            <td>{log.document_id ?? "-"}</td>
                                            <td>
                                                {log.action ?? log.status}
                                            </td>
                                            <td>{log.result ?? "-"}</td>
                                            <td>{log.reason ?? "-"}</td>
                                            <td>
                                                {log.timestamp
                                                    ? new Date(
                                                        log.timestamp
                                                    ).toLocaleString()
                                                    : log.attempted_at
                                                        ? new Date(
                                                            log.attempted_at
                                                        ).toLocaleString()
                                                        : "-"}
                                            </td>
                                        </tr>
                                    ))}

                                    {securityLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="7">
                                                No security logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Audit Verification */}
                {!loading && activeTab === "audit" && (
                    <section className="admin-section">
                        <h2>Audit Chain Verification</h2>

                        <div className="audit-card">
                            <p>
                                Verify whether recorded audit events
                                have been modified or the hash chain
                                has been broken.
                            </p>

                            <button
                                type="button"
                                className="verify-button"
                                onClick={handleAuditVerification}
                            >
                                Verify Audit Chain
                            </button>

                            {auditResult && (
                                <div className="audit-result">
                                    <h3>
                                        {auditResult.valid
                                            ? "Audit Chain Valid"
                                            : "Audit Chain Invalid"}
                                    </h3>

                                    <p>{auditResult.message}</p>

                                    <p>
                                        Total records:{" "}
                                        {auditResult.total_records ?? 0}
                                    </p>

                                    <p>
                                        Verified records:{" "}
                                        {auditResult.verified_records ?? 0}
                                    </p>

                                    {auditResult.failed_log_id && (
                                        <p>
                                            Failed Log ID:{" "}
                                            {auditResult.failed_log_id}
                                        </p>
                                    )}

                                    {auditResult.reason && (
                                        <p>
                                            Reason: {auditResult.reason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}

export default AdminDashboard;
