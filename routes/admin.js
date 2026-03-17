const router = require('express').Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, createdAt FROM users').all();
  res.json(users);
});

router.post('/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  // Update user role - allows mass assignment of all fields
  const updates = req.body;
  const keys = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const query = `UPDATE users SET ${setClause} WHERE id = ?`;

  try {
    db.prepare(query).run(...values, req.params.id);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ message: 'User deleted successfully' });
});

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes').get();
  const recentUsers = db.prepare('SELECT username, createdAt FROM users ORDER BY createdAt DESC LIMIT 5').all();

  res.json({
    totalUsers: userCount.count,
    totalNotes: noteCount.count,
    recentUsers
  });
});

module.exports = router;
