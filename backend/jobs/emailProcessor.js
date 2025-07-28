const cron = require('node-cron');
const emailService = require('../services/emailService');

class EmailProcessor {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Email processor is already running');
      return;
    }

    console.log('Starting email processor...');

    // Schedule daily email sending at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily email job...');
      await this.processDailyEmails();
    }, {
      timezone: 'UTC'
    });

    // Process emails every 5 minutes for testing
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running email queue processing...');
      await this.processEmailQueue();
    }, {
      timezone: 'UTC'
    });

    this.isRunning = true;
    console.log('Email processor started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Email processor is not running');
      return;
    }

    console.log('Stopping email processor...');
    this.isRunning = false;
    console.log('Email processor stopped');
  }

  async processDailyEmails() {
    try {
      console.log('Processing daily emails...');
      await emailService.processEmailQueue();
      console.log('Daily emails processed successfully');
    } catch (error) {
      console.error('Error processing daily emails:', error);
    }
  }

  async processEmailQueue() {
    try {
      console.log('Processing email queue...');
      await emailService.processEmailQueue();
      console.log('Email queue processed successfully');
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  async sendTestEmail(userId) {
    try {
      console.log(`Sending test email to user ${userId}...`);
      await emailService.sendDailyEmail(userId);
      console.log('Test email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error sending test email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailProcessor(); 