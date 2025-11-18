# Deploy PyHack - Quick Steps

## ✅ Your App Works NOW (Without Backend)

Your Vercel deployment at https://pyhack-kj6y.vercel.app/ will work in **guest mode** after you merge these changes:

### What Works:
- ✅ All 15 Python challenges
- ✅ Code execution with Pyodide
- ✅ Progress saved in browser
- ✅ Clean, professional UI

### What Needs Backend:
- ❌ User accounts
- ❌ Leaderboard
- ❌ Achievements
- ❌ Cross-device sync

## Step 1: Merge This Branch

```bash
# Merge the fixes into your main branch
git checkout main
git merge claude/fix-pyhack-challenges-01J7W8ts2AJha81bm7KnmyBG
git push origin main
```

Vercel will auto-deploy in ~2 minutes.

## Step 2: Test Your App

Visit: https://pyhack-kj6y.vercel.app/

You should see:
- ✅ App loads perfectly
- ✅ Yellow warning: "Backend Offline: Working in guest mode"
- ✅ Can solve challenges
- ✅ Progress saves locally

## Step 3: Deploy Backend (When Ready)

### Fastest: Heroku (5 minutes)

```bash
cd pyhack-backend

# Login to Heroku
heroku login

# Create app
heroku create pyhack-api

# Add database
heroku addons:create heroku-postgresql:essential-0

# Set config
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set FRONTEND_URL=https://pyhack-kj6y.vercel.app

# Deploy
git push heroku main

# Setup database
heroku run node prisma/seed.js
heroku run node scripts/createAdmin.js
```

### Update Frontend

Edit `js/config.js`:
```javascript
window.PYHACK_CONFIG = {
  API_URL: 'https://your-app-name.herokuapp.com/api',  // ← Your Heroku URL
  GUEST_MODE_ENABLED: true,
  SHOW_CONNECTION_STATUS: true,
};
```

Push to GitHub:
```bash
git add js/config.js
git commit -m "Add backend URL"
git push origin main
```

Done! Full app with accounts, leaderboard, achievements works! 🎉

---

**TL;DR:** Merge this branch → Vercel auto-deploys → App works in guest mode → Deploy backend when ready for full features.
