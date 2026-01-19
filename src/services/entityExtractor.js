import { normalizeText } from '../utils/textProcessing';

const PAGE_KEYWORDS = [
  { id: 'home', keywords: ['home', 'homepage', 'welcome'] },
  { id: 'academics', keywords: ['academics', 'programs', 'courses', 'degree'] },
  { id: 'admissions', keywords: ['admissions', 'enroll', 'enrollment', 'apply', 'requirements'] },
  { id: 'news', keywords: ['news', 'events', 'announcements', 'achievements', 'updates'] },
  { id: 'downloads', keywords: ['downloads', 'forms', 'documents', 'files'] },
  { id: 'students', keywords: ['students', 'student', 'campus life', 'services'] },
  { id: 'faculty', keywords: ['faculty', 'staff', 'departments', 'personnel'] },
  { id: 'about', keywords: ['about', 'mission', 'vision', 'goals', 'core values', 'history'] },
  { id: 'contact', keywords: ['contact', 'email', 'phone', 'address'] }
];

const extractEntities = (message) => {
  const normalized = normalizeText(message);
  const pageMentions = PAGE_KEYWORDS.filter((page) =>
    page.keywords.some((keyword) => normalized.includes(keyword))
  ).map((page) => page.id);

  return {
    normalized,
    pageMentions
  };
};

export {
  extractEntities
};

