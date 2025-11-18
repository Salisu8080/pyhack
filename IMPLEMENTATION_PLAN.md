# PyHack - User Authentication & Admin Dashboard Implementation Plan

## Current Architecture Analysis

**Current State:**
- Single HTML file (index.html) containing all code
- Client-side only (no backend)
- Uses Pyodide for Python execution in browser
- LocalStorage for progress tracking
- No user authentication or accounts
- 15 hardcoded challenges

**Required Changes:**
- Add backend server (Node.js/Express or Python/Flask)
- Add database (PostgreSQL/MySQL or MongoDB)
- Implement user authentication (JWT-based)
- Create user management system
- Create admin dashboard
- Migrate from localStorage to server-side storage

---

## Technology Stack Recommendations

### Backend Options

**Option 1: Node.js Stack (Recommended)**
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **File Upload**: Multer (for user avatars)
- **Validation**: Joi or Zod
- **Email**: Nodemailer

**Option 2: Python Stack**
- **Runtime**: Python 3.10+
- **Framework**: Flask or FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: Flask-JWT-Extended or FastAPI JWT
- **Validation**: Pydantic (FastAPI) or Marshmallow (Flask)
- **Email**: Flask-Mail or python-email

### Frontend Enhancements
- Keep current structure but add API integration
- Add state management (localStorage + API sync)
- Add authentication UI components
- Add dashboard components

### Database Schema (PostgreSQL)
```sql
-- Users table
-- Challenges table
-- User Progress table
-- User Sessions table
-- Admin Audit Logs table
-- System Settings table
```

---

## PHASE 1: Backend Foundation & User Authentication

### Phase 1A: Project Setup & Database Design

**Implementation Prompt:**

