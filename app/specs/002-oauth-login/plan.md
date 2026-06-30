# OAuth 2.0 Implementation Plan
## Smart Task Manager - Feature 002

---

## 1. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up OAuth infrastructure and backend core

#### Phase 1.1: Configuration & Setup
- [ ] Register Google OAuth 2.0 app in Google Cloud Console
- [ ] Register GitHub OAuth App
- [ ] Document OAuth credentials (Client ID, Client Secret)
- [ ] Set up environment variables for OAuth config
- [ ] Add Spring Security OAuth2 dependencies to pom.xml

#### Phase 1.2: Database Schema
- [ ] Add `oauth_provider` table (id, user_id, provider, provider_id, email, created_at)
- [ ] Add foreign key from oauth_provider → users
- [ ] Create migration scripts
- [ ] Add index on (provider, provider_id) for lookups

#### Phase 1.3: Backend - OAuth Service Layer
- [ ] Implement `OAuthTokenProvider` (exchange code for tokens)
- [ ] Implement `GoogleOAuthClient` (fetch user info from Google)
- [ ] Implement `GitHubOAuthClient` (fetch user info from GitHub)
- [ ] Implement `OAuthService` (unified provider abstraction)

#### Phase 1.4: CSRF & Session Security
- [ ] Implement state token generation (secure random)
- [ ] Implement state token validation middleware
- [ ] Store state token in session with expiration (5 min)
- [ ] Validate state on OAuth callback

### Phase 2: Backend API (Week 2-3)

**Goal:** Implement OAuth endpoints and user account logic

#### Phase 2.1: OAuth Endpoints
- [ ] `GET /api/oauth/authorize/:provider` - Redirect to provider
- [ ] `GET /api/oauth/callback/:provider` - Handle provider redirect
- [ ] `POST /api/oauth/link/:provider` - Link OAuth to existing user
- [ ] `POST /api/oauth/unlink/:provider` - Unlink OAuth from user
- [ ] `GET /api/user/oauth-providers` - List linked providers

#### Phase 2.2: User Account Logic
- [ ] Find or create user by OAuth email
- [ ] Link OAuth identity to existing account
- [ ] Merge duplicate accounts (if email exists)
- [ ] Update user's last_login_at and provider info

#### Phase 2.3: Token Management
- [ ] Store OAuth provider tokens securely (encrypted DB field)
- [ ] Do NOT store refresh tokens (use code for new access)
- [ ] Implement token validation and refresh logic
- [ ] Add token expiration checking

#### Phase 2.4: Error Handling
- [ ] Create `OAuthException` class hierarchy
- [ ] Implement custom error responses for OAuth failures
- [ ] Add logging for OAuth events (audit trail)
- [ ] Add rate limiting on callback endpoint

### Phase 3: Frontend Implementation (Week 3-4)

**Goal:** Build OAuth UI and session management

#### Phase 3.1: OAuth UI Components
- [ ] Create `OAuthLoginButton` component (Google & GitHub)
- [ ] Create `OAuthLinkingModal` component for settings
- [ ] Add OAuth buttons to login page
- [ ] Add OAuth options to registration page
- [ ] Display linked providers in user profile/settings

#### Phase 3.2: Session Management
- [ ] Update session store to handle OAuth login
- [ ] Implement OAuth redirect handling
- [ ] Store JWT token from OAuth callback
- [ ] Verify user is logged in via context

#### Phase 3.3: Error Handling
- [ ] Display user-friendly OAuth error messages
- [ ] Fallback to local login if OAuth fails
- [ ] Handle OAuth provider redirects cleanly

### Phase 4: Integration & Testing (Week 4-5)

**Goal:** Test end-to-end flows and security

#### Phase 4.1: Integration Testing
- [ ] Test Google OAuth login → JWT issuance
- [ ] Test GitHub OAuth login → JWT issuance
- [ ] Test account linking flow
- [ ] Test account merging (email collision)
- [ ] Test OAuth provider failover to local login

#### Phase 4.2: Security Testing
- [ ] Verify CSRF state token validation
- [ ] Test HTTPS enforcement on redirect URIs
- [ ] Test token expiration and refresh
- [ ] Penetration test: attempt OAuth injection
- [ ] Verify encrypted storage of provider tokens

