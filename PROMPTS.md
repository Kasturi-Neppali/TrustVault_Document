
# TrustVault – AI Usage and Prompt Documentation

## 1. Introduction

TrustVault was developed with the assistance of Generative AI as a development and learning tool.

AI was used to support project planning, application architecture, frontend and backend development, database integration, debugging, deployment guidance, documentation and security analysis.

The development process involved providing project requirements, reviewing AI-generated suggestions, testing the implementation, identifying errors and requesting corrections.

AI-generated code was not treated as automatically correct. Suggestions were reviewed and tested during development.

## 2. AI Usage Objectives

The main objectives of using AI were:

- Understand the project requirements.
- Design a secure role-based document management system.
- Plan the frontend and backend architecture.
- Develop authentication and authorization functionality.
- Integrate PostgreSQL database services.
- Implement private document storage.
- Develop Admin, Owner and Viewer dashboards.
- Identify and resolve implementation errors.
- Improve responsive design.
- Prepare project documentation and security analysis.

## 3. Development Prompts

The following are representative prompts reconstructed from the development process.

### Prompt 1 – Project Understanding and Architecture

**Objective:** Understand the problem statement and plan the application architecture.

**Prompt:**

"I am developing a secure role-based document management platform named TrustVault. The application has three roles: Admin, Owner and Viewer. Help me understand the requirements, identify the responsibilities of each role, design the system architecture and suggest a suitable technology stack. Explain the development process step by step."

**AI assistance:**
- Suggested a role-based application architecture.
- Explained frontend, backend and database responsibilities.
- Helped organize the development into modules.
- Identified the importance of authentication and authorization.

**Developer review:**
The proposed architecture was reviewed against the project requirements before implementation.

### Prompt 2 – Database Design

**Objective:** Design the PostgreSQL database.

**Prompt:**

"Help me design a PostgreSQL database for TrustVault. It should support users, roles, documents, document permissions, audit logs and login attempts. Include primary keys, foreign keys, constraints and indexes. Explain the purpose of each table."

**AI assistance:**
- Helped design the database tables.
- Explained relationships between users, roles and documents.
- Suggested constraints and indexes.
- Explained how document sharing permissions could be represented.

**Developer review:**
The database structure was implemented and the connection to Neon PostgreSQL was tested.

### Prompt 3 – Backend Development

**Objective:** Develop backend APIs using Flask.

**Prompt:**

"Help me build a Flask backend for TrustVault using a modular folder structure. Implement authentication, role-based routes and separate modules for Admin, Owner and Viewer. Explain each file and function so I can understand the implementation."

**AI assistance:**
- Helped organize Flask routes and services.
- Explained authentication middleware.
- Assisted with database integration.
- Helped identify and correct backend errors.

**Developer review:**
Backend endpoints were tested during development and integrated with the frontend.

### Prompt 4 – Authentication and Authorization

**Objective:** Implement secure authentication and role-based access.

**Prompt:**

"Explain how to implement JWT authentication and role-based authorization in Flask. TrustVault has Admin, Owner and Viewer roles. Users must only access APIs permitted for their roles. Explain token validation, password hashing and backend permission checks."

**AI assistance:**
- Explained JWT authentication.
- Assisted with role-based authorization.
- Explained password hashing.
- Helped structure protected routes.

**Developer review:**
Login functionality and role-specific dashboard access were tested using different user accounts.

### Prompt 5 – Document Storage and Sharing

**Objective:** Implement private document storage and permission-based sharing.

**Prompt:**

"Help me integrate Supabase private Storage with my Flask application. Owners should upload documents and share them with registered Viewers. Sharing should support separate viewing and downloading permissions, expiry dates and permission revocation. Explain how the backend should verify permissions before returning a document."

**AI assistance:**
- Explained private object storage.
- Assisted with upload and download service design.
- Explained document sharing permissions.
- Suggested backend-side permission validation.

**Developer review:**
The document upload and sharing workflows were integrated with the application. Permission enforcement requires independent security testing.

### Prompt 6 – Admin, Owner and Viewer Dashboards

**Objective:** Develop role-specific interfaces.

**Prompt:**

"Help me develop separate React dashboards for Admin, Owner and Viewer in TrustVault. Admin should manage users, Owners should manage and share documents, and Viewers should access documents according to their permissions. Use reusable components and connect the frontend to Flask APIs."

**AI assistance:**
- Helped organize React pages and services.
- Assisted with dashboard components.
- Explained frontend API integration.
- Helped resolve navigation and authentication issues.

