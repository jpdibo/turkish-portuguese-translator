const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Database configuration for Supabase PostgreSQL
const dbConfig = {
  host: 'aws-0-eu-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.fojpudiljqeqxzxstoba',
  password: 'senhaprojeto',
  ssl: { rejectUnauthorized: false }
};

// Create connection pool
const pool = new Pool(dbConfig);

// Initialize database
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    console.log('Connected to Supabase PostgreSQL database');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS languages (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(50) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id SERIAL PRIMARY KEY,
        turkish_word VARCHAR(255),
        portuguese_word VARCHAR(255),
        english_word VARCHAR(255),
        language_id INTEGER,
        difficulty_level INTEGER DEFAULT 1,
        FOREIGN KEY (language_id) REFERENCES languages (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS word_examples (
        id SERIAL PRIMARY KEY,
        word_id INTEGER,
        turkish_example TEXT,
        portuguese_example TEXT,
        english_example TEXT,
        FOREIGN KEY (word_id) REFERENCES words (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id SERIAL PRIMARY KEY,
        source_word_id INTEGER,
        target_word_id INTEGER,
        FOREIGN KEY (source_word_id) REFERENCES words (id),
        FOREIGN KEY (target_word_id) REFERENCES words (id),
        UNIQUE(source_word_id, target_word_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        source_language VARCHAR(10) DEFAULT 'tr',
        target_language VARCHAR(10) DEFAULT 'pt',
        difficulty_level VARCHAR(50) DEFAULT 'beginner',
        words_per_day INTEGER DEFAULT 5,
        is_email_subscribed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_word_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        word_id INTEGER,
        mastery_level INTEGER DEFAULT 0,
        last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (word_id) REFERENCES words (id),
        UNIQUE(user_id, word_id)
      )
    `);

    // Insert default languages
    await client.query(`
      INSERT INTO languages (code, name) VALUES 
        ('tr', 'Turkish'),
        ('pt', 'Portuguese'),
        ('en', 'English')
      ON CONFLICT (code) DO NOTHING
    `);

    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Get database connection
function getDatabase() {
  return pool;
}

// Import words from JSON file
async function importWords() {
  try {
    // Try different possible paths for the words file
    let wordsData;
    const possiblePaths = [
      path.join(__dirname, '..', 'words_to_import.json'),
      path.join(__dirname, 'words_to_import.json'),
      path.join(process.cwd(), 'words_to_import.json'),
      path.join(process.cwd(), 'backend', 'words_to_import.json')
    ];
    
    let fileFound = false;
    for (const filePath of possiblePaths) {
      try {
        console.log(`Trying to read words from: ${filePath}`);
        wordsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Successfully read words from: ${filePath}`);
        fileFound = true;
        break;
      } catch (err) {
        console.log(`Could not read from ${filePath}: ${err.message}`);
      }
    }
    
    if (!fileFound) {
      throw new Error('Could not find words_to_import.json in any expected location');
    }

    const client = await pool.connect();
    
    let imported = 0;
    
    for (const entry of wordsData) {
      try {
        // Insert word
        const result = await client.query(
          `INSERT INTO words (turkish_word, portuguese_word, english_word, language_id, difficulty_level) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT DO NOTHING 
           RETURNING id`,
          [entry.tr.word, entry.pt.word, entry.en.word, 1, entry.difficulty || 1]
        );
        
        if (result.rows.length > 0) {
          const wordId = result.rows[0].id;
          
          // Insert examples if they exist
          if (entry.tr.example || entry.pt.example || entry.en.example) {
            await client.query(
              `INSERT INTO word_examples (word_id, turkish_example, portuguese_example, english_example) 
               VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING`,
              [wordId, entry.tr.example, entry.pt.example, entry.en.example]
            );
          }
          
          imported++;
        }
      } catch (error) {
        console.error('Error inserting word:', entry, error);
      }
    }
    
    client.release();
    console.log(`Imported ${imported} words successfully`);
    return imported;
  } catch (error) {
    console.error('Error importing words:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  importWords,
  testConnection
};