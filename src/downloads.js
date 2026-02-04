import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './downloads.css';

const Downloads = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navAnimationsComplete, setNavAnimationsComplete] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [downloads, setDownloads] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state for each section
  const [formsPage, setFormsPage] = useState(1);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [policiesPage, setPoliciesPage] = useState(1);
  const itemsPerPage = 6; // Match news_events items per page

  // Category mapping
  const categoryConfig = {
    'forms-enrollment': {
      title: 'Enrollment Forms',
      description: 'Registration and academic load documents',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'forms-clearance': {
      title: 'Clearance Forms',
      description: 'Approvals and exit clearance documents',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    'forms-request': {
      title: 'Request Forms',
      description: 'Formal request documentation',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
    },
    'forms-shift-change': {
      title: 'Shift / Change Forms',
      description: 'Schedule or program adjustments',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
    },
    'hr-policies': {
      title: 'HR Policies',
      description: 'Important HR policies and guidelines',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'hr-forms': {
      title: 'HR Forms',
      description: 'Forms for faculty and staff',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'syllabi': {
      title: 'Syllabi',
      description: 'Course syllabi and resources',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'manuals': {
      title: 'Manuals',
      description: 'Academic and administrative manuals',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'handbooks': {
      title: 'Handbooks',
      description: 'Student and employee handbooks',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    },
    'other': {
      title: 'Other Resources',
      description: 'Additional downloadable content',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'
    }
  };

  // Scroll-based navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsTopBarVisible(false);
      } else if (currentScrollY < lastScrollY && currentScrollY < 50) {
        setIsTopBarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Track scroll progress - Real-time dynamic for laptop/desktop
  useEffect(() => {
    let ticking = false;
    let isMobile = window.innerWidth <= 768;
    let isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight - windowHeight;
          const scrolled = window.scrollY;
          
          // Calculate progress
          let progress = (scrolled / documentHeight) * 100;
          
          // Device-specific easing for optimal smoothness
          if (isMobile) {
            // Mobile: Real-time dynamic progression for touch scrolling
            // No easing - immediate response to scroll position
            // Cap progress at 100% and ensure it doesn't go below 0%
            setScrollProgress(Math.min(100, Math.max(0, progress)));
          } else if (isTablet) {
            // Tablet: Real-time dynamic progression for touch scrolling
            // No easing - immediate response to scroll position
            // Cap progress at 100% and ensure it doesn't go below 0%
            setScrollProgress(Math.min(100, Math.max(0, progress)));
          } else {
            // Desktop/Laptop: Real-time dynamic progression for mouse control
            // No easing - immediate response to scroll position
            // Cap progress at 100% and ensure it doesn't go below 0%
            setScrollProgress(Math.min(100, Math.max(0, progress)));
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // Update device type on resize
    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
      isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch downloads
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDownloads();
        if (response.status === 'success') {
          setDownloads(response.downloads || {});
        } else {
          setError('Failed to load downloads');
        }
      } catch (err) {
        console.error('Error fetching downloads:', err);
        setError('Failed to load downloads. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  // Animation observers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.downloads-grid').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [downloads, formsPage, documentsPage, policiesPage]);

  const handleDownload = (fileUrl) => {
    if (fileUrl) window.open(fileUrl, '_blank');
  };

  // Pagination helpers
  const changePage = (targetPage, totalItems, currentPageSetter, currentPageValue, sectionId) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const nextPage = Math.min(Math.max(targetPage, 1), totalPages);
    if (nextPage === currentPageValue) return;
    currentPageSetter(nextPage);
    
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const buildPageList = (totalPages, currentPage) => {
    if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    const left = Math.max(2, currentPage - 2);
    const right = Math.min(totalPages - 1, currentPage + 2);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i += 1) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const renderPagination = (sectionId, totalItems, currentPage, setPage) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (totalPages <= 1) return null;
    const pageList = buildPageList(totalPages, currentPage);
    return (
      <div className="pagination-controls numbered">
        <button
          className="load-more-btn secondary"
          onClick={() => changePage(currentPage - 1, totalItems, setPage, currentPage, sectionId)}
          disabled={currentPage === 1}
        >
          « Previous
        </button>
        <div className="page-list">
          {pageList.map((page, idx) =>
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={page}
                className={`page-number ${page === currentPage ? 'active' : ''}`}
                onClick={() => changePage(page, totalItems, setPage, currentPage, sectionId)}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          className="load-more-btn"
          onClick={() => changePage(currentPage + 1, totalItems, setPage, currentPage, sectionId)}
          disabled={currentPage === totalPages}
        >
          Next »
        </button>
      </div>
    );
  };

  // Group data
  const getPagedData = (keys, page) => {
    let allItems = [];
    keys.forEach(key => {
      if (downloads[key]) {
        // Add category info to each item for display
        const categoryItems = downloads[key].map(item => ({
          ...item,
          categoryTitle: categoryConfig[key]?.title || 'Download',
          categoryIcon: categoryConfig[key]?.icon || categoryConfig['other'].icon
        }));
        allItems = [...allItems, ...categoryItems];
      }
    });
    const start = (page - 1) * itemsPerPage;
    return {
      items: allItems.slice(start, start + itemsPerPage),
      total: allItems.length
    };
  };

  const formsData = getPagedData(['forms-enrollment', 'forms-clearance', 'forms-request', 'forms-shift-change'], formsPage);
  const policiesData = getPagedData(['hr-policies', 'hr-forms'], policiesPage);
  const documentsData = getPagedData(['syllabi', 'manuals', 'handbooks', 'other'], documentsPage);

  const renderGrid = (data) => (
    <div className="downloads-grid">
      {data.items.map(item => (
        <div key={item.id} className="download-item">
          <div className="download-icon-wrapper">
             <div className="download-icon">
               <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                 <path d={item.categoryIcon} />
               </svg>
             </div>
          </div>
          <div className="download-content">
            <h4>{item.title}</h4>
            <p className="download-category-tag">{item.categoryTitle}</p>
            <p>{item.description || 'Click below to download this resource.'}</p>
            <button className="read-more" onClick={() => handleDownload(item.file_url)}>
              Download File
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      setNavAnimationsComplete(true);
    }, 1500);

    return () => clearTimeout(animationTimeout);
  }, []);

  return (
    <div className={`App downloads-page ${navAnimationsComplete ? 'nav-animations-complete' : ''}`}>
      {/* Dynamic Scroll Progress Bar */}
      <div 
        className="scroll-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />
      <SEO
        title="Downloads"
        description="Access essential forms, documents, policies, and resources at City College of Bayawan."
        keywords="downloads, forms, policies, syllabi, manuals, CCB downloads"
        url="/downloads"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Hero Section */}
      <section className={`downloads-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Downloads & Resources</h1>
            <p className="hero-subtitle">Essential documents for students, faculty, and staff</p>
            <p className="hero-motto">Access enrollment forms, manuals, policies, and more</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section downloads-section">
        <div className="container">
          <div className="downloads-content-wrapper">
            
            {/* Forms Section */}
            <div id="forms-section" className="content-block">
              <h2>Forms</h2>
              {loading ? (
                <div className="loading-container"><div className="loading-spinner"></div><p>Loading forms...</p></div>
              ) : error ? (
                <div className="error-container"><p className="error-message">{error}</p></div>
              ) : (
                <>
                  {renderGrid(formsData)}
                  {renderPagination('forms-section', formsData.total, formsPage, setFormsPage)}
                </>
              )}
            </div>

            {/* HR & Policies Section */}
            <div id="policies-section" className="content-block">
              <h2>HR Policies & Forms</h2>
              {loading ? (
                <div className="loading-container"><div className="loading-spinner"></div><p>Loading policies...</p></div>
              ) : !error && (
                <>
                  {renderGrid(policiesData)}
                  {renderPagination('policies-section', policiesData.total, policiesPage, setPoliciesPage)}
                </>
              )}
            </div>

            {/* Documents Section */}
            <div id="documents-section" className="content-block">
              <h2>Syllabi, Manuals & Handbooks</h2>
              {loading ? (
                 <div className="loading-container"><div className="loading-spinner"></div><p>Loading documents...</p></div>
              ) : !error && (
                <>
                  {renderGrid(documentsData)}
                  {renderPagination('documents-section', documentsData.total, documentsPage, setDocumentsPage)}
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      <div className="footer-section-downloads">
        <Footer />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Downloads;
