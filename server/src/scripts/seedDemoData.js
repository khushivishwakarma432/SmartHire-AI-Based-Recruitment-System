const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Score = require('../models/Score');
const User = require('../models/User');

dotenv.config();

const DEMO_RECRUITER = {
  name: 'SmartHire Demo Recruiter',
  email: 'demo@smarthire.com',
  password: 'Demo@123',
  role: 'hr',
};

const DEMO_JOBS = [
  {
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Bangalore',
    employmentType: 'Full-time',
    description:
      'Build responsive hiring dashboards and candidate workflows using React, JavaScript, and modern CSS.',
    requiredSkills: ['React', 'JavaScript', 'CSS'],
  },
  {
    title: 'Data Analyst',
    department: 'Analytics',
    location: 'Remote',
    employmentType: 'Full-time',
    description:
      'Analyze recruitment metrics, prepare reports, and work with hiring data using Excel, SQL, and Python.',
    requiredSkills: ['Excel', 'SQL', 'Python'],
  },
];

const DEMO_CANDIDATES = [
  {
    fullName: 'Riya Sharma',
    email: 'riya.sharma@demo.smarthire.local',
    phone: '+91 9876543210',
    appliedJobTitle: 'Frontend Developer',
    candidateSkills: ['React', 'JavaScript', 'CSS'],
    recruiterStatus: 'Shortlisted',
    score: 90,
  },
  {
    fullName: 'Aman Verma',
    email: 'aman.verma@demo.smarthire.local',
    phone: '+91 9876543211',
    appliedJobTitle: 'Frontend Developer',
    candidateSkills: ['React', 'HTML'],
    recruiterStatus: 'Pending Review',
    score: 60,
  },
  {
    fullName: 'Neha Singh',
    email: 'neha.singh@demo.smarthire.local',
    phone: '+91 9876543212',
    appliedJobTitle: 'Data Analyst',
    candidateSkills: ['Java', 'Spring'],
    recruiterStatus: 'Rejected',
    score: 20,
  },
];

const getCandidateSummary = (candidate) =>
  `${candidate.fullName} has experience with ${candidate.candidateSkills.join(', ')} and is being reviewed for the ${candidate.appliedJobTitle} role.`;

const uniqueStrings = (values = []) => {
  const seen = new Set();

  return values.filter((value) => {
    const normalized = String(value || '').trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getScoreSummary = (candidate, job, matchedSkills, missingSkills) => {
  const fit = candidate.score >= 80 ? 'strong' : candidate.score >= 50 ? 'moderate' : 'limited';
  const matchedText = matchedSkills.length
    ? `Matched skills: ${matchedSkills.join(', ')}.`
    : 'No strong direct skill matches were detected.';
  const missingText = missingSkills.length
    ? `Skills still missing or less visible: ${missingSkills.join(', ')}.`
    : 'No major skill gaps are currently highlighted.';

  return `${candidate.fullName} shows ${fit} alignment for the ${job.title} role. ${matchedText} ${missingText}`;
};

const upsertDemoRecruiter = async () => {
  const hashedPassword = await bcrypt.hash(DEMO_RECRUITER.password, 10);
  let user = await User.findOne({ email: DEMO_RECRUITER.email });

  if (!user) {
    user = await User.create({
      name: DEMO_RECRUITER.name,
      email: DEMO_RECRUITER.email,
      password: hashedPassword,
      role: DEMO_RECRUITER.role,
    });

    return user;
  }

  user.name = DEMO_RECRUITER.name;
  user.role = DEMO_RECRUITER.role;
  user.password = hashedPassword;
  await user.save();
  return user;
};

const upsertDemoJobs = async (userId) => {
  const jobsByTitle = {};

  for (const job of DEMO_JOBS) {
    const savedJob = await Job.findOneAndUpdate(
      {
        title: job.title,
        createdBy: userId,
      },
      {
        ...job,
        createdBy: userId,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    jobsByTitle[job.title] = savedJob;
  }

  return jobsByTitle;
};

const upsertDemoCandidates = async (userId, jobsByTitle) => {
  const candidateIds = [];

  for (const candidate of DEMO_CANDIDATES) {
    const job = jobsByTitle[candidate.appliedJobTitle];

    if (!job) {
      throw new Error(`Missing demo job for candidate ${candidate.fullName}.`);
    }

    const matchedSkills = uniqueStrings(
      candidate.candidateSkills.filter((skill) => job.requiredSkills.includes(skill)),
    );
    const missingSkills = uniqueStrings(
      job.requiredSkills.filter((skill) => !matchedSkills.includes(skill)),
    );
    const candidateSummary = getCandidateSummary(candidate);
    const resumeText = `${candidateSummary} Skills: ${candidate.candidateSkills.join(', ')}.`;

    const savedCandidate = await Candidate.findOneAndUpdate(
      {
        email: candidate.email,
        appliedJob: job._id,
        uploadedBy: userId,
      },
      {
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        resumeUrl: '/uploads/parser-smoke-test.pdf',
        resumeText,
        resumeParsingStatus: 'parsed',
        resumeParsingDetails: '',
        candidateSkills: candidate.candidateSkills,
        candidateSummary,
        appliedJob: job._id,
        uploadedBy: userId,
        recruiterStatus: candidate.recruiterStatus,
        recruiterNotes: `${candidate.recruiterStatus} in the demo dataset.`,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    await Score.findOneAndUpdate(
      {
        candidateId: savedCandidate._id,
        jobId: job._id,
      },
      {
        candidateId: savedCandidate._id,
        jobId: job._id,
        score: candidate.score,
        matchedSkills,
        missingSkills,
        summary: getScoreSummary(candidate, job, matchedSkills, missingSkills),
        createdAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    candidateIds.push(savedCandidate._id);
  }

  return candidateIds;
};

const ensureDemoData = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is required before seeding demo data.');
  }

  const recruiter = await upsertDemoRecruiter();
  const jobsByTitle = await upsertDemoJobs(recruiter._id);
  const candidateIds = await upsertDemoCandidates(recruiter._id, jobsByTitle);

  return {
    recruiterEmail: recruiter.email,
    jobCount: Object.keys(jobsByTitle).length,
    candidateCount: candidateIds.length,
  };
};

const runSeedScript = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const result = await ensureDemoData();
    console.log(
      `Demo data ready for ${result.recruiterEmail}: ${result.jobCount} jobs, ${result.candidateCount} candidates.`,
    );
  } catch (error) {
    console.error(`Demo seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  runSeedScript();
}

module.exports = {
  ensureDemoData,
};
