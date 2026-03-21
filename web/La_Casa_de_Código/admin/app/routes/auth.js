const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { db } = require('../db');

router.post('/register', (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (username.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'Username must be 3+ chars, password 4+ chars.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken.' });
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, username, password, name, role, balance, notes)
    VALUES (?, ?, ?, ?, 'customer', 0.00, '')
  `).run(id, username, hashedPassword, name);

  const session = Buffer.from(JSON.stringify({ id })).toString('base64');
  res.cookie('session', session, {
    httpOnly: false,
    sameSite: 'Lax',
    path: '/'
  });

  res.json({ success: true, message: 'Account created. Welcome to Banco de España Digital.' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const session = Buffer.from(JSON.stringify({ id: user.id })).toString('base64');
  res.cookie('session', session, {
    httpOnly: false,
    sameSite: 'Lax',
    path: '/'
  });

  res.json({ success: true, message: `Welcome back, ${user.name}.` });
});

router.post('/logout', (req, res) => {
  res.clearCookie('session', { path: '/' });
  res.json({ success: true, message: 'Logged out.' });
});

module.exports = router;
