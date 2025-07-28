const cron = require('node-cron');
const EmailService = require('../services/emailService');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class EmailProcessor {
  constructor() {
    this.isRunning = false;
  }

  start() {
    console.log('Email processor disabled for local development (using SQLite)');
    // Email processor disabled - will be enabled when using MySQL in production
  }

  async processEmailQueue() {
    console.log('Processing email queue...');
    
    try {
      const query = `
        SELECT eq.id, eq.user_id, eq.daily_word_set_id, eq.retry_count
        FROM email_queue eq
        WHERE eq.status = 'pending' 
        AND eq.retry_count < 3
        ORDER BY eq.created_at ASC
        LIMIT 50
      `;
      
      const result = await pool.query(query);
      const pendingEmails = result.rows;
      
      console.log(`Found ${pendingEmails.length} pending emails`);
      
      for (const email of pendingEmails) {
        try {
          await EmailService.sendDailyEmail(email.user_id, email.daily_word_set_id);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error.message);
          
          // Update retry count
          await EmailService.updateEmailQueueStatus(
            email.daily_word_set_id, 
            email.retry_count >= 2 ? 'failed' : 'pending',
            error.message
          );
        }
      }
      
      console.log(`Processed ${pendingEmails.length} emails`);
      
    } catch (error) {
      console.error('Email queue processing failed:', error);
    }
  }

  async generateDailyWordSets() {
    console.log('Generating daily word sets for all subscribed users...');
    
    try {
      // Get all users with email subscriptions
      const usersQuery = `
        SELECT u.id, up.source_language_id, up.target_language_id, up.difficulty_level_id, up.words_per_day
        FROM users u
        JOIN user_preferences up ON u.id = up.user_id
        WHERE up.is_email_subscribed = true
        AND u.is_active = true
      `;
      
      const usersResult = await pool.query(usersQuery);
      const users = usersResult.rows;
      
      console.log(`Found ${users.length} subscribed users`);
      
      for (const user of users) {
        try {
          await this.generateUserDailyWordSet(user);
        } catch (error) {
          console.error(`Failed to generate word set for user ${user.id}:`, error.message);
        }
      }
      
      console.log('Daily word set generation completed');
      
    } catch (error) {
      console.error('Daily word set generation failed:', error);
    }
  }

  async generateUserDailyWordSet(user) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if word set already exists for today
    const existingQuery = `
      SELECT id FROM daily_word_sets 
      WHERE user_id = $1 AND date = $2
    `;
    
    const existingResult = await pool.query(existingQuery, [user.id, today]);
    if (existingResult.rows.length > 0) {
      console.log(`Word set already exists for user ${user.id} on ${today}`);
      return;
    }
    
    // Generate new word set
    const wordsQuery = `
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
        t.id as translation_id,
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
        AND t.is_verified = true
      ORDER BY w1.frequency_rank ASC, RANDOM()
      LIMIT $5;
    `;
    
    const wordsResult = await pool.query(wordsQuery, [
      user.id,
      user.source_language_id,
      user.target_language_id,
      user.difficulty_level_id,
      user.words_per_day
    ]);
    
    if (wordsResult.rows.length === 0) {
      console.log(`No suitable words found for user ${user.id}`);
      return;
    }
    
    // Create daily word set
    const wordSetQuery = `
      INSERT INTO daily_word_sets (user_id, date, source_language_id, target_language_id, difficulty_level_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const wordSetResult = await pool.query(wordSetQuery, [
      user.id,
      today,
      user.source_language_id,
      user.target_language_id,
      user.difficulty_level_id
    ]);
    
    const wordSetId = wordSetResult.rows[0].id;
    
    // Add words to the set
    for (let i = 0; i < wordsResult.rows.length; i++) {
      const word = wordsResult.rows[i];
      await pool.query(
        `INSERT INTO word_set_items (daily_word_set_id, translation_id, sort_order)
         VALUES ($1, $2, $3)`,
        [wordSetId, word.translation_id, i]
      );
    }
    
    // Add to email queue
    await pool.query(
      `INSERT INTO email_queue (user_id, daily_word_set_id, status)
       VALUES ($1, $2, 'pending')`,
      [user.id, wordSetId]
    );
    
    console.log(`Generated word set ${wordSetId} with ${wordsResult.rows.length} words for user ${user.id}`);
  }

  stop() {
    console.log('Stopping email processor...');
    // Cleanup if needed
  }
}

module.exports = new EmailProcessor(); 