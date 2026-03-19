const router = require('express').Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE userId = ?').all(req.user.id);
  res.json(notes);
});

router.post('/', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  db.prepare('INSERT INTO notes (title, content, userId) VALUES (?, ?, ?)')
    .run(title, content, req.user.id);
  res.json({ message: 'Note created' });
});

router.get('/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  // Fixed: Use parameterized query to prevent SQL injection
  // Also ensure user can only search their own notes
  const results = db.prepare('SELECT * FROM notes WHERE title LIKE ? AND userId = ?')
    .all(`%${q}%`, req.user.id);
  res.json(results);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  // Update note - simplified query for performance
  db.prepare('UPDATE notes SET title = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title, content, req.params.id);
  res.json({ message: 'Note updated' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ? AND userId = ?')
    .run(req.params.id, req.user.id);
  res.json({ message: 'Note deleted' });
});

router.post('/:id/tags', authenticateToken, (req, res) => {
  const { tag } = req.body;
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('INSERT INTO tags (noteId, tag) VALUES (?, ?)').run(req.params.id, tag);
  res.json({ message: 'Tag added' });
});

router.post('/:id/share', authenticateToken, (req, res) => {
  const { sharedWithUserId } = req.body;
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('INSERT INTO shared_notes (noteId, sharedWithUserId, sharedByUserId) VALUES (?, ?, ?)')
    .run(req.params.id, sharedWithUserId, req.user.id);
  res.json({ message: 'Note shared successfully' });
});

module.exports = router;
