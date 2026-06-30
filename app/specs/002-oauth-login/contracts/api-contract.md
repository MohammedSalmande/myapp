# OAuth 2.0 API Contracts
## Smart Task Manager - Feature 002

**API Version:** 1.0  
**Base URL:** `http://localhost:8080/api`  
**Authentication:** Bearer JWT token (except OAuth endpoints)

---

## 1. Authentication Endpoints (Existing - Enhanced)

### 1.1 POST /auth/login
Existing JWT login endpoint (unchanged).

---

### 1.2 POST /auth/register
Existing JWT registration endpoint (unchanged).

---

## 2. OAuth Authorization Endpoints

### 2.1 GET /oauth/authorize/:provider

**Description:** Initiate OAuth flow with specified provider.

**Method:** GET  
**Path:** `/oauth/authorize/{provider}`  
**Parameters:**
- `provider` (path): `google` or `github`

**Query Parameters:**
- `redirect_uri` (optional): Where to redirect after OAuth (defaults to `/`)

**Response: 302 Found**
```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...&
  redirect_uri=http://localhost:8080/api/oauth/callback/google&
  response_type=code&
  scope=openid+profile+email&
  state=<secure_state_token>
```

**Example Request:**
```bash
GET http://localhost:8080/api/oauth/authorize/google
```

**Example Response:**
```
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?...
Set-Cookie: oauth_state=<token>; HttpOnly; Secure; SameSite=Lax; Max-Age=300
```

**Error Responses:**
```
HTTP/1.1 400 Bad Request
{
  "error": "invalid_provider",
  "error_description": "Provider must be 'google' or 'github'"
}

HTTP/1.1 500 Internal Server Error
{
  "error": "state_generation_failed",
  "error_description": "Failed to generate OAuth state token"
}
```

**Security Notes:**
- State token generated and stored in session (5 min TTL)
- Uses HTTPS in production
- Cookie marked HttpOnly, Secure, SameSite=Lax

---

### 2.2 GET /oauth/callback/:provider

**Description:** OAuth provider redirects here with authorization code.

**Method:** GET  
**Path:** `/oauth/callback/{provider}`  
**Parameters:**
- `provider` (path): `google` or `github`

**Query Parameters:**
- `code` (required): Authorization code from provider
- `state` (required): CSRF state token
- `error` (optional): Error code if user denied

**Response: 302 Found** (on success)
```
Location: http://localhost:3000/dashboard?token=<jwt_token>&user=<username>
```

**Example Request:**
```bash
GET http://localhost:8080/api/oauth/callback/google?code=4/0Abcdef...&state=xyz123
```

**Example Response (Success):**
```
HTTP/1.1 302 Found
Location: http://localhost:3000/dashboard?token=eyJhbGc...&user=alice@gmail.com
```

**Error Responses:**

```json
HTTP/1.1 400 Bad Request
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 400,
  "error": "invalid_state",
  "message": "State token mismatch or expired"
}
```

```json
HTTP/1.1 400 Bad Request
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 400,
  "error": "invalid_code",
  "message": "Authorization code is invalid or expired"
}
```

```json
HTTP/1.1 400 Bad Request
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 400,
  "error": "access_denied",
  "message": "User denied permission (error=access_denied)"
}
```

```json
HTTP/1.1 502 Bad Gateway
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 502,
  "error": "provider_unavailable",
  "message": "OAuth provider temporarily unavailable"
}
```

```json
HTTP/1.1 429 Too Many Requests
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 429,
  "error": "rate_limit_exceeded",
  "message": "Too many OAuth attempts from this IP"
}
```

**Implementation Notes:**
- Rate limited: 10 requests per minute per IP
- State token validated (case-sensitive)
- Authorization code exchanged server-side (never exposed to browser)
- New user auto-created with email as username
- Returns JWT token for session
- All errors include error_description for frontend display

---

## 3. OAuth Management Endpoints

### 3.1 POST /oauth/link/:provider

**Description:** Link OAuth provider to authenticated user's account.

