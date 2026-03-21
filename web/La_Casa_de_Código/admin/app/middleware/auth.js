module.exports = function authMiddleware(req, res, next) {
  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf8'));

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid session format.' });
    }

    const { db } = require('../db');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Malformed session cookie.' });
  }
};
