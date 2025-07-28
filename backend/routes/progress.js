const express = require('express');
const { getDatabase } = require('../database');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Update word mastery level
router.post('/word/:wordId', authenticateToken, async (req, res) => {
  try {
    const { wordId } = req.params;
    const { masteryLevel } = req.body;
    const db = await getDatabase();

    db.run(
      'INSERT OR REPLACE INTO user_word_progress (user_id, word_id, mastery_level, last_reviewed) VALUES (?, ?, ?, ?)',
      [req.user.userId, wordId, masteryLevel, new Date().toISOString()],
      function(err) {
        if (err) {
          console.error('Error updating progress:', err);
          return res.status(500).json({ error: 'Failed to update progress' });
        }

        res.json({ message: 'Progress updated successfully' });
      }
    );
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get user progress statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get total words learned
    db.get(
      'SELECT COUNT(*) as total_words FROM user_word_progress WHERE user_id = ?',
      [req.user.userId],
      (err, totalResult) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Get mastery level breakdown
        db.all(
          'SELECT mastery_level, COUNT(*) as count FROM user_word_progress WHERE user_id = ? GROUP BY mastery_level',
          [req.user.userId],
          (err, masteryResults) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Get recent activity
            db.all(
              'SELECT wp.mastery_level, w.turkish_word, w.portuguese_word, wp.last_reviewed FROM user_word_progress wp JOIN words w ON wp.word_id = w.id WHERE wp.user_id = ? ORDER BY wp.last_reviewed DESC LIMIT 10',
              [req.user.userId],
              (err, recentActivity) => {
                if (err) {
                  console.error('Database error:', err);
                  return res.status(500).json({ error: 'Database error' });
                }

                const stats = {
                  totalWords: totalResult.total_words || 0,
                  masteryBreakdown: masteryResults || [],
                  recentActivity: recentActivity || []
                };

                res.json(stats);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get words by mastery level
router.get('/words/:masteryLevel', authenticateToken, async (req, res) => {
  try {
    const { masteryLevel } = req.params;
    const db = await getDatabase();
    
    db.all(
      'SELECT w.id, w.turkish_word, w.portuguese_word, w.english_word, wp.mastery_level, wp.last_reviewed, e.turkish_example, e.portuguese_example FROM user_word_progress wp JOIN words w ON wp.word_id = w.id LEFT JOIN word_examples e ON w.id = e.word_id WHERE wp.user_id = ? AND wp.mastery_level = ? ORDER BY wp.last_reviewed DESC',
      [req.user.userId, masteryLevel],
      (err, words) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ words: words || [] });
      }
    );
  } catch (error) {
    console.error('Words by mastery error:', error);
    res.status(500).json({ error: 'Failed to get words' });
  }
});

// Get learning streak
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get days with activity in the last 30 days
    db.all(
      'SELECT DISTINCT DATE(last_reviewed) as review_date FROM user_word_progress WHERE user_id = ? AND last_reviewed >= DATE("now", "-30 days") ORDER BY review_date DESC',
      [req.user.userId],
      (err, dates) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const reviewDates = dates.map(d => d.review_date);
        
        if (reviewDates.includes(today)) {
          currentStreak = 1;
          for (let i = 1; i <= 30; i++) {
            const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            if (reviewDates.includes(checkDate)) {
              currentStreak++;
            } else {
              break;
            }
          }
        } else if (reviewDates.includes(yesterday)) {
          currentStreak = 1;
          for (let i = 2; i <= 30; i++) {
            const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            if (reviewDates.includes(checkDate)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        res.json({ 
          currentStreak,
          totalDays: dates.length,
          lastActivity: dates.length > 0 ? dates[0].review_date : null
        });
      }
    );
  } catch (error) {
    console.error('Streak error:', error);
    res.status(500).json({ error: 'Failed to get streak' });
  }
});

module.exports = router; 