**Method:** POST  
**Path:** `/oauth/link/{provider}`  
**Authentication:** Required (Bearer JWT)  
**Parameters:**
- `provider` (path): `google` or `github`

**Request Body:** None (response contains OAuth link URL)

**Response: 200 OK**
```json
{
  "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "xyz789",
  "provider": "google"
}
```

**Example Request:**
```bash
POST http://localhost:8080/api/oauth/link/google
Authorization: Bearer eyJhbGc...
```

**Example Response:**
```json
HTTP/1.1 200 OK
{
  "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "abc123xyz",
  "provider": "google"
}
```

**Error Responses:**

```json
HTTP/1.1 401 Unauthorized
{
  "error": "authentication_required",
  "message": "Must be logged in to link OAuth"
}
```

```json
HTTP/1.1 409 Conflict
{
  "error": "provider_already_linked",
  "message": "This user already has a Google account linked"
}
```

```json
HTTP/1.1 400 Bad Request
{
  "error": "invalid_provider",
  "message": "Provider must be 'google' or 'github'"
}
```

**Implementation Notes:**
- URL for user to click and authorize linking
- State token generated and stored in session
- After OAuth redirects, links provider to authenticated user
- Prevents duplicate provider linking

---

### 3.2 POST /oauth/unlink/:provider

**Description:** Remove OAuth provider from authenticated user's account.

**Method:** POST  
**Path:** `/oauth/unlink/{provider}`  
**Authentication:** Required (Bearer JWT)  
**Parameters:**
- `provider` (path): `google` or `github`

**Request Body:** None

**Response: 200 OK**
```json
{
  "message": "Provider unlinked successfully",
  "providers": [
    {
      "provider": "github",
      "provider_email": "alice@github.com",
      "provider_name": "alice-dev",
      "created_at": "2026-06-20T10:00:00Z"
    }
  ]
}
```

**Example Request:**
```bash
POST http://localhost:8080/api/oauth/unlink/google
Authorization: Bearer eyJhbGc...
```

**Example Response:**
```json
HTTP/1.1 200 OK
{
  "message": "Provider unlinked successfully",
  "providers": [
    {
      "provider": "github",
      "provider_email": "alice@github.com",
      "provider_name": "alice-dev",
      "created_at": "2026-06-20T10:00:00Z"
    }
  ]
}
```

**Error Responses:**

```json
HTTP/1.1 401 Unauthorized
{
  "error": "authentication_required",
  "message": "Must be logged in to unlink OAuth"
}
```

```json
HTTP/1.1 400 Bad Request
{
  "error": "provider_not_linked",
  "message": "This user does not have Google linked"
}
```

```json
HTTP/1.1 400 Bad Request
{
  "error": "cannot_unlink",
  "message": "Cannot unlink provider - must maintain at least one authentication method"
}
```

**Implementation Notes:**
- Prevents unlinking if user has no password and only one provider
- Returns updated provider list after unlinking
- Changes persist immediately

---

### 3.3 GET /user/oauth-providers

**Description:** Get list of OAuth providers linked to authenticated user.

**Method:** GET  
**Path:** `/user/oauth-providers`  
**Authentication:** Required (Bearer JWT)

**Response: 200 OK**
```json
{
  "user_id": 1,
  "username": "alice@gmail.com",
  "providers": [
    {
      "id": 1,
      "provider": "google",
      "provider_email": "alice@gmail.com",
      "provider_name": "Alice Smith",
      "provider_avatar_url": "https://lh3.googleusercontent.com/...",
      "created_at": "2026-06-20T09:00:00Z",
      "last_login_at": "2026-06-22T12:00:00Z"
    },
    {
      "id": 2,
      "provider": "github",
      "provider_email": "alice@github.com",
      "provider_name": "alice-dev",
      "provider_avatar_url": "https://avatars.githubusercontent.com/...",
      "created_at": "2026-06-21T10:00:00Z",
      "last_login_at": "2026-06-21T15:30:00Z"
    }
  ]
}
```

