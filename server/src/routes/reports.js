const express = require('express');
const auth = require('../middleware/auth');
const { getReports } = require('../controllers/reportsController');

const router = express.Router();
router.get('/', auth, getReports);

module.exports = router;