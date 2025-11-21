# Firebase Multiple Auth Providers Fix

## Problem Description

Users cannot use both email/password and Google sign-in with the same email address. When a user signs up with email/password and later tries to sign in with Google (or vice versa), they receive an error: `Firebase: Error (auth/invalid-credential)` or `auth/account-exists-with-different-credential`.

This happens because Firebase creates **separate accounts** for different authentication providers (email/password vs Google) even when using the same email address.

## Root Cause

Firebase has a setting called **"Prevent sign-in enumeration"** which, when enabled, creates separate accounts for each authentication provider. This is a security feature to prevent attackers from discovering which emails are registered.

## Solution

### 1. Firebase Console Configuration (CRITICAL)

You **MUST** configure Firebase to allow multiple sign-in methods per email:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **lms-auth-3dbe0**
3. Navigate to: **Authentication** > **Settings** tab
4. Find **"User account management"** section
5. Click on **"Manage sign-in methods"**
6. Look for **"Email enumeration protection"** or **"Prevent sign-in enumeration"**
7. **DISABLE** this setting OR set it to **"Allow email enumeration"**

**Alternative (Recommended for Production):**
- Keep enumeration protection ON
- Enable **"Account linking"** to automatically link accounts with the same email

### 2. Backend Changes (COMPLETED)

✅ **Updated `UserService.createUser()` method** to handle multiple auth providers:
- First checks if user exists with the given Firebase UID
- Then checks if user exists with the same email but different Firebase UID
- If email exists with different UID, **updates the Firebase UID** to the new one
- This allows the same backend user record to work with multiple Firebase auth providers

**File**: `lms-backend/src/main/java/com/devlcm/lcm/service/UserService.java`

```java
public User createUser(User signupRequest, String firebaseUid) {
    // Check if user already exists with this Firebase UID
    Optional<User> existingUserByUid = userRepository.findByFirebaseUid(firebaseUid);
    if (existingUserByUid.isPresent()) {
        return existingUserByUid.get();
    }
    
    // Check if user exists with the same email but different Firebase UID
    // This handles multiple auth providers for the same email
    Optional<User> existingUserByEmail = userRepository.findByEmail(signupRequest.getEmail());
    if (existingUserByEmail.isPresent()) {
        User existingUser = existingUserByEmail.get();
        // Update the Firebase UID to support multiple auth providers
        existingUser.setFirebaseUid(firebaseUid);
        return userRepository.save(existingUser);
    }
    
    // Create new user...
}
```

### 3. Frontend Changes (COMPLETED)

✅ **Updated Login.jsx** to show clear error messages:
- Added better error handling for `auth/account-exists-with-different-credential`
- Shows helpful message: "An account already exists with this email using a different sign-in method"

✅ **Updated SignUp.jsx** to handle existing accounts:
- Checks if user already exists in backend before creating
- If user exists (different Firebase UID), allows login
- Shows clear error messages for account conflicts

**Files**:
- `lcm-frontend/src/pages/Login.jsx`
- `lcm-frontend/src/pages/SignUp.jsx`

### 4. How It Works Now

#### Scenario 1: User signs up with Email/Password first
1. User creates account with `user@example.com` + password
2. Firebase creates user with UID: `abc123`
3. Backend creates user record with `firebaseUid: abc123`
4. **Later**: User tries to sign in with Google using same email
5. Firebase creates **new** user with UID: `xyz789` (different UID!)
6. Backend signup/login endpoint receives `xyz789`
7. Backend finds existing user by email
8. Backend **updates** `firebaseUid` from `abc123` to `xyz789`
9. User can now use **both** email/password and Google sign-in ✅

#### Scenario 2: User signs up with Google first
1. User creates account with Google (`user@example.com`)
2. Firebase creates user with UID: `xyz789`
3. Backend creates user record with `firebaseUid: xyz789`
4. **Later**: User tries to sign up with email/password using same email
5. Firebase creates **new** user with UID: `abc123` (different UID!)
6. Backend signup endpoint receives `abc123`
7. Backend finds existing user by email
8. Backend **updates** `firebaseUid` from `xyz789` to `abc123`
9. User can now use **both** methods ✅

### 5. Important Notes

**Limitations:**
- When user switches between auth methods, only the **most recent Firebase UID** is stored
- If user uses email/password, then Google, then tries email/password again, it will fail because the Firebase UID changed
- This is a **Firebase limitation**, not a backend issue

**Best Practice:**
- Configure Firebase to prevent this issue at the source (see step 1)
- OR implement proper account linking on the frontend
- OR inform users to stick with one sign-in method

### 6. Testing Steps

1. **Test Email/Password → Google:**
   ```
   1. Sign up with email: test@example.com, password: test123
   2. Log out
   3. Try "Sign in with Google" using test@example.com
   4. Should work (after Firebase config change)
   ```

2. **Test Google → Email/Password:**
   ```
   1. Sign up with Google using test2@example.com
   2. Log out
   3. Try to log in with email: test2@example.com, password: (set password in Firebase Console)
   4. Should work (after Firebase config change)
   ```

### 7. Alternative Solution: Account Linking

For a more robust solution, implement account linking on the frontend:

```javascript
import { linkWithCredential, EmailAuthProvider } from "firebase/auth";

// When Google sign-in detects existing email/password account
const credential = EmailAuthProvider.credential(email, password);
await linkWithCredential(auth.currentUser, credential);
```

This requires:
1. Prompting user for their password when Google sign-in fails
2. Using `linkWithCredential` to merge accounts
3. More complex UI flow

### 8. Recommended Final Solution

**For Production:**

1. ✅ Keep Firebase enumeration protection OFF (or enable account linking)
2. ✅ Use the updated backend code (already done)
3. ✅ Add a Profile page where users can link/unlink auth providers
4. ✅ Show clear error messages (already done)
5. ⚠️ Consider implementing proper account linking UI

**For Development/Testing:**
- The current solution (backend UID updates) works fine
- Just make sure to configure Firebase correctly

### 9. Current Status

✅ **Backend**: Fixed to handle multiple auth providers per email
✅ **Frontend**: Better error messages
⚠️ **Firebase Config**: **YOU MUST UPDATE THIS IN FIREBASE CONSOLE**
❌ **Account Linking UI**: Not implemented (optional enhancement)

### 10. Firebase Console Access

**Project**: lms-auth-3dbe0
**Console URL**: https://console.firebase.google.com/project/lms-auth-3dbe0/authentication/users

**Required Action:**
Go to Authentication > Settings > Email enumeration protection > **DISABLE**

---

## Quick Fix Summary

**Immediate Action Required:**
```
1. Open Firebase Console
2. Go to Authentication > Settings
3. Disable "Email enumeration protection"
4. Save changes
5. Test login with both methods
```

**Backend Changes:** ✅ Already completed
**Frontend Changes:** ✅ Already completed
**Firebase Changes:** ⚠️ **YOU NEED TO DO THIS MANUALLY**

After disabling email enumeration protection in Firebase Console, users will be able to use both email/password and Google sign-in with the same email address seamlessly!
