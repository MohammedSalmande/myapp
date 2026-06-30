# OAuth 2.0 Data Model Changes
## Smart Task Manager - Feature 002

---

## 1. Current Data Model

### 1.1 Existing Tables

```sql
-- Users table (existing)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table (existing)
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    urgent BOOLEAN DEFAULT FALSE,
    important BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    due_date DATE,
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (owner_id)
);
```

---

## 2. New Tables for OAuth

### 2.1 oauth_provider Table

**Purpose:** Store OAuth identity relationships between users and external providers.

```sql
CREATE TABLE oauth_provider (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Link to user account
    user_id BIGINT NOT NULL,
    
    -- OAuth provider name (google, github)
    provider VARCHAR(50) NOT NULL,
    
    -- Unique identifier from provider (sub or id)
    provider_id VARCHAR(255) NOT NULL,
    
    -- Email from provider (for verification and display)
    provider_email VARCHAR(255),
    
    -- Optional: Provider's display name
    provider_name VARCHAR(255),
    
    -- Optional: Provider's avatar URL
    provider_avatar_url VARCHAR(500),
    
    -- Timestamp when OAuth was linked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp of last OAuth login
    last_login_at TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique per provider (can't link same provider twice)
    UNIQUE KEY uk_user_provider (user_id, provider),
    
    -- Unique per provider ID (provider_id is global unique)
    UNIQUE KEY uk_provider_id (provider, provider_id),
    
    -- Indexes for fast lookups
    INDEX idx_provider_id (provider_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_last_login (last_login_at)
);
```

### 2.2 Table Relationships

```
users (1) ──< oauth_provider (many)
  │
  └─ One user can have multiple OAuth providers
     (Google, GitHub, etc.)
```

**Example Data:**

```sql
-- User with both Google and GitHub OAuth
INSERT INTO users (username, password) VALUES ('alice@example.com', 'hash...');
-- Returns user_id = 1

INSERT INTO oauth_provider 
(user_id, provider, provider_id, provider_email, provider_name, created_at, last_login_at)
VALUES 
(1, 'google', 'google-sub-123', 'alice@gmail.com', 'Alice Smith', NOW(), NOW()),
(1, 'github', 'alice-github-456', 'alice@github.com', 'alice-dev', NOW(), NOW());

-- User with Google OAuth and local password
INSERT INTO users (username, password) VALUES ('bob', 'hash...');
-- Returns user_id = 2

INSERT INTO oauth_provider 
(user_id, provider, provider_id, provider_email, provider_name, created_at)
VALUES 
(2, 'google', 'google-sub-789', 'bob@gmail.com', 'Bob Jones', NOW());
```

---

## 3. Modified Tables

### 3.1 users Table (Enhanced)

**Changes:**
- Add `last_login_at` timestamp (for analytics)
- Make `password` optional (nullable for OAuth-only users)
- Add `oauth_only` flag to differentiate auth types

```sql
ALTER TABLE users 
ADD COLUMN last_login_at TIMESTAMP NULL AFTER created_at,
ADD COLUMN oauth_only BOOLEAN DEFAULT FALSE AFTER last_login_at,
MODIFY COLUMN password VARCHAR(255) NULL;

-- Update indexes
CREATE INDEX idx_last_login_at ON users(last_login_at);
CREATE INDEX idx_oauth_only ON users(oauth_only);
```

**Updated Entity:**

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = true)  // NULL for OAuth-only users
    private String password;

    @Column(nullable = true)
    private OffsetDateTime lastLoginAt;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean oauthOnly = false;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OAuthProvider> oauthProviders = new ArrayList<>();

    // getters and setters...
}
```

---

## 4. New Entity Models

### 4.1 OAuthProvider Entity

```java
@Entity
@Table(name = "oauth_provider")
public class OAuthProvider {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OAuthProviderType provider;

    @Column(nullable = false, unique = true)
    private String providerId;

    @Column
    private String providerEmail;

    @Column
    private String providerName;

    @Column
    private String providerAvatarUrl;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column
    private OffsetDateTime lastLoginAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    // getters and setters...
}
```

### 4.2 OAuthProviderType Enum

```java
public enum OAuthProviderType {
    GOOGLE("google"),
    GITHUB("github");

    private final String value;

