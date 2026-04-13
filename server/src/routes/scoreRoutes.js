const express = require('express');

const { generateScore, getLatestScores } = require('../controllers/scoreController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/latest', protect, getLatestScores);
router.post('/generate/:candidateId/:jobId', protect, generateScore);

module.exports = router;
