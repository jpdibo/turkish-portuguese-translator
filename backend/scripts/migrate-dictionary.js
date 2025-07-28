const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/language_learning_platform',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateDictionary() {
  console.log('Starting dictionary migration...');
  
  try {
    // Read current dictionary from the frontend
    const dictionaryPath = path.join(__dirname, '../../public/dictionary.json');
    const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    
    console.log(`Found ${dictionary.length} words to migrate`);
    
    // Insert languages
    console.log('Inserting languages...');
    const turkishLang = await pool.query(
      'INSERT INTO languages (code, name, native_name) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      ['tr', 'Turkish', 'Türkçe']
    );
    
    const portugueseLang = await pool.query(
      'INSERT INTO languages (code, name, native_name) VALUES ($1, $2, $3) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      ['pt', 'Portuguese', 'Português']
    );
    
    console.log(`Turkish language ID: ${turkishLang.rows[0].id}`);
    console.log(`Portuguese language ID: ${portugueseLang.rows[0].id}`);
    
    // Insert language pair
    await pool.query(
      `INSERT INTO language_pairs (source_language_id, target_language_id) 
       VALUES ($1, $2) ON CONFLICT (source_language_id, target_language_id) DO NOTHING`,
      [turkishLang.rows[0].id, portugueseLang.rows[0].id]
    );
    
    // Get difficulty levels
    const difficulties = await pool.query('SELECT id, name FROM difficulty_levels');
    const difficultyMap = {};
    difficulties.rows.forEach(d => {
      difficultyMap[d.name] = d.id;
    });
    
    console.log('Difficulty levels:', difficultyMap);
    
    // Insert categories
    const categories = [
      'Food & Drinks', 'Family & Relationships', 'Travel & Transportation',
      'Work & Business', 'Health & Body', 'Nature & Environment',
      'Technology', 'Emotions & Feelings', 'Daily Activities', 'Home & Furniture'
    ];
    
    const categoryMap = {};
    for (const categoryName of categories) {
      const category = await pool.query(
        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [categoryName]
      );
      categoryMap[categoryName] = category.rows[0].id;
    }
    
    console.log('Categories created');
    
    // Process each dictionary entry
    let processedCount = 0;
    for (const entry of dictionary) {
      try {
        // Insert source word (Turkish)
        const sourceWord = await pool.query(
          `INSERT INTO words (language_id, word, difficulty_level_id, frequency_rank) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (language_id, word) DO UPDATE SET 
           difficulty_level_id = EXCLUDED.difficulty_level_id,
           frequency_rank = EXCLUDED.frequency_rank
           RETURNING id`,
          [turkishLang.rows[0].id, entry.turkish, difficultyMap[entry.level], 1000]
        );
        
        // Insert target word (Portuguese)
        const targetWord = await pool.query(
          `INSERT INTO words (language_id, word, difficulty_level_id, frequency_rank) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (language_id, word) DO UPDATE SET 
           difficulty_level_id = EXCLUDED.difficulty_level_id,
           frequency_rank = EXCLUDED.frequency_rank
           RETURNING id`,
          [portugueseLang.rows[0].id, entry.portuguese, difficultyMap[entry.level], 1000]
        );
        
        // Insert translation
        await pool.query(
          `INSERT INTO translations (source_word_id, target_word_id, is_verified) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (source_word_id, target_word_id) DO UPDATE SET 
           is_verified = EXCLUDED.is_verified`,
          [sourceWord.rows[0].id, targetWord.rows[0].id, true]
        );
        
        // Insert example sentences
        if (entry.example_tr) {
          await pool.query(
            `INSERT INTO example_sentences (word_id, sentence) 
             VALUES ($1, $2) 
             ON CONFLICT (word_id, sentence) DO NOTHING`,
            [sourceWord.rows[0].id, entry.example_tr]
          );
        }
        
        if (entry.example_pt) {
          await pool.query(
            `INSERT INTO example_sentences (word_id, sentence) 
             VALUES ($1, $2) 
             ON CONFLICT (word_id, sentence) DO NOTHING`,
            [targetWord.rows[0].id, entry.example_pt]
          );
        }
        
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`Processed ${processedCount} words...`);
        }
        
      } catch (error) {
        console.error(`Error processing word "${entry.turkish}":`, error.message);
      }
    }
    
    console.log(`Migration completed successfully! Processed ${processedCount} words.`);
    
    // Verify migration
    const wordCount = await pool.query('SELECT COUNT(*) FROM words');
    const translationCount = await pool.query('SELECT COUNT(*) FROM translations');
    const exampleCount = await pool.query('SELECT COUNT(*) FROM example_sentences');
    
    console.log('\nMigration Summary:');
    console.log(`- Words: ${wordCount.rows[0].count}`);
    console.log(`- Translations: ${translationCount.rows[0].count}`);
    console.log(`- Example sentences: ${exampleCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDictionary()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDictionary }; 