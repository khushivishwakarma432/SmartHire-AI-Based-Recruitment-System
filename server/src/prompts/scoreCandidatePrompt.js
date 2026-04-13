const buildScoreCandidatePrompt = ({ candidate, job }) => `
You are scoring a candidate for a job opening.

Return JSON only with this exact shape:
{
  "score": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "summary": ""
}

Rules:
- score must be a number from 0 to 100
- matchedSkills must be an array of strings
- missingSkills must be an array of strings
- summary must be a short hiring summary in 2-4 sentences
- do not include markdown
- do not include extra keys
- compare the candidate resumeText against the job description and requiredSkills
- if resumeText is weak, incomplete, or missing, use candidateSummary and candidateSkills as fallback evidence
- if the candidate evidence is limited, be conservative
- treat skills case-insensitively and trim whitespace
- support simple aliases where reasonable, for example:
  - js = javascript
  - react.js = react
  - node.js = node
  - postgres = postgresql
- matchedSkills should contain skills clearly supported by the available candidate evidence
- missingSkills should contain required skills that are not clearly supported by the available candidate evidence
- avoid duplicates in matchedSkills and missingSkills

Candidate Data:
${JSON.stringify(candidate, null, 2)}

Job Data:
${JSON.stringify(job, null, 2)}
`;

module.exports = buildScoreCandidatePrompt;
