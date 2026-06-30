# OAuth 2.0 Implementation Tasks
## Smart Task Manager - Feature 002

**Total Estimated Effort:** 56 story points  
**Target Sprint:** 6-7 weeks

---

## Backlog

### EPIC: OAuth 2.0 Integration

#### STORY-001: OAuth Provider Registration & Configuration
**Story Points:** 5  
**Priority:** P0 - Critical (Blocker for all other work)  
**Acceptance Criteria:**
- [ ] Google OAuth 2.0 app created in Google Cloud Console
- [ ] GitHub OAuth App created and credentials obtained
- [ ] OAuth credentials documented and stored securely
- [ ] Environment variables configured in .env
- [ ] pom.xml updated with Spring Security OAuth2 dependencies

**Tasks:**
- [ ] Register Google OAuth 2.0 application
- [ ] Register GitHub OAuth application
- [ ] Document OAuth credentials and setup steps
- [ ] Create .env template with OAuth config variables
- [ ] Add Spring Security OAuth2 and HTTP client dependencies
- [ ] Document OAuth provider API endpoints

**Definition of Done:**
- Google and GitHub apps ready for development
- All OAuth credentials in .env file
- Dependencies added to pom.xml
- Setup guide documented

---

#### STORY-002: Database Schema for OAuth Identity Storage
**Story Points:** 3  
**Priority:** P0 - Critical  
**Dependencies:** STORY-001  
**Acceptance Criteria:**
- [ ] `oauth_provider` table created with correct schema
- [ ] Foreign key constraint to `users` table
- [ ] Index on (provider, provider_id) for fast lookups
- [ ] Migration script tested on local database
- [ ] NULL handling for optional fields

**Tasks:**
- [ ] Design oauth_provider table schema
- [ ] Create database migration script
- [ ] Add unique constraint on (user_id, provider)
- [ ] Create JPA entity for OAuthProvider
- [ ] Add repository interface for OAuthProvider
- [ ] Test migration on local database

**SQL Schema:**
```sql
CREATE TABLE oauth_provider (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, provider),
    UNIQUE KEY (provider, provider_id),
    INDEX (provider_id)
);
```

**Definition of Done:**
- Migration runs successfully
- Entity maps to table
- No migration conflicts
- Tested queries work

---

#### STORY-003: OAuth Service Layer - Token Management
**Story Points:** 5  
**Priority:** P1 - High  
**Dependencies:** STORY-001, STORY-002  
**Acceptance Criteria:**
- [ ] OAuthTokenProvider exchanges auth code for access token
- [ ] Token exchange calls correct provider endpoint
- [ ] Error handling for invalid/expired codes
- [ ] State token generation and validation
- [ ] State token expiration (5 min TTL)

**Tasks:**
- [ ] Create StateTokenManager class
- [ ] Generate cryptographically secure state tokens
- [ ] Store state token in session/cache with expiration
- [ ] Implement state token validation
- [ ] Create OAuthTokenProvider interface
- [ ] Implement token exchange logic (Google)
- [ ] Implement token exchange logic (GitHub)
- [ ] Add error handling for OAuth errors

**Code Structure:**
```java
public interface OAuthTokenProvider {
    String exchangeCodeForToken(String code) throws OAuthException;
}

public class StateTokenManager {
    public String generateStateToken();
    public boolean validateStateToken(String token);
}
```

**Definition of Done:**
- Unit tests pass (StateTokenManager, token exchange)
- Mocked provider calls work
- Error cases handled
- Tokens expire correctly

---

#### STORY-004: OAuth Client - Google Integration
**Story Points:** 4  
**Priority:** P1 - High  
**Dependencies:** STORY-003  
**Acceptance Criteria:**
- [ ] GoogleOAuthClient fetches user info from Google API
- [ ] User email and name extracted correctly
- [ ] Handles API errors gracefully
- [ ] Unit tests mock Google API responses

**Tasks:**
- [ ] Create GoogleOAuthClient class
- [ ] Implement code-to-token exchange
- [ ] Call Google userinfo endpoint
- [ ] Extract user email and profile info
- [ ] Handle Google API error responses
- [ ] Unit tests with mocked Google API

**Definition of Done:**
- GoogleOAuthClient tested with mock responses
- All required fields extracted
- Error scenarios handled
- API call timeout configured

---

#### STORY-005: OAuth Client - GitHub Integration
**Story Points:** 4  
**Priority:** P1 - High  
**Dependencies:** STORY-003  
**Acceptance Criteria:**
- [ ] GitHubOAuthClient fetches user info from GitHub API
- [ ] User email and name extracted correctly
- [ ] Handles GitHub email API (returns array)
- [ ] Unit tests mock GitHub API responses

