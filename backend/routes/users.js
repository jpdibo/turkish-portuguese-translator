const express = require('express');
const router = express.Router();

// Example users route
router.get('/', (req, res) => {
  res.json({ message: 'Users route works!' });
});

module.exports = router; 