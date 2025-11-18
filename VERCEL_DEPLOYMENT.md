# PyHack Vercel Deployment Guide

## Current Status

✅ **Frontend:** Deployed on Vercel at https://pyhack-kj6y.vercel.app/
❌ **Backend:** Not yet deployed (frontend works in guest mode only)

## Quick Fix: Deploy Backend to Heroku

### Option 1: Deploy Backend to Heroku (Recommended - Free Tier Available)

#### Step 1: Install Heroku CLI

```bash
# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login and Create App

```bash
# Login to Heroku
heroku login

# Navigate to backend
cd pyhack-backend

# Create Heroku app
heroku create pyhack-api-yourname
# Note the app URL (e.g., https://pyhack-api-yourname.herokuapp.com)
```

#### Step 3: Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:essential-0
```

#### Step 4: Set Environment Variables

```bash
# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="$JWT_SECRET"
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FRONTEND_URL=https://pyhack-kj6y.vercel.app

# Optional: Email configuration (if using email features)
# heroku config:set SMTP_HOST=smtp.sendgrid.net
# heroku config:set SMTP_PORT=587
# heroku config:set SMTP_USER=apikey
# heroku config:set SMTP_PASS=your_sendgrid_api_key
# heroku config:set SMTP_FROM=noreply@pyhack.com
```

#### Step 5: Create Procfile

The Procfile should already exist. If not, create `pyhack-backend/Procfile`:

```
web: node server.js
```

#### Step 6: Deploy to Heroku

```bash
# Make sure you're in pyhack-backend directory
git subtree push --prefix pyhack-backend heroku main

# Or if you haven't committed yet:
git add .
git commit -m "Prepare backend for Heroku deployment"
git push heroku main
```

#### Step 7: Initialize Database

```bash
# Seed the database
heroku run node prisma/seed.js

# Create first admin account
heroku run node scripts/createAdmin.js
```

#### Step 8: Test Backend

```bash
# Check if backend is running
curl https://pyhack-api-yourname.herokuapp.com/health

# Expected response:
# {"status":"ok","message":"PyHack API is running"}
```

#### Step 9: Update Frontend Configuration

In your local repository, update `js/config.js`:

```javascript
window.PYHACK_CONFIG = {
  // Update with your Heroku backend URL
  API_URL: 'https://pyhack-api-yourname.herokuapp.com/api',

  GUEST_MODE_ENABLED: true,
  SHOW_CONNECTION_STATUS: true,
};
```

#### Step 10: Push to GitHub (Auto-Deploy to Vercel)

```bash
git add js/config.js
git commit -m "Configure backend URL for production"
git push origin main
```

Vercel will automatically redeploy with the new backend URL!

---

## Option 2: Deploy Backend to Render.com (Alternative Free Option)

### Step 1: Create Account

1. Go to https://render.com
2. Sign up with GitHub

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `pyhack-backend` directory
4. Configuration:
   - **Name:** pyhack-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

### Step 3: Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Name it `pyhack-db`
3. Plan: Free
4. Copy the "Internal Database URL"

### Step 4: Set Environment Variables

In your web service dashboard, add:

```
NODE_ENV=production
DATABASE_URL=<paste internal database URL>
JWT_SECRET=<generate random 32+ character string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://pyhack-kj6y.vercel.app
```

### Step 5: Deploy

Render will auto-deploy. Wait for it to complete.

### Step 6: Initialize Database

```bash
# Using Render Shell (from dashboard)
node prisma/seed.js
node scripts/createAdmin.js
```

### Step 7: Update Frontend

Update `js/config.js` with your Render URL:

```javascript
window.PYHACK_CONFIG = {
  API_URL: 'https://pyhack-backend.onrender.com/api',
  // ...
};
```

---

## Option 3: Temporary - Work Without Backend (Current State)

Your app currently works in **guest mode**:

✅ All 15 Python challenges work
✅ Code validation works (client-side with Pyodide)
✅ Progress saved in browser localStorage
❌ No user accounts
❌ No leaderboard
❌ No achievements syncing
❌ Progress not saved across devices

