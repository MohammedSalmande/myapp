# OAuth 2.0 Security Considerations
## Smart Task Manager - Feature 002

**Security Level:** HIGH RISK  
**Review Status:** DRAFT (requires security team review)

---

## 1. Threat Model

### 1.1 Threat Actors

| Actor | Capability | Motivation |
|-------|-----------|-----------|
| Attacker | Network access, code knowledge | Unauthorized account access, data theft |
| Malicious User | Valid OAuth account | Task data access, privilege escalation |
| Insider | System/code access | Data exfiltration, system disruption |
| OAuth Provider | Full provider control | API changes, data collection |

### 1.2 Attack Surface

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │ HTTP    │   Backend    │  HTTPS  │ OAuth        │
│              ├◄────────┤              ├────────►│ Provider     │
└──────────────┘  OAuth  └──────────────┘         └──────────────┘
                   Flow

Attack vectors:
1. Browser → Backend (CSRF, XSS, token theft)
2. Backend → Provider (MitM, token injection)
3. Provider → Backend (Fake credentials, replayed tokens)
4. Backend database (SQL injection, token leakage)
5. Backend to frontend (Token leakage in redirects)
```

---

## 2. Security Threats & Mitigations

### 2.1 CSRF (Cross-Site Request Forgery)

**Threat:** Attacker tricks user into authorizing OAuth on behalf of attacker's account.

**Risk Level:** HIGH

**Attack Scenario:**
```
1. Attacker creates malicious website
2. Attacker tricks user into visiting
3. Malicious site makes request to /oauth/authorize/google
   (without state token validation)
