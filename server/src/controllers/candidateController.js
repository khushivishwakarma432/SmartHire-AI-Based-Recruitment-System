const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');

const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { sendCandidateUploadedEmail } = require('../services/emailService');
const ensureDatabaseConnection = require('../utils/ensureDatabaseConnection');
const extractResumeText = require('../utils/extractResumeText');

const normalizeCandidateSkills = (value) =>
  String(value || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

const normalizeCandidateTags = (tags = []) => {
  const seen = new Set();

  const values = Array.isArray(tags)
    ? tags
    : String(tags || '')
        .split(',')
        .map((tag) => tag.trim());

  return values.reduce((accumulator, tag) => {
    const normalizedTag = String(tag || '').trim();
    const normalizedKey = normalizedTag.toLowerCase();

    if (!normalizedTag || seen.has(normalizedKey)) {
      return accumulator;
    }

    seen.add(normalizedKey);
    accumulator.push(normalizedTag);
    return accumulator;
  }, []);
};

const normalizeRecruiterStatus = (value) => {
  const normalizedValue = String(value || '').trim();
  return normalizedValue === 'Pending' ? 'Pending Review' : normalizedValue;
};

const normalizeInterviewMode = (value) => String(value || '').trim();
const normalizeInterviewStatus = (value) => String(value || '').trim();

const removeUploadedFile = async (filename) => {
  if (!filename) {
    return;
  }

  try {
    await fs.unlink(path.join(__dirname, '../../uploads', filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Uploaded file cleanup failed: ${error.message}`);
    }
  }
};

const uploadCandidate = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { fullName, email, phone, appliedJob, candidateSkills = '', candidateSummary = '' } = req.body;
    const normalizedFullName = String(fullName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim();
    const normalizedCandidateSummary = String(candidateSummary || '').trim();
    const normalizedCandidateSkills = normalizeCandidateSkills(candidateSkills);

    if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !appliedJob) {
      return res.status(400).json({
        message: 'fullName, email, phone, and appliedJob are required.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Resume PDF is required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appliedJob)) {
      return res.status(400).json({
        message: 'Invalid job ID.',
      });
    }

    const job = await Job.findOne({
      _id: appliedJob,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Applied job not found.',
      });
    }

    const existingCandidate = await Candidate.findOne({
      email: normalizedEmail,
      appliedJob,
      uploadedBy: req.user._id,
    }).select('_id');

    if (existingCandidate) {
      await removeUploadedFile(req.file.filename);
      return res.status(409).json({
        message: 'A candidate with this email has already been uploaded for the selected job.',
      });
    }

    const parsingResult = await extractResumeText(req.file.filename);

    const candidate = await Candidate.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      resumeUrl: `/uploads/${req.file.filename}`,
      resumeText: parsingResult.resumeText,
      resumeParsingStatus: parsingResult.parsingStatus,
      resumeParsingDetails: parsingResult.details,
      candidateSkills: normalizedCandidateSkills,
      candidateSummary: normalizedCandidateSummary,
      appliedJob,
      uploadedBy: req.user._id,
      recruiterStatus: 'Pending Review',
    });

    await sendCandidateUploadedEmail({
      to: req.user.email || process.env.EMAIL_USER,
      candidateName: candidate.fullName,
      jobTitle: job.title,
    });

    return res.status(201).json({
      message:
        parsingResult.parsingStatus === 'parsed'
          ? 'Candidate uploaded successfully.'
          : 'Candidate uploaded successfully, but resume parsing quality was limited. You can still continue using the candidate profile.',
      candidate,
      parsing: {
        status: parsingResult.parsingStatus,
        details: parsingResult.details,
        textLength: parsingResult.textLength,
      },
    });
  } catch (error) {
    await removeUploadedFile(req.file?.filename);
    return next(error);
  }
};

const reviewCandidate = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { id } = req.params;
    const { recruiterStatus, recruiterNotes = '' } = req.body;
    const allowedStatuses = ['Shortlisted', 'Rejected', 'On Hold', 'Pending Review', 'Pending'];
    const normalizedRecruiterStatus = normalizeRecruiterStatus(recruiterStatus);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid candidate ID.',
      });
    }

    if (!normalizedRecruiterStatus || !allowedStatuses.includes(recruiterStatus)) {
      return res.status(400).json({
        message: 'A valid recruiterStatus is required.',
      });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      uploadedBy: req.user._id,
    }).populate('appliedJob', 'title');

    if (!candidate) {
      return res.status(404).json({
        message: 'Candidate not found.',
      });
    }

    candidate.recruiterStatus = normalizedRecruiterStatus;
    candidate.recruiterNotes = String(recruiterNotes || '').trim();

    await candidate.save();

    return res.status(200).json({
      message: 'Recruiter review saved successfully.',
      candidate,
    });
  } catch (error) {
    return next(error);
  }
};

const scheduleInterview = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { id } = req.params;
    const {
      interviewDate = '',
      interviewTime = '',
      interviewMode = '',
      interviewLocation = '',
      interviewStatus = '',
    } = req.body;
    const allowedModes = ['Online', 'Offline', ''];
    const allowedStatuses = ['Scheduled', 'Completed', 'Rescheduled', ''];
    const normalizedInterviewDate = String(interviewDate || '').trim();
    const normalizedInterviewTime = String(interviewTime || '').trim();
    const normalizedInterviewMode = normalizeInterviewMode(interviewMode);
    const normalizedInterviewLocation = String(interviewLocation || '').trim();
    const normalizedInterviewStatus = normalizeInterviewStatus(interviewStatus);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid candidate ID.',
      });
    }

    if (!normalizedInterviewDate || !normalizedInterviewTime || !normalizedInterviewMode || !normalizedInterviewStatus) {
      return res.status(400).json({
        message: 'interviewDate, interviewTime, interviewMode, and interviewStatus are required.',
      });
    }

    if (!allowedModes.includes(normalizedInterviewMode)) {
      return res.status(400).json({
        message: 'A valid interviewMode is required.',
      });
    }

    if (!allowedStatuses.includes(normalizedInterviewStatus)) {
      return res.status(400).json({
        message: 'A valid interviewStatus is required.',
      });
    }

    if (normalizedInterviewMode === 'Online' && !normalizedInterviewLocation) {
      return res.status(400).json({
        message: 'Please provide a meeting link or location for the interview.',
      });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      uploadedBy: req.user._id,
    }).populate('appliedJob', 'title');

    if (!candidate) {
      return res.status(404).json({
        message: 'Candidate not found.',
      });
    }

    candidate.interviewDate = normalizedInterviewDate;
    candidate.interviewTime = normalizedInterviewTime;
    candidate.interviewMode = normalizedInterviewMode;
    candidate.interviewLocation = normalizedInterviewLocation;
    candidate.interviewStatus = normalizedInterviewStatus;

    await candidate.save();

    return res.status(200).json({
      message: 'Interview details saved successfully.',
      candidate,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCandidateTags = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { id } = req.params;
    const { tags = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid candidate ID.',
      });
    }

    const candidate = await Candidate.findOne({
      _id: id,
      uploadedBy: req.user._id,
    }).populate('appliedJob', 'title');

    if (!candidate) {
      return res.status(404).json({
        message: 'Candidate not found.',
      });
    }

    candidate.tags = normalizeCandidateTags(tags);

    await candidate.save();

    return res.status(200).json({
      message: 'Candidate tags saved successfully.',
      candidate,
    });
  } catch (error) {
    return next(error);
  }
};

const getCandidates = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const candidates = await Candidate.find({ uploadedBy: req.user._id })
      .populate('appliedJob', 'title')
      .sort({ uploadedAt: -1 });

    return res.status(200).json({
      candidates,
    });
  } catch (error) {
    return next(error);
  }
};

const getCandidatesByJob = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: 'Invalid job ID.',
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      createdBy: req.user._id,
    }).select('title department location employmentType');

    if (!job) {
      return res.status(404).json({
        message: 'Job not found.',
      });
    }

    const candidates = await Candidate.find({
      uploadedBy: req.user._id,
      appliedJob: jobId,
    })
      .populate('appliedJob', 'title')
      .sort({ uploadedAt: -1 });

    return res.status(200).json({
      job,
      candidates,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCandidates,
  getCandidatesByJob,
  scheduleInterview,
  reviewCandidate,
  updateCandidateTags,
  uploadCandidate,
};