```
Create the backend foundation for PyHack application:

1. PROJECT STRUCTURE:
   - Initialize a new Node.js project with Express.js
   - Create folder structure:
     ```
     pyhack-backend/
     ├── src/
     │   ├── config/
     │   │   ├── database.js
     │   │   └── jwt.js
     │   ├── models/
     │   │   ├── User.js
     │   │   ├── Challenge.js
     │   │   ├── UserProgress.js
     │   │   └── Session.js
     │   ├── routes/
     │   │   ├── auth.js
     │   │   ├── users.js
     │   │   └── challenges.js
     │   ├── middleware/
     │   │   ├── auth.js
     │   │   ├── validation.js
     │   │   └── errorHandler.js
     │   ├── controllers/
     │   │   ├── authController.js
     │   │   ├── userController.js
     │   │   └── challengeController.js
     │   └── utils/
     │       ├── emailService.js
     │       └── validators.js
     ├── prisma/
     │   └── schema.prisma
     ├── .env.example
     ├── .gitignore
     ├── package.json
     └── server.js
     ```

2. DATABASE SCHEMA (Prisma):
   Create the following models in prisma/schema.prisma:

   ```prisma
   model User {
     id                String         @id @default(uuid())
     email             String         @unique
     username          String         @unique
     password          String         // Hashed with bcrypt
     firstName         String?
     lastName          String?
     avatar            String?
     role              UserRole       @default(USER)
     isActive          Boolean        @default(true)
     emailVerified     Boolean        @default(false)
     verificationToken String?
     resetToken        String?
     resetTokenExpiry  DateTime?
     lastLogin         DateTime?
     createdAt         DateTime       @default(now())
     updatedAt         DateTime       @updatedAt

     progress          UserProgress[]
     sessions          Session[]
   }

   enum UserRole {
     USER
     ADMIN
     SUPER_ADMIN
   }

   model Challenge {
     id            String         @id @default(uuid())
     levelNumber   Int            @unique
     title         String
     description   String         @db.Text
     task          String         @db.Text
     starterCode   String         @db.Text
     expectedOutput String        @db.Text
     hint          String?        @db.Text
     solution      String         @db.Text
     testType      String         @default("exact")
     difficulty    String         @default("beginner")
     points        Int            @default(10)
     isActive      Boolean        @default(true)
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt

     progress      UserProgress[]
   }

   model UserProgress {
     id            String    @id @default(uuid())
     userId        String
     challengeId   String
     status        String    // "not_started", "in_progress", "completed"
     attempts      Int       @default(0)
     lastCode      String?   @db.Text
     completedAt   DateTime?
     timeSpent     Int       @default(0) // in seconds
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt

     user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     challenge     Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

     @@unique([userId, challengeId])
   }

   model Session {
     id        String   @id @default(uuid())
     userId    String
     token     String   @unique
     userAgent String?
     ipAddress String?
     expiresAt DateTime
     createdAt DateTime @default(now())

     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model AuditLog {
     id        String   @id @default(uuid())
     userId    String?
     action    String
     entity    String
     entityId  String?
     details   Json?
     ipAddress String?
     createdAt DateTime @default(now())
   }

   model SystemSetting {
     id        String   @id @default(uuid())
     key       String   @unique
     value     String   @db.Text
     category  String
     updatedAt DateTime @updatedAt
   }
   ```

3. DEPENDENCIES:
   Install required packages:
   ```json
   {
     "dependencies": {
       "express": "^4.18.2",
       "prisma": "^5.0.0",
       "@prisma/client": "^5.0.0",
       "bcrypt": "^5.1.0",
       "jsonwebtoken": "^9.0.0",
       "dotenv": "^16.0.3",
       "cors": "^2.8.5",
       "helmet": "^7.0.0",
       "express-rate-limit": "^6.7.0",
       "joi": "^17.9.2",
       "nodemailer": "^6.9.3",
       "morgan": "^1.10.0"
     },
     "devDependencies": {
       "nodemon": "^2.0.22"
     }
   }
   ```

4. ENVIRONMENT VARIABLES (.env.example):
   ```env
   NODE_ENV=development
   PORT=5000

   DATABASE_URL="postgresql://user:password@localhost:5432/pyhack"

   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   FRONTEND_URL=http://localhost:3000
   ```

5. INITIAL DATABASE SETUP:
   - Create PostgreSQL database named 'pyhack'
   - Run: npx prisma migrate dev --name init
   - Run: npx prisma generate
   - Seed challenges from existing index.html data

Acceptance Criteria:
- ✓ Project structure created with all folders
- ✓ Prisma schema defined with all models
- ✓ Database migrations run successfully
- ✓ Dependencies installed
- ✓ Environment variables configured
- ✓ Database connection established
```

---

### Phase 1B: User Registration & Login API

**Implementation Prompt:**

```
Implement user authentication endpoints (registration, login, logout):

1. AUTHENTICATION CONTROLLER (src/controllers/authController.js):

   Implement the following functions:

   **register()**
   - Validate input: email, username, password (min 8 chars), firstName, lastName
   - Check if email/username already exists
   - Hash password with bcrypt (salt rounds: 10)
   - Generate email verification token
   - Create user in database
   - Send verification email
   - Return success message (don't auto-login)

   **login()**
   - Validate input: email/username and password
   - Find user by email or username
   - Check if user is active
   - Verify password with bcrypt
   - Check if email is verified (optional: allow/deny unverified)
   - Generate JWT token with payload: { userId, email, role }
   - Create session record in database
   - Update lastLogin timestamp
   - Return: { token, user: { id, email, username, role } }

   **logout()**
   - Extract JWT from Authorization header
   - Delete session from database
   - Return success message

   **verifyEmail()**
   - Accept verification token from URL parameter
   - Find user by verificationToken
   - Set emailVerified = true, verificationToken = null
   - Return success message

   **forgotPassword()**
   - Accept email
   - Generate reset token (UUID) and expiry (1 hour)
   - Save resetToken and resetTokenExpiry to user
   - Send password reset email with token
   - Return success message

   **resetPassword()**
   - Accept token and new password
   - Find user by resetToken where resetTokenExpiry > now
   - Hash new password
   - Update password, clear resetToken and resetTokenExpiry
   - Return success message

2. AUTHENTICATION ROUTES (src/routes/auth.js):
   ```javascript
   POST   /api/auth/register        - Register new user
   POST   /api/auth/login           - Login user
   POST   /api/auth/logout          - Logout user (requires auth)
   GET    /api/auth/verify/:token   - Verify email
   POST   /api/auth/forgot-password - Request password reset
   POST   /api/auth/reset-password  - Reset password with token
   GET    /api/auth/me              - Get current user (requires auth)
   ```

3. MIDDLEWARE (src/middleware/auth.js):

   **authenticateToken()**
   - Extract token from Authorization header (Bearer token)
   - Verify JWT token
   - Check if session exists and not expired
   - Attach user to req.user
   - Call next() or return 401 Unauthorized

   **requireRole(roles)**
   - Check if req.user.role is in allowed roles array
   - Call next() or return 403 Forbidden

4. VALIDATION MIDDLEWARE (src/middleware/validation.js):

   Use Joi to create validation schemas:
   - registerSchema: email, username (3-30 chars, alphanumeric), password (min 8)
   - loginSchema: identifier (email or username), password
   - forgotPasswordSchema: email
   - resetPasswordSchema: token, password

5. ERROR HANDLING (src/middleware/errorHandler.js):
   - Global error handler middleware
   - Log errors appropriately
   - Return JSON error responses with proper status codes
   - Don't expose sensitive error details in production

6. EMAIL SERVICE (src/utils/emailService.js):

   Implement functions:
   - sendVerificationEmail(email, token)
   - sendPasswordResetEmail(email, token)
   - sendWelcomeEmail(email, username)

   Use Nodemailer with SMTP configuration from env variables.

7. SECURITY FEATURES:
   - Implement rate limiting (express-rate-limit):
     * Login: 5 attempts per 15 minutes
     * Register: 3 attempts per hour
     * Password reset: 3 attempts per hour
   - Use helmet for security headers
   - Enable CORS with proper configuration
   - Sanitize all inputs

Acceptance Criteria:
- ✓ All authentication endpoints working
- ✓ Passwords properly hashed
- ✓ JWT tokens generated and validated
- ✓ Email verification flow working
- ✓ Password reset flow working
- ✓ Rate limiting implemented
- ✓ Input validation working
- ✓ Error handling consistent
- ✓ Security best practices followed
```

---

### Phase 1C: User Profile Management API

**Implementation Prompt:**

```
Implement user profile management endpoints:

1. USER CONTROLLER (src/controllers/userController.js):

   Implement the following functions:

   **getProfile()**
   - Get current user from req.user
   - Fetch full user details from database (exclude password)
   - Include statistics: totalChallengesCompleted, currentStreak, totalPoints
   - Return user profile

   **updateProfile()**
   - Allow updates: firstName, lastName, username (if available)
   - Validate username uniqueness
   - Update user in database
   - Return updated profile

   **changePassword()**
   - Accept: currentPassword, newPassword
   - Verify currentPassword
   - Hash and save newPassword
   - Invalidate all existing sessions (logout all devices)
   - Return success message

   **uploadAvatar()**
   - Accept image file upload (multer middleware)
   - Validate: file type (jpg, png), size (<5MB)
   - Save to /uploads/avatars/ with unique filename
   - Update user avatar field with file path
   - Delete old avatar if exists
   - Return new avatar URL

   **deleteAccount()**
   - Verify password
   - Soft delete: set isActive = false
   - Or hard delete: delete user record (cascades to progress, sessions)
   - Return success message

   **getStats()**
   - Calculate user statistics:
     * Total challenges completed
     * Current streak
     * Total points earned
     * Time spent learning
     * Completion rate
     * Recent activity (last 7 days)
   - Return statistics object

2. USER ROUTES (src/routes/users.js):
   ```javascript
   GET    /api/users/profile          - Get current user profile
   PUT    /api/users/profile          - Update profile
   POST   /api/users/change-password  - Change password
   POST   /api/users/avatar           - Upload avatar
   DELETE /api/users/account          - Delete account
   GET    /api/users/stats            - Get user statistics
   ```

   All routes require authentication middleware.

3. FILE UPLOAD SETUP:
   - Configure multer for avatar uploads
   - Create /uploads/avatars/ directory
   - Serve static files with express.static()
   - Implement file size and type validation

Acceptance Criteria:
- ✓ User can view their profile
- ✓ User can update profile information
- ✓ User can change password
- ✓ User can upload avatar image
- ✓ User can delete account
- ✓ Statistics calculated correctly
- ✓ File uploads working and validated
```

---

## PHASE 2: Challenge Management & Progress Tracking

### Phase 2A: Challenge API & Progress Tracking

**Implementation Prompt:**

```
Implement challenge management and user progress tracking:

1. CHALLENGE CONTROLLER (src/controllers/challengeController.js):

   **getAllChallenges()**
   - Fetch all active challenges ordered by levelNumber
   - For authenticated users: include progress status for each challenge
   - For guests: return challenges without progress
   - Return array of challenges with progress

   **getChallengeById()**
   - Fetch challenge by ID or levelNumber
   - Include user progress if authenticated
   - Don't expose solution (only for admins)
   - Return challenge details

   **submitCode()**
   - Accept: challengeId, code
   - Validate code is not empty
   - Execute code using Pyodide (client-side) - validation only server-side
   - Compare output with expectedOutput based on testType
   - Update or create UserProgress:
     * Increment attempts
     * Save lastCode
     * If correct: set status = 'completed', completedAt = now
     * Calculate timeSpent
   - Award points if first completion
   - Update user's total points
   - Return: { success: boolean, output, expected, message }

   **getProgress()**
   - Fetch all UserProgress for current user
   - Include challenge details
   - Calculate overall completion percentage
   - Return progress data

   **resetProgress(challengeId)**
   - Reset specific challenge progress for user
   - Set status = 'not_started', attempts = 0
   - Return success message

2. CHALLENGE ROUTES (src/routes/challenges.js):
   ```javascript
   GET    /api/challenges              - Get all challenges
   GET    /api/challenges/:id          - Get single challenge
   POST   /api/challenges/:id/submit   - Submit code for challenge
   GET    /api/challenges/progress     - Get user progress (auth required)
   DELETE /api/challenges/:id/progress - Reset challenge progress
   ```

3. PROGRESS TRACKING:
   - Track attempts per challenge
   - Track time spent (calculate from createdAt to completedAt)
   - Store last submitted code (for resume functionality)
   - Calculate streak (consecutive days with completions)

4. VALIDATION:
   Implement different test types:
   - exact: Exact string match (trim whitespace)
   - flexible: Custom validation logic
   - pattern: Regex pattern matching

   Mirror the validation logic from current index.html.

5. DATA MIGRATION:
   Create a seed script to migrate the 15 challenges from index.html to database:
   - Extract challenges array from index.html
   - Insert into Challenge table
   - Preserve all fields: title, description, task, starterCode, etc.

Acceptance Criteria:
- ✓ All 15 challenges migrated to database
- ✓ Challenges API endpoints working
- ✓ Code submission and validation working
- ✓ Progress tracking accurate
- ✓ Points awarded correctly
- ✓ Test types (exact, flexible, pattern) working
```

---

### Phase 2B: Leaderboard & Achievements

**Implementation Prompt:**

```
Implement leaderboard and achievement system:

1. DATABASE ADDITIONS (Update Prisma schema):
   ```prisma
   model Achievement {
     id          String   @id @default(uuid())
     name        String
     description String
     icon        String
     points      Int
     condition   String   // JSON condition
     createdAt   DateTime @default(now())

     userAchievements UserAchievement[]
   }

   model UserAchievement {
     id            String      @id @default(uuid())
     userId        String
     achievementId String
     unlockedAt    DateTime    @default(now())

     user          User        @relation(fields: [userId], references: [id])
     achievement   Achievement @relation(fields: [achievementId], references: [id])

     @@unique([userId, achievementId])
   }

   model User {
     // Add to existing User model
     totalPoints   Int              @default(0)
     currentStreak Int              @default(0)
     longestStreak Int              @default(0)
     achievements  UserAchievement[]
   }
   ```

2. LEADERBOARD CONTROLLER:

   **getGlobalLeaderboard()**
   - Fetch top 100 users ordered by totalPoints
   - Include: username, avatar, totalPoints, challengesCompleted
   - Add rank numbers
   - Include current user's rank if not in top 100
   - Return leaderboard array

   **getWeeklyLeaderboard()**
   - Fetch users with most points earned this week
   - Filter completions from last 7 days
   - Return weekly rankings

3. ACHIEVEMENT SYSTEM:

   Predefined achievements:
   - "First Steps" - Complete first challenge
   - "Python Novice" - Complete 5 challenges
   - "Python Apprentice" - Complete 10 challenges
   - "Python Master" - Complete all 15 challenges
   - "Speed Demon" - Complete a challenge in under 2 minutes
   - "Perfectionist" - Complete a challenge on first attempt
   - "Week Warrior" - 7 day streak
   - "Dedicated Learner" - 30 day streak

   **checkAchievements(userId)**
   - Check user's progress against all achievement conditions
   - Award new achievements
   - Return newly unlocked achievements

   **getUserAchievements(userId)**
   - Fetch all achievements for user
   - Return unlocked achievements with timestamps

4. ROUTES:
   ```javascript
   GET /api/leaderboard/global  - Global leaderboard
   GET /api/leaderboard/weekly  - Weekly leaderboard
   GET /api/achievements        - All available achievements
   GET /api/achievements/user   - Current user's achievements
   ```

Acceptance Criteria:
- ✓ Leaderboard showing top users
- ✓ Weekly leaderboard working
- ✓ Achievement system implemented
- ✓ Achievements automatically awarded
- ✓ User rankings calculated correctly
```

---

## PHASE 3: Frontend Integration

### Phase 3A: Frontend Authentication UI

**Implementation Prompt:**

```
Update the frontend (index.html) to integrate with authentication API:

1. CREATE AUTHENTICATION PAGES:

   Add HTML sections (hidden by default):

   **Login Modal:**
   - Email/Username input
   - Password input
   - "Remember me" checkbox
   - "Forgot password?" link
   - Submit button
   - Link to register
   - Error message area

   **Register Modal:**
   - Email input
   - Username input
   - First Name input
   - Last Name input
   - Password input
   - Confirm Password input
   - Terms acceptance checkbox
   - Submit button
   - Link to login
   - Error message area

   **Forgot Password Modal:**
   - Email input
   - Submit button
   - Back to login link

   **User Menu Dropdown (when logged in):**
   - User avatar and name
   - "My Profile" link
   - "Dashboard" link
   - "Settings" link
   - "Logout" button

2. JAVASCRIPT API INTEGRATION:

   Create API service object:
   ```javascript
   const API = {
     baseURL: 'http://localhost:5000/api',
     token: localStorage.getItem('authToken'),

     async register(userData) {
       // POST /auth/register
     },

     async login(credentials) {
       // POST /auth/login
       // Save token to localStorage
       // Update UI to logged-in state
     },

     async logout() {
       // POST /auth/logout
       // Clear token from localStorage
       // Update UI to logged-out state
     },

     async getProfile() {
       // GET /users/profile
     },

     async getChallenges() {
       // GET /challenges
     },

     async submitCode(challengeId, code) {
       // POST /challenges/:id/submit
     },

     // Helper to add auth header
     getHeaders() {
       return {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${this.token}`
       };
     }
   };
   ```

3. STATE MANAGEMENT:

   Update app state to include:
   ```javascript
   const appState = {
     user: null,           // Current user object
     isAuthenticated: false,
     challenges: [],       // Challenges from API
     progress: {},         // User progress map
     streak: 0,
     totalPoints: 0
   };
   ```

4. INITIALIZATION:

   On page load:
   - Check if authToken exists in localStorage
   - If yes: call API.getProfile() to validate token and get user
   - If valid: set isAuthenticated = true, load challenges with progress
   - If invalid: clear token, show login
   - If no token: show guest mode with option to login/register

5. GUEST MODE vs AUTHENTICATED MODE:

   Guest Mode:
   - Can view and attempt challenges
   - Progress saved in localStorage only
   - Show "Sign up to save progress" banner
   - Limited features

   Authenticated Mode:
   - Full access to all features
   - Progress synced to server
   - Access to leaderboard
   - Profile and stats

6. UI UPDATES:

   - Add Login/Register buttons in header (when not logged in)
   - Show user menu when logged in
   - Add loading states for API calls
   - Add error handling and user feedback
   - Show success messages for actions

Acceptance Criteria:
- ✓ Login modal functional and styled
- ✓ Register modal functional and styled
- ✓ Authentication flow working
- ✓ Token stored and used correctly
- ✓ UI updates based on auth state
- ✓ Guest mode still functional
- ✓ Error handling working
- ✓ Form validation working
```

---

### Phase 3B: User Dashboard UI

**Implementation Prompt:**

```
Create a user dashboard page showing progress, stats, and achievements:

1. DASHBOARD PAGE LAYOUT:

   Create new section in index.html (shown when user clicks "Dashboard"):

   ```html
   <div id="dashboard-page" class="container" style="display:none;">
     <!-- Header with user info -->
     <div class="dashboard-header">
       <img src="user.avatar" class="avatar-large">
       <h2>Welcome back, [username]!</h2>
       <div class="user-stats-summary">
         <div class="stat-card">
           <h3 id="total-points">0</h3>
           <p>Total Points</p>
         </div>
         <div class="stat-card">
           <h3 id="challenges-completed">0/15</h3>
           <p>Challenges Completed</p>
         </div>
         <div class="stat-card">
           <h3 id="current-streak">0</h3>
           <p>Day Streak 🔥</p>
         </div>
       </div>
     </div>

     <!-- Progress Section -->
     <div class="progress-section">
       <h3>Your Progress</h3>
       <div class="progress-bar-container">
         <div class="progress-bar" id="overall-progress"></div>
         <span id="progress-text">0%</span>
       </div>

       <div class="challenges-grid">
         <!-- Challenge cards with status indicators -->
       </div>
     </div>

     <!-- Achievements Section -->
     <div class="achievements-section">
       <h3>Achievements</h3>
       <div class="achievements-grid" id="achievements-list">
         <!-- Achievement badges -->
       </div>
     </div>

     <!-- Recent Activity -->
     <div class="activity-section">
       <h3>Recent Activity</h3>
       <div class="activity-timeline">
         <!-- Activity items -->
       </div>
     </div>

     <!-- Leaderboard Preview -->
     <div class="leaderboard-preview">
       <h3>Leaderboard</h3>
       <p>Your Rank: <strong>#<span id="user-rank">-</span></strong></p>
       <table class="leaderboard-table">
         <!-- Top 10 users -->
       </table>
       <a href="#" id="view-full-leaderboard">View Full Leaderboard</a>
     </div>
   </div>
   ```

2. DASHBOARD DATA LOADING:

   ```javascript
   async function loadDashboard() {
     showLoading();

     try {
       // Fetch user stats
       const stats = await API.getUserStats();

       // Fetch progress
       const progress = await API.getProgress();

       // Fetch achievements
       const achievements = await API.getUserAchievements();

       // Fetch leaderboard
       const leaderboard = await API.getGlobalLeaderboard();

       // Update UI
       updateDashboardStats(stats);
       updateProgressDisplay(progress);
       updateAchievements(achievements);
       updateLeaderboardPreview(leaderboard);

     } catch (error) {
       showError('Failed to load dashboard');
     } finally {
       hideLoading();
     }
   }
   ```

3. CHALLENGE PROGRESS CARDS:

   Each challenge card shows:
   - Challenge number and title
   - Status indicator: Not Started (gray), In Progress (yellow), Completed (green)
   - Progress bar if in progress
   - Number of attempts
   - Points earned
   - Click to open challenge

4. ACHIEVEMENT BADGES:

   Display achievements as badges:
   - Unlocked: Full color with date
   - Locked: Grayscale with lock icon
   - Hover to see description
   - Animation when new achievement unlocked

5. ACTIVITY TIMELINE:

   Show recent user actions:
   - "Completed Challenge X" - timestamp
   - "Earned Achievement Y" - timestamp
   - "Reached Z day streak" - timestamp

   Display last 10 activities.

6. NAVIGATION:

   Add navigation to switch between:
   - Dashboard (overview)
   - Challenges (main learning interface)
   - Leaderboard (full view)
   - Profile (settings)

Acceptance Criteria:
- ✓ Dashboard loads with user data
- ✓ Statistics displayed correctly
- ✓ Challenge progress visualized
- ✓ Achievements displayed with status
- ✓ Leaderboard preview working
- ✓ Recent activity shown
- ✓ Responsive design
- ✓ Smooth navigation between sections
```

---

## PHASE 4: Admin Dashboard

### Phase 4A: Admin Authentication & Authorization

**Implementation Prompt:**

```
Implement admin-specific features and access control:

1. ADMIN MIDDLEWARE (src/middleware/admin.js):

   **requireAdmin()**
   - Check if req.user.role === 'ADMIN' or 'SUPER_ADMIN'
   - If not: return 403 Forbidden
   - If yes: call next()

   **requireSuperAdmin()**
   - Check if req.user.role === 'SUPER_ADMIN'
   - If not: return 403 Forbidden
   - If yes: call next()

2. ADMIN ROUTES STRUCTURE:

   Create separate route files:
   - src/routes/admin/users.js
   - src/routes/admin/challenges.js
   - src/routes/admin/analytics.js
   - src/routes/admin/settings.js

   All routes require: authenticateToken + requireAdmin middleware

3. AUDIT LOGGING:

   Create middleware to log all admin actions:
   ```javascript
   async function auditLog(req, res, next) {
     // Log: userId, action, entity, entityId, IP address
     // Save to AuditLog table
   }
   ```

4. FIRST ADMIN SETUP:

   Create a seed script to create first super admin:
   ```javascript
   // scripts/createAdmin.js
   // Run: node scripts/createAdmin.js
   // Creates super admin account
   ```

Acceptance Criteria:
- ✓ Admin middleware working
- ✓ Admin routes protected
- ✓ Audit logging functional
- ✓ First admin account created
- ✓ Role-based access control working
```

---

### Phase 4B: Admin User Management API

**Implementation Prompt:**

```
Implement admin endpoints for user management:

1. ADMIN USER CONTROLLER (src/controllers/admin/userController.js):

   **getAllUsers()**
   - Fetch all users with pagination
   - Support filters: role, isActive, emailVerified
   - Support search by: email, username, name
   - Support sorting by: createdAt, lastLogin, totalPoints
   - Return: { users, total, page, limit }

   **getUserDetails(userId)**
   - Fetch complete user profile
   - Include: all fields, statistics, recent activity
   - Include progress summary
   - Return user object

   **updateUser(userId)**
   - Allow updates: firstName, lastName, email, username, role, isActive
   - Validate email/username uniqueness
   - Log action in audit log
   - Return updated user

   **deleteUser(userId)**
   - Hard delete user and all related data (cascades)
   - Log action in audit log
   - Prevent deletion of last super admin
   - Return success message

   **toggleUserStatus(userId)**
   - Toggle isActive field
   - Log action in audit log
   - Return updated status

   **resetUserPassword(userId)**
   - Generate temporary password
   - Hash and update user password
   - Send email to user with temp password
   - Log action in audit log
   - Return success message

   **getUserActivity(userId)**
   - Fetch user's recent activity (logins, completions)
   - Return activity log

2. ADMIN USER ROUTES:
   ```javascript
   GET    /api/admin/users              - Get all users (paginated)
   GET    /api/admin/users/:id          - Get user details
   PUT    /api/admin/users/:id          - Update user
   DELETE /api/admin/users/:id          - Delete user
   PATCH  /api/admin/users/:id/status   - Toggle active status
   POST   /api/admin/users/:id/reset-pw - Reset user password
   GET    /api/admin/users/:id/activity - Get user activity
   ```

3. VALIDATION:
   - Validate admin can't delete themselves
   - Validate can't change own role to lower
   - Validate can't delete last super admin

Acceptance Criteria:
- ✓ User listing with pagination working
- ✓ User search and filters working
- ✓ User CRUD operations working
- ✓ User status toggle working
- ✓ Password reset working
- ✓ Audit logging for all actions
- ✓ Proper authorization checks
```

---

### Phase 4C: Admin Challenge Management API

**Implementation Prompt:**

```
Implement admin endpoints for challenge management (CRUD):

1. ADMIN CHALLENGE CONTROLLER (src/controllers/admin/challengeController.js):

   **createChallenge()**
   - Accept: levelNumber, title, description, task, starterCode, expectedOutput, hint, solution, testType, difficulty, points
   - Validate levelNumber is unique
   - Create challenge in database
   - Log action in audit log
   - Return created challenge

   **updateChallenge(challengeId)**
   - Allow updates to all challenge fields
   - Validate levelNumber uniqueness if changed
   - Log action in audit log
   - Return updated challenge

   **deleteChallenge(challengeId)**
   - Soft delete: set isActive = false
   - Or hard delete with cascade to UserProgress
   - Log action in audit log
   - Return success message

   **reorderChallenges(newOrder)**
   - Accept array of { id, levelNumber }
   - Update levelNumbers in batch
   - Log action in audit log
   - Return success message

   **toggleChallengeStatus(challengeId)**
   - Toggle isActive field
   - Return updated status

   **getChallengeStats(challengeId)**
   - Calculate:
     * Total attempts
     * Completion rate
     * Average attempts to complete
     * Average time to complete
   - Return statistics

2. ADMIN CHALLENGE ROUTES:
   ```javascript
   POST   /api/admin/challenges           - Create challenge
   PUT    /api/admin/challenges/:id       - Update challenge
   DELETE /api/admin/challenges/:id       - Delete challenge
   PATCH  /api/admin/challenges/:id/status - Toggle active status
   POST   /api/admin/challenges/reorder   - Reorder challenges
   GET    /api/admin/challenges/:id/stats - Get challenge statistics
   ```

3. VALIDATION:
   - Validate all required fields present
   - Validate testType is valid enum
   - Validate difficulty is valid enum
   - Validate points is positive integer
   - Validate solution code is valid Python

Acceptance Criteria:
- ✓ Challenge creation working
- ✓ Challenge updates working
- ✓ Challenge deletion working
- ✓ Challenge reordering working
- ✓ Challenge statistics calculated
- ✓ Input validation working
- ✓ Audit logging for all actions
```

---

### Phase 4D: Admin Analytics & System Settings API

**Implementation Prompt:**

```
Implement admin analytics dashboard and system settings:

1. ADMIN ANALYTICS CONTROLLER (src/controllers/admin/analyticsController.js):

   **getOverviewStats()**
   - Calculate and return:
     * Total users
     * Active users (logged in last 30 days)
     * Total challenges
     * Total code submissions
     * Average completion rate
     * Most popular challenge
     * Least popular challenge

   **getUserGrowth(period)**
   - Period: 'week', 'month', 'year'
   - Return user registration counts per day/week/month
   - Format for charts: [{ date, count }]

   **getCompletionRates()**
   - Return completion rate for each challenge
   - Format: [{ challengeId, title, attempts, completions, rate }]

   **getActivityHeatmap()**
   - Return user activity by hour of day and day of week
   - Format: { day, hour, activityCount }

   **getTopUsers(limit = 10)**
   - Return top users by points
   - Include: username, points, challenges completed

2. ADMIN SYSTEM SETTINGS CONTROLLER (src/controllers/admin/settingsController.js):

   **getAllSettings()**
   - Fetch all system settings grouped by category
   - Return settings object

   **updateSetting(key, value)**
   - Update specific setting
   - Validate value based on setting type
   - Log action in audit log
   - Return updated setting

   System settings examples:
   - SITE_NAME
   - SITE_DESCRIPTION
   - ALLOW_REGISTRATION (true/false)
   - REQUIRE_EMAIL_VERIFICATION (true/false)
   - MAX_LOGIN_ATTEMPTS
   - SESSION_TIMEOUT_DAYS
   - POINTS_PER_CHALLENGE
   - ENABLE_LEADERBOARD (true/false)

3. ADMIN ANALYTICS ROUTES:
   ```javascript
   GET /api/admin/analytics/overview           - Overview statistics
   GET /api/admin/analytics/user-growth        - User growth data
   GET /api/admin/analytics/completion-rates   - Challenge completion rates
   GET /api/admin/analytics/activity-heatmap   - Activity heatmap
   GET /api/admin/analytics/top-users          - Top users
   ```

4. ADMIN SETTINGS ROUTES:
   ```javascript
   GET   /api/admin/settings      - Get all settings
   PUT   /api/admin/settings/:key - Update setting
   ```

Acceptance Criteria:
- ✓ Analytics calculations accurate
- ✓ Data formatted for frontend charts
- ✓ System settings CRUD working
- ✓ Settings validation working
- ✓ Audit logging for settings changes
```

---

## PHASE 5: Admin Frontend Dashboard

### Phase 5A: Admin Dashboard UI Structure

**Implementation Prompt:**

```
Create comprehensive admin dashboard interface:

1. ADMIN DASHBOARD LAYOUT:

   Create admin section in index.html:
   ```html
   <div id="admin-dashboard" style="display:none;">
     <!-- Sidebar Navigation -->
     <aside class="admin-sidebar">
       <ul class="admin-nav">
         <li><a href="#admin-overview">📊 Overview</a></li>
         <li><a href="#admin-users">👥 Users</a></li>
         <li><a href="#admin-challenges">🎯 Challenges</a></li>
         <li><a href="#admin-analytics">📈 Analytics</a></li>
         <li><a href="#admin-settings">⚙️ Settings</a></li>
         <li><a href="#admin-logs">📋 Audit Logs</a></li>
       </ul>
     </aside>

     <!-- Main Content Area -->
     <main class="admin-content">
       <div id="admin-overview-section"><!-- Overview --></div>
       <div id="admin-users-section"><!-- User Management --></div>
       <div id="admin-challenges-section"><!-- Challenge Management --></div>
       <div id="admin-analytics-section"><!-- Analytics --></div>
       <div id="admin-settings-section"><!-- Settings --></div>
       <div id="admin-logs-section"><!-- Audit Logs --></div>
     </main>
   </div>
   ```

2. ADMIN OVERVIEW PAGE:

   Display key metrics cards:
   - Total Users (with growth %)
   - Active Users (last 30 days)
   - Total Challenges
   - Total Submissions
   - Average Completion Rate
   - Most Popular Challenge

   Recent activity feed:
   - New user registrations
   - Challenge completions
   - Admin actions

3. ACCESS CONTROL:

   ```javascript
   function checkAdminAccess() {
     const user = appState.user;
     if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
       showError('Access Denied');
       navigateTo('dashboard');
       return false;
     }
     return true;
   }

   function navigateToAdmin(section) {
     if (!checkAdminAccess()) return;

     showAdminDashboard();
     loadAdminSection(section);
   }
   ```

4. STYLING:

   - Professional admin theme (darker header, sidebar)
   - Use different color scheme than main app
   - Responsive layout (sidebar collapses on mobile)
   - Clean, data-focused design

Acceptance Criteria:
- ✓ Admin dashboard layout created
- ✓ Navigation working between sections
- ✓ Access control implemented
- ✓ Overview page showing key metrics
- ✓ Responsive design
- ✓ Professional styling
```

---

### Phase 5B: Admin User Management UI

**Implementation Prompt:**

```
Create user management interface for admins:

1. USER MANAGEMENT TABLE:

   ```html
   <div id="admin-users-section">
     <div class="section-header">
       <h2>User Management</h2>
       <div class="actions">
         <input type="search" id="user-search" placeholder="Search users...">
         <select id="role-filter">
           <option value="">All Roles</option>
           <option value="USER">Users</option>
           <option value="ADMIN">Admins</option>
         </select>
         <select id="status-filter">
           <option value="">All Status</option>
           <option value="true">Active</option>
           <option value="false">Inactive</option>
         </select>
       </div>
     </div>

     <table class="admin-table">
       <thead>
         <tr>
           <th>User</th>
           <th>Email</th>
           <th>Role</th>
           <th>Status</th>
           <th>Challenges</th>
           <th>Points</th>
           <th>Joined</th>
           <th>Actions</th>
         </tr>
       </thead>
       <tbody id="users-table-body">
         <!-- User rows populated via JS -->
       </tbody>
     </table>

     <div class="pagination">
       <!-- Pagination controls -->
     </div>
   </div>
   ```

2. USER ACTIONS:

   Each user row has action buttons:
   - 👁️ View Details (opens modal with full user info)
   - ✏️ Edit (opens edit modal)
   - 🔒/🔓 Toggle Status (activate/deactivate)
   - 🔑 Reset Password
   - 🗑️ Delete (with confirmation)

3. USER DETAILS MODAL:

   Shows:
   - Full user information
   - Statistics (challenges completed, points, streak)
   - Progress on each challenge
   - Recent activity
   - Account history

4. USER EDIT MODAL:

   Allow editing:
   - First Name, Last Name
   - Email (with validation)
   - Username (with validation)
   - Role (dropdown)
   - Active status (checkbox)

5. JAVASCRIPT FUNCTIONS:

   ```javascript
   async function loadUsers(page = 1, filters = {}) {
     const params = new URLSearchParams({
       page,
       limit: 20,
       ...filters
     });

     const data = await API.admin.getUsers(params);
     renderUsersTable(data.users);
     renderPagination(data.total, data.page, data.limit);
   }

   async function editUser(userId) {
     const user = await API.admin.getUserDetails(userId);
     showEditUserModal(user);
   }

   async function toggleUserStatus(userId) {
     if (confirm('Are you sure?')) {
       await API.admin.toggleUserStatus(userId);
       loadUsers(); // Reload table
       showSuccess('User status updated');
     }
   }

   async function deleteUser(userId) {
     if (confirm('Are you sure? This action cannot be undone!')) {
       await API.admin.deleteUser(userId);
       loadUsers(); // Reload table
       showSuccess('User deleted');
     }
   }
   ```

6. SEARCH AND FILTERS:

   - Debounced search input (300ms)
   - Real-time filtering by role and status
   - Maintain filters when paginating

Acceptance Criteria:
- ✓ User table displays all users
- ✓ Search functionality working
- ✓ Filters working (role, status)
- ✓ Pagination working
- ✓ User details modal working
- ✓ Edit user modal working
- ✓ Toggle status working
- ✓ Delete user working with confirmation
- ✓ Reset password working
```

---

### Phase 5C: Admin Challenge Management UI

**Implementation Prompt:**

```
Create challenge management interface for admins:

1. CHALLENGE MANAGEMENT LAYOUT:

   ```html
   <div id="admin-challenges-section">
     <div class="section-header">
       <h2>Challenge Management</h2>
       <button id="add-challenge-btn" class="btn-primary">+ Add Challenge</button>
     </div>

     <div class="challenges-admin-list">
       <!-- Draggable challenge cards for reordering -->
     </div>
   </div>
   ```

2. CHALLENGE CARD:

   Each challenge card shows:
   - Level number
   - Title
   - Difficulty badge
   - Points
   - Status indicator (active/inactive)
   - Statistics (completion rate, avg attempts)
   - Action buttons: Edit, Toggle Status, Delete
   - Drag handle for reordering

3. ADD/EDIT CHALLENGE MODAL:

   ```html
   <div id="challenge-modal" class="modal">
     <form id="challenge-form">
       <input type="number" name="levelNumber" placeholder="Level Number" required>
       <input type="text" name="title" placeholder="Title" required>
       <textarea name="description" placeholder="Description" required></textarea>
       <textarea name="task" placeholder="Task" required></textarea>
       <textarea name="starterCode" placeholder="Starter Code"></textarea>
       <textarea name="expectedOutput" placeholder="Expected Output" required></textarea>
       <textarea name="hint" placeholder="Hint"></textarea>
       <textarea name="solution" placeholder="Solution" required></textarea>

       <select name="testType" required>
         <option value="exact">Exact Match</option>
         <option value="flexible">Flexible Match</option>
         <option value="pattern">Pattern Match</option>
       </select>

       <select name="difficulty">
         <option value="beginner">Beginner</option>
         <option value="intermediate">Intermediate</option>
         <option value="advanced">Advanced</option>
       </select>

       <input type="number" name="points" placeholder="Points" value="10">

       <label>
         <input type="checkbox" name="isActive" checked>
         Active
       </label>

       <div class="modal-actions">
         <button type="submit" class="btn-primary">Save Challenge</button>
         <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
       </div>
     </form>
   </div>
   ```

4. CHALLENGE REORDERING:

   Implement drag-and-drop to reorder challenges:
   ```javascript
   // Use SortableJS or implement custom drag-and-drop
   function enableChallengeReordering() {
     const list = document.getElementById('challenges-admin-list');

     // Make items draggable
     // On drop, update order and save to API
   }

   async function saveNewOrder(newOrder) {
     await API.admin.reorderChallenges(newOrder);
     showSuccess('Challenge order updated');
   }
   ```

5. CHALLENGE STATISTICS:

   Show for each challenge:
   - Total attempts
   - Completions
   - Completion rate (%)
   - Average attempts to complete
   - Average time to complete

6. JAVASCRIPT FUNCTIONS:

   ```javascript
   async function loadChallenges() {
     const challenges = await API.admin.getAllChallenges();
     renderChallengesAdminList(challenges);
   }

   function showAddChallengeModal() {
     document.getElementById('challenge-form').reset();
     document.getElementById('challenge-modal').style.display = 'block';
   }

   async function showEditChallengeModal(challengeId) {
     const challenge = await API.admin.getChallengeDetails(challengeId);
     populateChallengeForm(challenge);
     document.getElementById('challenge-modal').style.display = 'block';
   }

   async function saveChallenge(formData) {
     const challengeId = formData.id;

     if (challengeId) {
       await API.admin.updateChallenge(challengeId, formData);
       showSuccess('Challenge updated');
     } else {
       await API.admin.createChallenge(formData);
       showSuccess('Challenge created');
     }

     closeModal();
     loadChallenges();
   }

   async function deleteChallenge(challengeId) {
     if (confirm('Delete this challenge? User progress will be affected.')) {
       await API.admin.deleteChallenge(challengeId);
       showSuccess('Challenge deleted');
       loadChallenges();
     }
   }
   ```

Acceptance Criteria:
- ✓ Challenge list displays all challenges
- ✓ Add challenge modal working
- ✓ Edit challenge modal working
- ✓ Form validation working
- ✓ Challenge creation working
- ✓ Challenge updates working
- ✓ Challenge deletion working
- ✓ Drag-and-drop reordering working
- ✓ Statistics displayed correctly
```

---

### Phase 5D: Admin Analytics Dashboard UI

**Implementation Prompt:**

```
Create analytics dashboard with charts and insights:

1. ANALYTICS LAYOUT:

   ```html
   <div id="admin-analytics-section">
     <h2>Analytics Dashboard</h2>

     <!-- Key Metrics Cards -->
     <div class="metrics-grid">
       <div class="metric-card">
         <h3 id="total-users-metric">0</h3>
         <p>Total Users</p>
         <span class="metric-change">+12% this month</span>
       </div>
       <!-- More metric cards -->
     </div>

     <!-- Charts -->
     <div class="charts-grid">
       <div class="chart-container">
         <h3>User Growth</h3>
         <canvas id="user-growth-chart"></canvas>
       </div>

       <div class="chart-container">
         <h3>Challenge Completion Rates</h3>
         <canvas id="completion-rates-chart"></canvas>
       </div>

       <div class="chart-container">
         <h3>Activity Heatmap</h3>
         <div id="activity-heatmap"></div>
       </div>

       <div class="chart-container">
         <h3>Top Performers</h3>
         <table id="top-users-table">
           <!-- Top users -->
         </table>
       </div>
     </div>
   </div>
   ```

2. CHARTING LIBRARY:

   Add Chart.js via CDN:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```

3. USER GROWTH CHART:

   ```javascript
   async function renderUserGrowthChart() {
     const data = await API.admin.getUserGrowth('month');

     const ctx = document.getElementById('user-growth-chart').getContext('2d');
     new Chart(ctx, {
       type: 'line',
       data: {
         labels: data.map(d => d.date),
         datasets: [{
           label: 'New Users',
           data: data.map(d => d.count),
           borderColor: 'rgb(75, 192, 192)',
           tension: 0.1
         }]
       },
       options: {
         responsive: true,
         scales: {
           y: { beginAtZero: true }
         }
       }
     });
   }
   ```

4. COMPLETION RATES CHART:

   ```javascript
   async function renderCompletionRatesChart() {
     const data = await API.admin.getCompletionRates();

     const ctx = document.getElementById('completion-rates-chart').getContext('2d');
     new Chart(ctx, {
       type: 'bar',
       data: {
         labels: data.map(d => d.title),
         datasets: [{
           label: 'Completion Rate (%)',
           data: data.map(d => d.rate),
           backgroundColor: 'rgba(54, 162, 235, 0.5)'
         }]
       },
       options: {
         responsive: true,
         scales: {
           y: {
             beginAtZero: true,
             max: 100
           }
         }
       }
     });
   }
   ```

5. ACTIVITY HEATMAP:

   Create a heatmap showing activity by day/hour:
   - Use HTML table or canvas
   - Color intensity based on activity count
   - Tooltip showing exact numbers

6. EXPORT FUNCTIONALITY:

   Add buttons to export analytics data:
   ```javascript
   function exportAnalyticsCSV() {
     // Generate CSV from analytics data
     // Trigger download
   }

   function exportAnalyticsPDF() {
     // Generate PDF report
     // Use library like jsPDF
   }
   ```

Acceptance Criteria:
- ✓ Analytics page loads data
- ✓ User growth chart displaying correctly
- ✓ Completion rates chart displaying correctly
- ✓ Activity heatmap functional
- ✓ Top users table populated
- ✓ Charts responsive
- ✓ Data auto-refreshes
- ✓ Export functionality working
```

---

### Phase 5E: Admin System Settings UI

**Implementation Prompt:**

```
Create system settings management interface:

1. SETTINGS LAYOUT:

   ```html
   <div id="admin-settings-section">
     <h2>System Settings</h2>

     <div class="settings-categories">
       <!-- General Settings -->
       <div class="settings-category">
         <h3>General</h3>
         <div class="setting-item">
           <label>Site Name</label>
           <input type="text" id="setting-site-name" data-key="SITE_NAME">
           <button onclick="saveSetting('SITE_NAME')">Save</button>
         </div>
         <div class="setting-item">
           <label>Site Description</label>
           <textarea id="setting-site-desc" data-key="SITE_DESCRIPTION"></textarea>
           <button onclick="saveSetting('SITE_DESCRIPTION')">Save</button>
         </div>
       </div>

       <!-- Registration Settings -->
       <div class="settings-category">
         <h3>Registration & Authentication</h3>
         <div class="setting-item">
           <label>
             <input type="checkbox" id="setting-allow-reg" data-key="ALLOW_REGISTRATION">
             Allow new user registration
           </label>
           <button onclick="saveSetting('ALLOW_REGISTRATION')">Save</button>
         </div>
         <div class="setting-item">
           <label>
             <input type="checkbox" id="setting-require-verify" data-key="REQUIRE_EMAIL_VERIFICATION">
             Require email verification
           </label>
           <button onclick="saveSetting('REQUIRE_EMAIL_VERIFICATION')">Save</button>
         </div>
         <div class="setting-item">
           <label>Max Login Attempts</label>
           <input type="number" id="setting-max-login" data-key="MAX_LOGIN_ATTEMPTS">
           <button onclick="saveSetting('MAX_LOGIN_ATTEMPTS')">Save</button>
         </div>
         <div class="setting-item">
           <label>Session Timeout (days)</label>
           <input type="number" id="setting-session-timeout" data-key="SESSION_TIMEOUT_DAYS">
           <button onclick="saveSetting('SESSION_TIMEOUT_DAYS')">Save</button>
         </div>
       </div>

       <!-- Gamification Settings -->
       <div class="settings-category">
         <h3>Gamification</h3>
         <div class="setting-item">
           <label>Default Points Per Challenge</label>
           <input type="number" id="setting-points" data-key="POINTS_PER_CHALLENGE">
           <button onclick="saveSetting('POINTS_PER_CHALLENGE')">Save</button>
         </div>
         <div class="setting-item">
           <label>
             <input type="checkbox" id="setting-leaderboard" data-key="ENABLE_LEADERBOARD">
             Enable leaderboard
           </label>
           <button onclick="saveSetting('ENABLE_LEADERBOARD')">Save</button>
         </div>
       </div>

       <!-- Email Settings -->
       <div class="settings-category">
         <h3>Email Configuration</h3>
         <div class="setting-item">
           <label>SMTP Host</label>
           <input type="text" id="setting-smtp-host" data-key="SMTP_HOST">
           <button onclick="saveSetting('SMTP_HOST')">Save</button>
         </div>
         <div class="setting-item">
           <label>SMTP Port</label>
           <input type="number" id="setting-smtp-port" data-key="SMTP_PORT">
           <button onclick="saveSetting('SMTP_PORT')">Save</button>
         </div>
         <div class="setting-item">
           <button onclick="testEmailConfig()" class="btn-secondary">Test Email Configuration</button>
         </div>
       </div>
     </div>
   </div>
   ```

2. JAVASCRIPT FUNCTIONS:

   ```javascript
   async function loadSettings() {
     const settings = await API.admin.getAllSettings();

     // Populate form fields
     for (const [key, value] of Object.entries(settings)) {
       const element = document.querySelector(`[data-key="${key}"]`);
       if (element) {
         if (element.type === 'checkbox') {
           element.checked = value === 'true';
         } else {
           element.value = value;
         }
       }
     }
   }

   async function saveSetting(key) {
     const element = document.querySelector(`[data-key="${key}"]`);
     const value = element.type === 'checkbox' ? element.checked : element.value;

     try {
       await API.admin.updateSetting(key, value);
       showSuccess('Setting saved');
     } catch (error) {
       showError('Failed to save setting');
     }
   }

   async function testEmailConfig() {
     try {
       await API.admin.testEmail();
       showSuccess('Test email sent successfully');
     } catch (error) {
       showError('Email configuration test failed');
     }
   }
   ```

3. AUDIT LOG VIEWER:

   Add section to view recent admin actions:
   ```html
   <div id="admin-logs-section">
     <h2>Audit Logs</h2>

     <div class="filters">
       <select id="log-action-filter">
         <option value="">All Actions</option>
         <option value="create">Create</option>
         <option value="update">Update</option>
         <option value="delete">Delete</option>
       </select>
       <select id="log-entity-filter">
         <option value="">All Entities</option>
         <option value="user">Users</option>
         <option value="challenge">Challenges</option>
         <option value="setting">Settings</option>
       </select>
       <input type="date" id="log-date-from">
       <input type="date" id="log-date-to">
     </div>

     <table class="admin-table">
       <thead>
         <tr>
           <th>Timestamp</th>
           <th>Admin</th>
           <th>Action</th>
           <th>Entity</th>
           <th>Details</th>
           <th>IP Address</th>
         </tr>
       </thead>
       <tbody id="audit-logs-body">
         <!-- Logs populated via JS -->
       </tbody>
     </table>
   </div>
   ```

Acceptance Criteria:
- ✓ Settings page loads current values
- ✓ Settings can be updated
- ✓ Changes saved to database
- ✓ Validation working for each setting type
- ✓ Email test functionality working
- ✓ Audit logs displaying correctly
- ✓ Audit log filters working
```

---

## PHASE 6: Testing, Security & Deployment

### Phase 6A: Security Hardening

**Implementation Prompt:**

```
Implement comprehensive security measures:

1. SECURITY CHECKLIST:

   **Input Validation & Sanitization:**
   - Validate all inputs on both client and server
   - Sanitize HTML inputs to prevent XSS
   - Use parameterized queries (Prisma does this automatically)
   - Validate file uploads (type, size, content)

   **Authentication & Authorization:**
   - Implement password strength requirements
   - Add password complexity checker on frontend
   - Implement account lockout after failed attempts
   - Add CAPTCHA for registration and login (optional)
   - Implement 2FA/MFA (optional, advanced)

   **Rate Limiting:**
   Already implemented in Phase 1B, verify:
   - Login endpoint: 5 attempts per 15 minutes
   - Registration: 3 attempts per hour
   - Password reset: 3 attempts per hour
   - API endpoints: 100 requests per 15 minutes per IP

   **CORS Configuration:**
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

   **Helmet Security Headers:**
   ```javascript
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
         styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
         imgSrc: ["'self'", "data:", "https:"],
       }
     }
   }));
   ```

   **SQL Injection Prevention:**
   - Use Prisma ORM (prevents SQL injection)
   - Never use raw queries with user input
   - If raw queries needed, use parameterized queries

   **XSS Prevention:**
   - Sanitize all user-generated content before display
   - Use DOMPurify library for HTML sanitization
   - Set proper Content-Type headers

   **CSRF Protection:**
   - Use SameSite cookie attribute
   - Implement CSRF tokens for state-changing operations

2. PASSWORD SECURITY:

   ```javascript
   // Password strength checker
   function validatePasswordStrength(password) {
     const minLength = 8;
     const hasUpperCase = /[A-Z]/.test(password);
     const hasLowerCase = /[a-z]/.test(password);
     const hasNumbers = /\d/.test(password);
     const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

     return {
       valid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
       strength: calculateStrength(password)
     };
   }

   // Bcrypt configuration
   const SALT_ROUNDS = 10;
   const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
   ```

3. SESSION MANAGEMENT:

   - Implement session expiry check on each request
   - Clean up expired sessions (cron job)
   - Implement "logout all devices" functionality
   - Track session metadata (IP, user agent)

4. DATA ENCRYPTION:

   - Encrypt sensitive data at rest (if applicable)
   - Use HTTPS only (TLS 1.2+)
   - Store JWT secret securely (environment variable)
   - Never log sensitive data (passwords, tokens)

5. ERROR HANDLING:

   - Don't expose stack traces in production
   - Log errors securely (server-side only)
   - Return generic error messages to client
   - Implement error monitoring (Sentry, etc.)

6. DATABASE SECURITY:

   - Use separate database user with minimal permissions
   - Regular database backups
   - Enable database encryption
   - Implement row-level security if needed

Acceptance Criteria:
- ✓ All security measures implemented
- ✓ Rate limiting working
- ✓ Input validation comprehensive
- ✓ CORS configured correctly
- ✓ Security headers set
- ✓ Password requirements enforced
- ✓ Session management secure
- ✓ Error handling secure
```