**Example Request:**
```bash
GET http://localhost:8080/api/user/oauth-providers
Authorization: Bearer eyJhbGc...
```

**Error Responses:**

```json
HTTP/1.1 401 Unauthorized
{
  "error": "authentication_required",
  "message": "Must be logged in"
}
```

**Implementation Notes:**
- Returns all linked OAuth identities
- Includes provider details (email, name, avatar, timestamps)
- Useful for settings page to show linked accounts

---

## 4. Error Response Format

All errors follow a consistent format:

```json
{
  "timestamp": "2026-06-22T12:34:56.789Z",
  "status": 400,
  "error": "error_code",
  "message": "Human-readable error message",
  "path": "/api/oauth/callback/google",
  "trace_id": "xyz-123-abc"  // for debugging
}
```

**Common Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_state` | 400 | CSRF state token mismatch or expired |
| `invalid_code` | 400 | Authorization code invalid or expired |
| `access_denied` | 400 | User denied OAuth permission |
| `invalid_provider` | 400 | Provider not supported |
| `provider_unavailable` | 502 | OAuth provider temporary outage |
| `rate_limit_exceeded` | 429 | Too many requests |
| `authentication_required` | 401 | Must be logged in |
| `provider_already_linked` | 409 | Provider already linked to this account |
| `provider_not_linked` | 400 | Provider not linked to this account |
| `cannot_unlink` | 400 | Must maintain at least one auth method |
| `account_already_exists` | 409 | Email already registered (during account linking) |

---

## 5. User Info Response Format

When OAuth flow completes, response includes:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "alice@gmail.com",
  "user_id": 1,
  "expires_in": 86400,
  "created": true  // true if new account created
}
```

**Response Headers:**
```
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

---

## 6. Request/Response Examples

### 6.1 Complete OAuth Login Flow

**Step 1: User clicks "Login with Google"**
```
Request:
GET /oauth/authorize/google

Response:
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?...
```

**Step 2: User grants permission, Google redirects**
```
Request:
GET /oauth/callback/google?code=4/0Abcdef...&state=xyz123

Response:
HTTP/1.1 302 Found
Location: http://localhost:3000/dashboard?token=eyJhbGc...&user=alice@gmail.com
```

**Step 3: Frontend stores JWT and loads dashboard**
```
Frontend JavaScript:
localStorage.setItem('token', 'eyJhbGc...');
window.location = '/dashboard';
```

### 6.2 Account Linking Flow

**Step 1: Logged-in user clicks "Link Google"**
```
Request:
POST /oauth/link/google
Authorization: Bearer eyJhbGc... (existing JWT)

Response:
HTTP/1.1 200 OK
{
  "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "provider": "google"
}
```

**Step 2: Frontend opens OAuth URL**
```
Frontend JavaScript:
window.open(authResponse.oauth_url);
```

**Step 3: User grants permission, Google redirects to callback**
```
Request:
GET /oauth/callback/google?code=...&state=... (linking=true in session)

Response:
HTTP/1.1 302 Found
Location: http://localhost:3000/settings?linked=google
```

---

## 7. Rate Limiting

**Endpoint:** `/oauth/callback/:provider`  
**Limit:** 10 requests per minute per IP  
**Header:** `X-RateLimit-Remaining: 9`

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1687437356
{
  "error": "rate_limit_exceeded",
  "message": "Too many OAuth attempts"
}
```

---

## 8. Security Headers

All OAuth responses include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Cache-Control: no-cache, no-store, must-revalidate
```

---

## 9. CORS Configuration

OAuth endpoints include CORS headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

---

## 10. Logging & Audit

All OAuth requests logged with:
- Request ID (tracing)
- Provider name
- User ID (if authenticated)
- IP address
- Result (success/failure)
- Error code (if applicable)
- Response time

**Example Log:**
```
[OAuth] AUTHORIZE | provider=google | ip=192.168.1.1 | state=xyz123
[OAuth] CALLBACK | provider=google | code_exchange_ms=245 | user_created=true | user_id=42
[OAuth] UNLINK | provider=github | user_id=42 | status=success
```
