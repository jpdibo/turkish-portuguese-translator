const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authentication token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const userQuery = `
      SELECT id, email, first_name, last_name, is_active, is_verified
      FROM users
      WHERE id = $1 AND is_active = true
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or expired token'
      });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is verified (optional, depending on your requirements)
    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Account not verified',
        message: 'Please verify your email address before accessing this resource'
      });
    }
    
    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired'
      });
    }
    
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

module.exports = auth; 