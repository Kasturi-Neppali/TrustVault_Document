# 🔐 TrustVault – Secure Role-Based Document Management System

**TrustVault** is a secure document management platform that enables users to upload, manage, share and access documents through role-based access control and document-level permissions.

The platform provides three user roles: **Admin, Owner and Viewer**. Each role has specific responsibilities and access permissions to help protect confidential documents.

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Objectives](#-objectives)
4. [Key Features](#-key-features)
5. [User Roles](#-user-roles)
6. [Technology Stack](#-technology-stack)
7. [System Architecture](#-system-architecture)
8. [Project Structure](#-project-structure)
9. [Database Design](#-database-design)
10. [Security Features](#-security-features)
11. [Installation and Setup](#-installation-and-setup)
12. [Environment Configuration](#-environment-configuration)
13. [Running the Application](#-running-the-application)
14. [Deployment](#-deployment)
15. [Testing](#-testing)
16. [Documentation](#-documentation)
17. [Future Enhancements](#-future-enhancements)

---

## 🚀 Project Overview

TrustVault provides a centralized platform for secure document management and controlled document sharing.

Owners can upload documents and share them with registered Viewers. They can independently control viewing and downloading permissions and specify when access should expire.

Viewers can access only the documents shared with them and perform actions permitted by the Owner.

Admins manage users, roles and account statuses and can monitor document metadata and security activities.

The system combines a React frontend, Flask backend, PostgreSQL database and private cloud document storage.

## ❗ Problem Statement

Traditional document-sharing systems can make it difficult to control who accesses confidential documents and what actions they can perform.

Unrestricted sharing may lead to unauthorized document access, downloading and distribution.

TrustVault addresses these challenges through:

- Role-based access control.
- Document-level permissions.
- Controlled document sharing.
- Permission expiry and revocation.
- Private document storage.
- Audit logging and integrity verification.

## 🎯 Objectives

- Implement secure user authentication.
- Provide separate Admin, Owner and Viewer roles.
- Enable secure document upload and management.
- Allow Owners to share documents with registered Viewers.
- Provide separate viewing and downloading permissions.
- Support permission expiry and revocation.
- Prevent unauthorized document access.
- Maintain audit logs for important activities.
- Provide user management and security monitoring.
- Deliver a responsive and user-friendly interface.

## ✨ Key Features

### 1. Authentication and Authorization

- User registration and login.
- JWT-based authentication.
- Password hashing.
- Protected application routes.
- Backend role-based access control.

### 2. Admin Dashboard

- View registered users.
- Manage user roles.
- Activate, deactivate and suspend accounts.
- View document metadata.
- Inspect security and audit logs.
- Verify audit-chain integrity.

### 3. Owner Dashboard

- Upload documents.
- View uploaded documents.
- Rename documents.
- Archive documents.
- Share documents with registered Viewers.
- Configure viewing and downloading permissions.
- Set permission expiry dates.
- Revoke document access.
- View document activity.

### 4. Viewer Dashboard

- View documents shared with them.
- Open documents when viewing is permitted.
- Download documents when downloading is permitted.
- View personal document activity.

### 5. Security and Monitoring

- JWT authentication.
- Role-based authorization.
- Document ownership checks.
- Document-level permission checks.
- Private Supabase Storage.
- Audit logging.
- Hash-chain integrity verification.

Security controls are subject to verification through the tests documented in `THREATS.md`.

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin | User management, role management, account status management and security monitoring |
| Owner | Uploading, managing and sharing documents |
| Viewer | Accessing documents according to assigned permissions |

### Access Control Overview

| Operation | Admin | Owner | Viewer |
|---|---|---|---|
| Manage users | Yes | No | No |
| Manage roles | Yes | No | No |
| Upload documents | No | Yes | No |
| Rename own documents | No | Yes | No |
| Archive own documents | No | Yes | No |
| Share own documents | No | Yes | No |
| Manage sharing permissions | No | Yes | No |
| View shared documents | No automatic content access | Own documents | With permission |
| Download shared documents | No automatic content access | Own documents | With permission |
| Inspect security logs | Yes | Own activity | Own activity |

Access to every operation is enforced by the backend, not just by the frontend interface.

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

### Backend

- Python
- Flask
- JWT
- bcrypt
- Psycopg

### Database and Storage

- PostgreSQL
- Neon PostgreSQL
- Supabase Storage

### Development and Deployment

- Visual Studio Code
- Git
- GitHub
- Vercel
- Render

## 🏗️ System Architecture

TrustVault follows a frontend-backend architecture.

```text
                  USERS
                    |
          +---------+---------+
          |         |         |
        Admin     Owner     Viewer
          |         |         |
          +---------+---------+
                    |
              React + Vite
                 Frontend
                    |
                Axios API
                    |
               Flask Backend
                    |
            JWT Authentication
                    |
            Role-Based Access
                    |
          +---------+----------+
          |                    |
    Neon PostgreSQL      Supabase Storage
          |                    |
      User Records          Private Files
      Roles
      Documents
      Permissions
      Audit Logs
      Login Attempts
```

### Architecture Components

1. **Frontend:** Provides role-specific dashboards and user interactions.
2. **Backend:** Handles API requests, authentication, authorization and business logic.
3. **Database:** Stores user information, roles, document metadata, permissions and audit records.
4. **Storage:** Stores uploaded document files in a private storage bucket.

## 📂 Project Structure

```text
TrustVault/
│
├── backend/
│   ├── middleware/
│   │   └── permissions.py
│   │
│   ├── routes/
│   │   ├── admin_routes.py
│   │   ├── auth_routes.py
│   │   ├── owner_routes.py
│   │   ├── role_routes.py
│   │   └── viewer_routes.py
│   │
│   ├── services/
│   │   ├── audit_service.py
│   │   ├── audit_verification.py
│   │   └── file_service.py
│   │
│   ├── .env.example
│   ├── app.py
│   ├── db.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ViewerDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── ownerService.js
│   │   │   └── viewerService.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   └── package.json
│
├── README.md
├── PROMPTS.md
├── PROJECT_DOCUMENTATION.md
└── THREATS.md
```

## 🗄️ Database Design

TrustVault uses PostgreSQL with the following main tables:

| Table | Purpose |
|---|---|
| `roles` | Stores application roles. |
| `users` | Stores user accounts and password hashes. |
| `documents` | Stores document metadata and storage references. |
| `document_permissions` | Stores Viewer access permissions. |
| `audit_logs` | Stores application and security activity. |
| `login_attempts` | Records successful and unsuccessful login attempts. |

### Document Permissions

The `document_permissions` table supports:

- `can_view`
- `can_download`
- `granted_at`
- `expires_at`
- `revoked_at`

This allows Owners to control access independently for each shared document.

## 🔒 Security Features

TrustVault is designed with multiple security controls.

| Security area | Approach |
|---|---|
| Authentication | JWT-based authentication |
| Password protection | bcrypt password hashing |
| Authorization | Backend role-based access control |
| Document access | Ownership and permission checks |
| Document storage | Private Supabase Storage bucket |
| Permission control | View, download, expiry and revocation |
| Audit monitoring | Audit activity records |
| Integrity verification | SHA-256 hash chaining |
| Configuration | Environment variables for sensitive credentials |

### Security Testing

Security testing focuses on:

- Unauthorized API access.
- Invalid and modified JWT tokens.
- Role privilege escalation.
- Insecure Direct Object Reference (IDOR).
- Unauthorized document viewing and downloading.
- Expired and revoked permissions.
- Malicious file uploads.
- Direct storage access.
- SQL injection.
- Suspended account access.
- Audit-log tampering.
- Exposure of application secrets.

Refer to [`THREATS.md`](THREATS.md) for the detailed threat model and security test cases.

## ⚙️ Installation and Setup

### Prerequisites

Install the following tools:

- Python 3.10 or a compatible supported version.
- Node.js and npm.
- Git.
- Visual Studio Code.
- Neon PostgreSQL account.
- Supabase account.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kasturi-Neppali/TrustVault_Document.git
```

Move into the project directory:

```bash
cd TrustVault_Document
```

### Step 2: Backend Setup

Open the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your local `.env` file using `.env.example` as a reference.

Configure the required environment variables before starting the backend.

### Step 3: Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Create a local `.env.local` file and configure the backend API URL.

## 🔑 Environment Configuration

### Backend – `backend/.env`

Create this file locally. Do not commit it to GitHub.

```env
DATABASE_URL=your_neon_postgresql_connection_string

JWT_SECRET_KEY=your_secure_random_secret

SUPABASE_URL=https://your_project.supabase.co

SUPABASE_SECRET_KEY=your_supabase_secret_key

SUPABASE_BUCKET=trustworld-documents

CORS_ORIGINS=http://localhost:5173

FLASK_DEBUG=true
```

### Frontend – `frontend/.env.local`

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

**Important security notes:**

- Never commit `.env` or `.env.local` files.
- Never expose the Supabase secret key in frontend code.
- Use strong, unique production secrets.
- Configure production variables through the hosting platform.
- Keep `.env.example` limited to placeholder values.

## ▶️ Running the Application

### Start the Backend

From the backend directory, activate the virtual environment and run:

```bash
python app.py
```

The backend development server should be available at:

```text
http://127.0.0.1:5000
```

Health endpoint:

```text
http://127.0.0.1:5000/api/health
```

### Start the Frontend

From the frontend directory:

```bash
npm run dev
```

The Vite development server is normally available at:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

## ☁️ Deployment

TrustVault uses cloud services for deployment and data management.

| Component | Hosting Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |
| Document Storage | Supabase Storage |
| Source Code | GitHub |

### Deployment Architecture

1. Push application changes to GitHub.
2. Vercel builds and deploys the React frontend.
3. Render builds and runs the Flask backend.
4. Flask connects to Neon PostgreSQL.
5. Flask connects to Supabase Storage.
6. The frontend communicates with the deployed backend API.

Production environment variables and CORS settings must be configured correctly on the hosting platforms.

## 🧪 Testing

The application should be tested using separate Admin, Owner and Viewer accounts.

### Functional Testing

- Registration and login.
- Role-specific dashboard access.
- User management.
- Document upload and management.
- Document sharing.
- Permission updates.
- Permission expiry and revocation.
- Document viewing and downloading.
- Logout and navigation.

### Security Testing

Security tests should include both allowed and denied requests.

For example:

- An unauthenticated user must not access protected APIs.
- An Owner must not access another Owner's documents.
- A Viewer must not download a document without download permission.
- A revoked Viewer must not continue accessing the document.
- An Owner must not access Admin-only functionality.

Actual test outcomes should be recorded in `THREATS.md`. Do not mark a test as passed until it has been executed.

## 📚 Documentation

Additional project documentation:

| File | Description |
|---|---|
| [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) | Detailed project architecture, modules, database and deployment documentation. |
| [`THREATS.md`](THREATS.md) | Security threat model, mitigations and security test cases. |
| [`PROMPTS.md`](PROMPTS.md) | Documentation of AI-assisted development and developer review. |

## 🚀 Future Enhancements

Potential improvements include:

- Multi-factor authentication.
- Advanced login rate limiting.
- Malware scanning for uploaded documents.
- Automated security testing.
- Enhanced monitoring and alerting.
- Automated database backups.
- Advanced document preview functionality.
- More detailed security reporting.

These are future improvements and are not claimed as existing features unless implemented and verified.

## 👩‍💻 Author

**Kasturi Neppali**

GitHub: [Kasturi-Neppali](https://github.com/Kasturi-Neppali)

Project Repository: [TrustVault – GitHub](https://github.com/Kasturi-Neppali/TrustVault_Document)

---

## 📄 License

This project is developed for educational and project evaluation purposes. Add a specific open-source license if you intend to distribute it under one.
