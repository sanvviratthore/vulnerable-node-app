# Security Audit Report
**Application:** Vulnerable Node.js Notes API  
**Audit Date:** 19/03/26  
**Auditor:** Sanvi Rathore

## Executive Summary

This security audit identified **15 vulnerabilities** in the application, ranging from **CRITICAL** to **LOW** severity. All identified vulnerabilities have been fixed and verified.

### Vulnerability Summary
- **CRITICAL**: 3
- **HIGH**: 6
- **MEDIUM**: 5
- **LOW**: 1

---

## Vulnerabilities Found & Fixed

### 1. SQL Injection in Notes Search
**Severity:** CRITICAL  
**Location:** `routes/notes.js` - `/notes/search` endpoint  
**CWE:** CWE-89

**Description:**  
User input (`q` query parameter) was directly interpolated into SQL query without sanitization, allowing SQL injection attacks.

**Exploit Example:**
```bash
curl "http://localhost:3000/notes/search?q=%' OR '1'='1"
```

**Impact:**
- Unauthorized access to all notes in database
- Potential data exfiltration
- Database manipulation

**Fix Applied:**
- Changed to parameterized query using `db.prepare()` with placeholders
- Added `userId` filter to restrict results to authenticated user's notes only

**Commit:** `Fix: SQL injection in notes search endpoint`

---

### 2. Command Injection in Backup Creation
**Severity:** CRITICAL  
**Location:** `routes/export.js` - `/export/backup` endpoint  
**CWE:** CWE-78

**Description:**  
User-provided filename was used directly in shell command (`exec()`) without sanitization.

**Exploit Example:**
```bash
curl -X POST http://localhost:3000/export/backup \
  -d '{"filename":"test; rm -rf /"}'
```

**Impact:**
- **Full server compromise**
- Arbitrary command execution
- Data theft or destruction
- Reverse shell possibility

**Fix Applied:**
- Removed `exec()` usage entirely
- Implemented file operations using native `fs` module
- Added filename sanitization (alphanumeric only)
- Validated path stays within designated directory

**Commit:** `Fix: Command injection in backup creation`

---

### 3. Path Traversal in File Download
**Severity:** CRITICAL  
**Location:** `routes/export.js` - `/export/download/:filename` endpoint  
**CWE:** CWE-22

**Description:**  
No validation on filename parameter allowed directory traversal attacks.

**Exploit Example:**
```bash
curl "http://localhost:3000/export/download/..%2F..%2Fetc%2Fpasswd"
curl "http://localhost:3000/export/download/..%2Fdata.db"
```

**Impact:**
- Access to ANY file on server
- Database file theft (including password hashes)
- Source code exposure
- Configuration file access

**Fix Applied:**
- Added filename sanitization
- Implemented path validation using `path.resolve()`
- Verified resolved path stays within `backups` directory
- Rejected paths containing `..`, `/`, or `\`

**Commit:** `Fix: Path traversal in file download endpoint`

---

### 4. Mass Assignment - Privilege Escalation
**Severity:** HIGH  
**Location:** `routes/users.js` - `/users/profile` endpoint  
**CWE:** CWE-915

**Description:**  
Profile update endpoint accepted any field from request body, allowing users to modify protected fields like `role` and `id`.

**Exploit Example:**
```bash
curl -X PUT http://localhost:3000/users/profile \
  -d '{"role":"admin"}'
