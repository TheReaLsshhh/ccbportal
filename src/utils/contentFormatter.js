import { normalizeText } from './textProcessing';

const formatLocalResponse = (message, matches) => {
  const lowerMessage = normalizeText(message);
  const wantsLatest = ['latest', 'recent', 'new', 'updates'].some((word) => lowerMessage.includes(word));
  const hasDynamic = matches.some(({ entry }) => entry.sourceType === 'dynamic');

  let intro = "Here’s the most relevant page for your request:";
  if (lowerMessage.includes('where') || lowerMessage.includes('find')) {
    intro = "You can find that here:";
  } else if (hasDynamic && wantsLatest) {
    intro = "Here are the latest updates that match your request:";
  } else if (hasDynamic) {
    intro = "Here are the most relevant updates I found:";
  }

  const lines = matches.flatMap(({ entry }) => {
    const details = Array.isArray(entry.details) ? entry.details.filter(Boolean) : [];
    const actions = Array.isArray(entry.actions) ? entry.actions.filter(Boolean) : [];
    const block = [
      `- [${entry.title}](${entry.url}): ${entry.summary}`
    ];
    if (details.length) {
      block.push('  Details:');
      details.forEach((detail) => block.push(`  - ${detail}`));
    }
    if (actions.length) {
      block.push('  What you can do:');
      actions.forEach((action) => block.push(`  - ${action}`));
    }
    return block;
  });

  return `${intro}\n\n${lines.join('\n')}\n\nIf you want, tell me exactly what detail you’re looking for and I’ll narrow it down.`;
};

const formatErrorResponse = (message) => (
  message || "Sorry, I ran into a problem while fetching a response. Please try again in a moment."
);

export {
  formatLocalResponse,
  formatErrorResponse
};

