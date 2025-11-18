# PyHack Backend API

Production-ready backend API for the PyHack Python learning platform.

## Features

- ✅ Complete user authentication with JWT
- ✅ Challenge management and progress tracking
- ✅ Leaderboards and achievements
- ✅ Admin system for platform management
- ✅ Analytics and reporting
- ✅ Security best practices

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Seed database with challenges and achievements
node prisma/seed.js

# Create first super admin
node scripts/createAdmin.js
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## API Documentation

### Base URL
`http://localhost:5000/api`

### Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication (`/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /verify/:token` - Verify email
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /me` - Get current user (requires auth)

#### Users (`/users`)
- `GET /profile` - Get profile (requires auth)
- `PUT /profile` - Update profile (requires auth)
- `POST /change-password` - Change password (requires auth)
- `POST /avatar` - Upload avatar (requires auth)
- `DELETE /account` - Delete account (requires auth)
- `GET /stats` - Get user statistics (requires auth)

#### Challenges (`/challenges`)
- `GET /` - Get all challenges
- `GET /:id` - Get single challenge
- `POST /:id/submit` - Submit code (requires auth)
- `GET /progress/all` - Get user progress (requires auth)
- `DELETE /:id/progress` - Reset progress (requires auth)

#### Leaderboard (`/leaderboard`)
- `GET /global` - Global leaderboard
- `GET /weekly` - Weekly leaderboard

#### Achievements (`/achievements`)
- `GET /` - Get all achievements
- `GET /user` - Get user achievements (requires auth)

#### Admin (`/admin`) - Requires Admin Role
All admin endpoints require authentication and admin/super_admin role.

**Users:**
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (super admin only)
- `PATCH /users/:id/status` - Toggle status
- `POST /users/:id/reset-password` - Reset password

**Challenges:**
- `GET /challenges` - All challenges
- `POST /challenges` - Create challenge
- `PUT /challenges/:id` - Update challenge
- `DELETE /challenges/:id` - Delete challenge
- `PATCH /challenges/:id/status` - Toggle status
- `POST /challenges/reorder` - Reorder challenges
- `GET /challenges/:id/stats` - Get statistics

**Analytics:**
- `GET /analytics/overview` - Overview stats
- `GET /analytics/user-growth` - User growth
- `GET /analytics/completion-rates` - Completion rates
- `GET /analytics/activity-heatmap` - Activity heatmap
- `GET /analytics/top-users` - Top users

**Settings:**
- `GET /settings` - Get all settings
- `PUT /settings/:key` - Update setting
- `GET /logs` - Get audit logs

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
NODE_ENV=development
PORT=5000

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@pyhack.com

# Frontend
FRONTEND_URL=http://localhost:8080

# Uploads
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

## Database

Uses SQLite by default (easy for development). For production, switch to PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pyhack"
```

Update `prisma/schema.prisma` datasource to `postgresql`.

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens for authentication
- Rate limiting on sensitive endpoints
- Input validation with Joi
- Helmet security headers
- CORS configuration
- Audit logging for admin actions

## Project Structure

```
pyhack-backend/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # Request handlers
│   │   └── admin/        # Admin controllers
│   ├── middleware/       # Auth, validation, errors
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── utils/            # Utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.js           # Seed script
├── scripts/
│   └── createAdmin.js    # Create admin
├── uploads/              # User uploads
├── server.js             # Main entry point
└── package.json
```

## Scripts

```bash
# Seed database
npm run seed

# Create admin
node scripts/createAdmin.js

# Start development
npm run dev

# Start production
npm start

# Run tests
npm test
```

## Testing

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"Test1234"}'

# Get challenges
curl http://localhost:5000/api/challenges

# Submit code (with auth token)
curl -X POST http://localhost:5000/api/challenges/1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"code":"print(\"Hello, World!\")","output":"Hello, World!"}'
```

## Deployment

### Heroku

```bash
git push heroku main
heroku run node prisma/seed.js
heroku run node scripts/createAdmin.js
```

### DigitalOcean/VPS

```bash
# Install Node.js, setup environment
npm install --production
npm run seed
npm start

# Use PM2 for process management
pm2 start server.js --name pyhack-api
```

## License

MIT

## Support

For issues and questions, see the main project documentation.