---

### Phase 6B: Testing

**Implementation Prompt:**

```
Implement comprehensive testing suite:

1. UNIT TESTS:

   Setup Jest for testing:
   ```bash
   npm install --save-dev jest supertest @types/jest
   ```

   Test structure:
   ```
   tests/
   ├── unit/
   │   ├── controllers/
   │   ├── middleware/
   │   └── utils/
   ├── integration/
   │   └── api/
   └── setup.js
   ```

   **Test Coverage:**
   - Authentication controller (register, login, logout)
   - User controller (profile, update, delete)
   - Challenge controller (get, submit, progress)
   - Admin controllers (CRUD operations)
   - Middleware (auth, validation, error handling)
   - Utilities (email service, validators)

2. INTEGRATION TESTS:

   Test API endpoints:
   ```javascript
   // Example: tests/integration/api/auth.test.js
   describe('Auth API', () => {
     test('POST /api/auth/register - success', async () => {
       const res = await request(app)
         .post('/api/auth/register')
         .send({
           email: 'test@example.com',
           username: 'testuser',
           password: 'Test123!',
           firstName: 'Test',
           lastName: 'User'
         });

       expect(res.statusCode).toBe(201);
       expect(res.body).toHaveProperty('message');
     });

     test('POST /api/auth/login - success', async () => {
       // Test login
     });

     test('POST /api/auth/login - invalid credentials', async () => {
       // Test failed login
     });
   });
   ```

3. E2E TESTS (Optional):

   Use Playwright or Cypress for frontend testing:
   - User registration flow
   - Login flow
   - Challenge completion flow
   - Admin dashboard access
   - User profile updates

4. TEST DATABASE:

   - Use separate test database
   - Reset database between tests
   - Seed test data

5. RUN TESTS:

   Add scripts to package.json:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

Acceptance Criteria:
- ✓ Unit tests for all controllers
- ✓ Unit tests for middleware
- ✓ Integration tests for all API endpoints
- ✓ Test coverage >80%
- ✓ All tests passing
- ✓ CI/CD integration (optional)
```

