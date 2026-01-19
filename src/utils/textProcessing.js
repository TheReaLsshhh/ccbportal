const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'of',
  'on', 'or', 'that', 'the', 'this', 'to', 'what', 'when', 'where', 'who', 'why', 'with', 'you', 'your'
]);

const normalizeText = (text = '') => (
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const tokenize = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((token) => token && !STOP_WORDS.has(token));
};

export {
  STOP_WORDS,
  normalizeText,
  tokenize
};

