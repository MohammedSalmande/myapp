# OAuth 2.0 Integration Specification
## Smart Task Manager - Feature 002

**Status:** Draft  
**Version:** 1.0  
**Date:** 2026-06-22  
**Author:** Engineering Team

---

## 1. Overview

Enable users to authenticate using external OAuth 2.0 providers (Google and GitHub) in addition to the existing JWT-based local authentication. This feature improves user experience by reducing friction during registration and login while maintaining security and privacy.

### 1.1 Goals

- **Primary:** Add Google and GitHub OAuth login options to reduce signup friction
- **Secondary:** Allow existing JWT-authenticated users to link OAuth identities
- **Tertiary:** Support seamless account recovery via OAuth providers

### 1.2 Non-Goals

- Third-party provider SSO (Single Sign-On) for organizations
- Social login sharing or multi-tenant scenarios
- OAuth provider management UI (manual config only)

---

## 2. Scope

### 2.1 In Scope

- Backend OAuth flow implementation using Spring Security OAuth2
- Frontend OAuth login UI components
- Database schema changes to support OAuth identity linking
- Session management for OAuth-authenticated users
- Account merging logic for existing users
- Error handling and edge cases

### 2.2 Out of Scope

- Other OAuth providers (Facebook, Twitter, etc.) - only Google and GitHub in MVP
- OAuth token refresh and expiration handling beyond provider defaults
- Device/mobile app OAuth flows
- PKCE (Proof Key for Code Exchange) - use standard authorization code flow

---

## 3. OAuth Providers

### 3.1 Google OAuth 2.0

**Provider:** Google Identity Platform  
**Flow:** Authorization Code Grant (server-side)  
**Scopes:**
- `openid` - Get ID token
- `profile` - User's name and picture
- `email` - User's email address

**Endpoints:**
- Authorization: `https://accounts.google.com/o/oauth2/v2/auth`
- Token: `https://oauth2.googleapis.com/token`
- User Info: `https://openidconnect.googleapis.com/v1/userinfo`

### 3.2 GitHub OAuth 2.0

**Provider:** GitHub OAuth App  
**Flow:** Authorization Code Grant (server-side)  
**Scopes:**
- `user` - Read user profile
- `user:email` - Read user email addresses

**Endpoints:**
- Authorization: `https://github.com/login/oauth/authorize`
- Token: `https://github.com/login/oauth/access_token`
- User Info: `https://api.github.com/user`

---

## 4. User Flows

### 4.1 First-Time OAuth Login

```
User → Clicks "Login with Google/GitHub"
     → Redirected to OAuth provider
     → Grants permissions
     → Redirected back to app with auth code
     → App exchanges code for tokens
     → App retrieves user info
     → Check if user exists in DB:
        - If yes (by email): Link OAuth to existing account, create JWT
        - If no: Create new user, store OAuth identity, create JWT
     → Redirect to dashboard
```

### 4.2 Existing User Links OAuth

```
Logged-in User → Settings page
              → Clicks "Link Google/GitHub"
              → OAuth provider approval flow
              → App stores OAuth provider ID with user
              → User returned to settings with confirmation
```

### 4.3 Returning OAuth User

```
Returning User → Clicks "Login with Google/GitHub"
              → OAuth provider redirects with auth code
              → App exchanges code for tokens
              → App finds user by OAuth provider ID
              → Create JWT session token
              → Redirect to dashboard
```

### 4.4 Account Recovery via OAuth

```
User (forgot password) → Clicks "Can't log in?"
                      → Clicks "Login with Google/GitHub"
                      → Verifies OAuth credentials
                      → System checks for linked account
                      → If linked: Login successful
                      → If not linked: Offer account creation option
```

---

## 5. Functional Requirements

### 5.1 Authentication

- [ ] FR-5.1.1: Support Google OAuth 2.0 login via authorization code flow
- [ ] FR-5.1.2: Support GitHub OAuth 2.0 login via authorization code flow
- [ ] FR-5.1.3: Store OAuth provider ID and email from provider
- [ ] FR-5.1.4: Auto-create user account on first OAuth login
- [ ] FR-5.1.5: Link OAuth identity to existing user accounts
- [ ] FR-5.1.6: Validate OAuth tokens are fresh and not tampered

### 5.2 Security

- [ ] FR-5.2.1: Use CSRF state token during OAuth flow
- [ ] FR-5.2.2: Store provider credentials securely (encrypted at rest)
- [ ] FR-5.2.3: Validate redirect URIs match registered OAuth apps
- [ ] FR-5.2.4: Never store OAuth access tokens in database (refresh only)
- [ ] FR-5.2.5: Validate JWT expiration and user session state

### 5.3 User Management

- [ ] FR-5.3.1: Allow users to have multiple linked OAuth providers
- [ ] FR-5.3.2: Prevent OAuth email address takeover via verification
- [ ] FR-5.3.3: Support account merging when OAuth email matches existing user
- [ ] FR-5.3.4: Display linked OAuth providers in user profile
- [ ] FR-5.3.5: Allow unlinking OAuth providers (keep at least one auth method)