**Tasks:**
- [ ] Create GitHubOAuthClient class
- [ ] Implement code-to-token exchange
- [ ] Call GitHub user endpoint
- [ ] Call GitHub user emails endpoint (get primary email)
- [ ] Extract user email and username
- [ ] Handle GitHub API error responses
- [ ] Unit tests with mocked GitHub API

**Definition of Done:**
- GitHubOAuthClient tested with mock responses
- Primary email correctly identified
- All error scenarios handled
- API call timeout configured

---

#### STORY-006: OAuth Service - User Lookup & Creation
**Story Points:** 5  
**Priority:** P1 - High  
**Dependencies:** STORY-002, STORY-004, STORY-005  
**Acceptance Criteria:**
- [ ] Find user by OAuth provider + provider_id
- [ ] Auto-create user on first OAuth login
- [ ] Link OAuth to existing user account
- [ ] Handle email collision (duplicate email from different provider)
- [ ] Update user's last_login timestamp

**Tasks:**
- [ ] Create OAuthService class
- [ ] Implement findOrCreateUser(provider, userInfo)
- [ ] Implement linkOAuthIdentity(user, provider, userInfo)
- [ ] Implement findUserByOAuthProvider(provider, providerId)
- [ ] Handle duplicate email scenarios
- [ ] Create default username from email if needed
- [ ] Update last_login_at on successful OAuth
- [ ] Unit tests for all scenarios

**Definition of Done:**
- All OAuth + user scenarios tested
- Duplicate email handling confirmed
- Default usernames working
- Database operations verified

---

#### STORY-007: OAuth Controller - Authorization Endpoint
**Story Points:** 3  
**Priority:** P1 - High  
**Dependencies:** STORY-003  
**Acceptance Criteria:**
- [ ] GET /api/oauth/authorize/:provider redirects to OAuth provider
- [ ] State token generated and stored
- [ ] Authorization URL includes correct parameters (client_id, redirect_uri, scopes)
- [ ] Returns 400 for unsupported providers

**Tasks:**
- [ ] Create OAuthController class
- [ ] Implement GET /api/oauth/authorize/:provider
- [ ] Generate state token
- [ ] Build authorization URL for each provider
- [ ] Include correct scopes (openid, profile, email)
- [ ] Return redirect response
- [ ] Add logging for OAuth requests

**Definition of Done:**
- Endpoint tested with mock provider
- Redirect URL correct
- State token stored in session
- Error handling for bad provider names

---

#### STORY-008: OAuth Controller - Callback Endpoint
**Story Points:** 5  
**Priority:** P0 - Critical  
**Dependencies:** STORY-006, STORY-007  
**Acceptance Criteria:**
- [ ] GET /api/oauth/callback/:provider handles provider redirect
- [ ] State token validated before token exchange
- [ ] Authorization code exchanged for access token
- [ ] User info fetched from provider
- [ ] User found or created
- [ ] JWT token issued to client
- [ ] Redirect to dashboard with JWT in URL or cookie

**Tasks:**
- [ ] Implement GET /api/oauth/callback/:provider
- [ ] Validate state token from query parameter
- [ ] Extract authorization code
- [ ] Call OAuthTokenProvider to exchange code
- [ ] Call provider client to get user info
- [ ] Call OAuthService to find/create user
- [ ] Issue JWT token
- [ ] Return redirect to frontend dashboard
- [ ] Add rate limiting (10 req/min per IP)

**Error Handling:**
- State token mismatch → 400 Bad Request
- Expired authorization code → 400 Bad Request
- Provider API error → 502 Bad Gateway
- Email already taken (non-OAuth) → 409 Conflict

**Definition of Done:**
- E2E callback flow tested with mocked provider
- Rate limiting working
- All error cases handled
- JWT issued successfully

---

#### STORY-009: OAuth Controller - Link OAuth to Existing User
**Story Points:** 4  
**Priority:** P2 - Medium  
**Dependencies:** STORY-006, STORY-008  
**Acceptance Criteria:**
- [ ] POST /api/oauth/link/:provider starts linking flow
- [ ] Authenticated user initiates OAuth link
- [ ] OAuth callback merges provider with existing user
- [ ] User can have multiple linked providers
- [ ] Prevent linking same provider twice

**Tasks:**
- [ ] Implement POST /api/oauth/link/:provider
- [ ] Create linking state in session
- [ ] Modify callback to detect linking vs. login flow
- [ ] Store provider with existing user
- [ ] Return user's updated provider list
- [ ] Unit tests for linking scenarios

**Definition of Done:**
- Linking flow works end-to-end
- Duplicate provider link rejected
- User context preserved throughout flow

---

