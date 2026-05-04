const mongoose = require('mongoose');
const path = require('path');

const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Score = require('../models/Score');
const { sendScoreGeneratedEmail } = require('../services/emailService');
const { generateCandidateScore } = require('../services/scoreService');
const ensureDatabaseConnection = require('../utils/ensureDatabaseConnection');
const extractResumeText = require('../utils/extractResumeText');

const hasManualCandidateContext = (candidate) =>
  Boolean(
    String(candidate?.candidateSummary || '').trim() ||
      (Array.isArray(candidate?.candidateSkills) && candidate.candidateSkills.length),
  );

const generateScore = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { candidateId, jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(candidateId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: 'Invalid candidate ID or job ID.',
      });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      uploadedBy: req.user._id,
    }).populate('appliedJob', 'title department location employmentType description requiredSkills');

    if (!candidate) {
      return res.status(404).json({
        message: 'Candidate not found.',
      });
    }

    const hasManualContext = hasManualCandidateContext(candidate);

    if (!candidate.resumeText || !candidate.resumeText.trim()) {
      try {
        const recoveredParsingResult = await extractResumeText(path.basename(candidate.resumeUrl || ''));
        candidate.resumeText = recoveredParsingResult.resumeText;
        candidate.resumeParsingStatus = recoveredParsingResult.parsingStatus;
        candidate.resumeParsingDetails = recoveredParsingResult.details;
        await candidate.save();
      } catch (error) {
        if (!hasManualContext) {
          return res.status(error.statusCode || 400).json({
            message:
              'Resume text is not available for this candidate. This usually means the resume file could not be recovered. Please reupload the resume and try again.',
            details: error.message,
          });
        }

        candidate.resumeParsingStatus = candidate.resumeParsingStatus || 'missing';
        candidate.resumeParsingDetails = [
          candidate.resumeParsingDetails,
          `Resume recovery failed during scoring: ${error.message}`,
        ]
          .filter(Boolean)
          .join(' ');
      }
    }

    const hasReliableResumeText = Boolean(candidate.resumeText && candidate.resumeText.trim());

    if (!hasReliableResumeText && !hasManualContext) {
      return res.status(400).json({
        message:
          'This candidate does not have enough readable profile information for AI scoring. Reupload a clearer PDF resume or add candidate summary/skills and try again.',
        details: candidate.resumeParsingDetails || '',
      });
    }

    if (String(candidate.appliedJob?._id || candidate.appliedJob) !== String(jobId)) {
      return res.status(400).json({
        message: 'This candidate can only be scored against the job they applied for.',
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      createdBy: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        message: 'Job not found.',
      });
    }

    const aiResult = await generateCandidateScore({
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        resumeUrl: candidate.resumeUrl,
        resumeText: candidate.resumeText,
        resumeParsingStatus: candidate.resumeParsingStatus,
        resumeParsingDetails: candidate.resumeParsingDetails,
        candidateSkills: candidate.candidateSkills || [],
        candidateSummary: candidate.candidateSummary || '',
        appliedJob: candidate.appliedJob,
        uploadedAt: candidate.uploadedAt,
      },
      job: {
        id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        description: job.description,
        requiredSkills: job.requiredSkills,
      },
    });

    const score = await Score.findOneAndUpdate(
      {
        candidateId: candidate._id,
        jobId: job._id,
      },
      {
        candidateId: candidate._id,
        jobId: job._id,
        score: aiResult.score,
        matchedSkills: aiResult.matchedSkills,
        missingSkills: aiResult.missingSkills,
        summary: aiResult.summary,
        createdAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    await sendScoreGeneratedEmail({
      to: req.user.email || process.env.EMAIL_USER,
      candidateName: candidate.fullName,
      jobTitle: job.title,
      score: aiResult.score,
    });

    return res.status(201).json({
      message: 'Candidate score generated successfully.',
      score,
    });
  } catch (error) {
    return next(error);
  }
};

const getLatestScores = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const { candidateIds = '', jobId = '' } = req.query;
    const requestedCandidateIds = candidateIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: 'Invalid job ID.',
      });
    }

    if (requestedCandidateIds.some((candidateId) => !mongoose.Types.ObjectId.isValid(candidateId))) {
      return res.status(400).json({
        message: 'One or more candidate IDs are invalid.',
      });
    }

    const candidateQuery = {
      uploadedBy: req.user._id,
    };

    if (jobId) {
      candidateQuery.appliedJob = jobId;
    }

    if (requestedCandidateIds.length) {
      candidateQuery._id = {
        $in: requestedCandidateIds,
      };
    }

    const candidates = await Candidate.find(candidateQuery).select('_id');
    const scopedCandidateIds = candidates.map((candidate) => candidate._id);

    if (!scopedCandidateIds.length) {
      return res.status(200).json({
        scores: [],
      });
    }

    const latestScores = await Score.aggregate([
      {
        $match: {
          candidateId: {
            $in: scopedCandidateIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: '$candidateId',
          doc: { $first: '$$ROOT' },
        },
      },
      {
        $replaceRoot: {
          newRoot: '$doc',
        },
      },
      {
        $sort: {
          score: -1,
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      scores: latestScores,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateScore,
  getLatestScores,
};