```

**Impact:**
- Privilege escalation to admin
- Account takeover via ID manipulation
- Password bypass

**Fix Applied:**
- Implemented field whitelist (only `email` and `username` allowed)
- Added email validation
- Removed ability to modify sensitive fields

**Commit:** `Fix: Mass assignment in profile update`

---

### 5. Mass Assignment in Admin Endpoint
**Severity:** HIGH  
**Location:** `routes/admin.js` - `/admin/users/:id/role` endpoint  
**CWE:** CWE-915

**Description:**  
Admin role update accepted entire request body, allowing modification of unintended fields.

**Impact:**
- Admin could change user passwords
- Potential data corruption

**Fix Applied:**
- Restricted to only updating `role` field
- Removed mass assignment pattern

**Commit:** `Fix: Mass assignment in admin role update`

---

### 6. Broken Access Control
**Severity:** HIGH  
**Location:** `routes/users.js` - `/users` and `/users/:id` endpoints  
**CWE:** CWE-284

**Description:**  
User listing and detail endpoints had NO authentication requirement.

**Impact:**
- User enumeration
- Email harvesting
- Information disclosure
- Password hash exposure (via `SELECT *`)

**Fix Applied:**
- Added `authenticateToken` middleware to both endpoints
- `/users` requires admin role
- `/users/:id` allows users to view own profile or admin to view any
- Changed `SELECT *` to specific columns (excluding password)

**Commit:** `Fix: Broken access control on user endpoints`

---

### 7. Insecure Direct Object Reference (IDOR)
**Severity:** HIGH  
**Location:** `routes/notes.js` - PUT `/notes/:id` endpoint  
**CWE:** CWE-639

**Description:**  
Note update endpoint didn't verify ownership before allowing modification.

**Impact:**
- Users could modify other users' notes
- Data corruption

**Fix Applied:**
- Added ownership verification query
- Only allow update if `note.userId === req.user.id`

**Commit:** `Fix: IDOR in note update endpoint`

---

### 8. JWT Algorithm Confusion
**Severity:** HIGH  
**Location:** `middleware/auth.js`  
**CWE:** CWE-347

**Description:**  
JWT verification didn't specify allowed algorithms, accepting any including 'none'.

**Impact:**
- Authentication bypass
- Token forgery

**Fix Applied:**
- Explicitly specified `algorithms: ['HS256']` in `jwt.verify()`
- Prevents 'none' algorithm attack

**Commit:** `Fix: JWT algorithm confusion vulnerability`

---

### 9. Hardcoded Weak Secrets
**Severity:** HIGH  
**Location:** `config.js`  
**CWE:** CWE-798

**Description:**  
JWT secret had weak default value: `"supersecret123"`

**Impact:**
- Easy token forgery
- Brute force attacks
- Authentication bypass

**Fix Applied:**
- Removed default values
- Application exits if `JWT_SECRET` not set in environment
- Updated `.env.example` with strong placeholder

**Commit:** `Fix: Hardcoded weak secrets`

---

### 10. Insecure CORS Configuration
**Severity:** MEDIUM  
**Location:** `middleware/cors.js`  
**CWE:** CWE-942

**Description:**  
CORS allowed all origins (`origin: '*'`) with credentials enabled.

**Impact:**
- CSRF attacks possible
- Data theft from logged-in users
- Session hijacking

**Fix Applied:**
- Implemented origin whitelist
- Made allowed origins configurable via environment variable
- Maintained credentials support only for whitelisted origins

**Commit:** `Fix: Insecure CORS configuration`

---

### 11. Missing Input Validation
**Severity:** MEDIUM  
**Location:** `routes/auth.js` - `/auth/register` endpoint  
**CWE:** CWE-20

**Description:**  
Registration endpoint didn't validate username or password despite validator utilities existing.

**Impact:**
- Weak passwords allowed
- Invalid usernames accepted
- Potential injection vectors

**Fix Applied:**
- Added `validateUsername()` and `validatePassword()` checks
- Enforces strong password requirements (8+ chars, uppercase, lowercase, number)
- Username restricted to alphanumeric and underscore

**Commit:** `Fix: Missing input validation on registration`

---

### 12. Incomplete XSS Protection
**Severity:** MEDIUM  
**Location:** `utils/sanitizer.js`  
**CWE:** CWE-79

**Description:**  
HTML sanitization only removed `<script>` tags, missing many XSS vectors.

**Bypass Examples:**
```html
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

**Impact:**
- Stored XSS in notes
- Session hijacking
- Credential theft

