const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database file in a persistent directory
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', 'dictionary.db')
  : path.join(__dirname, 'dictionary.db');

// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables
      db.serialize(() => {
        // Languages table
        db.run(`CREATE TABLE IF NOT EXISTS languages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL
        )`);

        // Words table
        db.run(`CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          turkish_word TEXT,
          portuguese_word TEXT,
          english_word TEXT,
          language_id INTEGER,
          difficulty_level INTEGER DEFAULT 1,
          FOREIGN KEY (language_id) REFERENCES languages (id)
        )`);

        // Word examples table
        db.run(`CREATE TABLE IF NOT EXISTS word_examples (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER,
          turkish_example TEXT,
          portuguese_example TEXT,
          english_example TEXT,
          FOREIGN KEY (word_id) REFERENCES words (id)
        )`);

        // Translations table
        db.run(`CREATE TABLE IF NOT EXISTS translations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_word_id INTEGER,
          target_word_id INTEGER,
          FOREIGN KEY (source_word_id) REFERENCES words (id),
          FOREIGN KEY (target_word_id) REFERENCES words (id),
          UNIQUE(source_word_id, target_word_id)
        )`);

        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )`);

        // User preferences table
        db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          source_language TEXT DEFAULT 'tr',
          target_language TEXT DEFAULT 'pt',
          difficulty_level TEXT DEFAULT 'beginner',
          words_per_day INTEGER DEFAULT 5,
          is_email_subscribed BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // User word progress table
        db.run(`CREATE TABLE IF NOT EXISTS user_word_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          word_id INTEGER,
          mastery_level INTEGER DEFAULT 0,
          last_reviewed TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (word_id) REFERENCES words (id),
          UNIQUE(user_id, word_id)
        )`);

        // Insert default languages
        db.run(`INSERT OR IGNORE INTO languages (code, name) VALUES 
          ('tr', 'Turkish'),
          ('pt', 'Portuguese'),
          ('en', 'English')`);

        resolve(db);
      });
    });
  });
}

// Get database instance
function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(db);
    });
  });
}

// Import words from JSON file
async function importWords() {
  try {
    const db = await getDatabase();
    
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
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        let imported = 0;
        
        wordsData.forEach((entry, index) => {
          // Insert words for each language
          db.run(`INSERT OR IGNORE INTO words (turkish_word, portuguese_word, english_word, language_id, difficulty_level) 
                  VALUES (?, ?, ?, ?, ?)`,
            [entry.tr.word, entry.pt.word, entry.en.word, 1, entry.difficulty || 1],
            function(err) {
              if (err) {
                console.error('Error inserting word:', err);
                return;
              }
              
              const wordId = this.lastID;
              
              // Insert examples
              if (entry.tr.example || entry.pt.example || entry.en.example) {
                db.run(`INSERT OR IGNORE INTO word_examples (word_id, turkish_example, portuguese_example, english_example) 
                        VALUES (?, ?, ?, ?)`,
                  [wordId, entry.tr.example, entry.pt.example, entry.en.example]);
              }
              
              imported++;
              if (imported === wordsData.length) {
                console.log(`Imported ${imported} words successfully`);
                resolve(imported);
              }
            }
          );
        });
      });
    });
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