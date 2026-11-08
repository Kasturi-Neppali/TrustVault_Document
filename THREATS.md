
# THREATS.md

# TrustVault – Security Threat Model

## 1. Introduction

TrustWorld is a secure, role-based document management platform designed to protect confidential documents through authentication, authorization, controlled document sharing and audit logging.

The application supports three user roles:

- **Admin:** Manages users, roles, account statuses and security monitoring.
- **Owner:** Uploads and manages documents and shares them with registered Viewers.
- **Viewer:** Accesses documents shared by Owners, subject to assigned permissions.

This document identifies potential security threats, their possible impact, the security controls designed to mitigate them, and the tests required to validate those controls.

The threat model focuses on protecting document confidentiality, integrity and availability.

## 2. Assets to Protect

| Asset | Description | Security requirement |
|---|---|---|
| User accounts | User identities and credentials | Confidentiality and integrity |
| Authentication tokens | JWT access tokens | Confidentiality and integrity |
| Documents | Uploaded confidential files | Confidentiality and integrity |
| Document permissions | View, download and expiry settings | Integrity |
| User roles | Admin, Owner and Viewer assignments | Integrity |
| Database | Users, documents and permission records | Confidentiality and integrity |
| Audit logs | Records of user and document activities | Integrity |
| Storage credentials | Supabase service credentials | Confidentiality |
| Database credentials | Neon connection credentials | Confidentiality |

## 3. Potential Attackers

The following attacker types are considered:

1. **Unauthenticated attacker:** Attempts to access protected APIs without logging in.
2. **Malicious Viewer:** Attempts to access documents or perform actions beyond granted permissions.
3. **Malicious Owner:** Attempts to access another Owner's documents or administrative functions.
4. **Compromised account:** An attacker obtains a legitimate user's credentials or access token.
5. **Insider threat:** An authorized user attempts to misuse their access.
6. **External attacker:** Attempts to exploit exposed application endpoints, upload functionality or configuration weaknesses.

## 4. Threat Identification and Mitigation

### T01 – Unauthorized API Access

**Threat:** An attacker attempts to access protected APIs without authentication.

**Possible impact:**
- Exposure of private information.
- Unauthorized document operations.
- Access to user or administrative information.

**Security controls:**
- JWT-based authentication.
- Authentication middleware for protected routes.
- Validation of access tokens before processing protected requests.

**Validation test:**
- Send a request to a protected endpoint without an Authorization header.
- Expected result: The request must be rejected.

### T02 – Invalid or Modified JWT Token

**Threat:** An attacker modifies a JWT token or submits an invalid or expired token.

**Possible impact:**
- Unauthorized access.
- Identity impersonation.
- Privilege escalation if token validation is incorrect.

**Security controls:**
- JWT signature verification.
- Token expiry validation.
- Secure server-side JWT secret configuration.

**Validation tests:**
- Submit a modified token.
- Submit a random token.
- Submit an expired token.
- Expected result: All invalid tokens must be rejected.

### T03 – Role-Based Privilege Escalation

**Threat:** An Owner or Viewer attempts to access Admin-only functionality by directly calling administrative APIs.

**Possible impact:**
- Unauthorized user management.
- Unauthorized role changes.
- Account suspension or activation by unauthorized users.

**Security controls:**
- Backend role-based access control.
- Role verification on protected administrative endpoints.
- Admin account creation through controlled provisioning rather than public registration.

**Validation test:**
- Log in as an Owner.
- Attempt to access an Admin API.
- Repeat using a Viewer account.
- Expected result: Both requests must be rejected.

### T04 – Insecure Direct Object Reference (IDOR)

**Threat:** A user changes a document ID or permission ID in an API request to access another user's resources.

**Possible impact:**
- Unauthorized document access.
- Unauthorized document modification.
- Exposure of confidential files.

**Security controls:**
- Verify document ownership on the backend.
- Check sharing permissions before allowing Viewer access.
- Validate resource ownership for every sensitive operation.

**Validation test:**
- Create two Owner accounts.
- Upload a document using Owner A.
- Log in as Owner B.
- Attempt to access Owner A's document using its document ID.
- Expected result: Owner B must not access or modify the document.

