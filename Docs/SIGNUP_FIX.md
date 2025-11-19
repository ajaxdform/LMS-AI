# Signup Flow Fix

## Problem
When signing up a new user:
- ✅ User was created in Firebase Authentication
- ❌ User was NOT created in MongoDB database
- ❌ Error: "User not found with ID or Firebase UID: xxx"

## Root Cause
The backend `/public/signup` endpoint was trying to create the user in Firebase **again**, but the frontend had already created the Firebase user. This caused a conflict because:

1. Frontend: Creates user in Firebase → Gets Firebase UID
2. Frontend: Calls backend `/public/signup` with token
3. Backend: Tries to create Firebase user AGAIN → Error (user already exists)
4. Backend: Never reaches MongoDB creation step

## Solution Applied

**Changed Backend `PublicController.signup()`:**

### Before:
```java
public ResponseEntity<ApiResponse<UserDTO>> signup(@Valid @RequestBody UserDTO userDTO) {
    // ❌ Tries to create Firebase user again
    UserRecord userRecord = FirebaseAuth.getInstance().createUser(
        new UserRecord.CreateRequest()
            .setEmail(userDTO.getEmail())
            .setPassword(userDTO.getPassword())
    );
    
    User createdUser = userService.createUser(userEntity, userRecord.getUid());
    // ...
}
```

### After:
```java
public ResponseEntity<ApiResponse<UserDTO>> signup(@Valid @RequestBody userDTO) {
    // ✅ Gets Firebase UID from the authentication token (already created by frontend)
    String firebaseUid = (String) SecurityContextHolder
        .getContext()
        .getAuthentication()
        .getPrincipal();
    
    User createdUser = userService.createUser(userEntity, firebaseUid);
    // ...
}
```

## How It Works Now

### Correct Signup Flow:

1. **Frontend (SignUp.jsx)**:
   ```javascript
   // Step 1: Create user in Firebase
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   const user = userCredential.user;
   const token = await user.getIdToken(); // Get Firebase token
   
   // Step 2: Call backend with token
   await api.post("/public/signup", 
     { username, email, password },
     { headers: { Authorization: `Bearer ${token}` } }
   );
   ```

2. **Backend (PublicController.java)**:
   - FirebaseAuthFilter extracts Firebase UID from token
   - Stores UID in SecurityContext
   - `/public/signup` endpoint gets UID from SecurityContext
   - Creates user record in MongoDB with Firebase UID

3. **Result**:
   - ✅ User exists in Firebase Authentication
   - ✅ User exists in MongoDB with matching Firebase UID
   - ✅ User can login and access protected routes

## Testing the Fix

### 1. Restart Backend
```powershell
cd c:\Users\shubh\LMS\lms-backend
mvn spring-boot:run
```

### 2. Test Signup
1. Go to `/signup` page
2. Fill in username, email, password
3. Click "Create Account"
4. Should redirect to `/dashboard` successfully

### 3. Verify Database
Check MongoDB `users` collection should show:
```javascript
{
  "_id": "...",
  "firebaseUid": "413h2wixYDVujGVqSSs16MryRlp2", // Matches Firebase
  "username": "yourname",
  "email": "your@email.com",
  "role": "STUDENT",
  "enrolledCourseIds": [],
  "createdAt": "2025-11-12T..."
}
```

### 4. Verify Firebase
Check Firebase Console → Authentication:
- User should exist with same email
- UID should match MongoDB `firebaseUid`

## Related Fixes

This fix also enables:
- ✅ `/users/me` endpoint works (returns current user with role)
- ✅ Admin panel link shows for admin users
- ✅ User authentication flow is consistent

## Files Modified

1. **PublicController.java** - Fixed signup to use existing Firebase UID
2. **UserController.java** - Added `/users/me` endpoint
3. **UserService.java** - Added `getUserByFirebaseUid()` method

## If Issues Persist

### "User not found" after signup
- Clear browser localStorage
- Delete user from Firebase Console
- Try signup again

### "User already exists" error
- User exists in Firebase but not MongoDB
- Option 1: Delete from Firebase, sign up again
- Option 2: Manually create MongoDB record with matching Firebase UID

### Signup works but can't see admin panel
- Follow steps in `VERIFY_ADMIN_USER.md`
- Make sure user role is set to "ADMIN" in MongoDB
