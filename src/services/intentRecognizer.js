import { normalizeText, tokenize } from '../utils/textProcessing';

const recognizeIntent = (message) => {
  const normalized = normalizeText(message);
  if (!normalized) {
    return { type: 'empty', normalized };
  }
  const tokens = new Set(tokenize(normalized));
  const hasPhrase = (phrase) => normalized.includes(phrase);
  if (
    tokens.has('hello') ||
    tokens.has('hi') ||
    tokens.has('hey') ||
    hasPhrase('good morning') ||
    hasPhrase('good afternoon') ||
    hasPhrase('good evening')
  ) {
    return { type: 'greeting', normalized };
  }
  if (tokens.has('thank') || tokens.has('thanks') || normalized.includes('appreciate')) {
    return { type: 'thanks', normalized };
  }
  if (tokens.has('bye') || tokens.has('goodbye') || normalized.includes('see you')) {
    return { type: 'goodbye', normalized };
  }
  if (tokens.has('latest') || tokens.has('recent') || tokens.has('new') || tokens.has('updates')) {
    return { type: 'latest', normalized };
  }
  return { type: 'general', normalized };
};

export {
  recognizeIntent
};