    OAuthProviderType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static OAuthProviderType fromValue(String value) {
        for (OAuthProviderType type : OAuthProviderType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown provider: " + value);
    }
}
```

### 4.3 OAuthUserInfo DTO

```java
public class OAuthUserInfo {
    private String providerId;      // sub (Google) or id (GitHub)
    private String email;            // email
    private String name;             // name
    private String avatarUrl;        // picture (Google) or avatar_url (GitHub)
    private String provider;         // "google" or "github"

    // getters and setters...
}
```

---

## 5. Repository Changes

### 5.1 New OAuthProviderRepository

```java
@Repository
public interface OAuthProviderRepository extends JpaRepository<OAuthProvider, Long> {
    
    // Find provider by provider type and provider ID
    Optional<OAuthProvider> findByProviderAndProviderId(
        OAuthProviderType provider,
        String providerId
    );

    // Find all providers for a user
    List<OAuthProvider> findByUserId(Long userId);

    // Find a specific provider for a user
    Optional<OAuthProvider> findByUserIdAndProvider(
        Long userId,
        OAuthProviderType provider
    );

    // Check if provider linked to user
    boolean existsByUserIdAndProvider(Long userId, OAuthProviderType provider);

    // Find by email (for account linking)
    List<OAuthProvider> findByProviderEmail(String email);

    // Update last login timestamp
    @Modifying
    @Query("UPDATE OAuthProvider op SET op.lastLoginAt = CURRENT_TIMESTAMP WHERE op.id = ?1")
    void updateLastLogin(Long id);

