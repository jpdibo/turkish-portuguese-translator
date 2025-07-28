const express = require('express');
const { getDatabase } = require('../database');
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
      WHERE w.difficulty_level = ?
      ORDER BY RANDOM()
      LIMIT ?
    `;

    db.all(query, [difficulty, parseInt(count)], (err, rows) => {
      if (err) {
        console.error('Error fetching words:', err);
        return res.status(500).json({ error: 'Failed to fetch words' });
      }

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
    });
  } catch (err) {
    console.error('Error fetching words:', err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// GET /api/words/languages
router.get('/languages', async (req, res) => {
  try {
    const db = await getDatabase();
    db.all('SELECT code, name FROM languages ORDER BY name', (err, rows) => {
      if (err) {
        console.error('Error fetching languages:', err);
        return res.status(500).json({ error: 'Failed to fetch languages' });
      }
      res.json({ languages: rows });
    });
  } catch (err) {
    console.error('Error fetching languages:', err);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// GET /api/words/difficulty-levels
router.get('/difficulty-levels', (req, res) => {
  res.json({
    levels: [
      { id: 1, name: 'beginner', displayName: 'Beginner' },
      { id: 2, name: 'intermediate', displayName: 'Intermediate' },
      { id: 3, name: 'advanced', displayName: 'Advanced' }
    ]
  });
});

module.exports = router; 