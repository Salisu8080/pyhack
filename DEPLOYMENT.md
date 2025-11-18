# PyHack Deployment Guide

Complete guide for deploying PyHack to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Heroku Deployment](#heroku-deployment)
4. [DigitalOcean/VPS Deployment](#digitalocean-vps-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Frontend Deployment (Netlify/Vercel)](#frontend-deployment)
7. [Database Migration](#database-migration)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

Before deploying to production:

### Security
- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Use HTTPS for all connections
- [ ] Configure CORS to only allow your frontend domain
- [ ] Enable rate limiting
- [ ] Set strong password requirements
- [ ] Review and remove any console.log statements
- [ ] Enable email verification
- [ ] Configure proper SMTP credentials

### Database
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Run database migrations
- [ ] Seed initial data (challenges, achievements)
- [ ] Set up database backups
- [ ] Create first admin account

### Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper frontend URL
- [ ] Set up environment variables
- [ ] Test all API endpoints
- [ ] Verify email sending works

### Code
- [ ] Run linter and fix issues
- [ ] Remove development dependencies
- [ ] Minify frontend assets (if applicable)
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness

## Environment Setup

### Production Environment Variables

Create a `.env.production` file:

```env
# Environment
NODE_ENV=production

# Server
PORT=5000
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/pyhack

# JWT
JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_MINIMUM_32_CHARACTERS
JWT_EXPIRES_IN=7d

# Email (Production SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=5242880

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Generate Secure JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Heroku Deployment

### 1. Install Heroku CLI

```bash
# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create Heroku App

```bash
cd pyhack-backend
heroku create your-app-name
```

### 4. Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:essential-0
```

This creates a PostgreSQL database and sets `DATABASE_URL` automatically.

### 5. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FRONTEND_URL=https://your-frontend-url.netlify.app

# Email configuration
heroku config:set SMTP_HOST=smtp.sendgrid.net
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=apikey
heroku config:set SMTP_PASS=your_sendgrid_api_key
heroku config:set SMTP_FROM=noreply@yourdomain.com
```

### 6. Create Procfile

Create `pyhack-backend/Procfile`:

```
web: node server.js
```

### 7. Deploy to Heroku

```bash
git add Procfile
git commit -m "Add Procfile for Heroku"
git push heroku main
```

### 8. Initialize Database

```bash
# Seed database
heroku run node prisma/seed.js

# Create admin
heroku run node scripts/createAdmin.js
```

### 9. Open Your App

```bash
heroku open
```

Your API will be available at: `https://your-app-name.herokuapp.com/api`

## DigitalOcean / VPS Deployment

### 1. Create a Droplet

- Choose Ubuntu 22.04 LTS
- Minimum: 1GB RAM, 1 vCPU
- Recommended: 2GB RAM, 2 vCPUs

### 2. SSH into Server

```bash
ssh root@your_server_ip
```

### 3. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### 4. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE pyhack;
CREATE USER pyhackuser WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE pyhack TO pyhackuser;
\q
```

### 5. Clone and Setup Application

```bash
# Create app directory
mkdir -p /var/www/pyhack
cd /var/www/pyhack

# Clone repository
git clone https://github.com/yourusername/pyhack.git .

# Setup backend
cd pyhack-backend
npm install --production

# Create .env file
nano .env
# (Paste production environment variables)

# Seed database
npm run seed

# Create admin
node scripts/createAdmin.js
```

### 6. Configure PM2

```bash
# Start application
pm2 start server.js --name pyhack-api

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/pyhack`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/pyhack;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /js {
        alias /var/www/pyhack/js;
    }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/pyhack /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### 9. Setup Firewall

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 10. Monitor Application

```bash
# View logs
pm2 logs pyhack-api

# Monitor processes
pm2 monit

# Check status
pm2 status
```

## Docker Deployment

### 1. Create Dockerfile

Create `pyhack-backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
```

### 2. Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: pyhackuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: pyhack
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./pyhack-backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pyhackuser:${DB_PASSWORD}@postgres:5432/pyhack
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      FRONTEND_URL: ${FRONTEND_URL}
    depends_on:
      - postgres
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./:/usr/share/nginx/html:ro
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. Create .env for Docker

```env
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### 4. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Seed database
docker-compose exec backend npm run seed

# Create admin
docker-compose exec backend node scripts/createAdmin.js

# Stop
docker-compose down
```

## Frontend Deployment

### Netlify

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to https://netlify.com
   - Click "New site from Git"
   - Choose GitHub repository
   - Configure:
     - Build command: (leave empty)
     - Publish directory: `/`
   - Click "Deploy site"

3. **Update API URL**:
   - After deployment, update `js/api-service.js`:
     ```javascript
     this.baseURL = 'https://your-api-domain.herokuapp.com/api';
     ```
   - Commit and push changes

4. **Configure Custom Domain** (optional):
   - In Netlify dashboard, go to Domain settings
   - Add custom domain
   - Update DNS records as instructed

### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Set root directory to project root
   - Deploy

4. **Update API URL** in `js/api-service.js`

## Database Migration

### From SQLite to PostgreSQL

1. **Export data from SQLite**:
   ```bash
   sqlite3 dev.db .dump > backup.sql
   ```

2. **Create PostgreSQL database**:
   ```bash
   createdb pyhack
   ```

3. **Update schema**:
   - Edit `prisma/schema.prisma`
   - Change `provider = "sqlite"` to `provider = "postgresql"`

4. **Run seed script** on PostgreSQL:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/pyhack" npm run seed
   ```

5. **Recreate admin account**:
   ```bash
   DATABASE_URL="postgresql://user:pass@localhost:5432/pyhack" node scripts/createAdmin.js
   ```

## Post-Deployment

### 1. Verify Deployment

Test all endpoints:

```bash
# Health check
curl https://api.yourdomain.com/api/challenges

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"Test1234","firstName":"Test","lastName":"User"}'
```

### 2. Setup Monitoring

#### Sentry (Error Tracking)

```bash
npm install @sentry/node
```

Add to `server.js`:

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

#### UptimeRobot (Uptime Monitoring)

1. Go to https://uptimerobot.com
2. Add monitor for your API and frontend
3. Set check interval to 5 minutes
4. Configure alert contacts

### 3. Setup Backups

```bash
# Automated PostgreSQL backup (add to crontab)
0 2 * * * pg_dump pyhack > /backups/pyhack_$(date +\%Y\%m\%d).sql
```

### 4. Configure CDN (Optional)

Use Cloudflare for:
- DDoS protection
- SSL/TLS
- Caching
- Performance optimization

## Monitoring & Maintenance

### Regular Checks

- [ ] Monitor error logs daily
- [ ] Check database performance weekly
- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Test backup restoration quarterly

### Performance Monitoring

```bash
# Check PM2 metrics
pm2 monit

# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk space
df -h
```

### Updating Application

```bash
# On VPS
cd /var/www/pyhack/pyhack-backend
git pull origin main
npm install --production
pm2 restart pyhack-api

# With Docker
docker-compose pull
docker-compose up -d --build
```

### Database Maintenance

```bash
# Vacuum database
psql pyhack -c "VACUUM ANALYZE;"

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('pyhack'));"
```

## Troubleshooting

### Common Issues

**502 Bad Gateway**:
- Check if Node.js process is running
- Check PM2 logs: `pm2 logs`
- Verify Nginx configuration: `nginx -t`

**Database Connection Errors**:
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `systemctl status postgresql`
- Check connection limits: `psql -c "SHOW max_connections;"`

**Email Not Sending**:
- Verify SMTP credentials
- Check firewall allows outbound port 587
- Test SMTP connection with telnet

**High Memory Usage**:
- Restart PM2: `pm2 restart all`
- Check for memory leaks in logs
- Consider upgrading server resources

## Security Best Practices

1. **Keep Software Updated**:
   ```bash
   apt update && apt upgrade -y
   npm audit fix
   ```

2. **Use Fail2Ban**:
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```

3. **Regular Backups**:
   - Automate database backups
   - Test restoration process
   - Store backups off-site

4. **Monitor Logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   pm2 logs pyhack-api --lines 100
   ```

5. **SSL/TLS Configuration**:
   - Use strong ciphers
   - Enable HSTS
   - Test with SSL Labs

---

**Congratulations!** Your PyHack platform is now deployed and running in production! 🚀
