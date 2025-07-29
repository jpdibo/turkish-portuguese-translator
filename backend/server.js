const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const wordsRoutes = require('./routes/words');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Setup endpoint to initialize database
app.get('/setup', async (req, res) => {
  try {
    const { initializeDatabase, importWords } = require('./database-supabase');
    
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Importing words...');
    const count = await importWords();
    
    res.json({
      success: true,
      message: `Database setup complete! Imported ${count} words.`,
      count: count
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API routes
app.use('/api/words', wordsRoutes);

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const { testConnection } = require('./database-supabase');
    const isConnected = await testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Database connection successful' : 'Database connection failed'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Test database: http://localhost:${PORT}/test-db`);
  console.log(`⚡ Setup database: http://localhost:${PORT}/setup`);
});

module.exports = app;