**Developer review:**
The dashboards were connected to the backend and tested through the deployed application.

### Prompt 7 – Responsive Design

**Objective:** Improve mobile and tablet compatibility.

**Prompt:**

"My TrustVault application works on desktop, but the dashboard layout is not displaying properly on mobile devices. Help me make the Admin, Owner and Viewer dashboards responsive using CSS media queries. Preserve existing functionality and API integration."

**AI assistance:**
- Suggested responsive layout changes.
- Helped adapt dashboard navigation for smaller screens.
- Suggested responsive table containers.
- Assisted with mobile and tablet styling.

**Developer review:**
The frontend build was used to check for compilation errors. Responsive behavior should also be verified on actual mobile screen sizes.

### Prompt 8 – Debugging and Deployment

**Objective:** Resolve deployment and integration problems.

**Prompt:**

"My TrustVault project uses React with Vite for the frontend and Flask for the backend. The frontend is deployed on Vercel and the backend on Render. Help me troubleshoot API connectivity, CORS configuration, environment variables, build errors and deployment issues without exposing secret credentials."

**AI assistance:**
- Explained deployment configuration.
- Helped troubleshoot frontend build issues.
- Assisted with API base URL configuration.
- Explained CORS and environment variables.
- Helped resolve routing and logout navigation problems.

**Developer review:**
The deployed application was tested, and the Admin, Owner and Viewer dashboards were reported to be working.

### Prompt 9 – Security Threat Analysis

**Objective:** Identify potential attacks against the application.

**Prompt:**

"Act as a security reviewer for TrustVault, a role-based document management application. Identify threats such as unauthorized API access, JWT manipulation, IDOR, privilege escalation, unauthorized downloads, expired permissions, malicious uploads, SQL injection, private storage exposure and audit-log tampering. For each threat, suggest mitigation measures and practical security tests. Do not claim that a protection works without evidence."

**AI assistance:**
- Helped identify security threats.
- Suggested mitigation strategies.
- Helped prepare the threat model.
- Suggested positive and negative security tests.

**Developer review:**
Threats were documented in THREATS.md. The corresponding tests must be executed and their actual results recorded.

## 4. How AI Suggestions Were Reviewed

AI assistance was used as a development aid, not as a replacement for developer decisions.

The following review process was followed:

1. Understand the generated solution before using it.
2. Compare suggestions with the actual project requirements.
3. Check whether generated code fits the existing folder structure.
4. Review database queries and API integration.
5. Run the application and inspect errors.
6. Test the relevant functionality.
7. Request corrections when the suggested implementation does not work.
8. Avoid including unverified security claims in documentation.

## 5. Examples of Developer Review and Corrections

| Development area | Review performed |
|---|---|
| Database integration | Tested connectivity to Neon PostgreSQL. |
| Authentication | Tested login and protected API access. |
| Role-based access | Tested Admin, Owner and Viewer dashboards. |
| Frontend integration | Checked communication with the Flask backend. |
| Deployment | Resolved frontend build and deployment configuration issues. |
| Navigation | Corrected logout and frontend routing behavior. |
| Responsive design | Updated layouts for smaller screens. |
| Security | Prepared threats and identified tests requiring verification. |

## 6. Tools and Technologies Used

| Tool | Purpose |
|---|---|
| Generative AI | Planning, explanations, coding assistance, debugging and documentation |
| Visual Studio Code | Development environment |
| React | Frontend development |
| Vite | Frontend build tool |
| Flask | Backend development |
| Python | Backend programming |
| PostgreSQL | Relational database |
| Neon | Hosted PostgreSQL database |
| Supabase Storage | Private document storage |
| JWT | Authentication |
| Git and GitHub | Version control |
| Vercel | Frontend deployment |
| Render | Backend deployment |

## 7. Limitations of AI Assistance

AI-generated suggestions can contain errors, incomplete assumptions or code that does not match the existing project.

During development, generated suggestions were reviewed and corrected where necessary.

Security recommendations are not considered proof of security. Actual API behavior, storage access and permission enforcement must be tested independently.

## 8. Conclusion

Generative AI helped accelerate the development of TrustVault and supported the understanding of different technologies and implementation concepts.

The development process involved directing AI with project-specific requirements, reviewing generated suggestions, testing functionality and correcting errors.

The final implementation and its security must be evaluated through actual application testing rather than relying only on AI-generated explanations or code.