---

### Phase 6C: Documentation

**Implementation Prompt:**

```
Create comprehensive documentation:

1. API DOCUMENTATION:

   Use Swagger/OpenAPI:
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   ```

   Document all endpoints with:
   - Description
   - Parameters
   - Request body schema
   - Response schemas
   - Example requests/responses
   - Authentication requirements

   Access at: http://localhost:5000/api-docs

2. README FILES:

   **Backend README.md:**
   - Project overview
   - Tech stack
   - Prerequisites
   - Installation steps
   - Environment variables
   - Running the app
   - Running tests
   - API documentation link
   - Deployment instructions

   **Frontend Integration Guide:**
   - How to connect to API
   - Authentication flow
   - API usage examples
   - Error handling

3. ADMIN DOCUMENTATION:

   Create admin user guide:
   - How to access admin panel
   - User management instructions
   - Challenge management instructions
   - Understanding analytics
   - System settings guide

4. USER DOCUMENTATION:

   Create user guide:
   - How to register and login
   - How to solve challenges
   - Understanding the dashboard
   - How to track progress

Acceptance Criteria:
- ✓ API documentation complete
- ✓ README files comprehensive
- ✓ Admin guide created
- ✓ User guide created
- ✓ Code commented appropriately
```

---

### Phase 6D: Deployment

**Implementation Prompt:**

```
Deploy the application to production:

1. BACKEND DEPLOYMENT (Options):

   **Option A: Heroku**
   - Create Heroku app
   - Add PostgreSQL addon
   - Set environment variables
   - Deploy: git push heroku main
   - Run migrations: heroku run npx prisma migrate deploy

   **Option B: DigitalOcean**
   - Create droplet (Ubuntu)
   - Install Node.js, PostgreSQL, Nginx
   - Clone repository
   - Set up environment variables
   - Configure Nginx as reverse proxy
   - Set up SSL with Let's Encrypt
   - Use PM2 for process management

   **Option C: Railway/Render**
   - Similar to Heroku, simpler setup
   - Connect GitHub repository
   - Auto-deploy on push

2. FRONTEND DEPLOYMENT:

   **Update API URLs:**
   - Change API.baseURL to production backend URL
   - Use environment-based configuration

   **Hosting Options:**
   - GitHub Pages (static hosting)
   - Netlify
   - Vercel
   - Same server as backend

3. DATABASE:

   - Use managed PostgreSQL (recommended)
   - Set up automated backups
   - Enable connection pooling
   - Set up monitoring

4. ENVIRONMENT VARIABLES:

   Production .env:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://...
   JWT_SECRET=<strong-random-secret>
   FRONTEND_URL=https://yourdomain.com
   SMTP_HOST=...
   ```

5. SSL/HTTPS:

   - Use Let's Encrypt for free SSL
   - Configure Nginx for HTTPS
   - Redirect HTTP to HTTPS
   - Set up automatic renewal

6. MONITORING:

   - Set up application monitoring (PM2, New Relic)
   - Set up error tracking (Sentry)
   - Set up uptime monitoring (UptimeRobot)
   - Set up log aggregation

7. CI/CD (Optional):

   GitHub Actions workflow:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install
         - run: npm test
         - run: npm run build
         # Deploy steps
   ```