#### STORY-010: OAuth Controller - Unlink OAuth Provider
**Story Points:** 3  
**Priority:** P2 - Medium  
**Dependencies:** STORY-009  
**Acceptance Criteria:**
- [ ] POST /api/oauth/unlink/:provider removes provider from user
- [ ] User must have at least one auth method (OAuth or password)
- [ ] Returns 400 if trying to unlink last auth method
- [ ] Returns updated provider list

**Tasks:**
- [ ] Implement POST /api/oauth/unlink/:provider
- [ ] Validate user has alternative auth method
- [ ] Delete OAuthProvider record
- [ ] Return success/error response
- [ ] Unit tests for edge cases

**Definition of Done:**
- Unlinking works correctly
- Safeguards prevent lockout
- Proper error messages

---

#### STORY-011: User Model Enhancement
**Story Points:** 2  
**Priority:** P1 - High  
**Dependencies:** STORY-002  
**Acceptance Criteria:**
- [ ] User entity has OAuth provider relationship
- [ ] last_login_at timestamp added
- [ ] User can have multiple OAuthProvider records

**Tasks:**
- [ ] Add @OneToMany relationship to OAuthProvider
- [ ] Add last_login_at field to User entity
- [ ] Create getOAuthProviders() method
- [ ] Update UserRepository queries if needed
- [ ] Update existing User tests

**Definition of Done:**
- Entity relationships correct
- Tests still pass
- No migration issues

---

#### STORY-012: Frontend - OAuth Login Button Component
**Story Points:** 3  
**Priority:** P1 - High  
**Acceptance Criteria:**
- [ ] OAuthLoginButton component displays Google and GitHub buttons
- [ ] Clicking button redirects to /api/oauth/authorize/:provider
- [ ] Icons/styling match existing design
- [ ] Mobile-responsive layout

**Tasks:**
- [ ] Create OAuthLoginButton.tsx component
- [ ] Add Google and GitHub OAuth button icons
- [ ] Implement redirect to authorize endpoint
- [ ] Style to match existing login page
- [ ] Add accessibility labels (aria-label, role)
- [ ] Test on mobile viewport

**Definition of Done:**
- Component renders correctly
- Buttons functional
- Styling matches
- Accessible to screen readers

---

#### STORY-013: Frontend - OAuth Login Flow Integration
**Story Points:** 4  
**Priority:** P1 - High  
**Dependencies:** STORY-008, STORY-012  
**Acceptance Criteria:**
- [ ] OAuth callback redirects to frontend with JWT
- [ ] Frontend stores JWT token in localStorage
- [ ] Frontend redirects to dashboard after login
- [ ] Error messages displayed for OAuth failures
- [ ] Fallback to local login if OAuth fails

**Tasks:**
- [ ] Create oauth-api.ts with OAuth endpoints
- [ ] Implement handleOAuthCallback(code, state)
- [ ] Store JWT token in localStorage after OAuth
- [ ] Update session context with user info
- [ ] Redirect to /dashboard on success
- [ ] Display error toast on failure
- [ ] Add fallback UI for OAuth errors
- [ ] Unit tests for OAuth flow

**Definition of Done:**
- OAuth login completes E2E
- JWT stored correctly
- Redirect works
- Error handling user-friendly

---

#### STORY-014: Frontend - OAuth Linking UI
**Story Points:** 3  
**Priority:** P2 - Medium  
**Dependencies:** STORY-009, STORY-013  
**Acceptance Criteria:**
- [ ] Settings page shows linked OAuth providers
- [ ] Button to link new OAuth provider
- [ ] Button to unlink provider (if multiple)
- [ ] Confirmation dialog before unlinking

**Tasks:**
- [ ] Extend Settings/Profile component
- [ ] Display list of linked providers
- [ ] Add "Link Provider" button
- [ ] Add "Unlink Provider" button with confirmation
- [ ] Call /api/user/oauth-providers to get list
- [ ] Call /api/oauth/link/:provider to link
- [ ] Call /api/oauth/unlink/:provider to unlink
- [ ] Update provider list on success

**Definition of Done:**
- OAuth linking UI complete
- All buttons functional
- Proper confirmations in place

---

#### STORY-015: Error Handling & Logging
**Story Points:** 3  
**Priority:** P2 - Medium  
**Dependencies:** All OAuth stories  
**Acceptance Criteria:**
- [ ] All OAuth errors logged with context
- [ ] User-friendly error messages
- [ ] Error codes standardized
- [ ] Audit trail of OAuth events

**Tasks:**
- [ ] Create OAuthException class hierarchy
- [ ] Add logging to OAuthService, clients
- [ ] Create error message mapping
- [ ] Add RequestId to all OAuth logs
- [ ] Document error codes (INVALID_STATE, PROVIDER_ERROR, etc.)
- [ ] Add info-level logging for successful OAuth events

