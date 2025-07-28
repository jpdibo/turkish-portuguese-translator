# Deployment Guide - Turkish Portuguese Translator

## 🚀 Quick Deployment Steps

### 1. Frontend Deployment (Vercel)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect it's a Vite project
   - Deploy!

3. **Update vercel.json**
   - Replace `https://your-backend-url.com` with your actual backend URL

### 2. Database Setup (MySQL)

**Option A: PlanetScale (Recommended)**
- Free tier: 1 database, 1 billion reads/month
- Go to [planetscale.com](https://planetscale.com)
- Create account and new database
- Get connection string

**Option B: Railway**
- Go to [railway.app](https://railway.app)
- Create new project
- Add MySQL service
- Get connection details

**Option C: Local MySQL**
```bash
# Install MySQL locally
# Create database
mysql -u root -p
CREATE DATABASE turkish_portuguese_db;
CREATE USER 'app_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON turkish_portuguese_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

### 3. Backend Deployment

**Option A: Render (Recommended - Free)**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: turkish-portuguese-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
6. Add environment variables:
   ```
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=turkish_portuguese_db
   JWT_SECRET=your-super-secret-jwt-key
   SENDGRID_API_KEY=your_sendgrid_key
   EMAIL_FROM=noreply@yourdomain.com
   FRONTEND_URL=https://your-vercel-app.vercel.app
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

**Option B: Fly.io (Free)**
1. Go to [fly.io](https://fly.io)
2. Sign up and install flyctl
3. Run: `fly launch`
4. Follow prompts to deploy

**Option C: Cyclic.sh (Free)**
1. Go to [cyclic.sh](https://cyclic.sh)
2. Connect GitHub repo
3. Auto-deploys on push

### 4. SendGrid Setup

1. **Create SendGrid Account**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up (free tier: 100 emails/day)

2. **Get API Key**
   - Go to Settings → API Keys
   - Create new API Key
   - Select "Mail Send" permissions

3. **Verify Sender**
   - Go to Settings → Sender Authentication
   - Verify your email or domain

4. **Add to Environment Variables**
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=your_verified_email@domain.com
   ```

### 5. Database Migration

Once your backend is deployed:

1. **Switch to MySQL in your backend**
   ```bash
   # In backend directory
   npm install mysql2
   ```

2. **Update database.js to use MySQL**
   - Replace `require('./database')` with `require('./database-mysql')`

3. **Run database setup**
   ```bash
   # This will create tables and import words
   npm run setup
   ```

### 6. Final Configuration

1. **Update Frontend API URL**
   - In your frontend code, update API calls to point to your backend URL
   - Example: `https://your-backend.railway.app/api/words`

2. **Test Everything**
   - Test word loading
   - Test email subscription
   - Test voice functionality

## 🔧 Environment Variables Summary

### Frontend (Vite)
```env
VITE_API_URL=https://your-backend-url.com
```

### Backend
```env
# Database
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=turkish_portuguese_db
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Turkish Portuguese Translator

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

## 💰 Cost Breakdown

- **Vercel**: Free tier (unlimited personal projects)
- **PlanetScale**: Free tier (1 database, 1B reads/month)
- **Render**: Free tier (750 hours/month)
- **SendGrid**: Free tier (100 emails/day)

**Total monthly cost: $0** (completely free!)

## 🎯 Next Steps

1. Deploy frontend to Vercel
2. Set up MySQL database
3. Deploy backend to Railway
4. Configure SendGrid
5. Test everything works
6. Share your live app!

Your Turkish-Portuguese translator will be live and ready for users! 🎉 