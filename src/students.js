import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './students.css';

const Students = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navAnimationsComplete, setNavAnimationsComplete] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Dynamic Campus Activities data
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  
  // Modal states for event details
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  // Animation states
  const [isHandbookContentVisible, setIsHandbookContentVisible] = useState(false);
  const [isCalendarContentVisible, setIsCalendarContentVisible] = useState(false);
  const [isServicesGridVisible, setIsServicesGridVisible] = useState(false);
  const [isCampusLifeContentVisible, setIsCampusLifeContentVisible] = useState(false);
  const [isActivitiesListVisible, setIsActivitiesListVisible] = useState(false);

  // Scroll-based navbar visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past initial 100px
        setIsTopBarVisible(false);
      } else if (currentScrollY < lastScrollY && currentScrollY < 50) {
        // Scrolling up and almost at the top (within 50px)
        setIsTopBarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Intersection Observer for handbook-content section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsHandbookContentVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const handbookContentElement = document.querySelector('.handbook-content');
    if (handbookContentElement) {
      observer.observe(handbookContentElement);
    }

    return () => {
      if (handbookContentElement) {
        observer.unobserve(handbookContentElement);
      }
    };
  }, []);

  // Intersection Observer for calendar-content section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCalendarContentVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const calendarContentElement = document.querySelector('.calendar-content');
    if (calendarContentElement) {
      observer.observe(calendarContentElement);
    }

    return () => {
      if (calendarContentElement) {
        observer.unobserve(calendarContentElement);
      }
    };
  }, []);

  // Intersection Observer for services-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsServicesGridVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const servicesGridElement = document.querySelector('.services-grid');
    if (servicesGridElement) {
      observer.observe(servicesGridElement);
    }

    return () => {
      if (servicesGridElement) {
        observer.unobserve(servicesGridElement);
      }
    };
  }, []);

  // Intersection Observer for campus-life-content section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCampusLifeContentVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const campusLifeContentElement = document.querySelector('.campus-life-content');
    if (campusLifeContentElement) {
      observer.observe(campusLifeContentElement);
    }

    return () => {
      if (campusLifeContentElement) {
        observer.unobserve(campusLifeContentElement);
      }
    };
  }, []);

  // Intersection Observer for activities-list section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsActivitiesListVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const activitiesListElement = document.querySelector('.activities-list');
    if (activitiesListElement) {
      observer.observe(activitiesListElement);
    }

    return () => {
      if (activitiesListElement) {
        observer.unobserve(activitiesListElement);
      }
    };
  }, [events]); // Re-run when events are loaded

  // Load events from API for Campus Activities
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const resp = await apiService.getEvents();
        if (resp.status === 'success' && Array.isArray(resp.events)) {
          setEvents(resp.events);
        } else {
          setEventsError('Failed to load campus activities');
        }
      } catch (e) {
        setEventsError('Failed to load campus activities');
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Modal functions for event details
  const openEventModal = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle modal keyboard events and scroll lock
  useEffect(() => {
    if (!isEventModalOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeEventModal();
      }
    };
    
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isEventModalOpen]);

  // Helper functions for formatting
  const formatEventDate = (iso) => {
    try {
      const date = new Date(iso);
      return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
      };
    } catch {
      return { day: '01', month: 'JAN' };
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return iso;
    }
  };

  const renderDetails = (text) => {
    if (!text) return null;
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, idx) => (
        <p key={`detail-line-${idx}`}>{line}</p>
      ));
  };

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      setNavAnimationsComplete(true);
    }, 1500);

    return () => clearTimeout(animationTimeout);
  }, []);

  return (
    <div className={`App students-page ${navAnimationsComplete ? 'nav-animations-complete' : ''}`}>
      {/* Dynamic Scroll Progress Bar */}
      <div 
        className="scroll-progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      />
      <SEO
        title="Student Portal"
        description="Access essential student resources at City College of Bayawan. Find student handbooks, academic calendars, student services, campus life information, and student organizations."
        keywords="student portal, student resources, student handbook, academic calendar, student services, campus life, student organizations, City College of Bayawan students"
        url="/students"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Students Page Header */}
      <section className="students-header">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Student Portal</h1>
            <p className="hero-subtitle">Access essential resources and information for your academic journey</p>
            <p className="hero-motto">Empowering Students for Academic Excellence</p>
          </div>
        </div>
      </section>

      {/* Student Handbook Section */}
      <section className="students-section handbook-section">
        <div className="container">
          <h2 className="section-title">Student Handbook</h2>
          <p className="section-subtitle">Your comprehensive guide to academic policies, procedures, and campus life</p>
          
          <div className={`handbook-content ${isHandbookContentVisible ? 'fade-in-visible' : ''}`}>
            <div className="handbook-card">
              <div className="handbook-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h3>Student Handbook 2025-2026</h3>
              <p>Complete guide containing all policies, procedures, and guidelines for students.</p>
              <button className="download-btn">Download PDF</button>
            </div>
            
            <div className="handbook-card">
              <div className="handbook-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Code of Conduct</h3>
              <p>Standards of behavior and ethical guidelines for all students.</p>
              <button className="download-btn">Download PDF</button>
            </div>
            
            <div className="handbook-card">
              <div className="handbook-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3>Academic Policies</h3>
              <p>Academic integrity, grading system, and academic requirements.</p>
              <button className="download-btn">Download PDF</button>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Calendar Section */}
      <section className="students-section calendar-section">
        <div className="container">
          <h2 className="section-title">Academic Calendar</h2>
          <p className="section-subtitle">Important dates and schedules for the academic year</p>
          
          <div className={`calendar-content ${isCalendarContentVisible ? 'fade-in-visible' : ''}`}>
            <div className="calendar-card">
              <div className="calendar-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                  <path d="M7 10h5v5H7z"/>
                </svg>
              </div>
              <h3>Academic Calendar 2025-2026</h3>
              <p>Complete academic year schedule including holidays, exams, and important dates.</p>
              <button className="download-btn">Download PDF</button>
            </div>
            
            <div className="calendar-card">
              <div className="calendar-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                  <path d="M7 10h5v5H7z"/>
                </svg>
              </div>
              <h3>Class Schedule</h3>
              <p>Current semester class schedules and room assignments.</p>
              <button className="download-btn">View Schedule</button>
            </div>
            
            <div className="calendar-card">
              <div className="calendar-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                  <path d="M7 10h5v5H7z"/>
                </svg>
              </div>
              <h3>Exam Schedule</h3>
              <p>Midterm and final examination schedules for all programs.</p>
              <button className="download-btn">View Schedule</button>
            </div>
          </div>
        </div>
      </section>

      {/* Student Services Section */}
      <section className="students-section services-section">
        <div className="container">
          <h2 className="section-title">Student Services</h2>
          <p className="section-subtitle">Comprehensive support services to enhance your academic experience</p>
          
          <div className={`services-grid ${isServicesGridVisible ? 'fade-in-visible' : ''}`}>
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Guidance & Counseling</h3>
              <p>Professional counseling services for academic, personal, and career development.</p>
              <ul>
                <li>Academic Advising</li>
                <li>Career Counseling</li>
                <li>Personal Development</li>
                <li>Mental Health Support</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                </svg>
              </div>
              <h3>Library Services</h3>
              <p>Access to extensive collections of books, journals, and digital resources.</p>
              <ul>
                <li>Book Collections</li>
                <li>Online Databases</li>
                <li>Study Spaces</li>
                <li>Research Support</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Registrar's Office</h3>
              <p>Academic records, enrollment services, and official documentation.</p>
              <ul>
                <li>Enrollment Services</li>
                <li>Transcript Requests</li>
                <li>Academic Records</li>
                <li>Graduation Requirements</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Health Services</h3>
              <p>Medical care, health education, and wellness programs for students.</p>
              <ul>
                <li>Medical Check-ups</li>
                <li>Health Education</li>
                <li>Emergency Care</li>
                <li>Wellness Programs</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3>IT Support</h3>
              <p>Technical support for computer labs, internet access, and software assistance.</p>
              <ul>
                <li>Computer Lab Access</li>
                <li>Internet Support</li>
                <li>Software Assistance</li>
                <li>Technical Training</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Financial Aid</h3>
              <p>Scholarships, grants, and financial assistance programs for eligible students.</p>
              <ul>
                <li>Scholarship Programs</li>
                <li>Student Loans</li>
                <li>Work-Study Programs</li>
                <li>Financial Counseling</li>
              </ul>
              <button className="service-btn">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Life & Student Organizations Section */}
      <section className="students-section campus-life-section">
        <div className="container">
          <h2 className="section-title">Campus Life & Student Organizations</h2>
          <p className="section-subtitle">Get involved in campus activities and join student organizations</p>
          
          <div className={`campus-life-content ${isCampusLifeContentVisible ? 'fade-in-visible' : ''}`}>
            <div className="organizations-grid">
              <div className="org-card">
                <div className="org-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>Student Government</h3>
                <p>Represent student interests and organize campus-wide events and activities.</p>
                <button className="org-btn">Join Now</button>
              </div>
              
              <div className="org-card">
                <div className="org-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>Academic Clubs</h3>
                <p>Subject-specific clubs for Business, IT, Education, and Hospitality students.</p>
                <button className="org-btn">Join Now</button>
              </div>
              
              <div className="org-card">
                <div className="org-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>Cultural Organizations</h3>
                <p>Celebrate diversity and promote cultural awareness through various activities.</p>
                <button className="org-btn">Join Now</button>
              </div>
              
              <div className="org-card">
                <div className="org-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>Sports Teams</h3>
                <p>Represent CCB in various sports competitions and intramural activities.</p>
                <button className="org-btn">Join Now</button>
              </div>
            </div>
            
            <div className="campus-activities">
              <h3>Campus Activities</h3>
              {eventsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading campus activities...</p>
                </div>
              ) : eventsError ? (
                <div className="error-container">
                  <p className="error-message">{eventsError}</p>
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state">
                  <p>No campus activities scheduled at the moment. Check back soon for updates!</p>
                </div>
              ) : (
                <div className={`activities-list ${isActivitiesListVisible ? 'fade-in-visible' : ''}`}>
                  {events.map(event => {
                    const eventDate = formatEventDate(event.event_date);
                    return (
                      <div key={event.id} className="activity-item">
                        <div className="activity-icon">
                          <div className="event-date-badge">
                            <span className="day">{eventDate.day}</span>
                            <span className="month">{eventDate.month}</span>
                          </div>
                        </div>
                        <div className="activity-content">
                          <h4>{event.title}</h4>
                          <p className="activity-date">{formatDate(event.event_date)}</p>
                          {event.formatted_time && <p className="activity-time">🕒 {event.formatted_time}</p>}
                          {event.location && <p className="activity-location">📍 {event.location}</p>}
                          <p className="activity-description">{event.description}</p>
                          <button className="activity-learn-more" onClick={() => openEventModal(event)}>
                            Learn More
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <div className="students-footer">
        <Footer />
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Event Details Modal */}
      {isEventModalOpen && selectedEvent && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeEventModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeEventModal}>×</button>
            <h3 className="modal-title">{selectedEvent.title}</h3>
            <p className="modal-date">{formatDate(selectedEvent.event_date)}</p>
            {selectedEvent.formatted_time && <p className="modal-time">🕒 {selectedEvent.formatted_time}</p>}
            {selectedEvent.location && <p className="modal-location">📍 {selectedEvent.location}</p>}
            <div className="modal-body">
              <p className="modal-description">{selectedEvent.description}</p>
              {selectedEvent.details && selectedEvent.details.trim() && (
                <div className="modal-details">
                  {renderDetails(selectedEvent.details)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
