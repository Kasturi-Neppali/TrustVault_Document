# TrustVault -- Secure Document Management Platform

A role-based document management web application built with **React +
Vite**, **Python Flask**, and **MySQL**. TrustWorld is designed to let
document Owners securely upload and share documents with selected
Viewers while giving Administrators tools to manage accounts and monitor
security events.

> **Project status:** This documentation reflects the project structure
> and features described during development. Run the verification
> checklist before claiming every feature is fully tested or
> production-ready.

## Table of contents

-   [Problem statement](#problem-statement)
-   [Objectives](#objectives)
-   [User roles](#user-roles)
-   [Features](#features)
-   [Technology stack](#technology-stack)
-   [Project structure](#project-structure)
-   [Architecture](#architecture)
-   [Database overview](#database-overview)
-   [Getting started on Windows](#getting-started-on-windows)
-   [Environment configuration](#environment-configuration)
-   [Running the application](#running-the-application)
-   [API overview](#api-overview)
-   [Security design](#security-design)
-   [Testing checklist](#testing-checklist)
-   [Known limitations and production
    recommendations](#known-limitations-and-production-recommendations)
-   [Future enhancements](#future-enhancements)

## Problem statement

Documents are often shared through systems that provide limited control
over who can view or download them. TrustVault addresses this problem
with role-based access, Owner-controlled sharing permissions, expiry and
revocation, and audit records for document access.

## Objectives

1. Authentication with at least admin, owner, and viewer roles.
2. Upload, organise, search, and manage documents.
3. Per-document read and edit permissions granted to named users.
4. Owners can grant and revoke access.
5. Users without permission cannot read, download, edit, or delete a document.
6. Audit uploads, downloads, edits, deletions, and permission changes.
7. Search by name, owner, category, and date.
8. Validate uploads.
9. Admin view of document activity and permission changes.
10. Automated tests proving one user cannot access another user's documents.

## User roles

  -----------------------------------------------------------------------
  Role                                Responsibilities
  ----------------------------------- -----------------------------------
  **Admin**                           Manage user accounts and roles,
                                      view document metadata, inspect
                                      security events, and verify the
                                      audit chain. Admin access does not
                                      automatically grant access to
                                      private document contents.

  **Owner**                           Upload, list, rename, and archive
                                      their own documents; share with
                                      registered Viewers; set
                                      view/download permissions and
                                      optional expiry; revoke
                                      permissions; inspect activity
                                      related to their documents.

  **Viewer**                          List documents shared with them,
                                      view documents when permitted,
                                      download only when separately
                                      permitted, and inspect their own
                                      activity.
  -----------------------------------------------------------------------

Public registration is intended to permit only `OWNER` and `VIEWER`.
Admin accounts should be provisioned through a controlled administrative
process, not public registration.

## Features

### Authentication and authorization

-   Registration and login APIs.
-   Password hashing with bcrypt.
-   JWT access tokens.
-   Account status checks.
-   Role-based backend authorization.

### Owner

-   Private document upload.
-   Document listing and metadata.
-   Rename and archive operations.
-   Share with a registered Viewer.
-   `can_view` and `can_download` controls.
-   Optional permission expiry.
-   Permission listing and revocation.
-   Owner-scoped activity history.

### Viewer

-   List currently shared and viewable documents.
-   View and download endpoints with backend permission checks.
-   Deny access for revoked or expired permissions.
-   Viewer-specific activity history.

### Admin

-   Dashboard statistics.
-   User search and management.
-   Role and account-status changes.
-   Document metadata listing.
-   Security log review.
-   Audit-chain verification.

### Audit

-   Record allowed and denied document access events.
-   SHA-256 hash chaining using previous/current hashes.
-   Admin endpoint to verify the chain.

## Technology stack

  Layer                   Technology
  ----------------------- ------------------------------
  Frontend                React, Vite, JavaScript, CSS
  Backend                 Python, Flask
  Database                MySQL
  Authentication          bcrypt, Flask-JWT-Extended
  HTTP client             Axios
  Cross-origin requests   Flask-CORS
  Configuration           python-dotenv
  Audit integrity         SHA-256 hash chaining

## Project structure

The screenshots supplied during development show this general layout.
Some nested `frontend` or `node_modules` folders visible in the
workspace may be leftovers from setup; verify their purpose before
deleting anything.

``` text
TrustWorld/
├── backend/
│   ├── .venv/
│   ├── middleware/
│   │   └── permissions.py
│   ├── routes/
│   │   ├── admin_routes.py
│   │   ├── auth_routes.py
│   │   ├── owner_routes.py
│   │   ├── role_routes.py
│   │   └── viewer_routes.py
│   ├── services/
│   │   ├── audit_service.py
│   │   ├── audit_verification.py
│   │   └── file_service.py
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── app.py
│   ├── db.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ViewerDashboard.jsx
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── ownerService.js
│   │   │   └── viewerService.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── PROMPTS.md
└── README.md
```

The backend and frontend should be run as separate applications. Keep
secrets and uploaded documents out of source control.

## Architecture

``` text
                 Browser
                    |
             React + Vite UI
                    |
              Axios requests
               JWT header
                    |
                 Flask API
          __________|____________
         |          |            |
       Auth      RBAC          Routes
       routes   middleware   Admin/Owner/
                              Viewer
                                  |
                              Services
                         File / Audit logic
                                  |
                       ___________________
                      |                   |
                    MySQL          Private file storage
               users, roles,       uploaded documents
               documents,
               permissions,
               audit_logs,
               login_attempts
```

The frontend controls navigation and presentation. The backend is the
authority for authentication, authorization, and file access. A hidden
button or protected React route is not a substitute for backend
authorization.

## Database overview

The database used in the project is `trustvault_db`. The documented
tables are:

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `roles`                             Stores role names such as ADMIN,
                                      OWNER, VIEWER.

  `users`                             Stores user profile, password hash,
                                      role reference, and account status.

  `documents`                         Stores document metadata, Owner
                                      reference, private storage
                                      filename, file hash, and archive
                                      state.

  `document_permissions`              Stores Viewer access, view/download
                                      flags, grant/expiry/revocation
                                      timestamps.

  `audit_logs`                        Stores document actions, results,
                                      reasons, timestamps, and hash-chain
                                      fields.

  `login_attempts`                    Stores successful and failed login
                                      attempts.
  -----------------------------------------------------------------------

Important relationships: - Each user references one role. - Each
document references its Owner in `users`. - Each permission references a
document and a Viewer. - Audit records may reference a user and a
document. - Login attempts may reference a user; failed attempts for
unknown email addresses may have a null user ID.

Use the SQL schema already created for your project. Before submission,
verify the actual schema in MySQL Workbench rather than assuming that
every optional column or index exists.

## Getting started on Windows

### Prerequisites

Install: - Python 3.10+ (the project was developed with Python 3.13.9 in
the development environment). - Node.js and npm. - MySQL Server and
MySQL Workbench. - Visual Studio Code (recommended).

### 1. Clone or open the project

``` powershell
git clone https://github.com/Kasturi-Neppali/TrustVault_Document.git
cd TrustWorld
```

If the repository is already on your computer, open its root folder in
VS Code.

### 2. Configure the database

1.  Start MySQL Server.
2.  Create the database named `trustvault_db`.
3.  Create the tables and seed the roles using the SQL schema prepared
    for this project.
4.  Create a dedicated MySQL application user with only the permissions
    required by the application.
5.  Put the database connection values in `backend/.env`.

Do not use a database administrator account as the application's normal
database user.

### 3. Set up the Flask backend

Open a terminal:

``` powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

If PowerShell blocks activation, use the virtual environment interpreter
directly:

``` powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env` based on `backend/.env.example`. Example variable
names:

``` env
DB_HOST=localhost
DB_USER=trustworld_user
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_NAME=trustworld_db
JWT_SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
```

Use the exact variable names expected by your `db.py` and `app.py`.
Never commit the real `.env` file.

Start Flask:

``` powershell
py app.py
```

The development server is commonly available at:

``` text
http://127.0.0.1:5000
```

### 4. Set up the React frontend

Open a second terminal:

``` powershell
cd frontend
npm install
npm run dev
```

Vite normally displays a local URL such as:

``` text
http://localhost:5173
```

Keep both backend and frontend terminals running while using the
application.

## Environment configuration

The backend `.env` file contains secrets and local database
configuration. The frontend `.env` file, if used, should contain only
values safe to expose in a browser bundle, such as a public API base
URL. Never place passwords, JWT signing secrets, or database credentials
in frontend environment variables.

Recommended: - Keep `backend/.env` out of Git. - Keep private uploads
out of Git. - Commit `.env.example` with placeholder values only. -
Rotate any secret that was accidentally committed or shared.

## Running the application

1.  Start MySQL.
2.  Start Flask from `backend`.
3.  Start Vite from `frontend`.
4.  Open the Vite URL in a browser.
5.  Register an Owner or Viewer account.
6.  Sign in using the appropriate role.
7.  Provision and test the Admin account separately.

## API overview

The following route groups are part of the project. Confirm exact
request bodies and response fields in the route files before using this
table as a formal API contract.

  --------------------------------------------------------------------------------------------------
  Method                  Endpoint                                           Purpose
  ----------------------- -------------------------------------------------- -----------------------
  POST                    `/api/auth/register`                               Register an Owner or
                                                                             Viewer

  POST                    `/api/auth/login`                                  Authenticate and
                                                                             receive a JWT

  GET                     `/api/owner/documents`                             List the current
                                                                             Owner's documents

  POST                    `/api/owner/documents`                             Upload a document

  GET                     `/api/owner/documents/<document_id>`               Get own document
                                                                             details

  PATCH                   `/api/owner/documents/<document_id>`               Rename own document

  DELETE                  `/api/owner/documents/<document_id>`               Archive own document

  POST                    `/api/owner/documents/<document_id>/share`         Share a document

  GET                     `/api/owner/documents/<document_id>/permissions`   List document
                                                                             permissions

  DELETE                  `/api/owner/permissions/<permission_id>`           Revoke a permission

  GET                     `/api/owner/activity`                              List activity for own
                                                                             documents

  GET                     `/api/viewer/documents`                            List documents shared
                                                                             with Viewer

  GET                     `/api/viewer/documents/<document_id>/view`         View a permitted
                                                                             document

  GET                     `/api/viewer/documents/<document_id>/download`     Download a permitted
                                                                             document

  GET                     `/api/viewer/activity`                             List current Viewer's
                                                                             activity

  GET                     `/api/admin/dashboard`                             Admin dashboard
                                                                             statistics

  GET                     `/api/admin/users`                                 List/search users

  GET                     `/api/admin/documents`                             List document metadata

  GET                     `/api/admin/security-logs`                         Review security events

  GET                     `/api/admin/audit/verify`                          Verify audit hash chain
  --------------------------------------------------------------------------------------------------

The project also contains role-related routes. Inspect `role_routes.py`
for the exact endpoints it exposes.

Protected endpoints require the JWT in the request header:

``` http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Security design

### Password security

Passwords are hashed using bcrypt. Plain-text passwords should never be
stored.

### JWT authentication

After successful login, the backend issues an access token. Protected
API routes validate the token and check the current user's role and
account status.

### Role-based authorization

Backend middleware checks the authenticated user and role before
allowing access to protected endpoints.

### Private document storage

Uploaded files are stored on the server rather than in the React public
assets. The backend resolves the stored filename and checks that the
resolved path remains inside the configured upload directory.

### Permission checks

Viewer access depends on the matching document permission, view/download
flags, revocation state, and expiry time. These checks must run on every
protected file request.

### Audit hash chain

Audit records include a previous hash and a current SHA-256 hash.
Verification recalculates the chain and can detect changes to records
that remain in the chain. A hash chain alone is not tamper-proof:
privileged database access or truncation of the chain requires
additional protections such as independently stored signed checkpoints.

## Testing checklist

Run these tests with dedicated test accounts and non-sensitive sample
documents.

### Authentication

-   [ ] Register an Owner.
-   [ ] Register a Viewer.
-   [ ] Confirm public registration rejects ADMIN.
-   [ ] Confirm duplicate email registration is rejected.
-   [ ] Confirm incorrect login credentials are rejected.
-   [ ] Confirm inactive/suspended accounts cannot log in.

### Admin

-   [ ] View dashboard statistics.
-   [ ] Search users.
-   [ ] Change an eligible user's role.
-   [ ] Activate/deactivate/suspend a test account.
-   [ ] View document metadata without receiving private file content.
-   [ ] Review security logs.
-   [ ] Verify the audit chain.

### Owner

-   [ ] Upload a supported file.
-   [ ] List own documents.
-   [ ] Rename own document.
-   [ ] Archive own document.
-   [ ] Share a document with a registered Viewer.
-   [ ] Set view/download permissions and expiry.
-   [ ] Inspect permissions.
-   [ ] Revoke an active permission.
-   [ ] View activity related to own documents.
-   [ ] Confirm one Owner cannot manage another Owner's documents.

### Viewer

-   [ ] List documents shared with the Viewer.
-   [ ] View a document when view permission is active.
-   [ ] Download only when download permission is active.
-   [ ] Confirm expired and revoked permissions are rejected.
-   [ ] Confirm unshared documents are rejected.
-   [ ] Confirm Viewer cannot upload, rename, archive, or share
    documents.
-   [ ] View only their own activity.

### Audit

-   [ ] Confirm allowed view/download attempts are logged.
-   [ ] Confirm denied attempts are logged where the route has an audit
    event.
-   [ ] Verify the hash chain.
-   [ ] Investigate any verification failure before claiming the log is
    intact.

Record actual test results, dates, and screenshots before submitting the
project.

## Known limitations and production recommendations

This project is a hackathon/learning implementation and should receive
further security review before production use.

Recommended improvements: 1. Add file-signature/content validation and
malware scanning; extension allowlists alone do not prove file content.
2. Add rate limiting and account lockout or throttling for login
attempts. 3. Use secure, HttpOnly, SameSite cookies or carefully
evaluate token storage; localStorage is exposed to successful XSS. 4.
Use HTTPS in deployment. 5. Run Flask behind a production WSGI server;
do not use the Flask development server in production. 6. Keep secrets
in a secure secret manager and rotate them when exposed. 7. Restrict
database privileges and protect audit storage. 8. Store signed audit
checkpoints outside the primary database. 9. Add automated unit,
integration, and authorization tests. 10. Consider CSRF protection if
cookie-based authentication is adopted. 11. Review file download
headers, content types, and browser handling. 12. Apply database
migrations and backups.

## Future enhancements

-   Multi-factor authentication.
-   Email notifications when documents are shared or accessed.
-   Document version history.
-   Advanced search and filtering.
-   Bulk permission management.
-   Rate limiting and suspicious-login alerts.
-   Malware scanning and file content inspection.
-   Cloud object storage with encryption at rest.
-   Signed external audit checkpoints.
-   Automated test suite and CI/CD pipeline.

------------------------------------------------------------------------

**TrustVault -- Secure Document Management Platform**\
Built with React, Flask, and MySQL.
