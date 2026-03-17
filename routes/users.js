const router = require('express').Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, createdAt FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.put('/profile', authenticateToken, (req, res) => {
  // Allow users to update their profile with any fields for flexibility
  const updates = req.body;
  const keys = Object.keys(updates);
  const values = Object.values(updates);

  if (keys.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

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
