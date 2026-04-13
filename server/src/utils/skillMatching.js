const SKILL_ALIASES = {
  javascript: ['js', 'javascript'],
  react: ['react', 'react.js', 'reactjs'],
  node: ['node', 'node.js', 'nodejs'],
  postgresql: ['postgres', 'postgresql'],
};

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[._/()-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildAliasLookup = () => {
  const lookup = {};

  Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
    [canonical, ...aliases].forEach((alias) => {
      lookup[normalizeText(alias)] = canonical;
    });
  });

  return lookup;
};

const ALIAS_LOOKUP = buildAliasLookup();

const canonicalizeSkill = (skill) => {
  const normalizedSkill = normalizeText(skill);
  return ALIAS_LOOKUP[normalizedSkill] || normalizedSkill;
};

const uniqueSkills = (skills) => {
  const seen = new Set();

  return skills.filter((skill) => {
    const key = canonicalizeSkill(skill);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildSkillAliasVariants = (skill) => {
  const canonicalSkill = canonicalizeSkill(skill);
  const aliases = SKILL_ALIASES[canonicalSkill] || [];
  return uniqueSkills([skill, canonicalSkill, ...aliases]).map((value) => normalizeText(value));
};

const buildCandidateEvidenceText = (candidate = {}) =>
  normalizeText(
    [
      candidate.resumeText,
      candidate.candidateSummary,
      Array.isArray(candidate.candidateSkills) ? candidate.candidateSkills.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

const hasAliasMatch = (normalizedEvidenceText, aliases) =>
  aliases.some((alias) => {
    if (!alias) {
      return false;
    }

    return (
      normalizedEvidenceText === alias ||
      normalizedEvidenceText.includes(`${alias} `) ||
      normalizedEvidenceText.includes(` ${alias}`) ||
      normalizedEvidenceText.includes(` ${alias} `)
    );
  });

const normalizeRequiredSkills = (requiredSkills = []) => {
  if (!Array.isArray(requiredSkills)) {
    return [];
  }

  return uniqueSkills(
    requiredSkills
      .map((skill) => String(skill || '').trim())
      .filter(Boolean),
  );
};

const mapSkillsToRequiredSkills = (skills = [], requiredSkills = []) => {
  const normalizedRequiredSkills = normalizeRequiredSkills(requiredSkills);
  const canonicalRequiredLookup = normalizedRequiredSkills.reduce((accumulator, skill) => {
    accumulator[canonicalizeSkill(skill)] = skill;
    return accumulator;
  }, {});

  return uniqueSkills(
    skills
      .map((skill) => canonicalRequiredLookup[canonicalizeSkill(skill)] || '')
      .filter(Boolean),
  );
};

const inferSkillMatches = ({ requiredSkills = [], candidate = {} }) => {
  const normalizedRequiredSkills = normalizeRequiredSkills(requiredSkills);
  const evidenceText = buildCandidateEvidenceText(candidate);
  const matchedSkills = [];
  const missingSkills = [];

  normalizedRequiredSkills.forEach((requiredSkill) => {
    const aliases = buildSkillAliasVariants(requiredSkill);

    if (hasAliasMatch(evidenceText, aliases)) {
      matchedSkills.push(requiredSkill);
      return;
    }

    missingSkills.push(requiredSkill);
  });

  return {
    matchedSkills,
    missingSkills,
  };
};

module.exports = {
  buildCandidateEvidenceText,
  canonicalizeSkill,
  inferSkillMatches,
  mapSkillsToRequiredSkills,
  normalizeRequiredSkills,
  normalizeText,
  uniqueSkills,
};
