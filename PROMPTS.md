
# PROMPTS.md

# TrustVault – AI Prompt Documentation

## 1. Project Information

**Project Name:** TrustVault – Secure Document Management Platform

**Project Type:** Full-Stack Web Application

**Project Purpose:** To develop a secure document management platform that allows users to upload, store, share, and access documents based on role-based permissions.

**Development Approach:** AI-assisted development with human review, implementation, debugging, and testing.

## 2. AI Tools Used

The following AI tools may be documented if they were actually used during development:

- ChatGPT – Project planning, code assistance, debugging, explanations, and documentation.
- Google Gemini – Additional development assistance.


## 3. Main Project Development Prompt

**Prompt:**

I want to build a secure document management platform named TrustVault as a full-stack web application.

The application should have three types of users:

1. Admin
2. Owner
3. Viewer

The Admin should manage users, assign roles, activate or deactivate accounts, view document metadata, monitor security logs, and verify audit records.

The Owner should upload documents, view their own documents, rename and archive documents, share documents with selected Viewers, grant or revoke permissions, set permission expiry dates, and control whether Viewers can download documents.

The Viewer should access only documents shared with them. They should be able to view or download documents only when the Owner grants the required permissions.

Use the following technology stack:

- Frontend: React.js with Vite
- Backend: Python Flask
- Database: MySQL
- Authentication: bcrypt and JWT
- Authorization: Role-Based Access Control (RBAC)
- Audit Logging: SHA-256 hash chaining

Provide a complete project architecture, folder structure, database schema, backend APIs, frontend components, and implementation steps.

Explain the code in beginner-friendly language and provide instructions to run and test the application.

## 4. Project Architecture and Database Prompts

### Prompt 1 – Project Structure

Design a clean folder structure for TrustVault using React.js, Flask, and MySQL.

Separate frontend components, pages, services, backend routes, middleware, database connections, and utility functions.

Explain the purpose of every folder and important file.

### Prompt 2 – Database Design

Design a MySQL database for TrustVault.

Include tables for:

- Users
- Roles
- Documents
- Document Permissions
- Audit Logs
- Login Attempts

Define primary keys, foreign keys, relationships, constraints, and suitable indexes.

Explain how the database supports secure document sharing and role-based access.

### Prompt 3 – Entity Relationship Design

Explain the relationships between Admins, Owners, Viewers, Documents, Permissions, and Audit Logs.

Provide an Entity Relationship Diagram (ERD) suitable for project documentation.

## 5. Authentication and Authorization Prompts

### Prompt 4 – User Registration and Login

Develop user registration and login APIs using Flask.

Requirements:

- Hash passwords using bcrypt.
- Validate user input.
- Prevent duplicate email registration.
- Generate JWT access tokens.
- Verify account status during login.
- Record successful and failed login attempts.
- Restrict public registration to Owner and Viewer roles.

Explain every function and its purpose.

### Prompt 5 – Role-Based Access Control

Implement RBAC middleware in Flask.

The system should allow:

- Admin to manage users and monitor security.
- Owner to manage their own documents.
- Viewer to access only shared documents.

Prevent users from accessing APIs belonging to unauthorized roles.

## 6. Admin Module Prompts

### Prompt 6 – Admin Dashboard

Develop an Admin Dashboard using React.

Include:

- Dashboard statistics.
- User management.
- Role assignment.
- Account activation and suspension.
- Document metadata.
- Security logs.
- Audit verification.

Ensure that the Admin can view document metadata without automatically receiving permission to read private document contents.

## 7. Owner Module Prompts

### Prompt 7 – Owner Document Management

Develop Owner APIs and React components to:

- Upload documents.
- View uploaded documents.
- Rename documents.
- Archive documents.
- Generate unique storage filenames.
- Calculate SHA-256 file hashes.

Store uploaded files in private server-side storage.

### Prompt 8 – Document Sharing and Permissions

Implement document sharing functionality.

The Owner should be able to:

- Share a document with a registered Viewer.
- Grant viewing permission.
- Grant or deny downloading permission.
- Set an optional expiry date.
- Revoke permissions.

Ensure that all permission checks happen in the backend.

### Prompt 9 – Permission Management Dashboard

Create an Owner interface to display:

- Viewer name and email.
- Document access permissions.
- Permission grant date.
- Expiry date.
- Active, expired, and revoked status.

Allow the Owner to revoke active permissions.

