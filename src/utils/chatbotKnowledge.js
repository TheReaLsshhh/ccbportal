const chatbotKnowledge = [
  {
    id: 'home',
    title: 'Home',
    url: '/',
    summary: 'Overview of City College of Bayawan, highlights, quick links, announcements, and featured updates.',
    keywords: ['home', 'homepage', 'overview', 'ccb', 'highlights', 'welcome', 'quick links', 'announcements', 'updates'],
    details: [
      'Latest announcements, events, achievements, and news highlights',
      'Hero sections and campus overview content',
      'Quick links to Admissions, Academics, and Contact'
    ],
    actions: [
      'Browse the latest updates carousel',
      'Jump to featured sections and quick links',
      'Open News & Events for full listings'
    ]
  },
  {
    id: 'services-menu',
    title: 'Services Menu',
    url: '/',
    summary: 'Services dropdown in the main navigation for library, GIYA Center, student affairs, and registrar.',
    keywords: ['services', 'menu', 'dropdown', 'library', 'giya', 'student affairs', 'registrar'],
    details: [
      'Services dropdown is in the top navigation bar',
      'Links open in a new tab for official service pages'
    ],
    actions: [
      'Open the Services dropdown in the navbar',
      'Select the service link you need'
    ]
  },
  {
    id: 'academics',
    title: 'Academic Programs',
    url: '/academics',
    summary: 'Programs, course offerings, program details, and academic pathways for each department.',
    keywords: ['academics', 'programs', 'courses', 'curriculum', 'degree', 'program list', 'department', 'specialization'],
    details: [
      'Degree program list with descriptions and durations',
      'Program overviews, core courses, and career prospects',
      'Specializations and department information'
    ],
    actions: [
      'Review program descriptions and course outlines',
      'Compare program duration and units',
      'Check specializations within each program'
    ]
  },
  {
    id: 'admissions',
    title: 'Admissions',
    url: '/admissions',
    summary: 'Admission requirements, enrollment process, and step-by-step guidance for new and transferring students.',
    keywords: ['admissions', 'apply', 'application', 'requirements', 'enrollment', 'how to apply', 'steps', 'process'],
    details: [
      'Requirements per applicant category (scholar/non-scholar, new/continuing)',
      'Enrollment process steps and timelines',
      'Important notes and reminders'
    ],
    actions: [
      'Choose your applicant category tab',
      'Follow the enrollment steps in order',
      'Use Contact Us for admissions inquiries'
    ]
  },
  {
    id: 'students',
    title: 'Students',
    url: '/students',
    summary: 'Student resources, guidelines, activities, support services, and campus life information.',
    keywords: ['students', 'student services', 'guidelines', 'activities', 'resources', 'campus life', 'support'],
    details: [
      'Student handbook and academic calendar',
      'Student services and campus life highlights',
      'Campus activities and event listings'
    ],
    actions: [
      'Open the student handbook and calendar sections',
      'Review campus activities and events',
      'Explore student services and support'
    ]
  },
  {
    id: 'faculty',
    title: 'Faculty & Staff',
    url: '/faculty',
    summary: 'Faculty and staff directory, departments, academic leadership, and contacts.',
    keywords: ['faculty', 'staff', 'departments', 'directory', 'professors', 'instructors', 'contacts'],
    details: [
      'Department directory with heads and contacts',
      'Faculty and staff listings by department',
      'Administrative offices and support units'
    ],
    actions: [
      'Locate a department contact',
      'Review department personnel lists',
      'Find administrative office details'
    ]
  },
  {
    id: 'about',
    title: 'About Us',
    url: '/about',
    summary: 'Mission, vision, goals, core values, and institutional background of the college.',
    keywords: ['about', 'mission', 'vision', 'goals', 'core values', 'history', 'background', 'institution'],
    details: [
      'Institutional history and milestones',
      'Mission, vision, goals, and core values',
      'Administrative officers and facilities'
    ],
    actions: [
      'Open Mission & Vision details',
      'Review the organizational chart',
      'Check administrative officers and campus facilities'
    ]
  },
  {
    id: 'news',
    title: 'News & Events',
    url: '/news',
    summary: 'Latest announcements, events, achievements, and campus updates.',
    keywords: ['news', 'events', 'announcements', 'updates', 'achievements', 'latest', 'recent', 'campus'],
    details: [
      'Announcements, news, achievements, and events sections',
      'Calendar view with dates and highlights',
      'Modal details for each item'
    ],
    actions: [
      'Open the Events section: [Events](/news?section=events)',
      'Open the News section: [News](/news?section=news)',
      'Open Announcements: [Announcements](/news?section=announcements)',
      'Open Achievements: [Achievements](/news?section=achievements)'
    ]
  },
  {
    id: 'downloads',
    title: 'Downloads',
    url: '/downloads',
    summary: 'Forms, documents, and downloadable resources for students and staff.',
    keywords: ['downloads', 'forms', 'documents', 'resources', 'files', 'pdf'],
    details: [
      'Enrollment, clearance, and request forms',
      'HR policies, HR forms, syllabi, manuals, and handbooks',
      'Category-based downloads with pagination'
    ],
    actions: [
      'Open Forms section: [Forms](/downloads#forms)',
      'Open HR Policies & Forms: [HR Policies](/downloads#hr-policies)',
      'Open Documents section: [Syllabi & Manuals](/downloads#documents)'
    ]
  },
  {
    id: 'contact',
    title: 'Contact Us',
    url: '/contact',
    summary: 'Contact form, email verification, and ways to reach the college.',
    keywords: ['contact', 'email', 'inquiries', 'support', 'reach us', 'message', 'help'],
    details: [
      'Contact form with subject categories',
      'Office address, phone numbers, and email',
      'Campus location map'
    ],
    actions: [
      'Send a message using the contact form',
      'Check office hours and contact details',
      'Use the map to locate the campus'
    ]
  },
  {
    id: 'ccb-logo',
    title: 'CCB Logo',
    url: '/ccb-logo',
    summary: 'Official college logo and branding assets.',
    keywords: ['logo', 'branding', 'ccb logo', 'assets', 'identity', 'seal'],
    details: [
      'Official branding elements and logo assets',
      'Usage guidance for CCB identity'
    ],
    actions: [
      'View and reference official logo assets',
      'Review branding guidelines if available'
    ]
  }
];

export default chatbotKnowledge;

