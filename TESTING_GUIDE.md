# PyHack Testing Guide

## Table of Contents

1. [Manual Testing](#manual-testing)
2. [API Testing with cURL](#api-testing-with-curl)
3. [Frontend Testing](#frontend-testing)
4. [Admin Dashboard Testing](#admin-dashboard-testing)
5. [End-to-End Testing Scenarios](#end-to-end-testing-scenarios)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

## Manual Testing

### Prerequisites

- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:8080
- At least one super admin account created
- Database seeded with challenges

## API Testing with cURL

### Authentication Endpoints

#### 1. Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "username": "testuser",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "Test1234"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the token for subsequent requests!**

#### 3. Get Current User

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Challenge Endpoints

#### 1. Get All Challenges (Public)

```bash
curl http://localhost:5000/api/challenges
```

**Expected Response:**
```json
{
  "challenges": [
    {
      "id": 1,
      "levelNumber": 1,
      "title": "Hello World",
      "description": "Welcome to Python!...",
      "task": "Write a program that prints 'Hello, World!'",
      ...
    },
    ...
  ]
}
```

#### 2. Get Single Challenge

```bash
curl http://localhost:5000/api/challenges/1
```

#### 3. Submit Code Solution

```bash
curl -X POST http://localhost:5000/api/challenges/1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "output": "Hello, World!",
    "isCorrect": true
  }'
```

**Expected Response (Correct):**
```json
{
  "message": "Solution submitted successfully",
  "progress": {
    "isCompleted": true,
    "attempts": 1,
    "pointsEarned": 10
  },
  "newAchievements": [
    {
      "name": "First Steps",
      "description": "Complete your first challenge",
      "icon": "🎯",
      "points": 10
    }
  ]
}
```

#### 4. Get User Progress

```bash
curl http://localhost:5000/api/challenges/progress/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Leaderboard Endpoints

#### 1. Global Leaderboard

```bash
curl http://localhost:5000/api/leaderboard/global?limit=10
```

#### 2. Weekly Leaderboard

```bash
curl http://localhost:5000/api/leaderboard/weekly?limit=10
```

### Achievements Endpoints

#### 1. Get All Achievements

```bash
curl http://localhost:5000/api/achievements
```

#### 2. Get User Achievements

```bash
curl http://localhost:5000/api/achievements/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### User Profile Endpoints

#### 1. Get Profile

```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2. Get User Statistics

```bash
curl http://localhost:5000/api/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "challengesCompleted": 5,
  "totalPoints": 75,
  "currentStreak": 3,
  "longestStreak": 5,
  "averageAttempts": 2.4,
  "rank": 12
}
```

### Admin Endpoints

**Note**: All admin endpoints require admin or super_admin role.

#### 1. Get All Users (Admin)

```bash
curl "http://localhost:5000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

#### 2. Get Analytics Overview (Admin)

```bash
curl http://localhost:5000/api/admin/analytics/overview \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

#### 3. Get System Settings (Admin)

```bash
curl http://localhost:5000/api/admin/settings \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## Frontend Testing

### User Registration Flow

1. Open http://localhost:8080
2. Click "Sign Up" button in header
3. Fill in registration form:
   - Email: test1@example.com
   - Username: test1
   - First Name: Test
   - Last Name: One
   - Password: Test1234
   - Confirm Password: Test1234
4. Click "Create Account"
5. **Expected**: Success toast, modal closes, user menu appears
6. **Verify**: Username displayed in top-right menu

### User Login Flow

1. Open http://localhost:8080 (in private/incognito window)
2. Click "Login" button
3. Enter credentials:
   - Identifier: test1
   - Password: Test1234
4. Click "Login"
5. **Expected**: Success toast, modal closes, user logged in
6. **Verify**: User menu appears with username

### Challenge Solving Flow

1. Ensure you're logged in
2. Challenge 1 should be loaded by default
3. Write code in editor:
   ```python
   print("Hello, World!")
   ```
4. Click "Run Code"
5. **Expected**:
   - Loading spinner appears
   - Success message: "🎉 Excellent! You completed this level!"
   - Green checkmark appears next to level title
   - Achievement notification appears (if first challenge)
6. Click "Next Level"
7. **Verify**: Level 2 loads

### Dashboard Testing

1. Click username menu → "Dashboard"
2. **Verify**:
   - Completed challenges count is correct
   - Total points displayed
   - Current streak shown
   - Recent progress list populated
3. Complete another challenge
4. Reopen dashboard
5. **Verify**: Stats updated

### Leaderboard Testing

1. Click username menu → "Leaderboard"
2. **Verify**:
   - Global tab shows users sorted by points
   - Medal indicators (🥇🥈🥉) for top 3
   - User points and challenges completed shown
3. Click "This Week" tab
4. **Verify**: Weekly leaderboard loads

### Achievements Testing

1. Click username menu → "Achievements"
2. **Verify**:
   - All 8 achievements listed
   - Unlocked achievements have green border and checkmark
   - Locked achievements grayed out with lock icon
   - Achievement icons, names, descriptions shown
3. Complete 5 challenges
4. Reopen achievements
5. **Verify**: "Python Novice" achievement unlocked

## Admin Dashboard Testing

### Access Control Testing

1. Open http://localhost:8080/admin.html (while logged in as regular user)
2. **Expected**: Redirected to index.html with "Access denied" alert
3. Log in as admin account
4. Open http://localhost:8080/admin.html
5. **Expected**: Dashboard loads successfully

### Dashboard Overview

1. **Verify** stats cards show:
   - Total Users (non-zero)
   - Active Users
   - Total Challenges (15)
   - Submissions Today

### User Management

1. Click "Users" in sidebar
2. **Verify**: User table loads with all users
3. Test search:
   - Enter username in search box
   - Click "Search"
   - **Verify**: Filtered results
4. Test role filter:
   - Select "ADMIN" from role dropdown
   - Click "Search"
   - **Verify**: Only admins shown
5. Edit user:
   - Click edit icon on a user
   - Change first name
   - Click "Save Changes"
   - **Verify**: Success message, user list updates
6. Toggle user status:
   - Click toggle icon
   - Confirm action
   - **Verify**: Status badge updates

### Challenge Management

1. Click "Challenges" in sidebar
2. **Verify**: All 15 challenges listed
3. Create new challenge:
   - Click "Create Challenge"
   - Fill in form:
     - Level Number: 16
     - Title: "Test Challenge"
     - Description: "Test description"
     - Task: "Test task"
     - Difficulty: "beginner"
     - Points: 10
     - Starter Code: "# test"
     - Expected Output: "test"
     - Solution: "print('test')"
   - Click "Create Challenge"
   - **Verify**: Success message, challenge added to list
4. Toggle challenge status:
   - Click toggle icon on a challenge
   - **Verify**: Status changes

### Analytics Testing

1. Click "Analytics" in sidebar
2. **Verify**:
   - Top performers list shows users with points
   - Users sorted by points descending
3. Complete several challenges as test users
4. Refresh analytics
5. **Verify**: Updated statistics

### Settings Testing

1. Click "Settings" in sidebar
2. **Verify**: Settings grouped by category:
   - General (SITE_NAME, SITE_DESCRIPTION)
   - Auth (ALLOW_REGISTRATION, etc.)
   - Security
   - Gamification
3. Change a setting:
   - Edit "SITE_NAME" value
   - **Verify**: Auto-save triggers
   - Refresh page
   - **Verify**: New value persists

## End-to-End Testing Scenarios

### Scenario 1: New User Journey

1. User registers account
2. Completes first challenge
3. Receives "First Steps" achievement
4. Completes 4 more challenges
5. Receives "Python Novice" achievement
6. Views dashboard to see progress
7. Checks leaderboard position
8. Logs out

**Verification Points**:
- User appears in leaderboard
- Points calculated correctly (50 points total)
- Achievements unlocked at right time
- Streak counter updates

### Scenario 2: Multi-User Competition

1. Create 3 test users
2. Each user completes different challenges
3. User A: Completes 10 challenges
4. User B: Completes 5 challenges
5. User C: Completes 15 challenges
6. Check global leaderboard

**Expected Ranking**:
1. User C (highest points)
2. User A
3. User B

### Scenario 3: Achievement Unlocking

Test each achievement:

1. **First Steps**: Complete 1 challenge ✓
2. **Python Novice**: Complete 5 challenges ✓
3. **Python Apprentice**: Complete 10 challenges ✓
4. **Python Master**: Complete all 15 challenges ✓
5. **Speed Demon**: Complete challenge in <2 minutes (check timeSpent in DB)
6. **Perfectionist**: Complete challenge on first attempt (attempts = 1)
7. **Week Warrior**: Maintain 7-day streak (simulate with DB)
8. **Dedicated Learner**: Maintain 30-day streak (simulate with DB)

### Scenario 4: Admin Workflow

1. Admin logs in
2. Views dashboard stats
3. Searches for inactive users
4. Toggles user status to inactive
5. Creates new challenge (Level 16)
6. Toggles challenge status to active
7. User completes new challenge
8. Admin checks analytics to see completion
9. Admin views user's progress

## Performance Testing

### Load Testing

Use Apache Bench (ab) or similar tool:

```bash
# Test login endpoint
ab -n 100 -c 10 -T application/json -p login.json \
  http://localhost:5000/api/auth/login

# login.json:
# {"identifier":"testuser","password":"Test1234"}
```

**Metrics to monitor**:
- Requests per second
- Average response time
- Failed requests (should be 0)

### Database Query Performance

```bash
# Time challenge loading
time curl http://localhost:5000/api/challenges

# Should be < 100ms
```

### Frontend Performance

1. Open Chrome DevTools
2. Go to Performance tab
3. Record page load
4. **Check**:
   - First Contentful Paint < 1s
   - Time to Interactive < 2s
   - No layout shifts

## Security Testing

### Authentication Security

#### 1. Test Invalid Credentials

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "wrongpassword"
  }'
```

**Expected**: 401 Unauthorized

#### 2. Test Missing Token

```bash
curl http://localhost:5000/api/users/profile
```

**Expected**: 401 Unauthorized

#### 3. Test Invalid Token

```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer invalid_token"
```

**Expected**: 403 Forbidden

#### 4. Test Expired Token

1. Generate token with short expiry (modify JWT_EXPIRES_IN to "1s")
2. Wait 2 seconds
3. Use token
4. **Expected**: 403 Forbidden "Token expired"

### Authorization Security

#### 1. Test Regular User Accessing Admin Endpoint

```bash
# Login as regular user, get token
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer REGULAR_USER_TOKEN"
```

**Expected**: 403 Forbidden "Admin access required"

#### 2. Test Admin Accessing Super Admin Endpoint

```bash
# Login as admin (not super admin)
curl -X DELETE http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 403 Forbidden "Super Admin access required"

### Input Validation

#### 1. Test XSS Prevention

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "<script>alert(\"xss\")</script>@example.com",
    "username": "test<script>",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected**: 400 Bad Request (invalid input)

#### 2. Test SQL Injection

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin\" OR \"1\"=\"1",
    "password": "anything"
  }'
```

**Expected**: 401 Unauthorized (no SQL injection)

#### 3. Test Rate Limiting

Run 10 login attempts quickly:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"wrong"}' &
done
```

**Expected**: After 5 attempts, receive "Too many requests" error

### CORS Testing

```bash
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:5000/api/auth/login
```

**Expected**: CORS headers only allow configured origins

## Test Checklist

### Authentication ✓
- [ ] User registration works
- [ ] User login works
- [ ] Logout works
- [ ] Email verification (if enabled)
- [ ] Password reset (if enabled)
- [ ] Token refresh works
- [ ] Invalid credentials rejected
- [ ] Duplicate username/email rejected

### Challenges ✓
- [ ] All 15 challenges load
- [ ] Code submission works
- [ ] Correct solutions accepted
- [ ] Incorrect solutions rejected
- [ ] Progress tracked correctly
- [ ] Points awarded on first completion
- [ ] Challenges locked/unlocked properly

### Achievements ✓
- [ ] First Steps unlocks on first challenge
- [ ] Python Novice unlocks at 5 challenges
- [ ] Python Apprentice unlocks at 10 challenges
- [ ] Python Master unlocks at 15 challenges
- [ ] All achievements display correctly

### Leaderboard ✓
- [ ] Global leaderboard works
- [ ] Weekly leaderboard works
- [ ] Users ranked correctly
- [ ] Points displayed accurately

### Admin Dashboard ✓
- [ ] Access control enforced
- [ ] User management works
- [ ] Challenge management works
- [ ] Analytics load correctly
- [ ] Settings can be updated
- [ ] Only admins can access

### Security ✓
- [ ] Password hashing works
- [ ] JWT authentication works
- [ ] Authorization enforced
- [ ] XSS prevented
- [ ] SQL injection prevented
- [ ] Rate limiting works
- [ ] CORS configured correctly

### Performance ✓
- [ ] Page loads < 2 seconds
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks

---

**Testing complete!** Report any issues found to the development team.
