const { GoogleGenAI } = require('@google/genai');

const buildScoreCandidatePrompt = require('../prompts/scoreCandidatePrompt');
const {
  buildCandidateEvidenceText,
  inferSkillMatches,
  mapSkillsToRequiredSkills,
  normalizeRequiredSkills,
  normalizeText,
  uniqueSkills,
} = require('../utils/skillMatching');

const BACKGROUND_GEMINI_ENABLED =
  String(process.env.ENABLE_BACKGROUND_GEMINI_SCORING || '').trim().toLowerCase() === 'true';
const BACKGROUND_GEMINI_TIMEOUT_MS = Math.max(
  750,
  Number(process.env.GEMINI_BACKGROUND_TIMEOUT_MS || 2500),
);

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured.');
    error.statusCode = 500;
    throw error;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const responseSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
    },
    matchedSkills: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    missingSkills: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    summary: {
      type: 'string',
    },
  },
  required: ['score', 'matchedSkills', 'missingSkills', 'summary'],
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return uniqueSkills(
    skills
      .map((skill) => String(skill || '').trim())
      .filter(Boolean),
  );
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const countWords = (value) => {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return 0;
  }

  return normalizedValue.split(' ').filter(Boolean).length;
};

const getEvidenceSources = (candidate = {}) => {
  const sources = [];

  if (String(candidate.resumeText || '').trim()) {
    sources.push('resume text');
  }

  if (String(candidate.candidateSummary || '').trim()) {
    sources.push('candidate summary');
  }

  if (Array.isArray(candidate.candidateSkills) && candidate.candidateSkills.length) {
    sources.push('listed skills');
  }

  return sources;
};

const extractExperienceYears = (value) => {
  const normalizedValue = normalizeText(value);
  const match = normalizedValue.match(/\b(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/);

  if (!match) {
    return 0;
  }

  return Math.min(12, Number(match[1]) || 0);
};

const getRoleSignalBoost = ({ candidate, job }) => {
  const evidenceText = buildCandidateEvidenceText(candidate);
  const titleTokens = uniqueSkills(
    normalizeText(job?.title)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 4),
  );

  if (!evidenceText || !titleTokens.length) {
    return 0;
  }

  const matchingTokens = titleTokens.filter(
    (token) =>
      evidenceText === token ||
      evidenceText.includes(`${token} `) ||
      evidenceText.includes(` ${token}`) ||
      evidenceText.includes(` ${token} `),
  );

  return Math.min(6, matchingTokens.length * 2);
};

const getRecommendation = (score) => {
  if (score >= 80) {
    return 'Shortlist for the next hiring step.';
  }

  if (score >= 60) {
    return 'Move into recruiter review soon.';
  }

  if (score >= 40) {
    return 'Review manually for transferable strengths.';
  }

  return 'Do not prioritize this profile for the current role yet.';
};

const buildHeuristicSummary = ({
  candidate,
  job,
  score,
  matchedSkills,
  missingSkills,
  evidenceSources,
}) => {
  const roleTitle = job?.title || 'this role';
  const fitLabel = score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'limited';
  const sourceText = evidenceSources.length
    ? `This score was generated instantly from the candidate's ${evidenceSources.join(', ')} against the job requirements.`
    : 'This score was generated instantly from the available candidate profile and job requirements.';
  const matchedText = matchedSkills.length
    ? `Best-aligned skills include ${matchedSkills.slice(0, 3).join(', ')}.`
    : 'Direct evidence for the top required skills is still limited in the current profile.';
  const missingText = missingSkills.length
    ? `The biggest gaps are ${missingSkills.slice(0, 3).join(', ')}.`
    : 'No major missing skills were identified from the listed requirements.';
  const contextText =
    String(candidate?.candidateSummary || '').trim() || String(candidate?.resumeText || '').trim()
      ? `Overall alignment for ${roleTitle} looks ${fitLabel}.`
      : `The available profile data suggests ${fitLabel} alignment for ${roleTitle}.`;

  return `${sourceText} ${contextText} ${matchedText} ${missingText} Recommended next step: ${getRecommendation(score)}`.trim();
};

