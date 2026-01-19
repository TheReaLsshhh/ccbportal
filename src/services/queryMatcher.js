import { normalizeText, tokenize } from '../utils/textProcessing';
import { fuzzyIncludes } from '../utils/fuzzyMatcher';

const scoreEntry = (entry, userTokens, normalizedMessage) => {
  if (!userTokens.length) return 0;
  let overlap = 0;
  userTokens.forEach((token) => {
    if (entry.tokens?.has(token)) overlap += 1;
  });

  let score = overlap / Math.max(userTokens.length, 4);
  const titleNormalized = normalizeText(entry.title);
  if (titleNormalized && normalizedMessage.includes(titleNormalized)) {
    score += 0.15;
  }
  (entry.keywords || []).forEach((keyword) => {
    const keywordNormalized = normalizeText(keyword);
    if (keywordNormalized && normalizedMessage.includes(keywordNormalized)) {
      score += 0.08;
    }
    if (fuzzyIncludes(keywordNormalized, normalizedMessage)) {
      score += 0.05;
    }
  });
  return Math.min(score, 1);
};

const matchQuery = (knowledgeIndex, message) => {
  const normalizedMessage = normalizeText(message);
  const userTokens = tokenize(message);
  if (!userTokens.length) {
    return { matches: [], topScore: 0, normalizedMessage };
  }

  const scored = knowledgeIndex
    .map((entry) => ({ entry, score: scoreEntry(entry, userTokens, normalizedMessage) }))
    .sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score || 0;
  const matches = scored
    .filter((item) => item.score >= Math.max(0.18, topScore * 0.6))
    .slice(0, 3);

  return { matches, topScore, normalizedMessage };
};

export {
  matchQuery
};

