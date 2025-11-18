# PyHack Complete Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Initialization](#database-initialization)
5. [Creating First Admin](#creating-first-admin)
6. [Running the Application](#running-the-application)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up PyHack, ensure you have the following installed:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **Git** (for version control)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

Check your versions:
```bash
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd pyhack-backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- Express.js (web framework)
- better-sqlite3 (database)
- bcrypt (password hashing)
- jsonwebtoken (authentication)
- And more...

### 3. Configure Environment Variables

Create a `.env` file in the `pyhack-backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
# For Gmail, use app-specific password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@pyhack.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

**Important Security Notes:**
- Change `JWT_SECRET` to a long, random string in production
- Never commit `.env` file to version control
- Use app-specific passwords for Gmail (Settings → Security → App Passwords)

## Database Initialization

### 1. Seed the Database

The seed script will create:
- 15 Python challenges
- 8 achievements
- System settings

```bash
npm run seed
```

Expected output:
```
✓ Created challenge 1: Hello World
✓ Created challenge 2: Variables & Numbers
...
✓ Created achievement: First Steps
✓ Created achievement: Python Novice
...
✓ All seed data inserted successfully!
```

### 2. Verify Database

Check that `dev.db` file was created in `pyhack-backend` directory.

## Creating First Admin

You need at least one admin account to access the admin dashboard.

### Run the Admin Creation Script

```bash
node scripts/createAdmin.js
```

You'll be prompted to enter:

```
=== Create Super Admin Account ===

Email: admin@pyhack.com
Username: admin
Password: ********
First Name: Admin
Last Name: User

✓ Super Admin created successfully!

Account Details:
  ID: a1b2c3d4-...
  Email: admin@pyhack.com
  Username: admin
  Role: SUPER_ADMIN
```

**Save these credentials!** You'll need them to log in.

## Running the Application

### 1. Start the Backend Server

From the `pyhack-backend` directory:

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
Database connected successfully
```

### 2. Start the Frontend

Open a new terminal window and navigate to the project root:

```bash
cd ..  # Go back to pyhack root directory
```

If you have Python installed, use the built-in HTTP server:

```bash
# Python 3
python -m http.server 8080

# Python 2 (legacy)
python -m SimpleHTTPServer 8080
```

Or use Node.js `http-server`:

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run server
http-server -p 8080
```

Or use VS Code Live Server extension:
- Install "Live Server" extension
- Right-click `index.html`
- Select "Open with Live Server"

### 3. Access the Application

- **Main App**: http://localhost:8080
- **Admin Dashboard**: http://localhost:8080/admin.html
- **Backend API**: http://localhost:5000/api

## First Time Usage

### 1. Create a User Account

1. Open http://localhost:8080
2. Click "Sign Up" in the header
3. Fill in the registration form:
   - Email: your@email.com
   - Username: yourname
   - First Name: Your
   - Last Name: Name
   - Password: (at least 6 characters)
4. Click "Create Account"

You should see a success message and be automatically logged in.

### 2. Test a Challenge

1. The app loads with Challenge 1 (Hello World)
2. Write your code in the editor:
   ```python
   print("Hello, World!")
   ```
3. Click "Run Code"
4. If correct, you'll see a success message and earn points

### 3. Access Your Dashboard

1. Click your username in the top-right
2. Select "Dashboard"
3. View your:
   - Completed challenges
   - Total points
   - Current streak

### 4. Access Admin Panel (Admin Only)

1. Log in with your admin account
2. Click your username → "Admin Panel"
3. You'll see the admin dashboard with:
   - User management
   - Challenge management
   - Analytics
   - System settings

## Configuration

### Backend API URL

If your backend is running on a different port or host, update the API URL in `js/api-service.js`:

```javascript
constructor() {
  this.baseURL = 'http://localhost:5000/api';  // Change this
  this.token = localStorage.getItem('pyhack-token');
}
```

### Email Configuration

For email verification and password reset features:

#### Gmail Setup

1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Update `.env`:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

#### Other SMTP Services

- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: Varies by region

### Database Migration (SQLite to PostgreSQL)

For production, switch to PostgreSQL:

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE pyhack;
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pyhack"
   ```
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from sqlite
     url      = env("DATABASE_URL")
   }
   ```
5. Run migrations and seed

## Troubleshooting

### Backend Issues

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Kill the process using port 5000
```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Or change the port in `.env`:
```env
PORT=5001
```

#### Database Errors

```
Error: Cannot find module 'better-sqlite3'
```

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

#### JWT Errors

```
Error: jwt malformed
```

**Solution**: Clear browser localStorage
```javascript
// In browser console
localStorage.clear()
```
Then log in again.

### Frontend Issues

#### API Connection Failed

```
Failed to fetch
```

**Checklist**:
1. Is the backend server running? (Check http://localhost:5000)
2. Is CORS configured correctly? (Check `.env` FRONTEND_URL)
3. Is the API URL correct in `js/api-service.js`?

#### Pyodide Loading Issues

If Python code execution fails:

1. Check browser console for errors
2. Ensure you have internet connection (Pyodide loads from CDN)
3. Try a different browser
4. Clear browser cache

#### Login Issues

If login fails even with correct credentials:

1. Check backend logs for errors
2. Verify user exists in database:
   ```bash
   sqlite3 pyhack-backend/dev.db "SELECT * FROM User WHERE username='yourname';"
   ```
3. Check password was hashed correctly
4. Clear browser localStorage and try again

### Common Issues

#### "Access Denied" on Admin Panel

**Cause**: User account doesn't have admin privileges

**Solution**: Update user role in database
```bash
sqlite3 pyhack-backend/dev.db "UPDATE User SET role='ADMIN' WHERE username='yourname';"
```

#### Email Not Sending

**Causes**:
- Invalid SMTP credentials
- SMTP server blocking
- Firewall issues

**Solutions**:
1. Test SMTP credentials with a test script
2. Check SMTP server logs
3. Use a different SMTP service
4. For development, set `REQUIRE_EMAIL_VERIFICATION=false` in settings

## Development Tips

### Hot Reload

For automatic server restart on code changes:

```bash
npm install -g nodemon
nodemon server.js
```

### Database Inspection

View database contents:

```bash
# Install SQLite browser (one-time)
# Mac: brew install sqlite-browser
# Windows: Download from sqlitebrowser.org

# Open database
sqlite3 pyhack-backend/dev.db
```

Useful queries:
```sql
-- View all users
SELECT id, username, email, role, isActive FROM User;

-- View user progress
SELECT u.username, c.title, up.isCompleted, up.attempts
FROM UserProgress up
JOIN User u ON up.userId = u.id
JOIN Challenge c ON up.challengeId = c.id;

-- View leaderboard
SELECT username, points, challengesCompleted
FROM User
ORDER BY points DESC
LIMIT 10;
```

### Logging

Enable debug logging:

```env
NODE_ENV=development
DEBUG=express:*
```

## Next Steps

1. **Customize Challenges**: Edit challenges in admin panel
2. **Configure Settings**: Adjust platform settings via admin dashboard
3. **Setup Email**: Configure SMTP for email features
4. **Deploy**: See DEPLOYMENT.md for production deployment

## Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs: `pyhack-backend/logs/`
- Check browser console for frontend errors
- Refer to API documentation in `pyhack-backend/README.md`

## Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set strong password requirements
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Enable email verification
- [ ] Review audit logs regularly
- [ ] Keep dependencies updated
- [ ] Use environment variables for all secrets

---

**Congratulations!** Your PyHack platform is now set up and ready to use! 🎉
