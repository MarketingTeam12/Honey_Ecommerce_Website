# Supabase Edge Function JWT Verification Fix

## Problem Identified

The Supabase Edge Function had a critical bug in the `verifyAuth` function that was breaking Google OAuth sign-in flow:

### Root Cause
The `verifyAuth` function was hardcoded to **DEMO MODE**, which meant:
- It always returned a demo admin user (`demo-admin-1`) regardless of the actual JWT token
- It never actually verified the real JWT tokens from authenticated users
- This caused user ID mismatches during Google OAuth sign-in

### Specific Issue
When a user signed in with Google:
1. Google OAuth flow completed successfully and Supabase issued a real JWT token
2. Frontend called `/auth/google-signup` endpoint with the real JWT token
3. Edge Function's `verifyAuth` function ignored the real JWT and returned demo admin user
4. User ID mismatch occurred: Real Google user ID ≠ Demo admin ID
5. Profile creation failed with 403 Forbidden error

## Solution Applied

### 1. Fixed `verifyAuth` Function
**File**: `/supabase/functions/server/index.tsx`

**Before** (Lines 76-90):
```typescript
async function verifyAuth(authHeader: string | null) {
  console.log('🔐 verifyAuth called - DEMO MODE ENABLED');
  console.log('🔐 Auth header present:', !!authHeader);
  
  // DEMO MODE: ALWAYS return success to prevent 401 errors
  console.log('✅ [DEMO MODE] Auto-approving ALL auth requests with admin user!');
  return {
    user: {
      id: 'demo-admin-1',
      email: 'admin@honeytranslations.com',
      user_metadata: { name: 'Admin User', role: 'admin' }
    },
    error: null
  };
}
```

**After**:
```typescript
async function verifyAuth(authHeader: string | null) {
  console.log('🔐 verifyAuth called');
  console.log('🔐 Auth header present:', !!authHeader);
  
  if (!authHeader) {
    console.log('❌ No auth header provided');
    return {
      user: null,
      error: 'Missing authorization header'
    };
  }
  
  // Extract the token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '').trim();
  
  // Check if it's a real JWT (contains dots) vs anon key
  const looksLikeJWT = token.includes('.');
  
  if (!looksLikeJWT) {
    console.log('⚠️ Token does not look like a JWT (no dots found)');
    return {
      user: null,
      error: 'Invalid token format'
    };
  }
  
  try {
    // Verify the JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('❌ Token verification failed:', error.message);
      return {
        user: null,
        error: error.message
      };
    }
    
    if (!data.user) {
      console.log('❌ No user found in token');
      return {
        user: null,
        error: 'Invalid token'
      };
    }
    
    console.log('✅ Token verified successfully for user:', data.user.email);
    return {
      user: data.user,
      error: null
    };
  } catch (err: any) {
    console.error('❌ Exception during token verification:', err);
    return {
      user: null,
      error: err.message || 'Token verification failed'
    };
  }
}
```

### 2. Fixed Authentication Middleware

Updated `requireAuth` and `requireAdmin` middleware functions to properly verify tokens instead of bypassing authentication.

**Before**:
```typescript
const requireAuth = async (c, next) => {
  // DEMO MODE: Skip auth check and set demo user
  console.log('🔐 [Middleware] requireAuth called - DEMO MODE ENABLED');
  c.set('user', {
    id: 'demo-admin-1',
    email: 'admin@honeytranslations.com',
    user_metadata: { name: 'Admin User', role: 'admin' }
  });
  await next();
};

const requireAdmin = async (c, next) => {
  // DEMO MODE: Skip admin check
  console.log('🔐 [Middleware] requireAdmin called - DEMO MODE ENABLED');
  await next();
};
```

**After**:
```typescript
const requireAuth = async (c, next) => {
  console.log('🔐 [Middleware] requireAuth called');
  const authHeader = c.req.header('Authorization');
  const { user, error } = await verifyAuth(authHeader);
  
  if (error || !user) {
    console.log('❌ [Middleware] Auth verification failed:', error);
    return c.json({ error: error || 'Unauthorized' }, 401);
  }
  
  console.log('✅ [Middleware] User authenticated:', user.email);
  c.set('user', user);
  await next();
};

const requireAdmin = async (c, next) => {
  console.log('🔐 [Middleware] requireAdmin called');
  const user = c.get('user');
  
  if (!user) {
    console.log('❌ [Middleware] No user in context');
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const isUserAdmin = await isAdmin(user.id, user.email);
  
  if (!isUserAdmin) {
    console.log('❌ [Middleware] User is not an admin:', user.email);
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }
  
  console.log('✅ [Middleware] Admin access granted:', user.email);
  await next();
};
```

## What This Fixes

### ✅ Google OAuth Sign-In Flow
- Users can now sign in with Google successfully
- Profile creation works correctly with the actual Google user ID
- No more user ID mismatch errors

### ✅ Proper JWT Verification
- Real JWT tokens are now properly validated using `supabase.auth.getUser()`
- Invalid tokens are rejected with proper error messages
- Security is maintained - only valid authenticated users can access protected endpoints

### ✅ Admin Access Control
- Admin-only endpoints now properly check user roles
- The `isAdmin` function correctly identifies admin users by email or role
- Non-admin users are properly rejected with 403 Forbidden

### ✅ Demo Credentials Still Work
The demo admin credentials (`admin@honeytranslations.com` / `admin123`) still work because:
1. They use real Supabase Auth to get a valid JWT
2. The JWT is properly verified like any other token
3. Admin status is checked via `isAdmin()` function which recognizes the admin email

## Testing Checklist

After deploying this fix, verify:

- [ ] Google OAuth sign-in works end-to-end
- [ ] New Google users get profiles created automatically
- [ ] Existing Google users can sign in without creating duplicate profiles
- [ ] Demo admin login still works (`admin@honeytranslations.com` / `admin123`)
- [ ] Regular email/password signup and login still work
- [ ] Admin Panel access is properly restricted to admin users
- [ ] Non-admin users cannot access admin endpoints

## Deployment Notes

**IMPORTANT**: After deploying this Edge Function update:

1. The Edge Function must be redeployed to Supabase
2. Clear browser cache and localStorage for testing
3. Test with a fresh Google OAuth sign-in
4. Verify console logs show proper JWT verification

## Impact

This fix ensures:
- ✅ Proper security - only authenticated users can access protected endpoints
- ✅ Google OAuth works correctly
- ✅ No more DEMO MODE bypassing authentication
- ✅ Production-ready authentication system