Acceptance Criteria:
- ✓ Backend deployed and accessible
- ✓ Frontend deployed and accessible
- ✓ Database configured and backed up
- ✓ HTTPS enabled
- ✓ Environment variables set correctly
- ✓ Monitoring configured
- ✓ Application running smoothly in production
```

---

## IMPLEMENTATION TIMELINE

### Suggested Timeline (Full-time development):

- **Phase 1A-C**: Backend Foundation - 1 week
- **Phase 2A-B**: Challenge Management - 1 week
- **Phase 3A-B**: Frontend Integration - 1 week
- **Phase 4A-D**: Admin Backend - 1 week
- **Phase 5A-E**: Admin Frontend - 1.5 weeks
- **Phase 6A-D**: Security, Testing, Deployment - 1 week

**Total**: ~6.5 weeks (can be faster with team or slower with part-time work)

---

## PRIORITY LEVELS

If you need to implement in stages:

### Must-Have (MVP):
- Phase 1A-C: User authentication
- Phase 2A: Basic challenge management
- Phase 3A: Frontend auth integration
- Phase 4A-B: Admin user management
- Phase 4C: Admin challenge CRUD
- Phase 6A: Basic security
- Phase 6D: Deployment

### Should-Have:
- Phase 2B: Leaderboard & achievements
- Phase 3B: User dashboard
- Phase 5A-C: Admin UI for users and challenges
- Phase 6B: Testing

### Nice-to-Have:
- Phase 4D: Analytics
- Phase 5D-E: Analytics UI and settings UI
- Phase 6C: Comprehensive documentation
- Advanced features (2FA, social login, etc.)

---

## NOTES

1. **Database Choice**: PostgreSQL recommended for relational data and ACID compliance. MongoDB possible if you prefer NoSQL.

2. **Authentication Strategy**: JWT-based authentication is recommended for stateless API. Consider refresh tokens for better security.

3. **Frontend Framework**: Current implementation is vanilla JS. Consider migrating to React/Vue for better state management if app grows significantly.

4. **Scalability**: Current architecture supports horizontal scaling. Use load balancer if needed.

5. **Pyodide Integration**: Keep Pyodide on client-side to avoid server load. Server only validates results.

6. **Backward Compatibility**: Maintain guest mode for users who don't want to register.

---

## APPENDIX: API Endpoint Reference

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/verify/:token
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me

### Users
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/change-password
- POST /api/users/avatar
- DELETE /api/users/account
- GET /api/users/stats

### Challenges
- GET /api/challenges
- GET /api/challenges/:id
- POST /api/challenges/:id/submit
- GET /api/challenges/progress
- DELETE /api/challenges/:id/progress

### Leaderboard
- GET /api/leaderboard/global
- GET /api/leaderboard/weekly

### Achievements
- GET /api/achievements
- GET /api/achievements/user

### Admin - Users
- GET /api/admin/users
- GET /api/admin/users/:id
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- PATCH /api/admin/users/:id/status
- POST /api/admin/users/:id/reset-pw
- GET /api/admin/users/:id/activity

### Admin - Challenges
- POST /api/admin/challenges
- PUT /api/admin/challenges/:id
- DELETE /api/admin/challenges/:id
- PATCH /api/admin/challenges/:id/status
- POST /api/admin/challenges/reorder
- GET /api/admin/challenges/:id/stats

### Admin - Analytics
- GET /api/admin/analytics/overview
- GET /api/admin/analytics/user-growth
- GET /api/admin/analytics/completion-rates
- GET /api/admin/analytics/activity-heatmap
- GET /api/admin/analytics/top-users

### Admin - Settings
- GET /api/admin/settings
- PUT /api/admin/settings/:key

---

**END OF IMPLEMENTATION PLAN**