### T05 – Unauthorized Document Viewing

**Threat:** A Viewer attempts to view a document that has not been shared with them or whose viewing permission is disabled.

**Possible impact:**
- Confidential document exposure.
- Violation of Owner-controlled access.

**Security controls:**
- Document sharing records.
- Backend verification of `can_view`.
- Permission expiry and revocation checks.

**Validation tests:**
- Attempt to view an unshared document.
- Attempt to view a document with `can_view` disabled.
- Attempt to view a document after permission revocation.
- Expected result: Every unauthorized attempt must be rejected.

### T06 – Unauthorized Document Download

**Threat:** A Viewer attempts to download a document when download permission is disabled.

**Possible impact:**
- Unauthorized copying and distribution of confidential files.

**Security controls:**
- Separate `can_view` and `can_download` permissions.
- Backend download authorization.
- Private document storage.

**Validation test:**
- Share a document with `can_view = true` and `can_download = false`.
- Attempt to view and download it.
- Expected result: Viewing may be allowed, but downloading must be rejected.

### T07 – Expired or Revoked Permissions

**Threat:** A Viewer attempts to access a document after the Owner's sharing permission expires or is revoked.

**Possible impact:**
- Continued access after authorization has ended.

**Security controls:**
- Permission expiry timestamps.
- Revocation timestamps.
- Permission checks during document access.

**Validation tests:**
- Create a permission with an expiry time in the past.
- Attempt to access the document.
- Revoke an active permission and attempt access again.
- Expected result: Both attempts must be rejected.

### T08 – Malicious File Upload

**Threat:** An attacker uploads a disallowed, oversized or potentially malicious file.

**Possible impact:**
- Storage abuse.
- Application instability.
- Distribution or storage of unsafe files.

**Security controls:**
- File type validation.
- File size restrictions.
- Generated storage filenames.
- Server-side upload validation.

**Validation tests:**
- Upload a file with a disallowed extension.
- Upload a file exceeding the configured size limit.
- Attempt to disguise a disallowed file using a misleading filename.
- Expected result: Invalid uploads must be rejected.

### T09 – Unauthorized Direct Storage Access

**Threat:** An attacker attempts to access private files directly through Supabase Storage without valid application authorization.

**Possible impact:**
- Bypassing application-level permissions.
- Confidential document exposure.

**Security controls:**
- Private Supabase Storage bucket.
- No public document URLs.
- Backend-controlled document access.
- Short-lived signed URLs, where used.

**Validation tests:**
- Attempt to access a document through a public URL.
- Attempt to access a document using an invalid or expired signed URL.
- Expected result: Unauthorized direct access must fail.

### T10 – SQL Injection

**Threat:** An attacker submits malicious input through login, search or other API fields to manipulate database queries.

**Possible impact:**
- Unauthorized database access.
- Data exposure or modification.
- Authentication bypass.

**Security controls:**
- Parameterized SQL queries.
- Input validation.
- Avoidance of unsafe SQL string concatenation.

**Validation test:**
- Submit SQL injection-style input to relevant API fields.
- Expected result: Input must be handled as data and must not alter SQL query behavior.

### T11 – Account Status Bypass

**Threat:** A suspended or inactive user attempts to continue using protected APIs.

**Possible impact:**
- Access by users whose accounts should no longer be active.

**Security controls:**
- Account status validation.
- Backend authentication and authorization checks.
- Controlled account activation and suspension.

**Validation tests:**
- Suspend a test account.
- Attempt to access protected endpoints using that account.
- Repeat for an inactive account.
- Expected result: Access must be rejected.

### T12 – Audit Log Tampering

**Threat:** An attacker attempts to modify or delete audit records to hide unauthorized activity.

**Possible impact:**
- Loss of accountability.
- Inability to investigate suspicious activity.
- Reduced trust in security records.

**Security controls:**
- Audit logging for important operations.
- Hash chaining using previous and current record hashes.
- Audit-chain verification.