4. User gets redirected to OAuth consent
5. User grants permission (thinks it's legitimate)
6. Attacker's account now has access to OAuth credentials
```

**Mitigation:**

```java
// ✓ Generate cryptographically secure state token
String state = SecureRandom.generateSecureString(32);

// ✓ Store state in HTTP-only, Secure, SameSite cookie
response.addCookie(new HttpCookie("oauth_state", state) {
    setHttpOnly(true);
    setSecure(true);
    setSameSite(SameSite.LAX);
    setMaxAge(300);  // 5 minute expiration
});

// ✓ Validate state on callback (case-sensitive)
if (!storedState.equals(callbackState)) {
    throw new OAuthException("State token mismatch");
}

// ✓ Delete state after validation
response.deleteCookie("oauth_state");
```

**Implementation Checklist:**
- [ ] State token generated with SecureRandom (≥256 bits)
- [ ] State token stored in HttpOnly cookie (not localStorage)
- [ ] State token expires after 5 minutes
- [ ] State token compared case-sensitively
- [ ] State token deleted after successful validation
- [ ] SameSite=Lax on all cookies

---

### 2.2 Authorization Code Injection

**Threat:** Attacker intercepts authorization code and replays it.

**Risk Level:** MEDIUM

**Attack Scenario:**
```
1. Attacker sniffs network traffic (lacks HTTPS)
2. Attacker captures: GET /oauth/callback?code=XYZ&state=ABC
3. Attacker replays authorization code to their own account
4. Authorization code accepted again, attacker gains access
```

**Mitigation:**

```java
// ✓ HTTPS only (TLS 1.2+)
server.port: 8080
server.ssl.enabled: true
server.ssl.key-store: classpath:keystore.p12
server.ssl.protocol: TLSv1.2

// ✓ Authorization code used once only
@Modifying
@Query("UPDATE oauth_token SET used_at = CURRENT_TIMESTAMP WHERE code = ?1")
void markCodeAsUsed(String code);

if (codeUsedAt != null) {
    throw new OAuthException("Authorization code already used");
}

// ✓ Authorization code expires quickly (10 min standard)
if (issuedAt.isAfter(now.minusMinutes(10))) {
    throw new OAuthException("Authorization code expired");
}

// ✓ Authorization code tied to redirect URI
if (!redirectUri.equals(storedRedirectUri)) {
    throw new OAuthException("Redirect URI mismatch");
}
```

**Implementation Checklist:**
- [ ] HTTPS enforced (302 redirect to https://)
- [ ] Authorization code expiration (10 min)
- [ ] Authorization code marked used after exchange
- [ ] Authorization code tied to redirect URI
- [ ] SSL/TLS certificate valid and trusted
- [ ] No mixed HTTP/HTTPS content

---

### 2.3 Token Theft

**Threat:** Attacker steals JWT or access token from client or server.

**Risk Level:** CRITICAL

**Attack Scenarios:**
```
1. XSS attack steals JWT from localStorage
2. Network sniffer intercepts JWT in HTTP request
3. Database breach leaks stored OAuth access tokens
4. Frontend passes JWT in URL (browser history leakage)
```

**Mitigation:**

```java
// ✓ JWT stored in secure HTTP-only cookie (not localStorage)
new HttpCookie("jwt_token", jwtToken) {
    setHttpOnly(true);
    setSecure(true);  // HTTPS only
    setSameSite(SameSite.STRICT);
    setMaxAge(86400);  // 24 hours
};

// ✓ Don't store OAuth access tokens - exchange code fresh
// Instead of:
//   oauth_tokens table(access_token, refresh_token)
// Do:
//   oauth_provider table(provider_id only)
//   Exchange code → token on each login

// ✓ JWT short expiration (24 hours)
jwt.expiration-ms: 86400000  // 24 hours

// ✓ Never pass tokens in URL
// ❌ BAD:  /dashboard?token=xxx
// ✓ GOOD: HttpOnly cookie + CORS

// ✓ Encrypt sensitive fields in database
@Encrypted
private String providerAccessToken;  // (if stored)

@Encrypted
@Column(columnDefinition = "VARCHAR(500)")
private String providerIdTokenClaim;

// ✓ Clear tokens on logout
response.deleteCookie("jwt_token");
```

**Implementation Checklist:**
- [ ] JWT stored in HttpOnly, Secure, SameSite cookie
- [ ] JWT never passed in URL parameters
- [ ] OAuth access tokens NOT stored in database
- [ ] If ID tokens stored, encrypted with AES-256
- [ ] JWT short expiration (24 hours max)
- [ ] Tokens cleared on logout
- [ ] HTTPS everywhere (no mixed content)

---

### 2.4 Account Takeover via Email Collision

**Threat:** Attacker signs up with victim's email on OAuth provider, then links to existing account.

**Risk Level:** HIGH

**Attack Scenario:**
```
1. Attacker registers alice@example.com on Google
2. Attacker clicks "Login with Google" on app
3. App auto-links Google OAuth to existing alice@example.com account
4. Attacker gains access to Alice's tasks
```

**Mitigation:**

```java
// ✓ Verify email with provider (don't trust client claim)
OAuthUserInfo userInfo = googleClient.getUserInfo(accessToken);
String verifiedEmail = userInfo.getVerifiedEmail();

if (!userInfo.isEmailVerified()) {
    throw new OAuthException("Email not verified by provider");
}

// ✓ Require separate email verification for linking
if (accountExists && differentEmail) {
    // Send verification email to existing account
    sendVerificationEmail(existingAccount.getEmail(), 
                        "linking", oauthProvider);
    // Require click before linking
}

// ✓ Never auto-link on email collision
// Instead, show user:
// "Email already registered. Log in with existing account first, 
//  then link OAuth from settings."

// ✓ Audit all account linkages
logger.info("OAuth linking: provider={}, verified_email={}, existing_user={}", 
           provider, verifiedEmail, userFound);
```

**Implementation Checklist:**
- [ ] Email verification required from OAuth provider
- [ ] Never auto-link without explicit user action
- [ ] Email collision shows conflict resolution UI
- [ ] Audit log all account linkage events
- [ ] Require existing account verification

---

### 2.5 Phishing

**Threat:** User tricked into granting permissions to malicious app.

**Risk Level:** MEDIUM

**Attack Scenario:**
```
1. Attacker registers fake OAuth app (if possible)
2. Attacker crafts phishing email with link to malicious app
3. User clicks, sees Google consent screen
4. User grants permissions (doesn't read carefully)
5. Attacker gets access token
```

**Mitigation:**

```java
// ✓ Display branding prominently
// Show on login/link page:
// "🔒 Connecting to Smart Task Manager"
// "Smart Task Manager is requesting access to your Google account"

// ✓ Minimal OAuth scopes
// openid, profile, email only (no calendar, drive, etc.)

// ✓ Document privacy policy
// "We will only store your email and name"
// "We never share data with third parties"

// ✓ Verified redirect URIs only
// No custom redirect URIs in production
// Whitelist enforced: http://localhost:8080/api/oauth/callback/google

// ✓ Transparent user experience
// Show which data accessed: "Email: alice@gmail.com"
// Show which app is requesting: "Smart Task Manager"
```

**Implementation Checklist:**
- [ ] Clear branding in OAuth flow
- [ ] Minimal, documented OAuth scopes
- [ ] Privacy policy link visible
- [ ] Redirect URI whitelist enforced
- [ ] User sees exactly what data is accessed

---

### 2.6 OAuth Provider Compromise

**Threat:** OAuth provider credentials (Client ID, Client Secret) leaked.

**Risk Level:** HIGH

**Impact:**
```
- Attacker can impersonate our app
- Attacker can request access tokens
- Attacker can access user data through our app
```

**Mitigation:**

```java
// ✓ Client Secret in environment variable (never in code)
String clientSecret = System.getenv("GOOGLE_OAUTH_CLIENT_SECRET");
if (clientSecret == null) {
    throw new IllegalStateException("GOOGLE_OAUTH_CLIENT_SECRET not set");
}

// ✓ Client Secret never logged
logger.debug("OAuth token exchange for provider: {}", provider);
// NOT: logger.debug("Client secret: {}", clientSecret);

// ✓ Client Secret not in error messages
catch (OAuthException e) {
    // ✓ Log internally with secret
    logger.error("OAuth failed for {}: {}", provider, e.getMessage(), e);
    // ✓ Return generic error to user
    return ResponseEntity.badRequest().body("Authentication failed");
}

// ✓ Rotate Client Secret regularly
// Procedure:
// 1. Add new secret to environment
// 2. Deploy
// 3. Test with new secret
// 4. Rotate in OAuth provider console
// 5. Remove old secret from environment

// ✓ Monitor for credential leaks
logger.info("OAuth token exchange success: provider={}, user_created={}", 
           provider, userCreated);
```

**Implementation Checklist:**
- [ ] Client ID and Secret in environment variables
- [ ] Credentials never logged or displayed
- [ ] Error messages don't leak credentials
- [ ] Credential rotation procedure documented
- [ ] No credentials in git history
- [ ] Secrets stored in secure vault (not .env file)

---

### 2.7 Denial of Service (DoS)

**Threat:** Attacker floods OAuth callback endpoint, preventing legitimate users from logging in.

**Risk Level:** MEDIUM

**Attack Scenario:**
```
1. Attacker sends thousands of requests to /oauth/callback
2. Backend rate limited or crashes
3. Legitimate users can't log in
```

**Mitigation:**

```java
// ✓ Rate limit OAuth callback endpoint
@Component
public class RateLimitInterceptor extends HandlerInterceptorAdapter {
    private final RateLimiter rateLimiter = 
        RateLimiter.create(10.0);  // 10 requests/minute
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        if (request.getRequestURI().contains("/oauth/callback")) {
            String clientIp = getClientIp(request);
            if (!rateLimiter.tryAcquire()) {
                response.setStatus(429);
                response.getWriter().write("Rate limit exceeded");
                return false;
            }
        }
        return true;
    }
}

// ✓ Database connection pooling
// Prevent resource exhaustion
spring.datasource.hikari.maximum-pool-size: 20
spring.datasource.hikari.connection-timeout: 30000

// ✓ API timeouts
// Prevent hanging requests
spring.mvc.async.request-timeout: 10000

// ✓ Monitor for abuse
logger.warn("High rate of OAuth callback failures: {} failures in {} minutes", 
           failureCount, timeWindow);

// ✓ Circuit breaker for provider API
@CircuitBreaker(name = "oauthProvider", 
                fallbackMethod = "providerUnavailable")
public OAuthUserInfo getOAuthUserInfo(String token) {
    // Call Google API
}
```

**Implementation Checklist:**
- [ ] Rate limiting on /oauth/callback (10 req/min/IP)
- [ ] Database connection pooling configured
- [ ] Request timeouts set (10 sec)
- [ ] Circuit breaker for provider API calls
- [ ] Monitoring for abuse patterns
- [ ] Return 429 on rate limit

---

### 2.8 SQL Injection

**Threat:** OAuth data used in SQL queries without sanitization.

**Risk Level:** HIGH

**Attack Scenario:**
```
1. OAuth provider allows special characters in user ID
2. Provider user ID: "'; DROP TABLE oauth_provider; --"
3. Query: SELECT * FROM oauth_provider WHERE provider_id = '...'; DROP TABLE...;
4. Database corrupted
```

**Mitigation:**

```java
// ✓ Use parameterized queries (JPA automatically handles)
public Optional<OAuthProvider> findByProviderAndProviderId(
    OAuthProviderType provider,
    String providerId) {
    // JPA uses prepared statements automatically
}

// ✓ Input validation on provider ID
@Entity
public class OAuthProvider {
    @Column(length = 255)
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", 
             message = "Invalid provider ID format")
    private String providerId;
}

