

const router = require('express').Router();
const auth = require('../middleware/auth');
const { professorId } = require('../db');

router.post('/connect', auth, (req, res) => {
  res.json({
    status: 'no agents available',
    message: 'All support agents are currently assisting other customers. Please try again later.',
    assigned_agent: null,
    last_available_agent: professorId,
    estimated_wait: 'indefinite',
    queue_position: -1,
    support_hours: 'Mon-Fri 09:00-17:00 CET'
  });
});

module.exports = router;
