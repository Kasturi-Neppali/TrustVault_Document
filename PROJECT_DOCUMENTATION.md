# TrustVault – Project Documentation

## 1. Project Overview

### Project Name
**TrustVault – Secure Role-Based Document Management System**

### Project Description

TrustVault is a secure document management platform that enables users to upload, manage, share and access documents based on assigned roles and permissions.

The system provides three different roles: Admin, Owner and Viewer.

Owners can upload and manage their documents and share them with registered Viewers. They can control whether a Viewer is allowed to view or download a document and can define permission expiry dates.

Viewers can access only documents shared with them and only perform actions permitted by the Owner.

Admins manage user accounts, roles and account statuses and can monitor document metadata and security activities.

The application is designed to improve document confidentiality, access control, accountability and secure document sharing.

## 2. Problem Statement

Traditional document-sharing methods can make it difficult to control who accesses confidential documents, what actions they can perform and how long their access should remain active.

Sharing documents without proper authorization controls may result in unauthorized viewing, downloading or distribution.

TrustVault addresses these challenges through role-based access control, document-level permissions, private storage and audit logging.

## 3. Project Objectives

The main objectives are:

1. Provide secure user authentication.
2. Implement role-based access control.
3. Allow Owners to upload and manage documents.
4. Allow Owners to share documents with registered Viewers.
5. Provide separate viewing and downloading permissions.
6. Support permission expiry and revocation.
7. Prevent unauthorized access to documents.
8. Maintain audit records of important activities.
9. Allow Admins to manage users and monitor security activities.
10. Provide a responsive and user-friendly interface.

## 4. User Roles and Responsibilities

### 4.1 Admin

The Admin is responsible for managing the application users and monitoring system activities.

Responsibilities:

- View registered users.
- Manage user roles.
- Activate, deactivate or suspend accounts.
- View document metadata.
- Inspect security and audit logs.
- Verify audit-chain integrity.

Admin access to user management does not automatically grant access to private document contents.

### 4.2 Owner

The Owner manages their own documents and controls document sharing.

Responsibilities:

- Upload documents.
- View uploaded documents.
- Rename documents.
- Archive documents.
- Share documents with registered Viewers.
- Enable or disable viewing permissions.
- Enable or disable downloading permissions.
- Configure permission expiry dates.
- Revoke previously granted permissions.
- View document activity.

### 4.3 Viewer

The Viewer accesses documents shared by Owners.

Responsibilities:

- View documents shared with them.
- Download documents when downloading permission is enabled.
- View their own document activity.
- Access only documents for which valid permissions exist.

## 5. Functional Modules

| Module | Description |
|---|---|
| Authentication | Handles user registration and login. |
| Role Management | Controls access based on Admin, Owner and Viewer roles. |
| Admin Management | Manages users and account statuses. |
| Document Management | Supports document upload, listing, renaming and archiving. |
| Document Sharing | Allows Owners to share documents with Viewers. |
| Permission Management | Controls viewing, downloading, expiry and revocation. |
| Viewer Access | Provides access to documents according to assigned permissions. |
| Audit Logging | Records important application activities. |
| Audit Verification | Verifies the integrity of hash-chained audit records. |
| Security Monitoring | Provides visibility into security-related activity. |

## 6. Technology Stack

### Frontend

- React – Component-based user interface.
- Vite – Frontend development and build tool.
- HTML5 – Application structure.
- CSS3 – Styling and responsive design.
- JavaScript – Frontend functionality.
- Axios – HTTP communication with backend APIs.
- React Router – Frontend navigation and protected routes.

### Backend

- Python – Backend programming language.
- Flask – REST API development.
- JWT – Authentication and token validation.
- bcrypt – Password hashing.
- Psycopg – PostgreSQL connectivity.

### Database and Storage

- PostgreSQL – Relational database.
- Neon – Hosted PostgreSQL database.
- Supabase Storage – Private document storage.

### Development and Deployment

- Visual Studio Code – Development environment.
- Git – Version control.
- GitHub – Source code repository.
- Vercel – Frontend hosting.
- Render – Backend hosting.

## 7. System Architecture

TrustVault follows a frontend-backend architecture.

The React frontend communicates with Flask REST APIs. The backend validates authentication and permissions before performing database or document-storage operations.

The PostgreSQL database stores users, roles, document metadata, permissions and audit records.

Supabase Storage stores document files in a private bucket.

### Architecture Flow

```text
                 USERS
                   |
          +--------+--------+
          |        |        |
        Admin    Owner    Viewer
          |        |        |
          +--------+--------+
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
       +-----------+-----------+
       |                       |
  Neon PostgreSQL       Supabase Storage
       |                       |
  Users and Roles         Private Files
  Documents               Document Objects
  Permissions
  Audit Logs
  Login Attempts
```

## 8. Database Design

TrustVault uses PostgreSQL to maintain application data.

### 8.1 Roles Table

Stores the available application roles.

Important fields:

- `role_id`
- `role_name`

Roles include ADMIN, OWNER and VIEWER.

### 8.2 Users Table

Stores user account information.

Important fields:

- `user_id`
- `name`
- `email`
- `password_hash`
- `role_id`
- `status`
- `created_at`

The password is stored as a hash rather than plain text.

### 8.3 Documents Table

Stores document metadata.

Important fields:

- `document_id`
- `owner_id`
- `document_name`
- `storage_path`
- `file_hash`
- `created_at`
- `updated_at`
- `is_deleted`
- `deleted_at`

Document file contents are stored in Supabase Storage rather than directly in the database.

### 8.4 Document Permissions Table

Stores document-sharing permissions.

Important fields:

- `permission_id`
- `document_id`
- `viewer_id`
- `can_view`
- `can_download`
- `granted_at`
- `expires_at`
- `revoked_at`