### 5.4 Error Handling

- [ ] FR-5.4.1: Handle OAuth provider temporary outages gracefully
- [ ] FR-5.4.2: Handle user rejection of OAuth permission grant
- [ ] FR-5.4.3: Handle invalid or expired authorization codes
- [ ] FR-5.4.4: Provide clear user messaging for common OAuth errors

---

## 6. Non-Functional Requirements

### 6.1 Performance

- OAuth login flow completes within 5 seconds (excluding network latency)
- Token exchange requests complete within 2 seconds
- No blocking I/O on critical request paths

### 6.2 Security

- All OAuth redirect URIs validated against whitelist
- HTTPS only for all OAuth endpoints
- CSRF tokens rotated per request
- Database encryption for sensitive OAuth fields
- Rate limiting on OAuth callback endpoint (10 req/min per IP)

### 6.3 Availability

- OAuth feature degradation does not block local JWT login
- OAuth provider outages do not prevent app functionality
- Fallback to local login if OAuth unavailable

### 6.4 Maintainability

- OAuth provider configuration externalized (environment variables)
- Clear separation of OAuth logic from core authentication
- Comprehensive logging of OAuth events for audit trail

---

## 7. Security Architecture

### 7.1 OAuth Flow Security

```
┌─────────────┐                          ┌────────────────┐
│   Browser   │                          │  OAuth Provider│
└──────┬──────┘                          └────────────────┘
       │                                          │
       │ 1. Click "Login with Google"            │
       ├─────────────────────────────────────────→
       │                                          │
       │ 2. Show OAuth consent screen             │
       │←─────────────────────────────────────────┤
       │                                          │
       │ 3. User grants permissions               │
       │─────────────────────────────────────────→
       │                                          │
       │ 4. Redirect to /oauth/callback           │
       │    with auth code + state                │
       │←─────────────────────────────────────────┤
       │                                          │
       └──── POST /oauth/callback ────────────────┘
             (server-side code exchange)
             
       Backend validates:
       ✓ State token matches session
       ✓ Auth code not expired
       ✓ Authorization code → Access token via provider
       ✓ Access token → User info from provider
       ✓ User email verified
       ✓ Merge or create user account
       ✓ Issue JWT token to client
```

### 7.2 Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| CSRF Attack | State token validation (checked against session) |
| Code Injection | Input validation on all parameters |
| Replay Attack | Nonce validation, one-time code usage |
| Token Theft | HTTPS only, secure token storage (DB encryption) |
| Phishing | Warn users to verify URL, don't store credentials |
| Account Takeover | Email verification, rate limiting |
| Provider Impersonation | HTTPS certificate validation |

---

## 8. Acceptance Criteria

- [ ] User can register with Google OAuth and access tasks
- [ ] User can register with GitHub OAuth and access tasks
- [ ] Returning user can login with same OAuth provider
- [ ] User can link multiple OAuth providers to one account
- [ ] Existing JWT user can link OAuth without losing data
- [ ] Tasks remain private to authenticated user
- [ ] CSRF state token validated on callback
- [ ] OAuth errors display clear user-friendly messages
- [ ] Audit logs record all OAuth authentication events
- [ ] Performance: OAuth login < 5 seconds (excluding network)

---

## 9. Dependencies

### 9.1 Backend

- Spring Security 6.x
- Spring Security OAuth2 Resource Server
- RestTemplate or WebClient for provider API calls
- Encryption library (Spring Cloud Config, or bcrypt)

### 9.2 Frontend

- Next.js 16+ (already in use)
- OAuth redirect handling
- Secure session storage (localStorage + httpOnly cookies)

### 9.3 External

- Google Cloud Console project (OAuth 2.0 Credentials)
- GitHub OAuth App registration
- DNS/domain name (for redirect URIs)

---

## 10. Success Metrics

- **Adoption:** ≥40% of new users choose OAuth over local signup
- **Friction Reduction:** OAuth signup time <2 min vs. local 5 min
- **Error Rate:** <1% OAuth flow failures
- **User Satisfaction:** ≥4.5/5 rating for OAuth experience
- **Security:** Zero reported OAuth-related incidents

---

## 11. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design & Review | 1 week | Spec, API contracts, security review |
| Backend Implementation | 2 weeks | Spring Security OAuth2, DB schema |
| Frontend Implementation | 1 week | OAuth UI components, session mgmt |
| Integration Testing | 1 week | E2E tests, OAuth provider testing |
| Security Testing | 1 week | Penetration testing, audit |
| Deployment & Monitoring | 1 week | Production rollout, monitoring setup |

**Total: 7 weeks**

---

## 12. Appendix: References

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Spring Security OAuth2 Docs](https://spring.io/projects/spring-security-oauth2-resource-server)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Security_Cheat_Sheet.html)
