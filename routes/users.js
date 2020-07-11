var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* Ego boost. */
router.get('/cool', (req, res, next) => {
  res.send('oh, but you are cool, as a cucumber!');
});

module.exports = router;
