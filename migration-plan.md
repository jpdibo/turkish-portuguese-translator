# Migration Plan: From Flat Dictionary to Scalable Architecture

## Phase 1: Database Setup & Data Migration

### Step 1: Set up PostgreSQL Database
```bash
# Install PostgreSQL
# Create database
createdb language_learning_platform

# Run schema creation
psql -d language_learning_platform -f database-schema.sql
```

### Step 2: Data Migration Script
```javascript
// scripts/migrate-dictionary.js
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateDictionary() {
  // Read current dictionary
  const dictionary = JSON.parse(fs.readFileSync('./public/dictionary.json', 'utf8'));
  
  try {
    // Insert languages
    const turkishLang = await pool.query(
      'INSERT INTO languages (code, name, native_name) VALUES ($1, $2, $3) RETURNING id',
      ['tr', 'Turkish', 'Türkçe']
    );
    
    const portugueseLang = await pool.query(
      'INSERT INTO languages (code, name, native_name) VALUES ($1, $2, $3) RETURNING id',
      ['pt', 'Portuguese', 'Português']
    );
    
    // Insert difficulty levels
    const difficulties = await pool.query(
      'SELECT id, name FROM difficulty_levels'
    );
    
    const difficultyMap = {};
    difficulties.rows.forEach(d => {
      difficultyMap[d.name] = d.id;
    });
    
    // Insert words and translations
    for (const entry of dictionary) {
      // Insert source word (Turkish)
      const sourceWord = await pool.query(
        `INSERT INTO words (language_id, word, difficulty_level_id, frequency_rank) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [turkishLang.rows[0].id, entry.turkish, difficultyMap[entry.level], 1000]
      );
      
      // Insert target word (Portuguese)
      const targetWord = await pool.query(
        `INSERT INTO words (language_id, word, difficulty_level_id, frequency_rank) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [portugueseLang.rows[0].id, entry.portuguese, difficultyMap[entry.level], 1000]
      );
      
      // Insert translation
      await pool.query(
        `INSERT INTO translations (source_word_id, target_word_id, is_verified) 
         VALUES ($1, $2, $3)`,
        [sourceWord.rows[0].id, targetWord.rows[0].id, true]
      );
      
      // Insert example sentences
      if (entry.example_tr) {
        await pool.query(
          `INSERT INTO example_sentences (word_id, sentence) VALUES ($1, $2)`,
          [sourceWord.rows[0].id, entry.example_tr]
        );
      }
      
      if (entry.example_pt) {
        await pool.query(
          `INSERT INTO example_sentences (word_id, sentence) VALUES ($1, $2)`,
          [targetWord.rows[0].id, entry.example_pt]
        );
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateDictionary();
```

## Phase 2: Backend API Development

### Step 1: Create Express.js Backend
```bash
mkdir backend
cd backend
npm init -y
npm install express pg redis jsonwebtoken bcrypt cors helmet
npm install --save-dev nodemon
```

### Step 2: Basic API Structure
```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const wordsRoutes = require('./routes/words');
const progressRoutes = require('./routes/progress');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/progress', progressRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Database Service Layer
```javascript
// backend/services/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class DatabaseService {
  async getDailyWords(userId, date, preferences) {
    const query = `
      WITH user_progress AS (
        SELECT word_id, mastery_level 
        FROM user_word_progress 
        WHERE user_id = $1
      ),
      recent_words AS (
        SELECT DISTINCT wsi.translation_id
        FROM daily_word_sets dws
        JOIN word_set_items wsi ON dws.id = wsi.daily_word_set_id
        WHERE dws.user_id = $1 
        AND dws.date >= CURRENT_DATE - INTERVAL '7 days'
      )
      SELECT 
        w1.word as source_word,
        w2.word as target_word,
        w1.pronunciation as source_pronunciation,
        w2.pronunciation as target_pronunciation,
        es1.sentence as source_example,
        es2.sentence as target_example,
        dl.name as difficulty_level
      FROM translations t
      JOIN words w1 ON t.source_word_id = w1.id
      JOIN words w2 ON t.target_word_id = w2.id
      JOIN difficulty_levels dl ON w1.difficulty_level_id = dl.id
      LEFT JOIN example_sentences es1 ON w1.id = es1.word_id
      LEFT JOIN example_sentences es2 ON w2.id = es2.word_id
      LEFT JOIN user_progress up ON w1.id = up.word_id
      WHERE w1.language_id = $2 
        AND w2.language_id = $3
        AND w1.difficulty_level_id = $4
        AND t.id NOT IN (SELECT translation_id FROM recent_words)
        AND (up.mastery_level IS NULL OR up.mastery_level < 4)
      ORDER BY w1.frequency_rank ASC
      LIMIT $5;
    `;
    
    const result = await pool.query(query, [
      userId,
      preferences.source_language_id,
      preferences.target_language_id,
      preferences.difficulty_level_id,
      preferences.words_per_day
    ]);
    
    return result.rows;
  }
}

module.exports = new DatabaseService();
```

## Phase 3: Frontend Integration

### Step 1: Update Frontend to Use API
```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const wordService = {
  getDailyWords: (date) => api.get(`/words/daily/${date}`),
  updateMastery: (wordId, masteryLevel) => api.put(`/progress/word/${wordId}/mastery`, { masteryLevel }),
  getProgress: () => api.get('/progress/overview')
};

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout')
};
```

### Step 2: Update App Component
```jsx
// src/App.jsx
import { useState, useEffect } from 'react';
import { wordService } from './services/api';
import WordCard from './components/WordCard';
import ProgressDashboard from './components/ProgressDashboard';
import EmailSubscriptionModal from './components/EmailSubscriptionModal';