// ✓ Never concatenate strings in queries
// ❌ BAD:
// Query q = em.createQuery(
//     "SELECT o FROM OAuthProvider o WHERE o.providerId = '" + id + "'");

// ✓ GOOD:
Query q = em.createQuery(
    "SELECT o FROM OAuthProvider o WHERE o.providerId = :id");
q.setParameter("id", id);
```

**Implementation Checklist:**
- [ ] JPA parameterized queries used everywhere
- [ ] No raw SQL queries (or reviewed for injection)
- [ ] Input validation on provider fields
- [ ] Provider ID length limited (255 chars)
- [ ] Special characters not allowed in provider ID

---

### 2.9 Dependency Vulnerabilities

**Threat:** Outdated libraries with known vulnerabilities.

**Risk Level:** MEDIUM

**Common Vulnerable Dependencies:**
- Spring Security with known CVEs
- JWT libraries with cryptographic flaws
- HTTP client libraries with request smuggling

**Mitigation:**

```xml
<!-- pom.xml -->
<!-- Spring Security should be ≥6.1 (latest 6.x) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
    <version>3.1.5</version>
</dependency>

<!-- jjwt should be ≥0.11.5 -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
```

**Implementation Checklist:**
- [ ] Run `mvn dependency:tree` and check for CVEs
- [ ] Use OWASP Dependency Check plugin
- [ ] Pin versions to latest stable (not SNAPSHOT)
- [ ] Regular dependency updates (weekly)
- [ ] Test after each update

---

## 3. Compliance & Standards

### 3.1 OAuth 2.0 Best Practices

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 6819 - OAuth 2.0 Threat Model and Security Considerations](https://tools.ietf.org/html/rfc6819)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### 3.2 Industry Standards

- **NIST Cybersecurity Framework** - Apply to OAuth implementation
- **OWASP Top 10** - Address vulnerabilities
- **CWE Top 25** - Avoid common weaknesses

### 3.3 Data Protection

- **GDPR** - Users can request data deletion
- **CCPA** - Users can opt out of data collection
- **Privacy Policy** - Document what data collected and how it's used

---

## 4. Security Testing Checklist

### 4.1 Unit Tests

- [ ] State token generation and validation
- [ ] Authorization code expiration
- [ ] Email verification checks
- [ ] Account linking safeguards

### 4.2 Integration Tests

- [ ] CSRF token validation on callback
- [ ] Rate limiting enforcement
- [ ] Database encryption
- [ ] Error handling (no credential leaks)

### 4.3 Penetration Testing

- [ ] CSRF bypass attempts
- [ ] Authorization code replay
- [ ] JWT tampering
- [ ] Token theft scenarios
- [ ] SQL injection attempts
- [ ] XSS attacks

### 4.4 Security Scanning

- [ ] Static analysis: SonarQube
- [ ] Dependency vulnerabilities: OWASP Dependency Check
- [ ] SSL/TLS: SSL Labs test
- [ ] DAST: OWASP ZAP or Burp Suite

---

## 5. Security Operations

### 5.1 Incident Response

**OAuth Compromise Detected:**
1. Invalidate all JWT tokens
2. Force password reset for all users
3. Review account access logs
4. Notify affected users
5. Rotate OAuth credentials

**Implementation:**
```java
// Add kill-switch for OAuth
@Component
public class OAuthKillSwitch {
    @Value("${oauth.disable-all:false}")
    private boolean disableAll;
    
