const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'turkish_portuguese_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS languages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(50) NOT NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS words (
        id INT AUTO_INCREMENT PRIMARY KEY,
        turkish_word VARCHAR(255),
        portuguese_word VARCHAR(255),
        english_word VARCHAR(255),
        language_id INT,
        difficulty_level INT DEFAULT 1,
        FOREIGN KEY (language_id) REFERENCES languages (id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS word_examples (
        id INT AUTO_INCREMENT PRIMARY KEY,
        word_id INT,
        turkish_example TEXT,
        portuguese_example TEXT,
        english_example TEXT,
        FOREIGN KEY (word_id) REFERENCES words (id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_word_id INT,
        target_word_id INT,
        FOREIGN KEY (source_word_id) REFERENCES words (id),
        FOREIGN KEY (target_word_id) REFERENCES words (id),
        UNIQUE KEY unique_translation (source_word_id, target_word_id)
      )
    `);

    // Insert default languages
    await connection.execute(`
      INSERT IGNORE INTO languages (code, name) VALUES 
        ('tr', 'Turkish'),
        ('pt', 'Portuguese'),
        ('en', 'English')
    `);

    connection.release();
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
    const wordsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'words_to_import.json'), 'utf8'));
    const connection = await pool.getConnection();
    
    let imported = 0;
    
    for (const entry of wordsData) {
      // Insert word
      const [result] = await connection.execute(
        `INSERT IGNORE INTO words (turkish_word, portuguese_word, english_word, language_id, difficulty_level) 
         VALUES (?, ?, ?, ?, ?)`,
        [entry.tr.word, entry.pt.word, entry.en.word, 1, entry.difficulty || 1]
      );
      
      const wordId = result.insertId;
      
      // Insert examples if they exist
      if (entry.tr.example || entry.pt.example || entry.en.example) {
        await connection.execute(
          `INSERT IGNORE INTO word_examples (word_id, turkish_example, portuguese_example, english_example) 
           VALUES (?, ?, ?, ?)`,
          [wordId, entry.tr.example, entry.pt.example, entry.en.example]
        );
      }
      
      imported++;
    }
    
    connection.release();
    console.log(`Imported ${imported} words successfully`);
    return imported;
  } catch (error) {
    console.error('Error importing words:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  importWords
}; 