#### Phase 4.3: E2E Tests
- [ ] Test complete Google login flow (UI → API → DB)
- [ ] Test complete GitHub login flow
- [ ] Test account linking from logged-in user
- [ ] Test unlinking OAuth provider
- [ ] Test multiple OAuth providers per user

---

## 2. Dependency Tree

```
OAuth Implementation
├── Phase 1: Foundation
│   ├── Google OAuth App Registration
│   ├── GitHub OAuth App Registration
│   ├── Database Schema (oauth_provider table)
│   ├── Spring Security OAuth2 Dependency
│   └── State Token Implementation
├── Phase 2: Backend API
│   ├── OAuth Service Layer (after Phase 1.3)
│   ├── Authorization Endpoints (after Phase 1.4)
│   ├── User Account Logic (after Phase 1.2)
│   └── Error Handling (after Phase 2.1)
├── Phase 3: Frontend
│   ├── OAuth Button Components (after Phase 2.1)
│   ├── Session Management (after Phase 2.1)
│   └── Error Messages (after Phase 2.4)
└── Phase 4: Testing
    ├── Integration Tests (after Phase 3)
    └── Security Tests (after Phase 2.3)
```

---

## 3. Configuration Management

### 3.1 Environment Variables

```bash
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud Console>
GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/api/oauth/callback/google

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=<from GitHub App>
GITHUB_OAUTH_CLIENT_SECRET=<from GitHub App>
GITHUB_OAUTH_REDIRECT_URI=http://localhost:8080/api/oauth/callback/github

# Security
OAUTH_STATE_TOKEN_EXPIRATION_SECONDS=300
OAUTH_RATE_LIMIT_PER_MINUTE=10
```

### 3.2 Spring Configuration

```yaml
# application.yml
oauth:
  providers:
    google:
      client-id: ${GOOGLE_OAUTH_CLIENT_ID}
      client-secret: ${GOOGLE_OAUTH_CLIENT_SECRET}
      redirect-uri: ${GOOGLE_OAUTH_REDIRECT_URI}
    github:
      client-id: ${GITHUB_OAUTH_CLIENT_ID}
      client-secret: ${GITHUB_OAUTH_CLIENT_SECRET}
      redirect-uri: ${GITHUB_OAUTH_REDIRECT_URI}
  state-token-expiration: ${OAUTH_STATE_TOKEN_EXPIRATION_SECONDS:300}
```

---

## 4. Code Architecture

### 4.1 Backend Package Structure

```
com/example/taskmanager/
├── controller/
│   ├── OAuthController.java          (new)
│   └── UserController.java           (existing)
├── service/
│   ├── OAuthService.java             (new)
│   ├── OAuthTokenProvider.java       (new)
│   └── UserService.java              (existing)
├── client/
│   ├── GoogleOAuthClient.java        (new)
│   ├── GitHubOAuthClient.java        (new)
│   └── OAuthProviderClient.java      (new interface)
├── model/
│   ├── User.java                     (existing, modify)
│   ├── OAuthProvider.java            (new)
│   └── OAuthToken.java               (new)
├── repository/
│   ├── OAuthProviderRepository.java  (new)
│   └── UserRepository.java           (existing, modify query)
├── dto/
│   ├── OAuthCallbackRequest.java     (new)
│   ├── OAuthUserInfo.java            (new)
│   ├── OAuthLinkRequest.java         (new)
│   └── AuthResponse.java             (existing)
├── exception/
│   ├── OAuthException.java           (new)
│   └── OAuthProviderException.java   (new)
└── security/
    ├── StateTokenManager.java        (new)
    └── JwtTokenProvider.java         (existing)
```

### 4.2 Frontend Component Structure

```
components/
├── OAuth/
│   ├── OAuthLoginButton.tsx          (new)
│   ├── OAuthProviderIcon.tsx         (new)
│   └── OAuthLinkingModal.tsx         (new)
├── Auth/
│   ├── LoginPage.tsx                 (existing, extend)
│   └── RegisterPage.tsx              (existing, extend)
└── User/
    └── SettingsPage.tsx              (existing, extend)

lib/
├── oauth-api.ts                      (new)
├── oauth-client.ts                   (new)
└── api.ts                            (existing, extend)

hooks/
├── useOAuth.ts                       (new)
└── useAuth.ts                        (existing, extend)
```

---

## 5. Data Flow Diagrams

### 5.1 OAuth Login Flow

