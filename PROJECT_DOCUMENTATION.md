# TrustVault -- Project Documentation

## 1. Title

**TrustVault: Secure Role-Based Document Management and Sharing
Platform**

## 2. Abstract

TrustVault is a full-stack document management application designed to
provide controlled document storage and sharing. It separates users into
Admin, Owner, and Viewer roles. Owners can upload and manage their own
documents and share them with selected Viewers. Sharing permissions
control whether a Viewer may view or download a document and can include
an expiry date or be revoked. Viewers can access only documents for
which they hold valid permissions. Administrators manage user accounts
and inspect document metadata and security events without automatically
receiving access to private document contents.

The application uses React with Vite for the frontend, Python Flask for
backend APIs, and MySQL for persistent data. Passwords are hashed with
bcrypt and protected APIs use JWT authentication and role-based
authorization. Document access events are recorded in audit logs, with
SHA-256 hash chaining used to make changes to records detectable during
verification.

## 3. Problem statement

Uncontrolled document sharing can expose sensitive information to users
who should not have access. A document owner may need to share a file
with a specific person, allow viewing but not downloading, limit access
to a period, or revoke access later. A system also needs a way to review
who attempted to access a document and whether access was allowed.

TrustVault addresses these requirements through role separation,
per-document permissions, backend access checks, and audit logging.

## 4. Objectives

-   Provide secure registration and login.
-   Implement three distinct roles: Admin, Owner, and Viewer.
-   Allow Owners to manage only their own documents.
-   Allow controlled sharing with registered Viewers.
-   Separate viewing permission from downloading permission.
-   Support permission expiry and revocation.
-   Prevent unauthorized access at the backend.
-   Record document access events.
-   Verify audit record integrity using a SHA-256 hash chain.
-   Provide a clear web interface for each role.

## 5. Proposed system

TrustWorld uses a React frontend to present role-specific dashboards.
The frontend sends requests to Flask APIs through Axios. Flask
authenticates requests using JWT and applies RBAC middleware. The
backend interacts with MySQL for user, document, permission, and audit
metadata. Uploaded documents are stored in a private server-side
directory and are delivered only through authorized backend routes.

## 6. User roles and responsibilities

### 6.1 Admin

-   View dashboard statistics.
-   Search and manage user accounts.
-   Assign permitted Owner/Viewer roles.
-   Activate, deactivate, or suspend accounts.
-   View document metadata.
-   Inspect login and document security logs.
-   Verify audit-chain integrity.

Admin access to metadata does not automatically grant access to private
document contents.

### 6.2 Owner

-   Upload documents.
-   List own documents.
-   Rename and archive own documents.
-   Share documents with registered Viewers.
-   Set `can_view` and `can_download`.
-   Set optional expiry timestamps.
-   Revoke permissions.
-   View permissions and activity associated with own documents.

### 6.3 Viewer

-   List documents currently shared with them.
-   View a document when a valid view permission exists.
-   Download only when download permission is also granted.
-   Be denied access after permission expiry or revocation.
-   View their own activity history.

## 7. Technology stack

  -----------------------------------------------------------------------
  Component               Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React.js                User interface

  Frontend tooling        Vite                    Development server and
                                                  build tooling

  Styling                 CSS                     Dashboard and form
                                                  styling

  API communication       Axios                   HTTP requests

  Backend                 Python Flask            REST API endpoints

  Database                MySQL                   Persistent application
                                                  data

  Password security       bcrypt                  Password hashing

  Authentication          JWT /                   Token-based
                          Flask-JWT-Extended      authentication

  Authorization           RBAC middleware         Role and account checks

  Audit integrity         SHA-256                 Hash-chain verification

  Configuration           python-dotenv           Load environment
                                                  variables

  CORS                    Flask-CORS              Permit configured
                                                  frontend origin
  -----------------------------------------------------------------------

## 8. System architecture

