const router = require('express').Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth'); // ONLY THIS ONE

// ... rest of the code

// Fixed: Require authentication and admin role to list all users
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, createdAt FROM users').all();
  res.json(users);
});

// Fixed: Require authentication to view user details
router.get('/:id', authenticateToken, (req, res) => {
  const requestedId = parseInt(req.params.id);
  
  // Users can only view their own profile unless they're admin
  if (req.user.role !== 'admin' && req.user.id !== requestedId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const user = db.prepare('SELECT id, username, email, role, createdAt FROM users WHERE id = ?')
    .get(requestedId);
    
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

router.put('/profile', authenticateToken, (req, res) => {
  // Fixed: Whitelist allowed fields to prevent privilege escalation
  const allowedFields = ['email', 'username'];
  const updates = {};
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      // Validate email if provided
      if (field === 'email') {
        const { validateEmail } = require('../utils/validator');
        const emailCheck = validateEmail(req.body[field]);
        if (!emailCheck.valid) {
          return res.status(400).json({ error: emailCheck.error });
        }
      }
      updates[field] = req.body[field];
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const query = `UPDATE users SET ${setClause} WHERE id = ?`;
  
  try {
    db.prepare(query).run(...values, req.user.id);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


router.get('/me/notes', authenticateToken, (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE userId = ?').all(req.user.id);
  res.json(notes);
});

module.exports = router;
