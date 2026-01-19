import apiService from './api';
import chatbotKnowledge from '../utils/chatbotKnowledge';

const staticEntries = chatbotKnowledge.map((entry) => ({
  ...entry,
  sourceType: 'static'
}));

const dynamicSources = [
  {
    id: 'academic-programs',
    title: 'Academic Programs',
    url: '/academics',
    keywords: ['academics', 'programs', 'courses'],
    fetch: () => apiService.getAcademicPrograms(),
    keys: ['programs'],
    extractor: 'generic'
  },
  {
    id: 'news-events',
    title: 'News & Events',
    url: '/news',
    keywords: ['news', 'events', 'updates'],
    fetch: () => apiService.getNewsEvents(),
    keys: ['news_items', 'news', 'events'],
    extractor: 'generic'
  },
  {
    id: 'announcements',
    title: 'Announcements',
    url: '/news',
    section: 'announcements',
    keywords: ['announcements', 'updates', 'notices'],
    fetch: () => apiService.getAnnouncements(),
    keys: ['announcements'],
    extractor: 'generic'
  },
  {
    id: 'events',
    title: 'Events',
    url: '/news',
    section: 'events',
    keywords: ['events', 'calendar', 'activities'],
    fetch: () => apiService.getEvents(),
    keys: ['events'],
    extractor: 'generic'
  },
  {
    id: 'achievements',
    title: 'Achievements',
    url: '/news',
    section: 'achievements',
    keywords: ['achievements', 'awards', 'recognition'],
    fetch: () => apiService.getAchievements(),
    keys: ['achievements'],
    extractor: 'generic'
  },
  {
    id: 'news',
    title: 'News',
    url: '/news',
    section: 'news',
    keywords: ['news', 'announcements', 'latest'],
    fetch: () => apiService.getNews(),
    keys: ['news'],
    extractor: 'generic'
  },
  {
    id: 'downloads',
    title: 'Downloads',
    url: '/downloads',
    keywords: ['downloads', 'forms', 'documents'],
    fetch: () => apiService.getDownloads(),
    keys: ['downloads'],
    extractor: 'downloads'
  },
  {
    id: 'departments',
    title: 'Departments',
    url: '/faculty',
    keywords: ['departments', 'faculty', 'staff'],
    fetch: () => apiService.getDepartments(),
    keys: ['departments'],
    extractor: 'generic'
  },
  {
    id: 'personnel',
    title: 'Faculty & Staff',
    url: '/faculty',
    keywords: ['faculty', 'staff', 'personnel'],
    fetch: () => apiService.getPersonnel(),
    keys: ['personnel'],
    extractor: 'generic'
  },
  {
    id: 'institutional-info',
    title: 'Institutional Info',
    url: '/about',
    keywords: ['mission', 'vision', 'goals', 'core values', 'about'],
    fetch: () => apiService.getInstitutionalInfo(),
    keys: ['institutional_info'],
    extractor: 'institutional'
  },
  {
    id: 'admissions-info',
    title: 'Admissions',
    url: '/admissions',
    keywords: ['admissions', 'requirements', 'enrollment'],
    fetch: () => apiService.getAdmissionsInfo(),
    keys: [],
    extractor: 'admissions'
  }
];

export {
  staticEntries,
  dynamicSources
};

