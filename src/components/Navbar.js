import React, { useState, useEffect } from 'react';
import './Navbar.css';
import apiService from '../services/api';

const Navbar = ({ isTopBarVisible = true }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const toggleMobileMenu = () => {
    const newMenuState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newMenuState);
    
    // Prevent body scroll when menu is open
    if (newMenuState) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };


  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Get search result icon based on content type
  const getSearchResultIcon = (result) => {
    switch (result.type) {
      case 'announcement':
        return '📢';
      case 'event':
        return '📅';
      case 'achievement':
        return '🏆';
      case 'program':
        return '🎓';
      case 'department':
        return '🏢';
      case 'personnel':
        return '👤';
      case 'page':
        return '📄';
      case 'admission_info':
        return '📝';
      case 'student_resource':
        return '👨‍🎓';
      case 'campus_activity':
        return '🎉';
      case 'faculty_resource':
        return '👨‍🏫';
      case 'download':
        return '📥';
      case 'about_info':
        return 'ℹ️';
      case 'contact_info':
        return '📞';
      default:
        return '📄';
    }
  };

  // Dynamic search function using API
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await apiService.search(query);
      if (response.status === 'success') {
        setSearchResults(response.results || []);
      } else {
        console.error('Search failed:', response.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    // Handle different types of results
    if (result.type === 'announcement' || result.type === 'event' || result.type === 'achievement') {
      // For dynamic content, navigate to the news page
      window.location.href = '/news';
    } else if (result.type === 'program') {
      // For academic programs, navigate to academics page
      window.location.href = '/academics';
    } else if (result.type === 'department' || result.type === 'personnel') {
      // For faculty/staff content, navigate to faculty page
      window.location.href = '/faculty';
    } else if (result.url && result.url !== '#') {
      // For other content, use the provided URL
      window.location.href = result.url;
    }
    
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    // Also close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.classList.remove('mobile-menu-open');
    }
  };

  // Handle navigation link clicks
  const handleNavLinkClick = () => {
    // Close mobile menu when navigating
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.classList.remove('mobile-menu-open');
    }
  };

  // Determine which navigation item should be active based on current page or section (for home page)
  const getActiveNavClass = (href) => {
    return activePage === href ? 'nav-link active-nav' : 'nav-link';
  };

  // Determine which top bar link should be active based on current page
  const getActiveTopLinkClass = (href) => {
    return activePage === href ? 'top-link active-top-link' : 'top-link';
  };

  // Set active page based on current URL
  useEffect(() => {
    const handleRoute = () => {
      const currentPath = window.location.pathname;
      setActivePage(currentPath || '/');
    };

    handleRoute();

    const onPop = () => handleRoute();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Close mobile menu and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const mainMobileMenu = document.querySelector('.nav-links');
      const mainMobileMenuBtn = document.querySelector('.mobile-menu-btn');
      const searchPopover = document.querySelector('.search-popover');
      const searchBtn = document.querySelector('.search-btn');
      const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

      // Close main mobile menu if clicking outside or on overlay
      if (isMobileMenuOpen && 
          ((mainMobileMenu && 
            !mainMobileMenu.contains(event.target) && 
            mainMobileMenuBtn && 
            !mainMobileMenuBtn.contains(event.target)) ||
           (mobileMenuOverlay && mobileMenuOverlay.contains(event.target)))) {
        setIsMobileMenuOpen(false);
        document.body.classList.remove('mobile-menu-open');
      }

      // Close search if clicking outside
      if (isSearchOpen && 
          searchPopover && 
          !searchPopover.contains(event.target) && 
          searchBtn && 
          !searchBtn.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          document.body.classList.remove('mobile-menu-open');
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);

  // Toggle navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(y > 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="navbar">
      {/* Unified Green Navigation Bar */}
      <div className={`main-nav ${isScrolled ? 'with-bg' : 'no-bg'}`}>
        <div className="nav-container">
          {/* Logo and Brand */}
          <div className="brand">
            <div className="logo">
              <img src="/images/ccb-logo.png" alt="City College of Bayawan logo" className="brand-logo" />
            </div>
            <div className="brand-text">
              <h1>CITY COLLEGE</h1>
              <h2>OF BAYAWAN</h2>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`} 
            onClick={toggleMobileMenu} 
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Mobile Menu Overlay */}
          <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>

          {/* Navigation Links */}
          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Main Navigation */}
            <a 
              href="/" 
              className={getActiveNavClass('/')}
              onClick={handleNavLinkClick}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/></svg>
              </span>
              <span className="nav-label">HOME</span>
            </a>
            <a 
              href="/academics" 
              className={getActiveNavClass('/academics')}
              onClick={handleNavLinkClick}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16z"/></svg>
              </span>
              <span className="nav-label">ACADEMIC PROGRAMS</span>
            </a>
            <a 
              href="/admissions" 
              className={getActiveNavClass('/admissions')}
              onClick={handleNavLinkClick}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a5 5 0 015 5v2h1a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9a2 2 0 012-2h1V7a5 5 0 015-5zm3 7V7a3 3 0 10-6 0v2h6z"/></svg>
              </span>
              <span className="nav-label">ADMISSIONS</span>
            </a>
            <a 
              href="/news" 
              className={getActiveNavClass('/news')}
              onClick={handleNavLinkClick}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 5h14a2 2 0 012 2v11a3 3 0 01-3 3H6a3 3 0 01-3-3V7a2 2 0 012-2zm2 4h10V7H6v2zm0 3h10v-2H6v2zm0 3h7v-2H6v2z"/></svg>
              </span>
              <span className="nav-label">NEWS & EVENTS</span>
            </a>
            <a 
              href="/downloads" 
              className={getActiveNavClass('/downloads')}
              onClick={handleNavLinkClick}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/></svg>
              </span>
              <span className="nav-label">DOWNLOADS</span>
            </a>

            {/* Secondary Navigation Links */}
            <div className="secondary-nav">
              <a href="/students" className={getActiveTopLinkClass('/students')} onClick={handleNavLinkClick}>STUDENTS</a>
              <a href="/faculty" className={getActiveTopLinkClass('/faculty')} onClick={handleNavLinkClick}>FACULTY & STAFF</a>
              <a href="/about" className={getActiveTopLinkClass('/about')} onClick={handleNavLinkClick}>ABOUT US</a>
              <a href="/contact" className={getActiveTopLinkClass('/contact')} onClick={handleNavLinkClick}>CONTACT US</a>
            </div>

            {/* Search icon with hover popover */}
            <div className="nav-search">
              <button className="search-btn" onClick={toggleSearch} aria-label="Toggle search">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
              <div className={`search-popover ${isSearchOpen ? 'search-open' : ''}`}>
                <div className="search-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search events, announcements, programs, admissions..."
                    aria-label="Search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus={isSearchOpen}
                  />
                  {isSearching && (
                    <div className="search-loading">
                      <div className="search-spinner"></div>
                      <span>Searching...</span>
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="search-result-item"
                          onClick={() => handleSearchResultClick(result)}
                        >
                          <div className="search-result-header">
                            <span className="search-result-icon">{getSearchResultIcon(result)}</span>
                            <div className="search-result-title">{result.title}</div>
                          </div>
                          <div className="search-result-category">{result.category}</div>
                          <div className="search-result-description">{result.description}</div>
                          {result.date && (
                            <div className="search-result-date">📅 {new Date(result.date).toLocaleDateString()}</div>
                          )}
                          {result.location && (
                            <div className="search-result-location">📍 {result.location}</div>
                          )}
                          {result.duration && (
                            <div className="search-result-duration">⏱️ {result.duration}</div>
                          )}
                          {result.specialization && (
                            <div className="search-result-specialization">🎯 {result.specialization}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="search-no-results">
                      <div className="no-results-text">No results found for "{searchQuery}"</div>
                      <div className="no-results-suggestion">Try searching for events, announcements, programs, admissions, student services, downloads, or faculty</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date Display */}
            <div className="date-display">
              <span className="date-text">Today is {getCurrentDate()}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;