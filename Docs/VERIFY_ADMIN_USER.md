# Verify and Fix Admin User

## Problem
The admin panel link is not showing in the navbar even though you have an admin user.

## Root Cause
The backend was missing a `/users/me` endpoint that the frontend needs to check the user's role.

## Solution Applied
Added `GET /api/v1/users/me` endpoint that returns the current logged-in user with their role.

## Steps to Fix

### 1. Restart the Backend
The backend needs to be restarted to load the new endpoint:

```bash
cd c:\Users\shubh\LMS\lms-backend
mvn spring-boot:run
```

Or if already running, stop it and restart.

### 2. Verify Admin User in MongoDB

**Option A: Using MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database
3. Go to the `users` collection
4. Find your user document
5. Verify the `role` field shows exactly: `ADMIN` (not "ADMIN" as string)

**Option B: Using Mongo Shell**
```javascript
// Connect to your database
use lcm

// Find your user
db.users.findOne({email: "shubhamsalaskar03@gmail.com"})

// If role is wrong or missing, update it:
db.users.updateOne(
  {email: "shubhamsalaskar03@gmail.com"},
  {$set: {role: "ADMIN"}}
)

// Verify the update
db.users.findOne({email: "shubhamsalaskar03@gmail.com"})
```

### 3. Clear Browser Cache
After backend restart:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear localStorage
4. Refresh the page
5. Login again

### 4. Test the Endpoint

**Using Browser Console:**
```javascript
// After logging in, run this in browser console:
const token = localStorage.getItem('token');
fetch('http://localhost:8080/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log(data));

// Should return: { status: "success", data: { role: "ADMIN", ... } }
```

**Using Postman:**
1. GET `http://localhost:8080/api/v1/users/me`
2. Headers: `Authorization: Bearer YOUR_FIREBASE_TOKEN`
3. Should return user with `role: "ADMIN"`

### 5. Verify Frontend
After backend restart and clearing cache:
1. Login to the application
2. The navbar should show "Admin Panel" link (purple colored)
3. Click it to access `/admin` dashboard
4. You should see statistics and admin features

## Troubleshooting

### Issue: Still not seeing "Admin Panel" link

**Check 1: Backend logs**
```
# Look for this in backend console:
GET /api/v1/users/me - Should return 200 OK
```

**Check 2: Browser console**
```javascript
// Run this to check what the frontend sees:
const checkAdmin = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:8080/api/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log('User role:', data.data.role);
  console.log('Is ADMIN?', data.data.role === 'ADMIN');
};
checkAdmin();
```

**Check 3: Network tab**
1. Open DevTools > Network
2. Refresh the page
3. Look for request to `/users/me`
4. Check the response - should have `role: "ADMIN"`

### Issue: 401 Unauthorized on /users/me

**Solution:**
- Logout and login again to get a fresh Firebase token
- The token might be expired

### Issue: Role shows "STUDENT" instead of "ADMIN"

**Solution:**
Update directly in MongoDB:
```javascript
db.users.updateOne(
  {email: "YOUR_EMAIL"},
  {$set: {role: "ADMIN"}}
)
```

Then restart backend and clear browser cache.

## Expected Behavior After Fix

1. ✅ Backend starts successfully
2. ✅ GET /users/me returns current user with role
3. ✅ Frontend calls /users/me on page load
4. ✅ useAdmin hook sets isAdmin = true
5. ✅ Navbar shows purple "Admin Panel" link
6. ✅ Clicking link navigates to /admin
7. ✅ Admin dashboard shows statistics
8. ✅ All admin pages are accessible