### Prompt 10 – Owner Activity History

Create an API and frontend page that displays access activities associated with documents owned by the logged-in Owner.

Include:

- Document name.
- Viewer details.
- Action performed.
- Allowed or denied result.
- Reason for the result.
- Date and time.

Restrict activity records to the logged-in Owner's documents.

## 8. Viewer Module Prompts

### Prompt 11 – Viewer Dashboard

Develop a Viewer Dashboard using React.

Include:

- Shared documents.
- Document details.
- View document functionality.
- Download functionality when permitted.
- Personal activity history.

Viewers must not be allowed to upload, rename, delete, archive, or share documents.

### Prompt 12 – Secure Document Access

Implement backend authorization for document viewing and downloading.

Check:

- Whether the document exists.
- Whether the document is archived.
- Whether the Viewer has permission.
- Whether viewing is enabled.
- Whether downloading is enabled.
- Whether permission has expired.
- Whether permission has been revoked.

Record successful and denied access attempts.

## 9. Security and Audit Prompts

### Prompt 13 – Secure File Upload

Implement secure document upload functionality.

Requirements:

- Restrict permitted file extensions.
- Set an upload size limit.
- Generate unique filenames.
- Store documents outside publicly accessible frontend folders.
- Calculate SHA-256 file hashes.
- Prevent path traversal.

Explain additional production security measures such as file-signature validation and malware scanning.

### Prompt 14 – Audit Logging

Design a tamper-evident audit logging system using SHA-256 hash chaining.

Each audit record should contain:

- User ID.
- Document ID.
- Action.
- Result.
- Reason.
- Timestamp.
- Previous hash.
- Current hash.

Explain how each record is connected to the previous record and how integrity verification works.

### Prompt 15 – Security Verification

Review the TrustWorld application for security weaknesses.

Check:

- Authentication.
- Authorization.
- Role restrictions.
- File upload validation.
- Private file storage.
- Permission expiry.
- Revoked permissions.
- Audit logging.
- SQL injection prevention.
- JWT handling.

Recommend security improvements and explain how to test them.

## 10. Frontend Integration and Debugging Prompts

### Prompt 16 – React and Flask Integration

Connect the React frontend with Flask backend APIs using Axios.

Implement:

- API service files.
- JWT authorization headers.
- Login and registration.
- Role-based dashboard navigation.
- Protected frontend routes.
- Error handling.

Explain how React communicates with Flask.

### Prompt 17 – Debugging and Error Resolution

Analyze application errors using the provided code, terminal output, and browser console messages.

Identify the root cause and provide corrected code without unnecessarily changing existing working modules.

Explain why the error occurred and how to prevent it.

### Prompt 18 – Integration Testing

Prepare an end-to-end testing plan for Admin, Owner, and Viewer roles.

Include positive and negative test cases for authentication, document uploads, sharing, permissions, downloads, and audit logging.

Provide expected HTTP response codes and test procedures.

## 11. Documentation and Hackathon Presentation Prompts

### Prompt 19 – Project Documentation

Prepare professional documentation for TrustVault.

Include:

- Abstract.
- Problem statement.
- Objectives.
- Existing system.
- Proposed system.
- System architecture.
- Database design.
- Module descriptions.
- Technology stack.
- Security features.
- Testing results.
- Future enhancements.
- Conclusion.

### Prompt 20 – Hackathon Demonstration

Prepare a demonstration plan for TrustVault that explains the complete application workflow.

Show how Admin, Owner, and Viewer accounts interact with the platform.

Highlight role-based permissions, secure document sharing, denied access attempts, and tamper-evident audit verification.

Prepare possible technical interview questions and answers about the project.

## 12. Human Review and Validation

AI-generated suggestions and code were reviewed and adapted during implementation.

The following activities require actual implementation and testing by the development team:

- Database creation and configuration.
- Backend API development.
- Frontend integration.
- Authentication and authorization testing.
- Document upload and sharing tests.
- Security verification.
- Audit-chain integrity verification.
- Final project demonstration.

AI assistance was used as a development aid. The final implementation and testing results should be reported according to the actual application behavior.

## 13. Expected Project Outcome

TrustWorld aims to provide a secure document management platform with:

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

**Project Name:** TrustVault

**Project Category:** Secure Document Management System

**Architecture:** React.js + Flask + MySQL

**Core Security Concept:** Role-Based Access Control and Tamper-Evident Audit Logging
