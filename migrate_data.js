import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  user: 'turkish_user',
  host: 'localhost',
  database: 'turkish_portuguese_db',
  password: 'password123', // Use the password you set
  port: 5432,
});

// Read the existing dictionary
const dictionaryData = JSON.parse(fs.readFileSync('./public/dictionary.json', 'utf8'));

// Map difficulty levels
const difficultyMap = {
  'beginner': 1,
  'intermediate': 3,
  'advanced': 5
};

async function migrateData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting data migration...');
    
    // Get the Basic Vocabulary category ID
    const categoryResult = await client.query(
      'SELECT id FROM word_categories WHERE name = $1',
      ['Basic Vocabulary']
    );
    const categoryId = categoryResult.rows[0]?.id || 1;
    
    let insertedCount = 0;
    
    for (const word of dictionaryData) {
      // Insert the word
      const wordResult = await client.query(
        `INSERT INTO words (turkish_word, portuguese_word, difficulty_level, category_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        [word.turkish, word.portuguese, difficultyMap[word.level] || 1, categoryId]
      );
      
      const wordId = wordResult.rows[0].id;
      
      // Insert the example
      await client.query(
        `INSERT INTO word_examples (word_id, turkish_example, portuguese_example) 
         VALUES ($1, $2, $3)`,
        [wordId, word.example_tr, word.example_pt]
      );
      
      insertedCount++;
      console.log(`Migrated: ${word.turkish} -> ${word.portuguese}`);
    }
    
    console.log(`\nMigration completed! ${insertedCount} words migrated successfully.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateData(); 