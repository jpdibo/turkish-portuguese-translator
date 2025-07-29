const express = require('express');
const { getDatabase } = require('../database-supabase');
const router = express.Router();

// GET /api/words?source=tr&target=pt&level=beginner&count=5
router.get('/', async (req, res) => {
  const { source = 'tr', target = 'pt', level = 'beginner', count = 5 } = req.query;
  let difficulty = 1;
  if (level === 'intermediate') difficulty = 2;
  if (level === 'advanced') difficulty = 3;

  try {
    const db = await getDatabase();
    
    // Get words for the specified language pair and difficulty
    const query = `
      SELECT 
        w.id,
        w.turkish_word,
        w.portuguese_word,
        w.english_word,
        w.difficulty_level,
        e.turkish_example,
        e.portuguese_example,
        e.english_example
      FROM words w
      LEFT JOIN word_examples e ON w.id = e.word_id
      WHERE w.difficulty_level = $1
      ORDER BY RANDOM()
      LIMIT $2
    `;

    const result = await db.query(query, [difficulty, parseInt(count)]);
    const rows = result.rows;

    // Map to frontend format
    const words = rows.map(row => {
      let source_word = '', target_word = '', source_example = '', target_example = '';
      
      // Get source word
      if (source === 'tr') source_word = row.turkish_word;
      if (source === 'pt') source_word = row.portuguese_word;
      if (source === 'en') source_word = row.english_word;
      
      // Get target word
      if (target === 'tr') target_word = row.turkish_word;
      if (target === 'pt') target_word = row.portuguese_word;
      if (target === 'en') target_word = row.english_word;
      
      // Get examples
      if (source === 'tr') source_example = row.turkish_example;
      if (source === 'pt') source_example = row.portuguese_example;
      if (source === 'en') source_example = row.english_example;
      
      if (target === 'tr') target_example = row.turkish_example;
      if (target === 'pt') target_example = row.portuguese_example;
      if (target === 'en') target_example = row.english_example;

      return {
        id: row.id,
        source_word,
        target_word,
        difficulty: row.difficulty_level,
        source_example: source_example || '',
        target_example: target_example || '',
      };
    });

    res.json({ words });
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

module.exports = router;