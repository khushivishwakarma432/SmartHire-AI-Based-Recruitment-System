const { GoogleGenAI } = require('@google/genai');

const buildScoreCandidatePrompt = require('../prompts/scoreCandidatePrompt');
const {
  inferSkillMatches,
  mapSkillsToRequiredSkills,
  normalizeRequiredSkills,
  uniqueSkills,
} = require('../utils/skillMatching');
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 3000, 4000];
const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 20000);

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

const buildFallbackSummary = ({ score, matchedSkills, missingSkills }) => {
  const fitLabel = score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'limited';
  const matchedText = matchedSkills.length
    ? `Matched skills include ${matchedSkills.join(', ')}.`
    : 'The response did not identify clear matched skills.';
  const missingText = missingSkills.length
    ? `Missing or less evident skills include ${missingSkills.join(', ')}.`
    : 'No major missing skills were highlighted.';

  return `The candidate shows ${fitLabel} alignment with the role based on the submitted resume and job requirements. ${matchedText} ${missingText}`;
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
    summary: summary || buildFallbackSummary({ score, matchedSkills, missingSkills }),
  };
};

const delay = (timeoutMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const error = new Error('Gemini scoring request timed out.');
      error.statusCode = 504;
      setTimeout(() => reject(error), timeoutMs);
    }),
  ]);

const isTemporaryGeminiOverloadError = (error) => {
  const statusCode = error?.status || error?.statusCode || error?.code;
  const message = String(error?.message || '').toLowerCase();

  return (
    statusCode === 503 ||
    statusCode === '503' ||
    statusCode === 429 ||
    statusCode === '429' ||
    statusCode === 504 ||
    statusCode === '504' ||
    statusCode === 'RESOURCE_EXHAUSTED' ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('resource exhausted') ||
    message.includes('unavailable') ||
    message.includes('overloaded') ||
    message.includes('high demand') ||
    message.includes('model is overloaded') ||
    message.includes('service unavailable') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
};

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

  for (const candidate of directCandidates) {
    if (!candidate) {
      continue;
    }

    try {
      return JSON.parse(candidate);
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

const generateCandidateScore = async ({ candidate, job }) => {
  try {
    const client = getClient();
    const prompt = buildScoreCandidatePrompt({ candidate, job });
    let response;
    let lastError;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        response = await withTimeout(
          client.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseJsonSchema: responseSchema,
            },
          }),
          DEFAULT_TIMEOUT_MS,
        );
        lastError = null;
        break;
      } catch (error) {
        if (!isTemporaryGeminiOverloadError(error)) {
          throw error;
        }

        lastError = error;

        if (attempt < MAX_RETRIES - 1) {
          await delay(RETRY_DELAYS_MS[attempt] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]);
        }
      }
    }

    if (lastError) {
      const error = new Error(
        'AI scoring is temporarily unavailable due to model traffic. Please try again in a few moments.',
      );
      error.statusCode = 503;
      throw error;
    }

    const parsedOutput = parseGeminiJsonResponse(response.text);

    return validateScoreResponse(parsedOutput, { candidate, job });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const apiError = new Error(`Gemini scoring request failed: ${error.message}`);
    apiError.statusCode = 502;
    throw apiError;
  }
};

module.exports = {
  generateCandidateScore,
};