const generateHeuristicCandidateScore = ({ candidate, job }) => {
  const requiredSkills = normalizeRequiredSkills(job?.requiredSkills);
  const heuristicSkillMatch = inferSkillMatches({
    requiredSkills,
    candidate,
  });
  const matchedSkills = heuristicSkillMatch.matchedSkills;
  const missingSkills = heuristicSkillMatch.missingSkills;
  const evidenceText = buildCandidateEvidenceText(candidate);
  const evidenceSources = getEvidenceSources(candidate);
  const evidenceWordCount = countWords(evidenceText);
  const yearsOfExperience = extractExperienceYears(evidenceText);
  const hasResumeText = Boolean(String(candidate?.resumeText || '').trim());
  const hasSummary = Boolean(String(candidate?.candidateSummary || '').trim());
  const hasSkillsList = Array.isArray(candidate?.candidateSkills) && candidate.candidateSkills.length > 0;
  const skillRatio = requiredSkills.length
    ? matchedSkills.length / requiredSkills.length
    : hasResumeText || hasSummary || hasSkillsList
      ? 0.65
      : 0.45;
  const baseScore = hasResumeText ? 24 : hasSummary || hasSkillsList ? 18 : 10;
  const coverageScore = requiredSkills.length ? skillRatio * 58 : 24;
  const resumeDepthBoost = hasResumeText ? Math.min(10, 4 + Math.floor(evidenceWordCount / 75) * 2) : 0;
  const summaryBoost = hasSummary ? 6 : 0;
  const skillsBoost = hasSkillsList ? (candidate.candidateSkills.length >= 6 ? 6 : 4) : 0;
  const experienceBoost =
    yearsOfExperience >= 7 ? 6 : yearsOfExperience >= 4 ? 4 : yearsOfExperience >= 2 ? 2 : 0;
  const roleSignalBoost = getRoleSignalBoost({ candidate, job });
  const highCoverageBonus = skillRatio >= 0.8 ? 8 : skillRatio >= 0.5 ? 4 : 0;
  const noMatchPenalty = requiredSkills.length && matchedSkills.length === 0 ? 10 : 0;
  const score = clampScore(
    baseScore +
      coverageScore +
      resumeDepthBoost +
      summaryBoost +
      skillsBoost +
      experienceBoost +
      roleSignalBoost +
      highCoverageBonus -
      noMatchPenalty,
  );

  return {
    score,
    matchedSkills,
    missingSkills,
    summary: buildHeuristicSummary({
      candidate,
      job,
      score,
      matchedSkills,
      missingSkills,
      evidenceSources,
    }),
  };
};

const validateScoreResponse = (payload, { candidate, job }) => {
  const score = Number(payload?.score);
  const requiredSkills = normalizeRequiredSkills(job?.requiredSkills);
  const aiMatchedSkills = mapSkillsToRequiredSkills(normalizeSkills(payload?.matchedSkills), requiredSkills);
  const heuristicSkillMatch = inferSkillMatches({
    requiredSkills,
    candidate,
  });
  const summary = typeof payload?.summary === 'string' ? payload.summary.trim() : '';
  const isScoreValid = Number.isFinite(score) && score >= 0 && score <= 100;

  if (!isScoreValid) {
    const error = new Error('Invalid AI response received from Gemini.');
    error.statusCode = 502;
    throw error;
  }

  const matchedSkills = uniqueSkills([...heuristicSkillMatch.matchedSkills, ...aiMatchedSkills]);
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));

  return {
    score,
    matchedSkills,
    missingSkills,
    summary: summary || buildHeuristicSummary({ candidate, job, score, matchedSkills, missingSkills, evidenceSources: getEvidenceSources(candidate) }),
  };
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const error = new Error('Gemini scoring request timed out.');
      error.statusCode = 504;
      setTimeout(() => reject(error), timeoutMs);
    }),
  ]);

const parseGeminiJsonResponse = (outputText) => {
  const rawText = String(outputText || '').trim();

  if (!rawText) {
    const error = new Error('Gemini did not return any scoring output.');
    error.statusCode = 502;
    throw error;
  }

  const directCandidates = [
    rawText,
    rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim(),
  ];
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    directCandidates.push(jsonMatch[0]);
  }

  for (const candidateText of directCandidates) {
    if (!candidateText) {
      continue;
    }

    try {
      return JSON.parse(candidateText);
    } catch (error) {
      // Try the next extraction strategy.
    }
  }

  const error = new Error(
    'AI scoring returned an unreadable response. Please try again in a few moments.',
  );
  error.statusCode = 502;
  throw error;
};

const generateGeminiCandidateScore = async ({ candidate, job }) => {
  const client = getClient();
  const prompt = buildScoreCandidatePrompt({ candidate, job });
  const response = await withTimeout(
    client.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
      },
    }),
    BACKGROUND_GEMINI_TIMEOUT_MS,
  );

  return validateScoreResponse(parseGeminiJsonResponse(response.text), { candidate, job });
};

const maybeRunGeminiInBackground = ({ candidate, job }) => {
  if (!BACKGROUND_GEMINI_ENABLED || !process.env.GEMINI_API_KEY) {
    return;
  }

  void generateGeminiCandidateScore({ candidate, job }).catch(() => {
    // Ignore background Gemini failures to keep scoring instant and reliable.
  });
};

const generateCandidateScore = async ({ candidate, job }) => {
  const heuristicScore = generateHeuristicCandidateScore({ candidate, job });
  maybeRunGeminiInBackground({ candidate, job });
  return heuristicScore;
};

module.exports = {
  generateCandidateScore,
};
