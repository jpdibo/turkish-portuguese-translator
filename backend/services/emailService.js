const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const { Pool } = require('pg');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Language Learning Platform';
  }

  async sendDailyEmail(userId, wordSetId) {
    try {
      console.log(`Sending daily email to user ${userId} for word set ${wordSetId}`);
      
      // Get user and word set data
      const user = await this.getUser(userId);
      const wordSet = await this.getWordSet(wordSetId);
      
      if (!user || !wordSet) {
        throw new Error('User or word set not found');
      }
      
      // Generate email content
      const emailContent = this.generateEmailContent(user, wordSet);
      
      // Send email
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Your Daily ${wordSet.target_language} Words - ${new Date().toLocaleDateString()}`,
        html: emailContent.html,
        text: emailContent.text,
        trackingSettings: {
          clickTracking: {
            enable: true,
            enableText: true
          },
          openTracking: {
            enable: true
          }
        }
      };
      
      await sgMail.send(msg);
      
      // Update email queue status
      await this.updateEmailQueueStatus(wordSetId, 'sent');
      
      console.log(`Email sent successfully to ${user.email}`);
      
      return { success: true, messageId: 'sent' };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      await this.updateEmailQueueStatus(wordSetId, 'failed', error.message);
      throw error;
    }
  }
  
  async getUser(userId) {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, up.words_per_day
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
  
  async getWordSet(wordSetId) {
    const query = `
      SELECT 
        dws.id,
        dws.date,
        sl.name as source_language,
        tl.name as target_language,
        dl.name as difficulty_level,
        json_agg(
          json_build_object(
            'source_word', w1.word,
            'target_word', w2.word,
            'source_example', es1.sentence,
            'target_example', es2.sentence,
            'difficulty', dl.name
          )
        ) as words
      FROM daily_word_sets dws
      JOIN languages sl ON dws.source_language_id = sl.id
      JOIN languages tl ON dws.target_language_id = tl.id
      JOIN difficulty_levels dl ON dws.difficulty_level_id = dl.id
      JOIN word_set_items wsi ON dws.id = wsi.daily_word_set_id
      JOIN translations t ON wsi.translation_id = t.id
      JOIN words w1 ON t.source_word_id = w1.id
      JOIN words w2 ON t.target_word_id = w2.id
      LEFT JOIN example_sentences es1 ON w1.id = es1.word_id
      LEFT JOIN example_sentences es2 ON w2.id = es2.word_id
      WHERE dws.id = $1
      GROUP BY dws.id, dws.date, sl.name, tl.name, dl.name
    `;
    
    const result = await pool.query(query, [wordSetId]);
    return result.rows[0];
  }
  
  generateEmailContent(user, wordSet) {
    const userName = user.first_name || 'there';
    const wordCount = wordSet.words.length;
    const date = new Date(wordSet.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily ${wordSet.target_language} Words</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 30px;
              color: #4a5568;
            }
            .word-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              margin: 20px 0;
              background-color: #f8fafc;
              transition: transform 0.2s ease;
            }
            .word-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            .word-pair {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .source-word {
              font-size: 24px;
              font-weight: 700;
              color: #2d3748;
            }
            .arrow {
              font-size: 20px;
              color: #718096;
              margin: 0 20px;
            }
            .target-word {
              font-size: 24px;
              font-weight: 700;
              color: #3182ce;
            }
            .example {
              background-color: #edf2f7;
              padding: 16px;
              border-radius: 8px;
              margin-top: 12px;
            }
            .example-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #718096;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .example-text {
              font-style: italic;
              color: #4a5568;
              margin: 0;
            }
            .difficulty-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin-top: 8px;
            }
            .difficulty-beginner { background-color: #c6f6d5; color: #22543d; }
            .difficulty-intermediate { background-color: #fef5e7; color: #744210; }
            .difficulty-advanced { background-color: #fed7d7; color: #742a2a; }
            .cta-section {
              background-color: #f7fafc;
              padding: 30px;
              text-align: center;
              margin-top: 40px;
              border-radius: 12px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background-color: #2d3748;
              color: #a0aec0;
              padding: 30px;
              text-align: center;
              font-size: 14px;
            }
            .footer a {
              color: #63b3ed;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .unsubscribe {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #4a5568;
            }
            @media (max-width: 600px) {
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .word-pair { flex-direction: column; text-align: center; }
              .arrow { margin: 10px 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌍 Your Daily ${wordSet.target_language} Words</h1>
              <p>${date} • ${wordCount} new words to learn</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Hello ${userName}! 👋<br>
                Here are your daily ${wordSet.target_language} words to expand your vocabulary:
              </div>
              
              ${wordSet.words.map(word => `
                <div class="word-card">
                  <div class="word-pair">
                    <div class="source-word">${word.source_word}</div>
                    <div class="arrow">→</div>
                    <div class="target-word">${word.target_word}</div>
                  </div>
                  
                  ${word.source_example ? `
                    <div class="example">
                      <div class="example-label">Example (${wordSet.source_language})</div>
                      <p class="example-text">${word.source_example}</p>
                    </div>
                  ` : ''}
                  
                  ${word.target_example ? `
                    <div class="example">
                      <div class="example-label">Exemplo (${wordSet.target_language})</div>
                      <p class="example-text">${word.target_example}</p>
                    </div>
                  ` : ''}
                  
                  <div class="difficulty-badge difficulty-${word.difficulty}">
                    ${word.difficulty}
                  </div>
                </div>
              `).join('')}
              
              <div class="cta-section">
                <h3 style="margin: 0 0 20px 0; color: #2d3748;">Ready to practice?</h3>
                <a href="${process.env.FRONTEND_URL}/words" class="cta-button">
                  Practice These Words Online →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Keep learning and expanding your language skills! 🚀</p>
              <p>This email was sent to ${user.email}</p>
              <div class="unsubscribe">
                <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(user.email)}&token=${this.generateUnsubscribeToken(user.email)}">
                  Unsubscribe from daily emails
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Your Daily ${wordSet.target_language} Words - ${date}

Hello ${userName}!

Here are your daily ${wordSet.target_language} words to expand your vocabulary:

${wordSet.words.map((word, index) => `
${index + 1}. ${word.source_word} → ${word.target_word} (${word.difficulty})
${word.source_example ? `   Example: ${word.source_example}` : ''}
${word.target_example ? `   Exemplo: ${word.target_example}` : ''}
`).join('\n')}

Practice these words online: ${process.env.FRONTEND_URL}/words

Keep learning and expanding your language skills!

---
Unsubscribe: ${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(user.email)}&token=${this.generateUnsubscribeToken(user.email)}
    `;
    
    return { html, text };
  }
  
  generateUnsubscribeToken(email) {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return crypto.createHmac('sha256', secret).update(email).digest('hex');
  }
  
  async updateEmailQueueStatus(wordSetId, status, errorMessage = null) {
    const query = `
      UPDATE email_queue 
      SET status = $1, sent_at = CASE WHEN $1 = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END, 
          error_message = $2, retry_count = CASE WHEN $1 = 'failed' THEN retry_count + 1 ELSE retry_count END
      WHERE daily_word_set_id = $3
    `;
    
    await pool.query(query, [status, errorMessage, wordSetId]);
  }
  
  async processEmailQueue() {
    console.log('Processing email queue...');
    
    try {
      const query = `
        SELECT eq.id, eq.user_id, eq.daily_word_set_id, eq.retry_count
        FROM email_queue eq
        WHERE eq.status = 'pending' 
        AND eq.retry_count < 3
        ORDER BY eq.created_at ASC
        LIMIT 50
      `;
      
      const result = await pool.query(query);
      const pendingEmails = result.rows;
      
      console.log(`Found ${pendingEmails.length} pending emails`);
      
      for (const email of pendingEmails) {
        try {
          await this.sendDailyEmail(email.user_id, email.daily_word_set_id);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error.message);
          
          // Update retry count
          await this.updateEmailQueueStatus(
            email.daily_word_set_id, 
            email.retry_count >= 2 ? 'failed' : 'pending',
            error.message
          );
        }
      }
      
      console.log(`Processed ${pendingEmails.length} emails`);
      
    } catch (error) {
      console.error('Email queue processing failed:', error);
    }
  }
  
  async unsubscribeUser(email, token) {
    // Verify unsubscribe token
    const expectedToken = this.generateUnsubscribeToken(email);
    if (token !== expectedToken) {
      throw new Error('Invalid unsubscribe token');
    }
    
    // Update user preferences
    const query = `
      UPDATE user_preferences 
      SET is_email_subscribed = false 
      WHERE user_id = (SELECT id FROM users WHERE email = $1)
    `;
    
    const result = await pool.query(query, [email]);
    return result.rowCount > 0;
  }
}

module.exports = new EmailService(); 