# Sign-In Hanging Issue - Root Cause Analysis

## 🔴 Problem Summary

When running locally and attempting to sign in as an artist, the page shows "Connexion..." (loading state) indefinitely and never completes.

---

## 🔍 Root Causes Identified

### **Issue #1: DATABASE_URL Host Mismatch in .env** ⚠️ CRITICAL

**Location:** `.env` line 9  
**Current (Wrong):**

```bash
DATABASE_URL=postgres://dadahiphop:change-me-to-a-long-random-password@localhost:5432/dadahiphop
```

**Problem:**

- When running with `docker compose up`, the app container tries to connect to `localhost:5432`
- But the PostgreSQL database is running in a **separate container** named `db`
- `localhost` inside the app container refers to the app container itself, NOT the host machine
- The connection times out, causing all API requests to hang

**Why it works in production:**

- In production/cloud, the DATABASE_URL likely points to a proper external host

**Solution:**
Change line 9 to:

```bash
DATABASE_URL=postgres://dadahiphop:change-me-to-a-long-random-password@db:5432/dadahiphop
```

The hostname should be `db` (the Docker Compose service name), not `localhost`.

---

### **Issue #2: Architecture Mismatch - Backend Auth Not Wired Up** 🟡 MEDIUM

**Location:** `src/integrations/supabase/client.ts`  
**Good News:** The project actually has a CUSTOM authentication backend!

Looking at the code:

- ✅ `src/server/api/routes/auth.server.ts` - Has sign-in, sign-up, sign-out endpoints
- ✅ `src/server/auth/` - Has sessions, passwords, accounts management
- ✅ `src/lib/auth.tsx` - Has AuthProvider and useAuth hook

**But:** The frontend IS correctly using it!

`src/integrations/supabase/client.ts` is a **compatibility layer** that:

1. Mimics the Supabase API
2. Actually calls your custom backend at `/api/auth/*`
3. NOT using real Supabase (excellent for self-hosted)

So the architecture is correct. The issue is just the database connection.

---

### **Issue #3: Missing API Request Error Logging** 🟡 MEDIUM

**Location:** `src/lib/api/http.ts` (not shown but referenced)  
**Problem:** When the database connection fails, the API request likely fails silently or with a generic error

The sign-in page doesn't show error details, just stays in loading state forever.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Update `.env` file

Replace line 9:

```bash
# OLD (WRONG):
DATABASE_URL=postgres://dadahiphop:change-me-to-a-long-random-password@localhost:5432/dadahiphop

# NEW (CORRECT):
DATABASE_URL=postgres://dadahiphop:change-me-to-a-long-random-password@db:5432/dadahiphop
```

### Step 2: Verify other environment variables

Make sure `.env` has these set (don't use defaults):

```bash
POSTGRES_PASSWORD=<generate-a-real-one>          # Not "change-me-..."
SESSION_SECRET=<generate-with-openssl>           # Run: openssl rand -hex 32
ADMIN_PASSWORD=<real-password>                    # Not "change-me-before-going-live"
```

### Step 3: Restart Docker containers

```bash
docker compose down
docker compose up -d --build
```

### Step 4: Test

- Open `http://localhost` (or `http://localhost:3000` depending on nginx config)
- Try to sign in with test account
- Sign-in should complete instead of hanging

---

## 🧪 Verification Checklist

After making the fix, verify these:

- [ ] `docker compose logs app` shows no connection errors to database
- [ ] `docker compose logs db` shows the database is ready
- [ ] Sign-in API call completes (check Network tab in DevTools)
- [ ] Sign-in page redirects to `/artist` after successful login
- [ ] Error messages appear if credentials are wrong (not indefinite loading)

---

## 📊 What Happens During Sign-In

### Current Flow (Broken):

```
1. User enters email/password, clicks "Se connecter"
2. Frontend calls supabase.auth.signInWithPassword()
3. This calls apiRequest("/api/auth/sign-in", {...})
4. Frontend tries to reach the app server at /api/auth/sign-in
5. Backend at src/server/api/routes/auth.server.ts receives request
6. Backend tries to connect to database at localhost:5432
7. ❌ Connection times out (can't reach localhost from inside container)
8. ❌ API request hangs or returns timeout error
9. ❌ Frontend stays in loading state forever
```

### After Fix (Working):

```
1. User enters email/password, clicks "Se connecter"
2. Frontend calls supabase.auth.signInWithPassword()
3. This calls apiRequest("/api/auth/sign-in", {...})
4. Backend receives request
5. Backend connects to database at db:5432 ✅ (correct hostname)
6. ✅ Database connection succeeds
7. ✅ Password verified
8. ✅ Session created
9. ✅ Response sent to frontend
10. ✅ Frontend redirects to /artist page
```

---

## 🛠️ Additional Improvements (Not Critical)

### Add API Request Timeout Logging

**File:** `src/lib/api/http.ts` (create if doesn't exist)

Add timeout handling:

```typescript
// Should log detailed errors instead of silently failing
const apiRequest = async (url: string, options = {}) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error(`API Request Failed:`, error.message);
    throw error;
  }
};
```

### Add Loading State to Sign-In

The sign-in page already shows "Connexion..." but doesn't show errors. Add:

```tsx
// In src/routes/sign-in.tsx, if no error but loading:
{
  loading && (
    <p className="text-sm text-yellow-200">
      Connexion en cours... Vérifiez votre connexion internet.
    </p>
  );
}
```

---

## ❓ How to Verify the Fix Works

### Test 1: Check database connectivity

```bash
# Inside app container
docker compose exec app wget -v http://127.0.0.1:3000/api/auth/session
```

Should return 200 with auth session info.

### Test 2: Check from browser DevTools

1. Open `http://localhost` in browser
2. Open DevTools → Network tab
3. Click "Se connecter"
4. Look for `/api/auth/sign-in` request
5. Check:
   - Status should be 200 (success) or 401 (bad credentials)
   - NOT a timeout or connection error
   - Response should have JSON: `{ data: { user, session }, error: null }`

### Test 3: Full sign-in flow

- Email: `admin@dadahiphop.com`
- Password: Value from `.env` ADMIN_PASSWORD
- Should redirect to `/artist` dashboard

---

## 📝 Summary

| Issue                   | Severity    | Fix                                                  | Time   |
| ----------------------- | ----------- | ---------------------------------------------------- | ------ |
| DATABASE_URL host wrong | 🔴 CRITICAL | Change `localhost` to `db` in .env                   | 1 min  |
| Missing error logging   | 🟡 MEDIUM   | Add timeout/error handling to apiRequest             | 10 min |
| Env var validation      | 🟡 MEDIUM   | Add startup validation in `src/server/env.server.ts` | 15 min |

**Estimated total fix time: 5-30 minutes**

The core issue is simply the DATABASE_URL. Fix that line and restart Docker, and sign-in should work.
