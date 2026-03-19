const router = require('express').Router();
const auth = require('../middleware/auth');
function merge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      if (typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}


router.post('/merge', auth, (req, res) => {
  const preferences = {};
  merge(preferences, req.body);

  res.json({
    status: 'preferences updated',
    applied: preferences
  });
});

module.exports = router;