    // Count providers for user
    int countByUserId(Long userId);
}
```

### 5.2 Enhanced UserRepository

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    boolean existsByUsername(String username);
    
    // Find user by OAuth provider email (for account linking)
    Optional<User> findByOauthProvidersProviderEmail(String email);
    
    // Find all users created via OAuth
    List<User> findByOauthOnly(boolean oauthOnly);
    
    // Find users with OAuth provider
    @Query("SELECT u FROM User u JOIN u.oauthProviders op WHERE op.provider = ?1")
    List<User> findUsersWithProvider(OAuthProviderType provider);
}
```

---

## 6. Migration Strategy

### 6.1 Initial Setup (New Database)

For new installations, all tables created together with no migration needed.

### 6.2 Existing Installation Migration

```sql
-- Step 1: Add new columns to users table
ALTER TABLE users 
ADD COLUMN last_login_at TIMESTAMP NULL,
ADD COLUMN oauth_only BOOLEAN DEFAULT FALSE,
MODIFY COLUMN password VARCHAR(255) NULL;

-- Step 2: Create oauth_provider table
CREATE TABLE oauth_provider (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    provider_avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_provider (user_id, provider),
    UNIQUE KEY uk_provider_id (provider, provider_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_last_login (last_login_at)
);

-- Step 3: Update existing users' last_login_at from updated_at column if available
-- (or set to created_at)
UPDATE users SET last_login_at = created_at;

-- Step 4: Create indexes on users table
CREATE INDEX idx_oauth_only ON users(oauth_only);
CREATE INDEX idx_last_login_at ON users(last_login_at);
```

### 6.3 Rollback Strategy

```sql
-- If migration fails:
DROP TABLE oauth_provider;

ALTER TABLE users 
DROP COLUMN last_login_at,
DROP COLUMN oauth_only,
MODIFY COLUMN password VARCHAR(255) NOT NULL;

DROP INDEX idx_oauth_only ON users;
DROP INDEX idx_last_login_at ON users;
```

---

## 7. Data Access Patterns

### 7.1 Find User by OAuth Login

```java
public User findUserByOAuth(String provider, String providerId) {
    OAuthProvider oauthProvider = oauthProviderRepository
        .findByProviderAndProviderId(
            OAuthProviderType.fromValue(provider),
            providerId
        )
        .orElseThrow(() -> new NotFoundException("OAuth provider not found"));
    
    return oauthProvider.getUser();
}
```

### 7.2 Link OAuth to Existing User

```java
public void linkOAuthToUser(User user, String provider, OAuthUserInfo userInfo) {
    OAuthProvider oauthProvider = new OAuthProvider();
    oauthProvider.setUser(user);
    oauthProvider.setProvider(OAuthProviderType.fromValue(provider));
    oauthProvider.setProviderId(userInfo.getProviderId());
    oauthProvider.setProviderEmail(userInfo.getEmail());
    oauthProvider.setProviderName(userInfo.getName());
    oauthProvider.setProviderAvatarUrl(userInfo.getAvatarUrl());
    
    oauthProviderRepository.save(oauthProvider);
}
```

### 7.3 Create User from OAuth

```java
public User createUserFromOAuth(String provider, OAuthUserInfo userInfo) {
    User user = new User();
    user.setUsername(generateUsernameFromEmail(userInfo.getEmail()));
    user.setPassword(null);  // NULL for OAuth-only users
    user.setOauthOnly(true);
    
    User savedUser = userRepository.save(user);
    
    linkOAuthToUser(savedUser, provider, userInfo);
    
    return savedUser;
}
```

### 7.4 Get User's OAuth Providers

```java
public List<OAuthProvider> getUserOAuthProviders(Long userId) {
    return oauthProviderRepository.findByUserId(userId);
}
```

### 7.5 Unlink OAuth Provider

```java
public void unlinkOAuthProvider(Long userId, String provider) {
    OAuthProvider oauthProvider = oauthProviderRepository
        .findByUserIdAndProvider(userId, OAuthProviderType.fromValue(provider))
        .orElseThrow(() -> new NotFoundException("Provider not linked"));
    
    // Ensure user has alternative auth method
    User user = oauthProvider.getUser();
    if (user.getPassword() == null && 
        oauthProviderRepository.countByUserId(userId) == 1) {
        throw new IllegalStateException(
            "Cannot unlink provider - must have alternative auth method"
        );
    }
    
    oauthProviderRepository.delete(oauthProvider);
}
```

---

## 8. Query Performance Considerations

### 8.1 Indexes

```sql
-- Fast OAuth provider lookups
CREATE UNIQUE INDEX idx_provider_provider_id 
    ON oauth_provider(provider, provider_id);

-- Fast user lookups by OAuth
CREATE INDEX idx_oauth_user_id 
    ON oauth_provider(user_id);

-- Fast email lookups
CREATE INDEX idx_oauth_email 
    ON oauth_provider(provider_email);

-- Last login tracking
CREATE INDEX idx_last_login 
    ON oauth_provider(last_login_at);
```

### 8.2 Query Optimization Tips

1. **Use LAZY loading** for OneToMany relationships to avoid N+1 queries
2. **Create indexes** on frequently joined columns
3. **Use projection queries** to fetch only needed fields
4. **Batch operations** when unlinking multiple providers
5. **Cache OAuth provider lookups** (TTL: 5 minutes)

---

## 9. Data Integrity Constraints

### 9.1 Invariants

1. **One provider per user:** User can only have one Google, one GitHub, etc.
2. **Unique provider ID:** Each provider ID globally unique (no user can claim same provider ID)
3. **Auth method required:** User must have either password or OAuth provider
4. **Email verification:** OAuth email must be verified by provider
5. **No orphaned providers:** Deleting user deletes all OAuth providers

### 9.2 Validations

```java
@Valid
public class LinkOAuthRequest {
    @NotBlank(message = "Provider required")
    private String provider;  // "google" or "github"
    
    @NotBlank(message = "Provider ID required")
    private String providerId;
    
    @Email(message = "Valid email required")
    private String providerEmail;
}
```

---

## 10. Audit Trail

### 10.1 Logging Data Changes

Track OAuth-related events in a separate audit table (future enhancement):

```sql
CREATE TABLE oauth_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50),  -- LOGIN, LINK, UNLINK, ERROR
    user_id BIGINT,
    provider VARCHAR(50),
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

### 10.2 Events to Log

- `OAUTH_LOGIN_SUCCESS` - User logged in via OAuth
- `OAUTH_LOGIN_FAILURE` - OAuth login failed
- `OAUTH_LINK_SUCCESS` - Provider linked to account
- `OAUTH_UNLINK_SUCCESS` - Provider unlinked from account
- `OAUTH_ACCOUNT_CREATED` - New account created via OAuth
- `OAUTH_ACCOUNT_MERGED` - Accounts merged on email collision

---

## 11. ER Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ username        │
│ password        │◄───── nullable for OAuth-only users
│ last_login_at   │
│ oauth_only      │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼──────────────────────┐
│   oauth_provider               │
├────────────────────────────────┤
│ id (PK)                        │
│ user_id (FK) ─────────────────►│
│ provider                       │
│ provider_id                    │
│ provider_email                 │
│ provider_name                  │
│ provider_avatar_url            │
│ created_at                     │
│ last_login_at                  │
└────────────────────────────────┘

Constraints:
- users.id → oauth_provider.user_id (1:N)
- oauth_provider.user_id + provider (UNIQUE)
- oauth_provider.provider + provider_id (UNIQUE)
```
