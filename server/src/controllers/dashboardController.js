const mongoose = require('mongoose');

const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Score = require('../models/Score');
const ensureDatabaseConnection = require('../utils/ensureDatabaseConnection');

const toSafeNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getDashboardSummary = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnection(res)) {
      return;
    }

    const [jobs, candidates] = await Promise.all([
      Job.find({ createdBy: req.user._id }).select('_id title'),
      Candidate.find({ uploadedBy: req.user._id }).select('_id fullName email appliedJob uploadedAt'),
    ]);

    const jobIds = jobs.map((job) => job._id);
    const candidateIds = candidates.map((candidate) => candidate._id);

    const latestScores = candidateIds.length
      ? await Score.aggregate([
          {
            $match: {
              candidateId: {
                $in: candidateIds.map((id) => new mongoose.Types.ObjectId(id)),
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
        ])
      : [];

    const totalJobs = jobs.length;
    const totalCandidates = candidates.length;
    const totalScored = latestScores.length;

    const averageScore = totalScored
      ? Number(
          (
            latestScores.reduce((sum, scoreEntry) => sum + Number(scoreEntry.score || 0), 0) / totalScored
          ).toFixed(1),
        )
      : 0;

    const candidateMap = new Map(candidates.map((candidate) => [String(candidate._id), candidate]));
    const jobMap = new Map(jobs.map((job) => [String(job._id), job]));

    const topCandidates = latestScores
      .sort((firstScore, secondScore) => secondScore.score - firstScore.score)
      .slice(0, 3)
      .map((scoreEntry) => {
        const candidate = candidateMap.get(String(scoreEntry.candidateId));
        const appliedJob = candidate ? jobMap.get(String(candidate.appliedJob)) : null;

        return {
          candidateId: scoreEntry.candidateId,
          fullName: candidate?.fullName || 'Unknown Candidate',
          email: candidate?.email || '',
          score: Math.min(100, Math.max(0, toSafeNumber(scoreEntry.score))),
          summary: scoreEntry.summary || 'No AI summary available yet.',
          jobTitle: appliedJob?.title || 'Unknown Job',
        };
      });

    const candidatesPerJob = jobs.map((job) => ({
        jobId: job._id,
        jobTitle: job.title,
        candidateCount: Math.max(
          0,
          candidates.filter((candidate) => String(candidate.appliedJob) === String(job._id)).length,
        ),
      }));

    return res.status(200).json({
      totalJobs,
      totalCandidates,
      totalScored,
      averageScore,
      topCandidates,
      candidatesPerJob,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
