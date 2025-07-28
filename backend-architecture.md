# Backend Architecture for Language Learning Platform

## Technology Stack
- **Framework**: Node.js with Express.js or Fastify
- **Database**: PostgreSQL (primary) + Redis (caching)
- **Authentication**: JWT tokens
- **Email Service**: SendGrid or AWS SES
- **File Storage**: AWS S3 or similar
- **Deployment**: Docker + Kubernetes or Vercel/Railway
- **Monitoring**: Sentry, LogRocket

## API Structure

### Core Services

#### 1. Authentication Service
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify-email/:token
```

#### 2. User Management Service
```
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/preferences
PUT    /api/users/preferences
POST   /api/users/subscribe-email
DELETE /api/users/unsubscribe-email
```

#### 3. Language & Vocabulary Service
```
GET /api/languages
GET /api/languages/:id
GET /api/language-pairs
GET /api/categories
GET /api/words
GET /api/words/:id
GET /api/words/:id/examples
GET /api/translations/:sourceWordId
```

#### 4. Daily Words Service
```
GET  /api/daily-words/today
GET  /api/daily-words/:date
POST /api/daily-words/generate
GET  /api/daily-words/history
```

#### 5. Progress Tracking Service
```
GET    /api/progress/overview
GET    /api/progress/words
POST   /api/progress/word/:wordId
PUT    /api/progress/word/:wordId/mastery
GET    /api/progress/stats
```

#### 6. Email Service
```
POST /api/email/send-daily
POST /api/email/send-custom
GET  /api/email/queue/status
POST /api/email/unsubscribe/:token
```

## Service Layer Architecture

### 1. Word Generation Service
```javascript
class WordGenerationService {
  async generateDailyWords(userId, preferences) {
    // 1. Get user's learning preferences
    // 2. Filter words by difficulty and category
    // 3. Apply spaced repetition algorithm
    // 4. Ensure no duplicates from recent days
    // 5. Create daily word set
  }
}
```

### 2. Email Service
```javascript
class EmailService {
  async sendDailyEmail(userId, wordSetId) {
    // 1. Get user preferences and word set
    // 2. Generate personalized email content
    // 3. Send via email provider
    // 4. Update email queue status
  }
  
  async processEmailQueue() {
    // Cron job to process pending emails
  }
}
```

### 3. Progress Tracking Service
```javascript
class ProgressService {
  async updateWordMastery(userId, wordId, masteryLevel) {
    // 1. Update user progress
    // 2. Calculate next review date (spaced repetition)
    // 3. Update learning statistics
  }
}
```

## Database Queries Optimization

### 1. Daily Word Generation Query
```sql
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
  es2.sentence as target_example
FROM translations t
JOIN words w1 ON t.source_word_id = w1.id
JOIN words w2 ON t.target_word_id = w2.id
LEFT JOIN example_sentences es1 ON w1.id = es1.word_id
LEFT JOIN example_sentences es2 ON w2.id = es2.word_id
WHERE w1.language_id = $2 
  AND w2.language_id = $3
  AND w1.difficulty_level_id = $4
  AND t.id NOT IN (SELECT translation_id FROM recent_words)
  AND (up.mastery_level IS NULL OR up.mastery_level < 4)
ORDER BY w1.frequency_rank ASC
LIMIT $5;
```

### 2. User Progress Overview Query
```sql
SELECT 
  COUNT(DISTINCT up.word_id) as total_words_learned,
  AVG(up.mastery_level) as average_mastery,
  COUNT(CASE WHEN up.mastery_level >= 4 THEN 1 END) as mastered_words,
  COUNT(CASE WHEN up.next_review <= CURRENT_TIMESTAMP THEN 1 END) as words_due_review
FROM user_word_progress up
WHERE up.user_id = $1;
```

## Caching Strategy

### Redis Cache Keys
```
user:preferences:{userId}
daily_words:{userId}:{date}
word_progress:{userId}:{wordId}
language_pairs
categories
```

## Email Templates

### Daily Email Template Variables
```javascript
{
  user_name: "John",
  word_count: 5,
  source_language: "Turkish",
  target_language: "Portuguese",
  words: [
    {
      source_word: "elma",
      target_word: "maçã",
      source_example: "Ben bir elma yiyorum.",
      target_example: "Eu estou comendo uma maçã."
    }
  ],
  progress_stats: {
    total_words: 150,
    mastered_words: 45,
    streak_days: 7
  }
}
```

## Security Considerations

### 1. Authentication
- JWT tokens with refresh mechanism
- Rate limiting on auth endpoints
- Password hashing with bcrypt
- Email verification for new accounts

### 2. Data Protection
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- HTTPS enforcement

### 3. Email Security
- Unsubscribe tokens
- Email validation
- Spam protection

## Deployment Architecture

### Development Environment
```
Frontend (React) → Backend API → PostgreSQL
                    ↓
                  Redis Cache
```

### Production Environment
```
CDN → Load Balancer → API Servers → Database Cluster
                      ↓
                    Redis Cluster
                      ↓
                  Email Service
```

## Monitoring & Analytics

### Key Metrics
- Daily active users
- Email open rates
- Word completion rates
- User retention
- API response times

### Logging
- User actions
- API requests
- Error tracking
- Performance metrics

## Scalability Considerations

### 1. Database Scaling
- Read replicas for analytics
- Connection pooling
- Query optimization
- Partitioning for large tables

### 2. Application Scaling
- Horizontal scaling with load balancers
- Microservices architecture
- Caching layers
- CDN for static assets

### 3. Email Scaling
- Queue-based email processing
- Rate limiting per provider
- Fallback email services
- Email analytics tracking 