    public void checkKillSwitch() {
        if (disableAll) {
            throw new OAuthException("OAuth temporarily disabled");
        }
    }
}
```

### 5.2 Monitoring & Alerts

```
Alert on:
- CSRF failures > 10 in 5 minutes
- Authorization code exchange failures > 20 in 5 minutes
- Rate limit hits > 50 in 5 minutes
- Email verification failures
- Account linking failures
```

### 5.3 Audit Logging

All OAuth events logged:
```
[OAUTH] LOGIN | provider=google | new_user=true | user_id=42 | ip=192.168.1.1
[OAUTH] LINK | provider=github | user_id=42 | status=success
[OAUTH] UNLINK | provider=google | user_id=42 | status=success
[OAUTH] ERROR | provider=google | error=invalid_state | ip=192.168.1.99
```

---

## 6. Security Review Checklist

Before production deployment:

- [ ] Code review by security team
- [ ] CSRF token validation confirmed
- [ ] Rate limiting tested
- [ ] HTTPS enforcement verified
- [ ] Secrets management reviewed
- [ ] Error handling checked (no leaks)
- [ ] Database encryption enabled
- [ ] Penetration testing completed
- [ ] Compliance review done
- [ ] Incident response plan in place
- [ ] Monitoring/alerting configured
- [ ] Documentation reviewed
- [ ] All security tests passing

---

## 7. Security Contacts & Resources

**Internal Contacts:**
- Security Team: security@example.com
- DevOps: devops@example.com
- Database Admin: dba@example.com

**External Resources:**
- Google OAuth Security: https://developers.google.com/identity/protocols/oauth2/security-considerations
- GitHub OAuth Security: https://docs.github.com/en/developers/apps/building-oauth-apps/securing-your-app
- OWASP OAuth Security: https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Security_Cheat_Sheet.html

**Reporting Security Issues:**
- Internal: Contact security team immediately
- External: security@example.com (responsible disclosure)
