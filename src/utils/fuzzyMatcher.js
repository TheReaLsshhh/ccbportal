import { normalizeText } from './textProcessing';

const buildBigrams = (value) => {
  const normalized = normalizeText(value);
  if (normalized.length < 2) return [normalized];
  const bigrams = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    bigrams.push(normalized.slice(i, i + 2));
  }
  return bigrams;
};

const diceCoefficient = (a, b) => {
  const aBigrams = buildBigrams(a);
  const bBigrams = buildBigrams(b);
  if (!aBigrams.length || !bBigrams.length) return 0;

  const bMap = new Map();
  bBigrams.forEach((bg) => {
    bMap.set(bg, (bMap.get(bg) || 0) + 1);
  });

  let matches = 0;
  aBigrams.forEach((bg) => {
    const count = bMap.get(bg) || 0;
    if (count > 0) {
      matches += 1;
      bMap.set(bg, count - 1);
    }
  });

  return (2 * matches) / (aBigrams.length + bBigrams.length);
};

const fuzzyIncludes = (needle, haystack, threshold = 0.82) => {
  const normalizedNeedle = normalizeText(needle);
  const normalizedHaystack = normalizeText(haystack);
  if (!normalizedNeedle || !normalizedHaystack) return false;
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  return diceCoefficient(normalizedNeedle, normalizedHaystack) >= threshold;
};

export {
  diceCoefficient,
  fuzzyIncludes
};