``` text
+-----------------------------+
|        User Browser         |
|  Admin / Owner / Viewer     |
+--------------+--------------+
               |
               v
+-----------------------------+
|       React + Vite          |
| Pages / Components / Axios  |
+--------------+--------------+
               |
          HTTP + JWT
               |
               v
+-----------------------------+
|          Flask API          |
| Auth / Admin / Owner /      |
| Viewer / Role routes        |
+--------------+--------------+
               |
       +-------+--------+
       |                |
       v                v
+--------------+  +----------------+
| RBAC         |  | Application    |
| Middleware   |  | Services       |
+--------------+  | File / Audit   |
                  +-------+--------+
                          |
                 +--------+--------+
                 |                 |
                 v                 v
          +-------------+  +------------------+
          | MySQL       |  | Private Storage  |
          | Metadata,   |  | Uploaded files   |
          | Permissions,|  +------------------+
          | Audit       |
          +-------------+
```

## 9. Database design overview

The project database is named `trustvault_db`.

  -----------------------------------------------------------------------
  Table                               Main responsibility
  ----------------------------------- -----------------------------------
  `roles`                             Defines ADMIN, OWNER, VIEWER role
                                      records.

  `users`                             Stores identity, email, bcrypt
                                      password hash, role reference, and
                                      status.

  `documents`                         Stores Owner reference, original
                                      document name, storage filename,
                                      file hash, timestamps, and archive
                                      fields.

  `document_permissions`              Stores document-to-Viewer access
                                      rules, view/download flags,
                                      grant/expiry/revocation dates.

  `audit_logs`                        Stores document activity, result,
                                      reason, timestamp, and hash-chain
                                      fields.

  `login_attempts`                    Stores login success/failure
                                      records and IP address where
                                      configured.
  -----------------------------------------------------------------------

### Main relationships

-   One role can be assigned to many users.
-   One Owner can own many documents.
-   One document can have permission records for multiple Viewers.
-   One Viewer can receive access to multiple documents.
-   One document can have multiple audit events.
-   One user can have multiple login-attempt records.

Use the actual SQL schema in the project as the final authority for
exact column definitions and constraints.

## 10. Module descriptions

### 10.1 Authentication module

Provides registration and login. Passwords are hashed using bcrypt.
Login checks account status and returns a JWT access token for an active
user.

### 10.2 Authorization module

The RBAC middleware checks the token, retrieves the current user and
role, verifies account status, and restricts protected APIs to permitted
roles.

### 10.3 Admin module

Provides user management, dashboard statistics, document metadata,
security logs, and audit verification.

### 10.4 Owner module

Provides private document upload and management, sharing, permission
administration, and Owner-scoped activity history.

### 10.5 Viewer module

Lists documents shared with the authenticated Viewer and provides
backend-protected view/download routes. It also provides the Viewer's
activity history.

### 10.6 File service

Validates allowed filename extensions, sanitizes filenames, generates
unique stored filenames, saves files in private storage, and calculates
SHA-256 file hashes. Extension validation alone is not sufficient to
establish file content safety.

### 10.7 Audit service

Records allowed and denied access events. Each hash-chained event refers
to the preceding record's hash. The verification service recalculates
the chain and reports whether the stored records match the expected
hashes.

## 11. Main workflows

### 11.1 Registration and login

1.  User submits registration details.
2.  Backend validates input.
3.  Public registration accepts Owner or Viewer roles only.
4.  Password is hashed using bcrypt.
5.  User record is stored in MySQL.
6.  During login, backend verifies the password and account status.
7.  An active user receives a JWT access token.

### 11.2 Owner uploads a document

1.  Owner selects a supported file.
2.  React sends it to the Flask upload endpoint.
3.  Backend checks the Owner identity and upload constraints.
4.  File receives a unique stored filename.
5.  File is saved in private storage.
6.  File hash and document metadata are stored in MySQL.

### 11.3 Owner shares a document

1.  Owner selects one of their documents.
2.  Owner supplies a registered Viewer's email.
3.  Owner selects viewing and downloading permissions.
4.  Owner may set an expiry timestamp.
5.  Backend verifies ownership and Viewer eligibility.
6.  Permission is stored in MySQL.

### 11.4 Viewer accesses a document