```
User Browser                Backend                 OAuth Provider
    │                         │                           │
    ├─ Click "Login Google"──→│                           │
    │                         ├─ Generate state token    │
    │                         ├─ Store in session        │
    │                         │                           │
    │                         ├─ Redirect to OAuth auth─→│
    │                         │  (client_id, state)      │
    │                         │                           │
    │←──────── Redirect ─────────────────────────────────┤
    │                         │                           │
    │ (show consent screen)   │                           │
    │                         │                           │
    ├─ Grant permission ─────────────────────────────────→
    │                         │                           │
    │←──────── Redirect ─────────────────────────────────┤
    │        (code, state)    │                           │
    │                         │                           │
    ├─ POST /oauth/callback──→│                           │
    │      (code, state)      ├─ Validate state          │
    │                         ├─ Exchange code→token    ──→
    │                         │  (client_id, secret, code)
    │                         │←─ Access token ──────────┤
    │                         │                           │
    │                         ├─ GET /userinfo ──────────→
    │                         │  (access_token)          │
    │                         │←─ User info ─────────────┤
    │                         │                           │
    │                         ├─ Find/Create user        │
    │                         ├─ Store OAuthProvider record
    │                         ├─ Issue JWT               │
    │                         │                           │
    │←─ Redirect + JWT ──────┤                           │
    │  /dashboard            │                           │
    │                         │                           │
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

- `OAuthServiceTest` - OAuth service logic, provider lookups
- `StateTokenManagerTest` - State token generation and validation
- `GoogleOAuthClientTest` - Google provider mocking
- `GitHubOAuthClientTest` - GitHub provider mocking
- `OAuthProviderRepositoryTest` - Database queries

### 6.2 Integration Tests

- `OAuthControllerTest` - OAuth endpoint behavior
- `OAuthFlowTest` - Full OAuth login flow (mocked provider)
- `UserMergingTest` - Account merging on email collision
- `OAuthLinkingTest` - Linking multiple providers to user

### 6.3 E2E Tests

- Login with Google → Create account → Access tasks
- Login with GitHub → Create account → Access tasks
- Existing user links OAuth provider
- User unlinking OAuth provider

### 6.4 Security Tests

- CSRF state token validation
- Expired state token rejection
- Invalid authorization code handling
- Token injection attempts
- Redirect URI validation

---

## 7. Rollout Strategy

### 7.1 Feature Flags

```java
@Component
public class FeatureFlags {
    public boolean isOAuthEnabled() {
        return environment.getProperty("features.oauth.enabled", boolean.class, true);
    }
}
```

### 7.2 Canary Deployment

1. Deploy to staging environment
2. Test with internal users (day 1)
3. Deploy to production with feature flag disabled (day 2)
4. Enable for 10% of users (day 3)
5. Monitor error rate and performance (day 4-5)
6. Ramp to 50% if all metrics healthy (day 6)
7. Full rollout (day 7)

### 7.3 Monitoring & Metrics

```
Metrics to track:
- OAuth login attempts per day
- Success rate per provider
- Average OAuth flow time
- CSRF failures
- Rate-limited requests
- Error codes distribution
- User account creation via OAuth
```

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OAuth provider outage | Users can't login via that provider | Fallback to local JWT login |
| Rate limiting abuse | DDoS via OAuth callback | Implement IP-based rate limiting |
| Email spoofing | Account takeover | Verify email with provider, add email verification step |
| CSRF attacks | Account hijacking | State token validation, SameSite cookies |
| Token leakage | Account compromise | HTTPS only, encrypted storage, short expiration |
| Configuration errors | Security holes | Strict validation, automated config tests |

---

## 9. Post-Launch

### 9.1 Documentation

- [ ] OAuth setup guide for operators
- [ ] OAuth troubleshooting guide
- [ ] Developer guide for OAuth integration
- [ ] User guide for linking OAuth providers

### 9.2 Monitoring

- [ ] Set up alerts for OAuth error spikes
- [ ] Track OAuth provider health status
- [ ] Monitor unauthorized access attempts
- [ ] Log all OAuth authentication events

### 9.3 Future Enhancements

- [ ] Support for additional providers (Microsoft, Apple Sign In)
- [ ] OAuth provider revocation API (unlink user from provider)
- [ ] Automatic token refresh for long-lived sessions
- [ ] Social features (share tasks, invite via OAuth contact)