This is fine for:
- Testing the app
- Solo learning
- Demo purposes

To enable full features, deploy the backend using Option 1 or 2 above.

---

## Verification Checklist

After deploying backend:

### 1. Test Backend Health

```bash
curl https://your-backend-url.herokuapp.com/health
```

Should return:
```json
{"status":"ok","message":"PyHack API is running"}
```

### 2. Test Challenges Endpoint

```bash
curl https://your-backend-url.herokuapp.com/api/challenges
```

Should return array of 15 challenges.

### 3. Test Frontend Connection

1. Open https://pyhack-kj6y.vercel.app/
2. Open browser console (F12)
3. Look for: `✅ Backend connected: https://your-backend-url.herokuapp.com/api`
4. If you see `⚠️ Backend not available`, check:
   - Backend is running
   - CORS is configured correctly
   - API URL in config.js is correct

### 4. Test User Registration

1. Click "Sign Up"
2. Fill form and submit
3. Should receive success message
4. Check backend logs: `heroku logs --tail`

### 5. Test Challenge Submission

1. Login with your account
2. Complete challenge 1
3. Check if achievement unlocks
4. Verify in dashboard

---

## Troubleshooting

### "Backend Offline" Warning

**Problem:** Yellow warning banner appears on app

**Solutions:**
1. Backend not deployed yet → Deploy using Option 1 or 2
2. Wrong API URL in config.js → Update with correct URL
3. Backend crashed → Check Heroku logs: `heroku logs --tail`
4. CORS error → Verify Vercel URL is in allowed origins

### CORS Errors

**Problem:** Console shows "blocked by CORS policy"

**Solution:**
1. Check `server.js` has your Vercel URL in `allowedOrigins`
2. Redeploy backend
3. Clear browser cache

### Database Connection Errors

**Problem:** Backend logs show "Cannot connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is set: `heroku config:get DATABASE_URL`
2. Check PostgreSQL addon is created: `heroku addons`
3. Restart dynos: `heroku restart`

### 502 Bad Gateway

**Problem:** Backend URL returns 502

**Solutions:**
1. Check if dyno is running: `heroku ps`
2. View logs: `heroku logs --tail`
3. Restart: `heroku restart`

---

## Cost Estimate

### Heroku Free Tier
- ✅ Web Dyno: Free (sleeps after 30 min of inactivity)
- ✅ PostgreSQL: Free (10,000 rows max)
- ⚠️ Wakes up when accessed (2-3 second delay)

### Heroku Hobby Tier ($7/month)
- ✅ Always on (no sleep)
- ✅ PostgreSQL: 10M rows
- ✅ SSL included

### Render Free Tier
- ✅ Completely free
- ✅ Auto-sleep after 15 min inactivity
- ✅ 750 hours/month free

---

## Quick Start Commands

```bash
# Deploy backend to Heroku
cd pyhack-backend
heroku create pyhack-api
heroku addons:create heroku-postgresql:essential-0
heroku config:set NODE_ENV=production JWT_SECRET=$(openssl rand -base64 32)
git push heroku main
heroku run node prisma/seed.js
heroku run node scripts/createAdmin.js

# Update frontend config
cd ..
# Edit js/config.js with your Heroku URL
git add js/config.js
git commit -m "Add production backend URL"
git push origin main

# Done! Vercel will auto-deploy
```

---

## Next Steps

1. **Deploy Backend** (choose Option 1 or 2)
2. **Update config.js** with backend URL
3. **Push to GitHub** (Vercel auto-deploys)
4. **Test everything** using checklist above
5. **Create admin account** for dashboard access
6. **Share your app!** 🎉

---

## Need Help?

- Check DEPLOYMENT.md for detailed deployment guides
- Check TESTING_GUIDE.md for testing procedures
- Check backend logs: `heroku logs --tail`
- Check browser console for frontend errors

**Your app is 90% ready - just needs backend deployment!** 🚀
