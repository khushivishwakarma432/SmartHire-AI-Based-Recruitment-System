const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  resumeUrl: {
    type: String,
    required: true,
    trim: true,
  },
  resumeText: {
    type: String,
    default: '',
    trim: true,
  },
  resumeParsingStatus: {
    type: String,
    enum: ['parsed', 'weak', 'missing_text', 'parse_failed'],
    default: 'parse_failed',
  },
  resumeParsingDetails: {
    type: String,
    default: '',
    trim: true,
  },
  candidateSkills: {
    type: [String],
    default: [],
  },
  candidateSummary: {
    type: String,
    default: '',
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  appliedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recruiterStatus: {
    type: String,
    enum: ['Shortlisted', 'Rejected', 'On Hold', 'Pending', 'Pending Review'],
    default: 'Pending Review',
  },
  recruiterNotes: {
    type: String,
    default: '',
    trim: true,
  },
  interviewDate: {
    type: String,
    default: '',
    trim: true,
  },
  interviewTime: {
    type: String,
    default: '',
    trim: true,
  },
  interviewMode: {
    type: String,
    enum: ['Online', 'Offline', ''],
    default: '',
  },
  interviewLocation: {
    type: String,
    default: '',
    trim: true,
  },
  interviewStatus: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Rescheduled', ''],
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Candidate', candidateSchema);
