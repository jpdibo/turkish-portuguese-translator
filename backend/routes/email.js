const express = require('express');
const sgMail = require('@sendgrid/mail');
const { getDatabase } = require('../database');
const router = express.Router();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

// Subscribe to daily emails
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    db.run(
      'UPDATE user_preferences SET is_email_subscribed = ? WHERE user_id = ?',
      [true, req.user.userId],
      function(err) {
        if (err) {
          console.error('Error subscribing to emails:', err);
          return res.status(500).json({ error: 'Failed to subscribe' });
        }

        res.json({ message: 'Successfully subscribed to daily emails' });
      }
    );
  } catch (error) {
    console.error('Email subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Unsubscribe from daily emails
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    db.run(
      'UPDATE user_preferences SET is_email_subscribed = ? WHERE user_id = ?',
      [false, req.user.userId],
      function(err) {
        if (err) {
          console.error('Error unsubscribing from emails:', err);
          return res.status(500).json({ error: 'Failed to unsubscribe' });
        }

        res.json({ message: 'Successfully unsubscribed from daily emails' });
      }
    );
  } catch (error) {
    console.error('Email unsubscription error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Send test email
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get user info
    db.get('SELECT email, name FROM users WHERE id = ?', [req.user.userId], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get sample words
      db.all(
        'SELECT w.turkish_word, w.portuguese_word, e.turkish_example, e.portuguese_example FROM words w LEFT JOIN word_examples e ON w.id = e.word_id WHERE w.difficulty_level = 1 ORDER BY RANDOM() LIMIT 3',
        async (err, words) => {
          if (err) {
            console.error('Error fetching words:', err);
            return res.status(500).json({ error: 'Error fetching words' });
          }

          // Create email content
          const wordList = words.map(word => `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0;">${word.turkish_word} → ${word.portuguese_word}</h3>
              ${word.turkish_example ? `<p style="margin: 5px 0; color: #666;"><strong>Turkish:</strong> ${word.turkish_example}</p>` : ''}
              ${word.portuguese_example ? `<p style="margin: 5px 0; color: #666;"><strong>Portuguese:</strong> ${word.portuguese_example}</p>` : ''}
            </div>
          `).join('');

          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">🇹🇷 Turkish-Portuguese Daily Words 🇵🇹</h2>
              <p>Hello ${user.name}!</p>
              <p>Here are your daily Turkish-Portuguese words:</p>
              ${wordList}
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Keep learning! Visit our app to practice more words.
              </p>
            </div>
          `;

          // Send email
          const msg = {
            to: user.email,
            from: process.env.EMAIL_FROM || 'noreply@turkishportuguese.com',
            subject: 'Your Daily Turkish-Portuguese Words',
            html: emailContent,
          };

          try {
            await sgMail.send(msg);
            res.json({ message: 'Test email sent successfully' });
          } catch (emailError) {
            console.error('SendGrid error:', emailError);
            res.status(500).json({ error: 'Failed to send email' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Get subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    db.get(
      'SELECT is_email_subscribed FROM user_preferences WHERE user_id = ?',
      [req.user.userId],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ 
          isSubscribed: result ? result.is_email_subscribed : false 
        });
      }
    );
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router; 