This table controls which Viewer can access a document and what actions are permitted.

### 8.5 Audit Logs Table

Stores important security and application activities.

Important fields:

- `log_id`
- `user_id`
- `document_id`
- `action`
- `result`
- `reason`
- `ip_address`
- `timestamp`
- `previous_hash`
- `current_hash`

The hash-chain structure supports detection of modifications to recorded audit entries.

### 8.6 Login Attempts Table

Stores login attempt information.

Important fields:

- `attempt_id`
- `user_id`
- `email`
- `status`
- `ip_address`
- `attempted_at`

This information supports monitoring of successful and unsuccessful login activity.

## 9. Security Design

Security is a major consideration in TrustVault.

### 9.1 Authentication

- Users authenticate through the login system.
- Passwords are stored using password hashing.
- JWT tokens are used to authenticate protected API requests.
- Token validation is performed by the backend.

### 9.2 Role-Based Access Control

Access to protected functionality is determined by the authenticated user's role.

- Admin APIs are restricted to Admin users.
- Owner APIs are restricted to authorized Owners.
- Viewer APIs are restricted to Viewers.

### 9.3 Document-Level Authorization

Role verification alone is not sufficient for document access.

The backend must also verify document ownership or an active sharing permission before allowing document operations.

### 9.4 Permission-Based Sharing

Owners can control:

- Whether a Viewer can view a document.
- Whether a Viewer can download a document.
- When the permission expires.
- Whether the permission is revoked.

### 9.5 Private Document Storage

Documents are stored in a private Supabase Storage bucket.

Access to document contents is controlled through backend authorization and the configured storage access mechanism.

### 9.6 Audit Logging

Important activities are recorded in the audit logs.

The audit structure uses SHA-256 hash chaining to support integrity verification.

### 9.7 Environment Configuration

Sensitive credentials are configured using environment variables rather than being hardcoded into application source files.

The repository uses an example environment file containing placeholder values.

## 10. Document Management Workflow

### Owner Workflow

1. Owner logs in.
2. Owner opens the dashboard.
3. Owner uploads a document.
4. Backend validates the upload.
5. The file is stored in private storage.
6. Document metadata is saved in PostgreSQL.
7. Owner shares the document with a registered Viewer.
8. Owner selects viewing and downloading permissions.
9. Owner optionally sets an expiry date.
10. Owner can later revoke the permission.

### Viewer Workflow

1. Viewer logs in.
2. Viewer opens the dashboard.
3. Backend retrieves documents shared with the Viewer.
4. Viewer selects an available document.
5. Backend checks the active permission.
6. Viewing or downloading is allowed only when the corresponding permission is valid.

### Admin Workflow

1. Admin logs in.
2. Admin opens the dashboard.
3. Admin views registered users.
4. Admin manages roles and account statuses.
5. Admin inspects document metadata and security activities.
6. Admin can verify audit-chain integrity.

## 11. Deployment Architecture

TrustVault is deployed using cloud hosting services.

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |
| Document Storage | Supabase Storage |
| Source Code | GitHub |

### Deployment Flow

1. Source code is maintained in GitHub.
2. The React frontend is built and deployed through Vercel.
3. The Flask backend is deployed through Render.
4. Render connects to the Neon PostgreSQL database.
5. The backend connects to the private Supabase Storage bucket.
6. The frontend communicates with the deployed backend using its configured API base URL.

Production credentials are configured through deployment environment variables and must not be committed to the repository.

## 12. Error Handling and Validation

The application should validate user inputs and handle errors appropriately.

Examples include:

- Invalid login credentials.
- Missing authentication tokens.
- Unauthorized API requests.
- Invalid document permissions.
- Expired or revoked permissions.
- Invalid file uploads.
- Database connection failures.
- Storage operation failures.

The backend should return appropriate HTTP status codes and avoid exposing sensitive internal information in error responses.

## 13. Testing Strategy

Testing should cover both normal application workflows and unauthorized access attempts.

### Functional Testing

- User registration and login.
- Role-specific dashboard access.
- Document upload and listing.
- Document rename and archive.
- Document sharing.
- Permission updates.
- Permission revocation.
- Document viewing and downloading.
- Admin user management.
- Logout and navigation.

### Security Testing

- Access protected APIs without authentication.
- Submit invalid or modified JWT tokens.
- Attempt role privilege escalation.
- Attempt access to another Owner's document.
- Attempt unauthorized Viewer access.
- Attempt downloading without permission.
- Attempt access after permission expiry or revocation.
- Test invalid file uploads.
- Test private storage access.
- Test SQL injection-style input.
- Test suspended account access.
- Verify audit-chain integrity.

Actual security test results must be documented after the tests are executed. A test must not be marked successful without evidence.

Refer to `THREATS.md` for the detailed threat model and security test scenarios.

## 14. Project Limitations and Future Enhancements

Potential future improvements include:

- Multi-factor authentication.
- Stronger login rate limiting and account protection.
- More advanced file content inspection and malware scanning.
- Automated security testing in the deployment pipeline.
- Enhanced monitoring and alerting.
- More detailed audit reporting.
- Automated backup and recovery procedures.
- Additional document formats and preview capabilities.

These are potential enhancements and should not be considered implemented unless they are actually developed and tested.

## 15. Conclusion

TrustVault provides a role-based document management platform designed to support secure document upload, controlled sharing and permission-based access.

The application combines React, Flask, PostgreSQL and private cloud storage to provide separate experiences for Admin, Owner and Viewer users.

Its security design focuses on authentication, role-based authorization, document-level permissions, private storage and audit logging.

The project demonstrates the practical application of full-stack development, database management, cloud deployment and security-focused software engineering.

The implementation and security controls should be evaluated through actual testing and deployment verification.
