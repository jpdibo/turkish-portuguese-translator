const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = await getDatabase();

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, new Date().toISOString()],
        function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Error creating user' });
          }

          const userId = this.lastID;

          // Create user preferences
          db.run(
            'INSERT INTO user_preferences (user_id, source_language, target_language, difficulty_level, words_per_day, is_email_subscribed) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'tr', 'pt', 'beginner', 5, false],
            function(err) {
              if (err) {
                console.error('Error creating preferences:', err);
              }

              // Generate JWT token
              const token = jwt.sign(
                { userId, email, name },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
              );

              res.status(201).json({
                message: 'User created successfully',
                token,
                user: { id: userId, email, name }
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDatabase();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    db.get(
      'SELECT u.id, u.email, u.name, u.created_at, up.* FROM users u LEFT JOIN user_preferences up ON u.id = up.user_id WHERE u.id = ?',
      [req.user.userId],
      (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Remove password from response
        delete user.password;
        res.json({ user });
      }
    );
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, source_language, target_language, difficulty_level, words_per_day, is_email_subscribed } = req.body;
    const db = await getDatabase();

    // Update user info
    db.run(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, req.user.userId],
      function(err) {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).json({ error: 'Error updating user' });
        }

        // Update preferences
        db.run(
          'UPDATE user_preferences SET source_language = ?, target_language = ?, difficulty_level = ?, words_per_day = ?, is_email_subscribed = ? WHERE user_id = ?',
          [source_language, target_language, difficulty_level, words_per_day, is_email_subscribed, req.user.userId],
          function(err) {
            if (err) {
              console.error('Error updating preferences:', err);
              return res.status(500).json({ error: 'Error updating preferences' });
            }

            res.json({ message: 'Profile updated successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router; 