const express = require('express');

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const protect = require('../middleware/authMiddleware');
const requireHr = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, requireHr);

router.route('/').post(createJob).get(getJobs);
router.route('/:id').get(getJobById).put(updateJob).delete(deleteJob);

module.exports = router;
