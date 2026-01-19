import { tokenize } from '../utils/textProcessing';

const extractTextFromValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim()).join(' ');
  }
  return '';
};

const buildSummaryFromItem = (item, fallback = '') => {
  if (!item || typeof item !== 'object') return fallback;
  const fields = [
    'description', 'summary', 'details', 'body', 'content', 'overview',
    'program_overview', 'career_prospects', 'requirement_text', 'text',
    'title', 'name', 'department_name', 'position', 'role', 'goals', 'core_values',
    'mission', 'vision', 'duration_text', 'units_text', 'enhancements_text'
  ];
  const parts = [];
  fields.forEach((field) => {
    const value = extractTextFromValue(item[field]);
    if (value) {
      parts.push(value);
    }
  });
  if (item.core_courses) {
    parts.push(extractTextFromValue(item.core_courses));
  }
  if (item.specializations) {
    parts.push(extractTextFromValue(item.specializations));
  }
  return parts.join(' ').trim() || fallback;
};

const buildTitleFromItem = (item, fallback = 'Update') => {
  if (!item || typeof item !== 'object') return fallback;
  return (
    item.title ||
    item.name ||
    item.department_name ||
    item.position ||
    item.role ||
    item.short_title ||
    fallback
  );
};

const buildDetailsFromItem = (item) => {
  if (!item || typeof item !== 'object') return [];
  const details = [];
  const dateValue = item.date || item.event_date || item.achievement_date;
  if (dateValue) details.push(`Date: ${dateValue}`);
  if (item.location) details.push(`Location: ${item.location}`);
  if (item.formatted_time) details.push(`Time: ${item.formatted_time}`);
  if (item.start_time && item.end_time) details.push(`Time: ${item.start_time} - ${item.end_time}`);
  if (item.category) details.push(`Category: ${item.category}`);
  if (item.department_name) details.push(`Department: ${item.department_name}`);
  if (item.office_location) details.push(`Office: ${item.office_location}`);
  if (item.phone) details.push(`Phone: ${item.phone}`);
  if (item.email) details.push(`Email: ${item.email}`);
  return details;
};

const resolveItems = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
};

const buildDynamicEntry = ({ baseId, baseTitle, baseUrl, baseKeywords }, item, index) => {
  const title = buildTitleFromItem(item, baseTitle);
  const summary = buildSummaryFromItem(item, baseTitle);
  const keywords = Array.from(new Set([...(baseKeywords || []), ...tokenize(title)]));
  const details = buildDetailsFromItem(item);
  return {
    id: `${baseId}-${index}`,
    title: `${baseTitle}: ${title}`,
    url: baseUrl,
    summary: summary.slice(0, 260) || baseTitle,
    keywords,
    extra: baseTitle,
    details,
    actions: [
      'Open the page for full details',
      'Ask for a specific item to narrow the result'
    ],
    sourceType: 'dynamic'
  };
};

const buildAdmissionsEntries = (data, limit = 6) => {
  const entries = [];
  const requirementsByCategory = data?.requirements_by_category || {};
  const stepsByCategory = data?.process_steps_by_category || {};

  Object.entries(requirementsByCategory).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;
    items.slice(0, limit).forEach((item, index) => {
      const categoryLabel = category
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      entries.push({
        id: `admissions-req-${category}-${index}`,
        title: `Admissions Requirement: ${item.text || category}`,
        url: '/admissions',
        summary: item.text || `Requirements for ${category}`,
        keywords: ['admissions', 'requirements', category.toLowerCase(), 'new student', 'continuing student', 'scholar', 'non scholar'],
        extra: 'Admissions requirements',
        details: [`Category: ${categoryLabel}`],
        actions: [
          'Review the full requirements list for this category',
          'Follow the enrollment process steps below the requirements'
        ],
        sourceType: 'dynamic'
      });
    });
  });

  Object.entries(stepsByCategory).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;
    items.slice(0, limit).forEach((item, index) => {
      const stepTitle = item.title || `Step ${item.step_number || index + 1}`;
        const categoryLabel = category
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
        entries.push({
        id: `admissions-step-${category}-${index}`,
        title: `Enrollment Step: ${stepTitle}`,
        url: '/admissions',
        summary: item.description || stepTitle,
          keywords: ['admissions', 'enrollment', 'steps', category.toLowerCase(), 'new student', 'continuing student', 'scholar', 'non scholar'],
          extra: 'Enrollment process',
          details: [`Category: ${categoryLabel}`],
          actions: [
            'Complete the steps in order',
            'Contact admissions if a step is unclear'
          ],
        sourceType: 'dynamic'
      });
    });
  });

  return entries;
};

const buildInstitutionalEntry = (data) => {
  const info = data?.institutional_info || data;
  const summary = buildSummaryFromItem(info, 'Institutional information');
  const details = [];
  if (info?.mission) details.push('Mission statement available');
  if (info?.vision) details.push('Vision statement available');
  if (info?.goals) details.push('Goals listed');
  if (info?.core_values) details.push('Core values listed');
  return [{
    id: 'institutional-info',
    title: 'Institutional Information',
    url: '/about',
    summary: summary || 'Institutional mission, vision, goals, and core values.',
    keywords: ['mission', 'vision', 'goals', 'core values', 'about'],
    extra: 'Institutional information',
    details,
    actions: [
      'Open About Us for the full mission and vision',
      'Review goals and core values sections'
    ],
    sourceType: 'dynamic'
  }];
};

const buildDownloadsEntries = (data, limit = 6) => {
  const downloads = data?.downloads || data;
  if (!downloads || typeof downloads !== 'object') return [];
  const entries = [];
  Object.entries(downloads).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;
    let anchor = '#documents';
    if (category.startsWith('forms-')) anchor = '#forms';
    if (category === 'hr-policies') anchor = '#hr-policies';
    if (category === 'hr-forms') anchor = '#hr-forms';
    items.slice(0, limit).forEach((item, index) => {
      entries.push({
        id: `downloads-${category}-${index}`,
        title: `Download: ${item.title || category}`,
        url: `/downloads${anchor}`,
        summary: item.description || `Downloadable file in ${category}`,
        keywords: ['downloads', category],
        extra: 'Downloads',
        details: item.file_type ? [`File type: ${item.file_type}`] : [],
        actions: [
          'Open the download to view or save the file',
          'Browse other categories for related documents'
        ],
        sourceType: 'dynamic'
      });
    });
  });
  return entries;
};

const extractEntries = (source, data, limit = 6) => {
  if (source.extractor === 'admissions') {
    return buildAdmissionsEntries(data, limit);
  }
  if (source.extractor === 'institutional') {
    return buildInstitutionalEntry(data);
  }
  if (source.extractor === 'downloads') {
    return buildDownloadsEntries(data, limit);
  }

  const baseUrl = source.section ? `${source.url}?section=${source.section}` : source.url;
  const items = resolveItems(data, source.keys);
  return items.slice(0, limit).map((item, index) =>
    buildDynamicEntry({
      baseId: source.id,
      baseTitle: source.title,
      baseUrl,
      baseKeywords: source.keywords
    }, item, index)
  );
};

export {
  extractEntries
};

