

const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/account', auth, (req, res) => {
  const user = req.user;

  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    balance: user.balance,
    notes: user.notes || ''
  });
});

module.exports = router;
