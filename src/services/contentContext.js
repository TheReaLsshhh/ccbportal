import { tokenize } from '../utils/textProcessing';

const buildEntryText = (entry) => {
  const detailText = Array.isArray(entry.details) ? entry.details.join(' ') : '';
  const actionText = Array.isArray(entry.actions) ? entry.actions.join(' ') : '';
  return `${entry.title} ${entry.summary} ${(entry.keywords || []).join(' ')} ${detailText} ${actionText} ${entry.extra || ''}`;
};

const buildKnowledgeIndex = (entries) => (
  entries.map((entry) => ({
    ...entry,
    tokens: new Set(tokenize(buildEntryText(entry)))
  }))
);

const buildContextItems = (matches) => (
  matches.map(({ entry }) => ({
    title: entry.title,
    url: entry.url,
    summary: entry.summary
  }))
);

export {
  buildEntryText,
  buildKnowledgeIndex,
  buildContextItems
};