function App() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [preferences, setPreferences] = useState({
    source_language: 'tr',
    target_language: 'pt',
    difficulty: 'beginner',
    words_per_day: 5
  });

  useEffect(() => {
    loadDailyWords();
  }, [preferences]);

  const loadDailyWords = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await wordService.getDailyWords(today);
      setWords(response.data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasteryChange = async (wordId, masteryLevel) => {
    try {
      await wordService.updateMastery(wordId, masteryLevel);
      // Optionally refresh words or update local state
    } catch (error) {
      console.error('Failed to update mastery:', error);
    }
  };

  if (loading) {
    return <div className="app-container"><h2>Loading...</h2></div>;
  }

  return (
    <div className="app-container">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Daily Language Learning
        </h1>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={preferences.difficulty}
            onChange={(e) => setPreferences({...preferences, difficulty: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Subscribe to Emails
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {words.map((word, index) => (
          <WordCard
            key={index}
            word={word}
            onMasteryChange={handleMasteryChange}
          />
        ))}
      </div>

      <EmailSubscriptionModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}

export default App;
```

## Phase 4: Email Service Implementation

### Step 1: Email Service Setup
```javascript
// backend/services/emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  async sendDailyEmail(userId, wordSetId) {
    try {
      // Get user and word set data
      const user = await this.getUser(userId);
      const wordSet = await this.getWordSet(wordSetId);
      
      // Generate email content
      const emailContent = this.generateEmailContent(user, wordSet);
      
      // Send email
      await sgMail.send({
        to: user.email,
        from: 'noreply@yourdomain.com',
        subject: `Your Daily ${wordSet.target_language} Words`,
        html: emailContent.html,
        text: emailContent.text
      });
      
      // Update email queue status
      await this.updateEmailQueueStatus(wordSetId, 'sent');
      
    } catch (error) {
      console.error('Email sending failed:', error);
      await this.updateEmailQueueStatus(wordSetId, 'failed', error.message);
    }
  }
  
  generateEmailContent(user, wordSet) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily Words</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Hello ${user.first_name}!</h1>
            <p>Here are your daily ${wordSet.target_language} words:</p>
            
            ${wordSet.words.map(word => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937;">${word.source_word}</h3>
                <p style="margin: 0 0 8px 0; font-size: 18px; color: #2563eb;">${word.target_word}</p>
                <p style="margin: 0 0 4px 0; font-style: italic; color: #6b7280;">${word.source_example}</p>
                <p style="margin: 0; font-style: italic; color: #6b7280;">${word.target_example}</p>
              </div>
            `).join('')}
            
            <div style="margin-top: 32px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/words" style="color: #2563eb; text-decoration: none;">
                  Practice these words online →
                </a>
              </p>
            </div>
            
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
              <p>
                <a href="${process.env.FRONTEND_URL}/unsubscribe?token=${user.unsubscribe_token}" style="color: #6b7280;">
                  Unsubscribe
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
      Hello ${user.first_name}!
      
      Here are your daily ${wordSet.target_language} words:
      
      ${wordSet.words.map(word => `
        ${word.source_word} - ${word.target_word}
        ${word.source_example}
        ${word.target_example}
      `).join('\n\n')}
      
      Practice these words online: ${process.env.FRONTEND_URL}/words
      
      Unsubscribe: ${process.env.FRONTEND_URL}/unsubscribe?token=${user.unsubscribe_token}
    `;
    
    return { html, text };
  }
}

module.exports = new EmailService();
```

### Step 2: Email Queue Processor
```javascript
// backend/jobs/emailProcessor.js
const cron = require('node-cron');
const EmailService = require('../services/emailService');
const DatabaseService = require('../services/database');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Processing email queue...');
  
  try {
    const pendingEmails = await DatabaseService.getPendingEmails();
    
    for (const email of pendingEmails) {
      await EmailService.sendDailyEmail(email.user_id, email.daily_word_set_id);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Processed ${pendingEmails.length} emails`);
  } catch (error) {
    console.error('Email processing failed:', error);
  }
});
```

## Phase 5: Deployment & Testing

### Step 1: Environment Configuration
```bash
# .env
DATABASE_URL=postgresql://username:password@localhost:5432/language_learning_platform
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=your_sendgrid_api_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://yourdomain.com
```

### Step 2: Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/language_learning_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=language_learning_platform
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Step 3: Testing Strategy
```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('Words API', () => {
  test('GET /api/words/daily/today returns daily words', async () => {
    const response = await request(app)
      .get('/api/words/daily/today')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('words');
    expect(Array.isArray(response.body.words)).toBe(true);
  });
});
```

## Migration Timeline

### Week 1: Database & Backend
- Set up PostgreSQL database
- Run migration script
- Create basic API endpoints
- Test data integrity

### Week 2: Frontend Integration
- Update frontend to use API
- Implement authentication
- Add responsive design improvements
- Test user flows

### Week 3: Email Service
- Implement email service
- Set up email templates
- Create email queue processor
- Test email delivery

### Week 4: Deployment & Testing
- Set up production environment
- Deploy to staging
- Performance testing
- User acceptance testing

### Week 5: Launch
- Deploy to production
- Monitor performance
- Gather user feedback
- Iterate and improve

## Rollback Plan

If issues arise during migration:

1. **Database Rollback**: Keep the original `dictionary.json` file
2. **Frontend Rollback**: Maintain the current working version
3. **Gradual Migration**: Migrate users in batches
4. **Feature Flags**: Use feature flags to toggle between old and new systems

## Success Metrics

- **Performance**: API response times < 200ms
- **Reliability**: 99.9% uptime
- **User Experience**: No disruption to existing users
- **Scalability**: Support 10,000+ concurrent users
- **Email Delivery**: 95%+ email delivery rate 