1.  Viewer requests their shared document list.
2.  Backend filters for active, non-revoked, non-expired permissions.
3.  Viewer requests a view or download.
4.  Backend rechecks permission for that specific action.
5.  Access is allowed or denied.
6.  An audit event is recorded by the relevant route.

### 11.5 Audit verification

1.  Admin requests audit verification.
2.  Backend reads audit records in chain order.
3.  Verification recalculates each event hash.
4.  Each previous hash is compared with the preceding record's current
    hash.
5.  The API reports whether the chain verifies.

## 12. Security features

-   bcrypt password hashing.
-   JWT-based authentication.
-   Role-based backend authorization.
-   Owner-scoped document operations.
-   Viewer-specific document permissions.
-   Separate view and download permissions.
-   Permission expiry and revocation.
-   Private file storage.
-   Sanitized filenames and path containment checks.
-   Login attempt recording.
-   Allowed/denied document access audit events.
-   SHA-256 audit hash chaining.

A hash chain is tamper-evident, not tamper-proof. Production deployment
should protect audit storage, restrict database privileges, and store
signed checkpoints independently.

## 13. Testing plan

Use separate test accounts and non-sensitive files.

  -----------------------------------------------------------------------
  Test case                           Expected behavior
  ----------------------------------- -----------------------------------
  Public registration as Owner        Accepted if input is valid

  Public registration as Viewer       Accepted if input is valid

  Public registration as Admin        Rejected

  Login with incorrect password       Rejected

  Login with inactive account         Rejected

  Owner uploads a supported file      Accepted

  Owner attempts to rename another    Rejected
  Owner's file                        

  Owner shares own document with a    Accepted if Viewer is eligible
  Viewer                              

  Viewer opens active shared document Allowed if `can_view` is true

  Viewer downloads with download      Allowed
  permission                          

  Viewer downloads without download   Rejected
  permission                          

  Viewer accesses expired permission  Rejected

  Viewer accesses revoked permission  Rejected

  Viewer attempts upload              Rejected

  Admin accesses document metadata    Allowed

  Admin attempts Viewer-only file API Rejected by role middleware

  Admin verifies audit chain          Returns verification result
  -----------------------------------------------------------------------


## 14. Installation and execution

### Prerequisites

-   Python.
-   Node.js and npm.
-   MySQL Server.
-   VS Code (recommended).

### Backend setup (Windows PowerShell)

``` powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

Configure `backend/.env` using the variable names expected by the
project's `db.py` and `app.py`. Typical variables include:

``` env
DB_HOST=localhost
DB_USER=trustworld_user
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_NAME=trustworld_db
JWT_SECRET_KEY=YOUR_LONG_RANDOM_SECRET
```

Create the database and tables using the SQL schema already prepared for
the project.

Start the backend:

``` powershell
py app.py
```

### Frontend setup

Open another terminal:

``` powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, commonly `http://localhost:5173`.

### Run both applications

-   MySQL must be running.
-   Flask must be running.
-   Vite must be running.
-   Frontend API configuration must point to the Flask backend.

## 15. Limitations and future enhancements

Potential future improvements: - Multi-factor authentication. - Email
notifications for sharing and access events. - File-signature validation
and malware scanning. - Login rate limiting and suspicious-login
alerts. - Document version history. - Cloud object storage and
encryption at rest. - Automated unit and integration tests. - Production
deployment with HTTPS and a WSGI server. - External signed audit
checkpoints. - Secure session/token handling and XSS/CSRF review.

## 16. Conclusion

TrustVault demonstrates a role-based approach to secure document
management. It combines authentication, backend authorization,
Owner-controlled sharing permissions, Viewer access restrictions,
private file storage, activity monitoring, and hash-chain audit
verification. The application provides a foundation that can be extended
with stronger production security, automated testing, and cloud
deployment.

------------------------------------------------------------------------

**Project:** TrustVault\
**Category:** Secure Document Management Platform\
**Frontend:** React + Vite\
**Backend:** Python Flask\
**Database:** MySQL
