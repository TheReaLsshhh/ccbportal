import { recognizeIntent } from './intentRecognizer';
import { formatLocalResponse } from '../utils/contentFormatter';

const buildQuickReply = (message) => {
  const intent = recognizeIntent(message);
  if (intent.type === 'greeting') {
    return "Hi! I’m here to help with anything about City College of Bayawan. What would you like to explore?";
  }
  if (intent.type === 'thanks') {
    return "You’re welcome! If you need anything else, just ask.";
  }
  if (intent.type === 'goodbye') {
    return "Goodbye! Take care, and come back anytime if you have more questions.";
  }
  return null;
};

const buildLocalResponse = (message, matches) => formatLocalResponse(message, matches);

export {
  buildQuickReply,
  buildLocalResponse
};

