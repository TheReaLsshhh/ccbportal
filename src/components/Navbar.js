import React, { useState, useEffect } from "react";
import "./Navbar.css";
import apiService from "../services/api";

const Navbar = ({ isTopBarVisible = true, isHomePage = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    const newMenuState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newMenuState);

    // Prevent body scroll when menu is open
    if (newMenuState) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  // Get search result icon based on content type
  const getSearchResultIcon = (result) => {
    switch (result.type) {
      case "announcement":
        return "📢";
      case "event":
        return "📅";
      case "achievement":
        return "🏆";
      case "program":
        return "🎓";
      case "department":
        return "🏢";
      case "personnel":
        return "👤";
      case "page":
        return "📄";
      case "admission_info":
        return "📝";
      case "student_resource":
        return "👨‍🎓";
      case "campus_activity":
        return "🎉";
      case "faculty_resource":
        return "👨‍🏫";
      case "download":
        return "📥";
      case "about_info":
        return "ℹ️";
      case "contact_info":
        return "📞";
      default:
        return "📄";
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
      if (response.status === "success") {
        setSearchResults(response.results || []);
      } else {
        console.error("Search failed:", response.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    // Handle different types of results
    if (
      result.type === "announcement" ||
      result.type === "event" ||
      result.type === "achievement"
    ) {
      // For dynamic content, navigate to the news page
      window.location.href = "/news";
    } else if (result.type === "program") {
      // For academic programs, navigate to academics page
      window.location.href = "/academics";
    } else if (result.type === "department" || result.type === "personnel") {
      // For faculty/staff content, navigate to faculty page
      window.location.href = "/faculty";
    } else if (result.url && result.url !== "#") {
      // For other content, use the provided URL
      window.location.href = result.url;
    }

    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    // Also close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.classList.remove("mobile-menu-open");
    }
  };

  // Handle navigation link clicks
  const handleNavLinkClick = () => {
    // Close mobile menu when navigating
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.classList.remove("mobile-menu-open");
    }
  };

  // Determine which navigation item should be active based on current page or section (for home page)
  const getActiveNavClass = (href) => {
    return activePage === href ? "nav-link active-nav" : "nav-link";
  };

  // Determine which top bar link should be active based on current page
  const getActiveTopLinkClass = (href) => {
    return activePage === href ? "top-link active-top-link" : "top-link";
  };

  // Set active page based on current URL
  useEffect(() => {
    const handleRoute = () => {
      const currentPath = window.location.pathname;
      setActivePage(currentPath || "/");
    };

    handleRoute();

    const onPop = () => handleRoute();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Close mobile menu and search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const mainMobileMenu = document.querySelector(".nav-links");
      const mainMobileMenuBtn = document.querySelector(".mobile-menu-btn");
      const searchPopover = document.querySelector(".search-popover");
      const searchBtn = document.querySelector(".search-btn");
      const mobileMenuOverlay = document.querySelector(".mobile-menu-overlay");

      // Close main mobile menu if clicking outside or on overlay
      if (
        isMobileMenuOpen &&
        ((mainMobileMenu &&
          !mainMobileMenu.contains(event.target) &&
          mainMobileMenuBtn &&
          !mainMobileMenuBtn.contains(event.target)) ||
          (mobileMenuOverlay && mobileMenuOverlay.contains(event.target)))
      ) {
        setIsMobileMenuOpen(false);
        document.body.classList.remove("mobile-menu-open");
      }

      // Close search if clicking outside
      if (
        isSearchOpen &&
        searchPopover &&
        !searchPopover.contains(event.target) &&
        searchBtn &&
        !searchBtn.contains(event.target)
      ) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          document.body.classList.remove("mobile-menu-open");
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
          setSearchResults([]);
        }
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, []);

  // Compute main nav classes:
  // Updated approach:
  // - Always use "with-bg" for a solid background
  // - On the homepage, just add "homepage-nav-section" without the "no-bg" variant
  const mainNavClassName = isHomePage
    ? "main-nav with-bg homepage-nav-section"
    : "main-nav with-bg";

  // Check if we're on the academic, admissions, news_events, downloads, students, faculty_staff, aboutus, or contactus page
  const isAcademicPage = window.location.pathname === "/academics" || window.location.pathname.startsWith("/academics");
  const isAdmissionsPage = window.location.pathname === "/admissions" || window.location.pathname.startsWith("/admissions");
  const isNewsEventsPage = window.location.pathname === "/news" || window.location.pathname.startsWith("/news");
  const isDownloadsPage = window.location.pathname === "/downloads" || window.location.pathname.startsWith("/downloads");
  const isStudentsPage = window.location.pathname === "/students" || window.location.pathname.startsWith("/students");
  const isFacultyStaffPage = window.location.pathname === "/faculty-staff" || window.location.pathname.startsWith("/faculty-staff");
  const isAboutUsPage = window.location.pathname === "/about" || window.location.pathname.startsWith("/about");
  const isContactUsPage = window.location.pathname === "/contact" || window.location.pathname.startsWith("/contact");

  return (
    <nav className={`navbar ${isHomePage ? (isAcademicPage ? "academic-page-navbar homepage-navbar" : isAdmissionsPage ? "admissions-page-navbar homepage-navbar" : isNewsEventsPage ? "news-events-page-navbar homepage-navbar" : isDownloadsPage ? "downloads-page-navbar homepage-navbar" : isStudentsPage ? "students-page-navbar homepage-navbar" : isFacultyStaffPage ? "faculty-staff-page-navbar homepage-navbar" : isAboutUsPage ? "aboutus-page-navbar homepage-navbar" : isContactUsPage ? "contactus-page-navbar homepage-navbar" : "homepage-navbar") : ""}`}>
      {/* Secondary Navigation Bar - Full Width Green Background */}
      <div className={`secondary-nav-bar ${isHomePage ? "homepage-nav-section" : ""}`}>
        <div className="secondary-nav-container">
          <div className="secondary-nav-links">
            <a
              href="/students"
              className={getActiveTopLinkClass("/students")}
              onClick={handleNavLinkClick}
            >
              STUDENTS
            </a>
            <a
              href="/faculty"
              className={getActiveTopLinkClass("/faculty")}
              onClick={handleNavLinkClick}
            >
              FACULTY & STAFF
            </a>
            <a
              href="/about"
              className={getActiveTopLinkClass("/about")}
              onClick={handleNavLinkClick}
            >
              ABOUT US
            </a>
            <a
              href="/contact"
              className={getActiveTopLinkClass("/contact")}
              onClick={handleNavLinkClick}
            >
              CONTACT US
            </a>
          </div>
          {/* Date Display */}
          <div className="date-display">
            <span className="date-text">Today is {getCurrentDate()}</span>
          </div>
        </div>
      </div>

      {/* Top Header Section - White Background with Logo */}
      <div className={`header-top ${isHomePage ? "homepage-nav-section" : ""}`}>
        <div className="header-container">
          <div className="brand">
            <div className="logo">
              <img
                src="/images/ccb-logo.png"
                alt="City College of Bayawan logo"
                className="brand-logo"
              />
            </div>
            <div className="brand-text">
              <h1>
                <span className="brand-text-part1">CITY COLLEGE</span>{" "}
                <span className="brand-text-part2">OF BAYAWAN</span>
              </h1>
              <div className="brand-tagline">Honus et Excellentia Ad Summum Bonum</div>
            </div>
          </div>
          {/* Date Display - Mobile Only */}
          <div className="header-date-display">
            <span className="date-text">Today is {getCurrentDate()}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={mainNavClassName}>
        <div className="nav-container">
          {/* Mobile Menu Button */}
          <button
            className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Mobile Menu Overlay */}
          <div
            className={`mobile-menu-overlay ${isMobileMenuOpen ? "active" : ""
              }`}
            onClick={toggleMobileMenu}
          ></div>

          {/* Navigation Links */}
          <div className={`nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            {/* Secondary Navigation - Mobile Only */}
            <div className="mobile-secondary-nav">
              <a
                href="/students"
                className={getActiveNavClass("/students")}
                onClick={handleNavLinkClick}
              >
                STUDENTS
              </a>
              <a
                href="/faculty"
                className={getActiveNavClass("/faculty")}
                onClick={handleNavLinkClick}
              >
                FACULTY & STAFF
              </a>
              <a
                href="/about"
                className={getActiveNavClass("/about")}
                onClick={handleNavLinkClick}
              >
                ABOUT US
              </a>
              <a
                href="/contact"
                className={getActiveNavClass("/contact")}
                onClick={handleNavLinkClick}
              >
                CONTACT US
              </a>
            </div>
            {/* Main Navigation */}
            <a
              href="/"
              className={getActiveNavClass("/")}
              onClick={handleNavLinkClick}
            >
              HOME
            </a>
            <a
              href="/academics"
              className={getActiveNavClass("/academics")}
              onClick={handleNavLinkClick}
            >
              ACADEMICS
            </a>
            <a
              href="/admissions"
              className={getActiveNavClass("/admissions")}
              onClick={handleNavLinkClick}
            >
              ADMISSIONS
            </a>
            {/* Services Dropdown */}
            <div
              className="services-dropdown-container"
              onMouseEnter={() => {
                if (window.innerWidth > 1024) {
                  setIsServicesDropdownOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (window.innerWidth > 1024) {
                  setIsServicesDropdownOpen(false);
                }
              }}
            >
              <button
                type="button"
                className={`nav-link services-nav-link ${isServicesDropdownOpen ? 'active-nav' : ''}`}
                aria-haspopup="true"
                aria-expanded={isServicesDropdownOpen}
                onClick={() => {
                  if (window.innerWidth <= 1024) {
                    setIsServicesDropdownOpen(!isServicesDropdownOpen);
                  }
                }}
                onMouseEnter={() => {
                  if (window.innerWidth > 1024) {
                    setIsServicesDropdownOpen(true);
                  }
                }}
              >
                SERVICES
                <span className={`dropdown-arrow ${isServicesDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              <div
                className={`services-dropdown ${isServicesDropdownOpen ? 'dropdown-open' : ''}`}
                onMouseEnter={() => {
                  if (window.innerWidth > 1024) {
                    setIsServicesDropdownOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  if (window.innerWidth > 1024) {
                    setIsServicesDropdownOpen(false);
                  }
                }}
              >
                <a
                  href="https://sites.google.com/view/ccblearningresourcecenter/home?authuser=0"
                  className="dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavLinkClick}
                >
                  College Library
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61577470075989"
                  className="dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavLinkClick}
                >
                  GIYA Center
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61582297621099"
                  className="dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavLinkClick}
                >
                  Student Affairs &Services Office
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61583528066100"
                  className="dropdown-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavLinkClick}
                >
                  Office of the Registrar
                </a>
              </div>
            </div>
            <a
              href="/news"
              className={getActiveNavClass("/news")}
              onClick={handleNavLinkClick}
            >
              NEWS & EVENTS
            </a>
            <a
              href="/downloads"
              className={getActiveNavClass("/downloads")}
              onClick={handleNavLinkClick}
            >
              DOWNLOADS
            </a>

            {/* Search icon with hover popover */}
            <div className="nav-search">
              <button
                className="search-btn"
                onClick={toggleSearch}
                aria-label="Toggle search"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </button>
              <div
                className={`search-popover ${isSearchOpen ? "search-open" : ""
                  }`}
              >
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
                            <span className="search-result-icon">
                              {getSearchResultIcon(result)}
                            </span>
                            <div className="search-result-title">
                              {result.title}
                            </div>
                          </div>
                          <div className="search-result-category">
                            {result.category}
                          </div>
                          <div className="search-result-description">
                            {result.description}
                          </div>
                          {result.date && (
                            <div className="search-result-date">
                              📅 {new Date(result.date).toLocaleDateString()}
                            </div>
                          )}
                          {result.location && (
                            <div className="search-result-location">
                              📍 {result.location}
                            </div>
                          )}
                          {result.duration && (
                            <div className="search-result-duration">
                              ⏱️ {result.duration}
                            </div>
                          )}
                          {result.specialization && (
                            <div className="search-result-specialization">
                              🎯 {result.specialization}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery &&
                    searchResults.length === 0 &&
                    !isSearching && (
                      <div className="search-no-results">
                        <div className="no-results-text">
                          No results found for "{searchQuery}"
                        </div>
                        <div className="no-results-suggestion">
                          Try searching for events, announcements, programs,
                          admissions, student services, downloads, or faculty
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
