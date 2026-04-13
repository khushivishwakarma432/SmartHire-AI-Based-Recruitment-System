const mongoose = require('mongoose');

const Job = require('../models/Job');
const ensureDatabaseConnection = require('../utils/ensureDatabaseConnection');

const validateRequiredFields = (payload) => {
  const requiredFields = [
    'title',
    'department',
    'location',
    'employmentType',
    'description',
  ];

  return requiredFields.filter((field) => !payload[field] || !String(payload[field]).trim());
};

const normalizeSkills = (skills) => {
  if (!skills) {
    return [];
  }

  if (!Array.isArray(skills)) {
    return null;
  }

  return skills
    .map((skill) => String(skill).trim())
    .filter(Boolean);
};

const ensureValidJobId = (jobId, res) => {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    res.status(400).json({
      message: 'Invalid job ID.',
    });
    return false;
  }

  return true;
};

const createJob = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const missingFields = validateRequiredFields(req.body);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      });
    }

    const requiredSkills = normalizeSkills(req.body.requiredSkills);

    if (requiredSkills === null) {
      return res.status(400).json({
        message: 'requiredSkills must be an array of strings.',
      });
    }

    const job = await Job.create({
      title: req.body.title,
      department: req.body.department,
      location: req.body.location,
      employmentType: req.body.employmentType,
      description: req.body.description,
      requiredSkills,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: 'Job created successfully.',
      job,
    });
  } catch (error) {
    return next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      jobs,
    });
  } catch (error) {
    return next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    if (!ensureValidJobId(req.params.id, res)) {
      return;
    }

    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found.',
      });
    }

    return res.status(200).json({
      job,
    });
  } catch (error) {
    return next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    if (!ensureValidJobId(req.params.id, res)) {
      return;
    }

    const missingFields = validateRequiredFields(req.body);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      });
    }

    const requiredSkills = normalizeSkills(req.body.requiredSkills);

    if (requiredSkills === null) {
      return res.status(400).json({
        message: 'requiredSkills must be an array of strings.',
      });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found.',
      });
    }

    job.title = req.body.title;
    job.department = req.body.department;
    job.location = req.body.location;
    job.employmentType = req.body.employmentType;
    job.description = req.body.description;
    job.requiredSkills = requiredSkills;

    await job.save();

    return res.status(200).json({
      message: 'Job updated successfully.',
      job,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    if (!ensureValidJobId(req.params.id, res)) {
      return;
    }

    const job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found.',
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      message: 'Job deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
};
