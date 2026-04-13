const express = require('express');

const {
  getCandidates,
  getCandidatesByJob,
  scheduleInterview,
  reviewCandidate,
  updateCandidateTags,
  uploadCandidate,
} = require('../controllers/candidateController');
const uploadResume = require('../config/upload');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getCandidates);
router.get('/job/:jobId', protect, getCandidatesByJob);
router.put('/tags/:id', protect, updateCandidateTags);
router.put('/interview/:id', protect, scheduleInterview);
router.put('/review/:id', protect, reviewCandidate);
router.post('/upload', protect, uploadResume.single('resume'), uploadCandidate);

module.exports = router;