**Validation tests:**
- Generate multiple audit records.
- Verify the audit chain.
- Modify a record in a controlled test environment.
- Run verification again.
- Expected result: The integrity check must detect the tampering.

### T13 – Brute-Force Login Attempts

**Threat:** An attacker repeatedly submits login attempts to guess user passwords.

**Possible impact:**
- Account compromise.
- Unauthorized access to confidential documents.

**Security controls:**
- Password hashing.
- Login-attempt recording.
- Additional rate limiting or account protection where configured.

**Validation tests:**
- Submit repeated invalid login attempts.
- Check whether attempts are recorded.
- Verify that any configured rate-limiting or lockout mechanism works.

### T14 – Exposure of Application Secrets

**Threat:** Database credentials, JWT secrets or Supabase service credentials are exposed through source code, GitHub or deployment logs.

**Possible impact:**
- Database compromise.
- Token forgery.
- Unauthorized storage access.

**Security controls:**
- Environment variables.
- `.env` exclusion through `.gitignore`.
- Separate `.env.example` containing placeholders.
- Restricted access to deployment environment variables.

**Validation tests:**
- Inspect tracked Git files for real secrets.
- Verify that `.env` files are excluded.
- Confirm that production secrets are configured through deployment environment variables.

## 5. Security Testing Principles

Security testing must verify the actual backend behavior, not only the frontend interface.

The following principles will be followed:

1. Test both authorized and unauthorized requests.
2. Test access using different user roles.
3. Attempt to access resources using modified resource IDs.
4. Verify document permissions independently for viewing and downloading.
5. Verify expiry and revocation behavior.
6. Test invalid authentication tokens.
7. Verify private storage access.
8. Verify audit-chain integrity.
9. Record the actual test result and expected result.
10. Perform destructive tests only on test data and controlled environments.

## 6. Known Limitations and Assumptions

- A valid JWT does not automatically guarantee that the user is authorized to access a particular document. Resource-level checks are required.
- Frontend route protection is not a replacement for backend authorization.
- A private storage bucket alone does not prove that every application access path is secure.
- Hash chaining can help detect record modification, but it does not by itself prevent a privileged attacker from rewriting an entire chain.
- Password hashing does not prevent brute-force attempts by itself.
- File extension validation alone cannot establish that a file is safe.
- A compromised authorized account may still perform actions permitted to that account.
- Security controls must be validated against the deployed application and its actual configuration.

## 7. Security Test Results

Test results must be recorded only after executing the tests.

| Test ID | Test scenario | Expected result | Actual result | Status |
|---|---|---|---|---|
| ST01 | Access protected API without token | Rejected | Pending | NOT TESTED |
| ST02 | Submit invalid JWT | Rejected | Pending | NOT TESTED |
| ST03 | Owner accesses Admin API | Rejected | Pending | NOT TESTED |
| ST04 | Owner accesses another Owner's document | Rejected | Pending | NOT TESTED |
| ST05 | Viewer accesses unshared document | Rejected | Pending | NOT TESTED |
| ST06 | Viewer downloads without download permission | Rejected | Pending | NOT TESTED |
| ST07 | Viewer accesses expired permission | Rejected | Pending | NOT TESTED |
| ST08 | Upload disallowed file | Rejected | Pending | NOT TESTED |
| ST09 | Access private storage without authorization | Rejected | Pending | NOT TESTED |
| ST10 | SQL injection attempt | No query manipulation | Pending | NOT TESTED |
| ST11 | Suspended user accesses protected API | Rejected | Pending | NOT TESTED |
| ST12 | Modify an audit record | Tampering detected | Pending | NOT TESTED |
| ST13 | Repeated invalid login attempts | Configured protection works | Pending | NOT TESTED |
| ST14 | Inspect repository for exposed secrets | No real secrets tracked | Pending | NOT TESTED |

## 8. Conclusion

TrustVault is designed with role-based access control, controlled document sharing, private storage, authentication and audit logging.

This threat model identifies the main risks associated with a confidential document management platform and describes the controls and tests needed to evaluate them.

The security test results will be updated as the application is tested. Any identified weaknesses will be documented and addressed before the final demonstration.