**Definition of Done:**
- Error handling comprehensive
- Logging helpful for debugging
- Audit trail working

---

#### STORY-016: Security Testing - CSRF & Token Validation
**Story Points:** 5  
**Priority:** P0 - Critical  
**Dependencies:** All OAuth stories  
**Acceptance Criteria:**
- [ ] CSRF state token validation tested
- [ ] Expired state tokens rejected
- [ ] Token injection attempts prevented
- [ ] Redirect URI validation working
- [ ] HTTPS enforcement in production

**Tasks:**
- [ ] Write unit tests for StateTokenManager
- [ ] Test state token expiration (5 min)
- [ ] Test invalid state rejection
- [ ] Test authorization code reuse prevention
- [ ] Penetration test: attempt CSRF bypass
- [ ] Penetration test: attempt token injection
- [ ] Verify HTTPS-only in prod config

**Definition of Done:**
- Security tests pass
- No CSRF vulnerabilities
- Token handling secure

---

#### STORY-017: Integration Tests - OAuth Flow E2E
**Story Points:** 6  
**Priority:** P1 - High  
**Dependencies:** All OAuth stories  
**Acceptance Criteria:**
- [ ] Google OAuth login E2E test passes
- [ ] GitHub OAuth login E2E test passes
- [ ] Account linking E2E test passes
- [ ] Account unlinking E2E test passes
- [ ] Duplicate email handling tested

**Tasks:**
- [ ] Create OAuthFlowTest with mocked providers
- [ ] Test complete Google login → task creation flow
- [ ] Test complete GitHub login → task creation flow
- [ ] Test linking OAuth to existing user
- [ ] Test unlinking OAuth provider
- [ ] Test duplicate email account merging
- [ ] Test OAuth provider error scenarios

**Definition of Done:**
- All E2E tests pass
- Code coverage >80%
- No flaky tests

---

#### STORY-018: Performance & Load Testing
**Story Points:** 3  
**Priority:** P2 - Medium  
**Dependencies:** Story-008, STORY-013  
**Acceptance Criteria:**
- [ ] OAuth login completes in <5 seconds
- [ ] No blocking I/O on callback endpoint
- [ ] Rate limiting prevents abuse (10 req/min/IP)
- [ ] Database queries optimized (proper indexes)

**Tasks:**
- [ ] Performance test OAuth callback endpoint
- [ ] Verify response time <2s (API only)
- [ ] Load test: simulate 100 concurrent OAuth logins
- [ ] Verify rate limiting working
- [ ] Check database query performance
- [ ] Profile for any bottlenecks

**Definition of Done:**
- Performance benchmarks met
- Rate limiting functional
- No performance regressions

---

#### STORY-019: Documentation & Runbooks
**Story Points:** 4  
**Priority:** P2 - Medium  
**Dependencies:** All OAuth stories  
**Acceptance Criteria:**
- [ ] OAuth setup guide completed
- [ ] Troubleshooting guide documented
- [ ] Operator runbook for OAuth issues
- [ ] Developer integration guide

**Tasks:**
- [ ] Write OAuth setup guide for new developers
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Document common OAuth errors
- [ ] Create runbook for provider outages
- [ ] Document security best practices

**Definition of Done:**
- Setup guide comprehensive
- Easy for new dev to set up OAuth
- Troubleshooting guide helpful

---

#### STORY-020: Monitoring & Alerts
**Story Points:** 3  
**Priority:** P2 - Medium  
**Dependencies:** All OAuth stories  
**Acceptance Criteria:**
- [ ] OAuth error rate monitored
- [ ] Alerts for CSRF failures
- [ ] Alerts for high rate limiting hits
- [ ] Dashboard showing OAuth metrics

**Tasks:**
- [ ] Set up Prometheus metrics for OAuth
- [ ] Track OAuth success/failure rates
- [ ] Track provider-specific error rates
- [ ] Set up Grafana dashboard
- [ ] Configure alerts for anomalies
- [ ] Log rotation policy for OAuth logs

**Definition of Done:**
- Monitoring in place
- Alerts working
- Dashboard shows key metrics

---

## Summary

**Total Story Points: 74**  
**Breakdown:**
- Backend: 40 points
- Frontend: 13 points
- Security & Testing: 14 points
- Documentation & Monitoring: 7 points

**Recommended Sprint Assignment:**
- Sprint 1 (Week 1-2): STORY-001 through STORY-006 (Foundations)
- Sprint 2 (Week 3-4): STORY-007 through STORY-014 (API & Frontend)
- Sprint 3 (Week 5-7): STORY-015 through STORY-020 (Security, Testing, Docs)
