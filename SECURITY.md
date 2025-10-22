# 🔒 Security Implementation

## Password Security

### Current Implementation

This application implements industry-standard password security using **bcrypt**:

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Secure Storage**: Only password hashes are stored in the database
3. **Secure Verification**: Passwords are verified using `bcrypt.compare()`

### Architecture

```
Frontend (Browser)
    ↓
  [HTTPS - Recommended]
    ↓
Backend API
    ↓
bcrypt.compare(plaintext, hash)
    ↓
PostgreSQL Database (stores only hashes)
```

### ✅ What is Secure

- **Database Storage**: Only bcrypt hashes stored (60 characters, format: `$2b$10$...`)
- **Password Verification**: Uses constant-time comparison (prevents timing attacks)
- **Salting**: Each password has a unique salt (prevents rainbow table attacks)
- **Cost Factor**: 10 rounds = ~100ms computation time (prevents brute force)

### ⚠️ Important Security Notes

#### Is sending plaintext password from frontend secure?

**Short answer**: It depends on your setup.

**Current implementation**:
- Frontend sends plaintext password via HTTP/HTTPS
- **This is acceptable ONLY if you use HTTPS in production**

**Recommendations**:

1. **✅ REQUIRED: Use HTTPS in production**
   ```bash
   # Generate SSL certificate
   # Use Let's Encrypt for free certificates
   ```

2. **✅ Optional: Implement password strength requirements**
   ```javascript
   // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
   const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
   ```

3. **✅ Optional: Add rate limiting to prevent brute force**
   ```javascript
   // Already implemented in your auth middleware
   // Max 5 attempts per minute
   ```

#### Why NOT hash on frontend?

Hashing on frontend is **NOT recommended** because:

- ❌ **False security**: The hash becomes the "password"
- ❌ **Replay attacks**: Attacker can steal and reuse the hash
- ❌ **No server-side control**: Can't upgrade hashing algorithm
- ✅ **HTTPS is the correct solution** for transport security

### Migration Guide

#### For Existing Databases with Plaintext Passwords

Run the migration script **ONCE**:

```bash
node src/utils/db/migration/migrate-passwords.js
```

This will:
1. Detect plaintext passwords (not starting with `$2b$` or `$2a$`)
2. Hash them using bcrypt
3. Update the database
4. Skip already-hashed passwords

#### For New Installations

Just run the schema and mock data:

```bash
# Schema already includes VARCHAR(60) for bcrypt hashes
# Mock data already includes hashed passwords
```

### Testing

**Test credentials** (for development only):

| Account ID | Username | Password (plaintext) | Password (hashed) |
|------------|----------|---------------------|-------------------|
| 1 | Admin 1 | `test123456` | `$2b$10$JQCr...` |
| 2 | Admin 2 | `admin_password2` | `$2b$10$mQ4M...` |

### Security Checklist

- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Plaintext passwords never stored
- [x] Constant-time comparison used
- [x] Migration script for existing data
- [ ] **TODO**: Enable HTTPS in production
- [ ] **TODO**: Implement password strength requirements (optional)
- [ ] **TODO**: Add password change functionality
- [ ] **TODO**: Implement password reset flow

### Code References

- Password hashing: `src/services/auth.js:65`
- Password verification: `src/services/auth.js:26`
- Migration script: `src/utils/db/migration/migrate-passwords.js`
- Database schema: `src/utils/db/migration/schema.sql:16`

---

**Last Updated**: 2025-10-21
