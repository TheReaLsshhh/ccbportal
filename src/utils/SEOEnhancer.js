// SEO Enhancement Utilities
export const generateStructuredData = (type, data) => {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return JSON.stringify(baseStructure);
};

// Educational Organization Schema
export const generateOrganizationSchema = () => {
  return generateStructuredData('EducationalOrganization', {
    name: 'City College of Bayawan',
    description: 'Honor and Excellence for the Highest Good - Quality higher education in Bayawan City, Negros Oriental',
    url: 'https://ccb.edu.ph',
    logo: 'https://ccb.edu.ph/images/ccb.c0ca0ca63b3fdc15330b.jpg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PH',
      addressRegion: 'Negros Oriental',
      addressLocality: 'Bayawan City',
      postalCode: '6221'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '(035) XXX-XXXX',
      contactType: 'admissions',
      email: 'info@ccb.edu.ph'
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61574582660823'
    ]
  });
};

// Course Schema
export const generateCourseSchema = (courseData) => {
  return generateStructuredData('Course', {
    name: courseData.title,
    description: courseData.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'City College of Bayawan',
      url: 'https://ccb.edu.ph'
    },
    educationalLevel: courseData.level || 'Undergraduate',
    about: courseData.about || [],
    teaches: courseData.skills || [],
    totalHours: courseData.duration,
    coursePrerequisites: courseData.prerequisites || []
  });
};

// Event Schema
export const generateEventSchema = (eventData) => {
  return generateStructuredData('Event', {
    name: eventData.title,
    description: eventData.description,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    location: {
      '@type': 'Place',
      name: 'City College of Bayawan',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PH',
        addressRegion: 'Negros Oriental',
        addressLocality: 'Bayawan City'
      }
    },
    organizer: {
      '@type': 'EducationalOrganization',
      name: 'City College of Bayawan',
      url: 'https://ccb.edu.ph'
    }
  });
};

// News Article Schema
export const generateArticleSchema = (articleData) => {
  return generateStructuredData('NewsArticle', {
    headline: articleData.title,
    description: articleData.description,
    image: articleData.image,
    datePublished: articleData.date,
    dateModified: articleData.modifiedDate || articleData.date,
    author: {
      '@type': 'EducationalOrganization',
      name: 'City College of Bayawan'
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'City College of Bayawan',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ccb.edu.ph/images/ccb.c0ca0ca63b3fdc15330b.jpg'
      }
    }
  });
};

// Breadcrumb Schema
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  });
};

// Meta tag generator
export const generateMetaTags = (pageData) => {
  const {
    title,
    description,
    keywords,
    image = '/images/ccb.c0ca0ca63b3fdc15330b.jpg',
    url = 'https://ccb.edu.ph',
    type = 'website',
    locale = 'en_US',
    siteName = 'City College of Bayawan'
  } = pageData;

  return {
    title: title,
    description: description,
    keywords: keywords,
    canonical: url,
    openGraph: {
      title: title,
      description: description,
      url: url,
      type: type,
      locale: locale,
      siteName: siteName,
      image: {
        url: image,
        width: 1200,
        height: 630,
        alt: title
      }
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      image: image,
      site: '@CCBOfficial'
    },
    additional: [
      { name: 'robots', content: 'index, follow' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'author', content: 'City College of Bayawan' },
      { name: 'language', content: 'English' },
      { name: 'revisit-after', content: '7 days' },
      { name: 'distribution', content: 'global' },
      { name: 'rating', content: 'general' },
      { httpEquiv: 'Content-Type', content: 'text/html; charset=UTF-8' },
      { httpEquiv: 'X-UA-Compatible', content: 'IE=edge' }
    ]
  };
};

// Sitemap generator utility
export const generateSitemapEntry = (url, lastModified, changeFreq = 'weekly', priority = 0.8) => {
  return {
    url: url,
    lastmod: lastModified,
    changefreq: changeFreq,
    priority: priority
  };
};

// Robots.txt generator
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://ccb.edu.ph/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow specific paths if any
# Disallow: /admin/
# Disallow: /private/`;
};

// Page-specific SEO data
export const pageSEOData = {
  home: {
    title: 'City College of Bayawan - Honor and Excellence for the Highest Good',
    description: 'City College of Bayawan - Quality higher education in Bayawan City, Negros Oriental. Explore academic programs, admissions, news, and campus life.',
    keywords: 'City College of Bayawan, CCB, Bayawan City, Negros Oriental, Higher Education, College, University, Academic Programs, Admissions, Student Portal',
    type: 'website'
  },
  academics: {
    title: 'Academic Programs - City College of Bayawan',
    description: 'Explore our comprehensive academic programs at City College of Bayawan. Quality education with focus on excellence and community service.',
    keywords: 'Academic Programs, Courses, Education, Bayawan College, Degree Programs',
    type: 'website'
  },
  admissions: {
    title: 'Admissions - City College of Bayawan',
    description: 'Join City College of Bayawan. Learn about admission requirements, application process, and enrollment information.',
    keywords: 'Admissions, Enrollment, Application, College Admission, Bayawan',
    type: 'website'
  },
  news: {
    title: 'News & Events - City College of Bayawan',
    description: 'Stay updated with the latest news, announcements, and events at City College of Bayawan.',
    keywords: 'News, Events, Announcements, College News, Bayawan Events',
    type: 'website'
  },
  about: {
    title: 'About Us - City College of Bayawan',
    description: 'Learn about City College of Bayawan\'s history, mission, vision, and commitment to quality education.',
    keywords: 'About CCB, College History, Mission, Vision, Bayawan College',
    type: 'website'
  },
  contact: {
    title: 'Contact Us - City College of Bayawan',
    description: 'Get in touch with City College of Bayawan. Contact information, location map, and inquiry forms.',
    keywords: 'Contact, Location, Address, Phone, Email, Bayawan College',
    type: 'website'
  }
};

// SEO validation utilities
export const validateSEO = (pageData) => {
  const issues = [];
  const warnings = [];

  // Title validation
  if (!pageData.title) {
    issues.push('Missing page title');
  } else if (pageData.title.length < 30) {
    warnings.push('Title is too short (recommended: 50-60 characters)');
  } else if (pageData.title.length > 60) {
    warnings.push('Title is too long (recommended: 50-60 characters)');
  }

  // Description validation
  if (!pageData.description) {
    issues.push('Missing meta description');
  } else if (pageData.description.length < 120) {
    warnings.push('Description is too short (recommended: 150-160 characters)');
  } else if (pageData.description.length > 160) {
    warnings.push('Description is too long (recommended: 150-160 characters)');
  }

  // Keywords validation
  if (!pageData.keywords) {
    warnings.push('Missing meta keywords');
  }

  // Image validation
  if (!pageData.image) {
    warnings.push('Missing Open Graph image');
  }

  return {
    issues,
    warnings,
    score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5))
  };
};

// Core Web Vitals monitoring integration
export const trackSEOPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track page load time for SEO
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      
      // Send to analytics if load time is poor
      if (loadTime > 3000) {
        console.warn('Slow page load detected:', loadTime + 'ms');
      }
    });
  }
};

export default {
  generateStructuredData,
  generateOrganizationSchema,
  generateCourseSchema,
  generateEventSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateMetaTags,
  generateSitemapEntry,
  generateRobotsTxt,
  pageSEOData,
  validateSEO,
  trackSEOPerformance
};
