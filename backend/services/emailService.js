const sgMail = require('@sendgrid/mail');
const { getDatabase } = require('../database');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@turkishportuguese.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Turkish Portuguese Translator';
  }

  async sendDailyEmail(userId) {
    try {
      console.log(`Sending daily email to user ${userId}`);
      
      // Get user data
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get random words for the day
      const words = await this.getDailyWords(user.words_per_day || 5);
      
      // Generate email content
      const emailContent = this.generateEmailContent(user, words);
      
      // Send email
      const msg = {
        to: user.email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: `Your Daily Turkish-Portuguese Words - ${new Date().toLocaleDateString()}`,
        html: emailContent.html,
        text: emailContent.text
      };
      
      await sgMail.send(msg);
      console.log(`Email sent successfully to ${user.email}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
  
  async getUser(userId) {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT u.id, u.email, u.name, up.words_per_day FROM users u LEFT JOIN user_preferences up ON u.id = up.user_id WHERE u.id = ?',
        [userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
  }
  
  async getDailyWords(count = 5) {
    const db = await getDatabase();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT w.turkish_word, w.portuguese_word, w.english_word, e.turkish_example, e.portuguese_example, w.difficulty_level FROM words w LEFT JOIN word_examples e ON w.id = e.word_id ORDER BY RANDOM() LIMIT ?',
        [count],
        (err, words) => {
          if (err) reject(err);
          else resolve(words);
        }
      );
    });
  }
  
  generateEmailContent(user, words) {
    const userName = user.name || 'there';
    const wordCount = words.length;
    const date = new Date().toLocaleDateString('en-US', {
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
          <title>Your Daily Turkish-Portuguese Words</title>
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
            .difficulty-1 { background-color: #c6f6d5; color: #22543d; }
            .difficulty-2 { background-color: #fef5e7; color: #744210; }
            .difficulty-3 { background-color: #fed7d7; color: #742a2a; }
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
              <h1>🇹🇷 Your Daily Turkish-Portuguese Words 🇵🇹</h1>
              <p>${date} • ${wordCount} new words to learn</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Hello ${userName}! 👋<br>
                Here are your daily Turkish-Portuguese words to expand your vocabulary:
              </div>
              
              ${words.map(word => `
                <div class="word-card">
                  <div class="word-pair">
                    <div class="source-word">${word.turkish_word}</div>
                    <div class="arrow">→</div>
                    <div class="target-word">${word.portuguese_word}</div>
                  </div>
                  
                  ${word.turkish_example ? `
                    <div class="example">
                      <div class="example-label">Example (Turkish)</div>
                      <p class="example-text">${word.turkish_example}</p>
                    </div>
                  ` : ''}
                  
                  ${word.portuguese_example ? `
                    <div class="example">
                      <div class="example-label">Exemplo (Portuguese)</div>
                      <p class="example-text">${word.portuguese_example}</p>
                    </div>
                  ` : ''}
                  
                  <div class="difficulty-badge difficulty-${word.difficulty_level}">
                    Level ${word.difficulty_level}
                  </div>
                </div>
              `).join('')}
              
              <div class="cta-section">
                <h3 style="margin: 0 0 20px 0; color: #2d3748;">Ready to practice?</h3>
                <a href="${process.env.FRONTEND_URL || 'https://turkish-portuguese-translator.vercel.app'}" class="cta-button">
                  Practice These Words Online →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Keep learning and expanding your language skills! 🚀</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const text = `
Your Daily Turkish-Portuguese Words - ${date}

Hello ${userName}!

Here are your daily Turkish-Portuguese words to expand your vocabulary:

${words.map((word, index) => `
${index + 1}. ${word.turkish_word} → ${word.portuguese_word} (Level ${word.difficulty_level})
${word.turkish_example ? `   Example: ${word.turkish_example}` : ''}
${word.portuguese_example ? `   Exemplo: ${word.portuguese_example}` : ''}
`).join('\n')}

Practice these words online: ${process.env.FRONTEND_URL || 'https://turkish-portuguese-translator.vercel.app'}

Keep learning and expanding your language skills!
    `;
    
    return { html, text };
  }
  
  async processEmailQueue() {
    console.log('Processing email queue...');
    
    try {
      const db = await getDatabase();
      
      // Get users subscribed to emails
      db.all(
        'SELECT u.id, u.email, u.name FROM users u JOIN user_preferences up ON u.id = up.user_id WHERE up.is_email_subscribed = 1',
        async (err, users) => {
          if (err) {
            console.error('Error getting users:', err);
            return;
          }
          
          console.log(`Found ${users.length} users subscribed to emails`);
          
          for (const user of users) {
            try {
              await this.sendDailyEmail(user.id);
              
              // Add delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              console.error(`Failed to send email to ${user.email}:`, error.message);
            }
          }
          
          console.log(`Processed ${users.length} emails`);
        }
      );
      
    } catch (error) {
      console.error('Email queue processing failed:', error);
    }
  }
}

module.exports = new EmailService(); 