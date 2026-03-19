const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const { validateUsername, validatePassword } = require('../utils/validator');

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  // Fixed: Add input validation
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.valid) {
    return res.status(400).json({ error: usernameCheck.error });
  }
  
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }
  
  const hashed = bcrypt.hashSync(password, 10);
  
  try {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed);
    res.json({ message: 'User registered' });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router;
