# Language Learning Platform Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete language learning platform with email service, responsive frontend, and scalable backend.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis (optional, for caching)
- SendGrid account (for email service)

## Step 1: Database Setup

### 1.1 Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 1.2 Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE language_learning_platform;
CREATE USER languser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE language_learning_platform TO languser;
\q
```

### 1.3 Run Database Schema
```bash
# Navigate to backend directory
cd backend

# Run the schema creation
psql -h localhost -U languser -d language_learning_platform -f database-schema.sql
```

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
```env
# Database
DATABASE_URL=postgresql://languser:your_password@localhost:5432/language_learning_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Language Learning Platform

# App Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 2.3 Migrate Dictionary Data
```bash
# Run the migration script
npm run migrate
```

### 2.4 Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3001`

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
# Navigate to project root
cd ..

# Install frontend dependencies
npm install
```

### 3.2 Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Step 4: Email Service Setup

### 4.1 SendGrid Configuration

1. Create a SendGrid account at https://sendgrid.com/
2. Create an API key with "Mail Send" permissions
3. Verify your sender domain or use a single sender verification
4. Add the API key to your `.env` file

### 4.2 Test Email Service
```bash
# The email processor starts automatically with the backend
# Check logs for email processing status
```

## Step 5: Testing the Platform

### 5.1 Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Get languages (public endpoint)
curl http://localhost:3001/api/words/languages

# Get difficulty levels (public endpoint)
curl http://localhost:3001/api/words/difficulty-levels
```

### 5.2 Test Frontend Features
1. Open `http://localhost:5173` in your browser
2. Test responsive design on different screen sizes
3. Try the email subscription modal
4. Test word mastery tracking
5. Check progress dashboard

## Step 6: Production Deployment

### 6.1 Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
SENDGRID_API_KEY=your_production_sendgrid_key
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### 6.2 Build Frontend
```bash
npm run build
```

### 6.3 Deploy Backend
```bash
# Using PM2 for process management
npm install -g pm2
pm2 start backend/server.js --name "language-learning-api"

# Or using Docker
docker build -t language-learning-backend .
docker run -p 3001:3001 --env-file .env language-learning-backend
```

## Step 7: Monitoring and Maintenance

### 7.1 Email Queue Monitoring
The email processor runs automatically and logs:
- Daily word set generation
- Email queue processing
- Failed email attempts
- User subscription changes

### 7.2 Database Maintenance
```sql
-- Check email queue status
SELECT status, COUNT(*) FROM email_queue GROUP BY status;

-- Check user subscriptions
SELECT COUNT(*) FROM user_preferences WHERE is_email_subscribed = true;

-- Monitor word progress
SELECT difficulty_level_id, COUNT(*) FROM user_word_progress GROUP BY difficulty_level_id;
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure user has proper permissions

2. **Email Not Sending**
   - Verify SendGrid API key
   - Check sender email verification
   - Review email queue logs

3. **Frontend Not Loading**
   - Check if backend is running
   - Verify CORS configuration
   - Check browser console for errors

4. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure user is verified

### Logs and Debugging

```bash
# Backend logs
npm run dev  # Shows detailed logs

# Email processor logs
# Check console output for email processing status

# Database queries
# Enable query logging in PostgreSQL for debugging
```

## Next Steps

1. **Add More Languages**: Extend the database with new language pairs
2. **Implement User Authentication**: Add login/register functionality
3. **Add Spaced Repetition**: Implement advanced learning algorithms
4. **Analytics Dashboard**: Add detailed learning analytics
5. **Mobile App**: Create React Native mobile application
6. **Social Features**: Add user communities and sharing

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

## Architecture Overview

```
Frontend (React + Tailwind) 
    ↓
Backend API (Express + PostgreSQL)
    ↓
Email Service (SendGrid + Cron Jobs)
    ↓
Database (PostgreSQL with normalized schema)
```

The platform is now ready for production use with:
- ✅ Responsive design for all devices
- ✅ Daily email subscriptions
- ✅ Scalable database architecture
- ✅ User progress tracking
- ✅ Modern UI/UX
- ✅ Email service with queue processing 