**Fix Applied:**
- Replaced regex-based sanitization with `isomorphic-dompurify` library
- Comprehensive XSS protection

**Commit:** `Fix: Incomplete XSS protection`

---

### 13. Information Disclosure
**Severity:** MEDIUM  
**Location:** `routes/users.js` - `/users` endpoint  
**CWE:** CWE-200

**Description:**  
User listing endpoint returned password hashes via `SELECT *`.

**Impact:**
- Password hash exposure
- Offline cracking possible

**Fix Applied:**
- Changed to explicit column selection
- Excluded `password` field from results

**Commit:** Included in `Fix: Broken access control on user endpoints`

---

### 14. Missing Rate Limiting
**Severity:** LOW  
**Location:** `server.js` - `/auth/register` endpoint  
**CWE:** CWE-307

**Description:**  
Registration endpoint had no rate limiting.

**Impact:**
- Account spam
- Resource exhaustion
- User enumeration

**Fix Applied:**
- Applied `loginLimiter` to `/auth/register`
- Limit: 5 requests per 15 minutes per IP

**Commit:** `Fix: Missing rate limiting on registration`

---

### 15. Missing Security Headers
**Severity:** MEDIUM  
**CWE:** CWE-693

**Description:**  
Application didn't set security-related HTTP headers.

**Impact:**
- Vulnerable to clickjacking
- XSS attacks easier
- MIME-sniffing attacks

**Fix Applied:**
- Added Helmet.js middleware
- Sets headers: X-Frame-Options, X-Content-Type-Options, CSP, etc.

**Commit:** `Add: Security headers with Helmet.js`

---

## Additional Security Improvements

### Implemented
1. ✅ Added Helmet.js for security headers
2. ✅ Improved filename sanitization
3. ✅ Added proper error handling
4. ✅ Environment variable validation

### Recommended (Not Implemented)
1. **HTTPS Enforcement** - Currently disabled for development
   - **Why not fixed:** Requires production deployment setup
   - **Recommendation:** Enable in production with valid SSL certificate

2. **Password Reset Functionality** - No secure password reset mechanism
   - **Why not fixed:** Out of scope, requires email service integration
   - **Recommendation:** Implement with time-limited tokens

3. **Account Lockout** - No protection against brute force on individual accounts
   - **Why not fixed:** Would require session/attempt tracking
   - **Recommendation:** Lock account after 5 failed login attempts

4. **Audit Logging** - Limited security event logging
   - **Why not fixed:** Requires centralized logging infrastructure
   - **Recommendation:** Log all authentication events, privilege changes, failed access attempts

5. **Database Encryption** - SQLite database not encrypted at rest
   - **Why not fixed:** Would require SQLCipher or similar
   - **Recommendation:** Use encrypted database in production

6. **Content Security Policy** - Basic CSP from Helmet, could be stricter
   - **Why not fixed:** Requires frontend testing
   - **Recommendation:** Define strict CSP based on actual frontend needs

---

## Testing Performed

### Manual Testing
- ✅ All endpoints tested with valid and invalid inputs
- ✅ Authentication and authorization verified
- ✅ SQL injection attempts blocked
- ✅ Path traversal attempts blocked
- ✅ Mass assignment exploits prevented
- ✅ CORS restrictions verified

### Automated Scanning
```bash
npm audit
# 0 vulnerabilities found in dependencies

npx snyk test
# No known security vulnerabilities detected
```

---

## Conclusion

All **15 identified vulnerabilities** have been successfully remediated. The application now implements:
- ✅ Input validation and sanitization
- ✅ Parameterized database queries
- ✅ Proper authentication and authorization
- ✅ Security headers
- ✅ Rate limiting
- ✅ Secure file operations
- ✅ Strong cryptographic practices

The application is significantly more secure, though additional hardening is recommended for production deployment (see "Recommended" section above).

---

**Audit completed by:** Sanvi Rathore 
**Date:** 19/03/26 
**Contact:** sanviirathoree@gmail.com