import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import './aboutus.css';

const AboutUs = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('history');
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  // Animation states
  const [isMissionContentVisible, setIsMissionContentVisible] = useState(false);
  const [isOrgChartVisible, setIsOrgChartVisible] = useState(false);
  const [isExecutiveGridVisible, setIsExecutiveGridVisible] = useState(false);
  const [isDepartmentsGridVisible, setIsDepartmentsGridVisible] = useState(false);
  const [isFacilitiesGridVisible, setIsFacilitiesGridVisible] = useState(false);

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
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Intersection Observer for mission-content section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsMissionContentVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const missionContentElement = document.querySelector('.mission-content');
    if (missionContentElement) {
      observer.observe(missionContentElement);
    }

    return () => {
      if (missionContentElement) {
        observer.unobserve(missionContentElement);
      }
    };
  }, []);

  // Intersection Observer for org-chart-container section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsOrgChartVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const orgChartElement = document.querySelector('.org-chart-container');
    if (orgChartElement) {
      observer.observe(orgChartElement);
    }

    return () => {
      if (orgChartElement) {
        observer.unobserve(orgChartElement);
      }
    };
  }, []);

  // Intersection Observer for executive-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsExecutiveGridVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const executiveGridElement = document.querySelector('.executive-grid');
    if (executiveGridElement) {
      observer.observe(executiveGridElement);
    }

    return () => {
      if (executiveGridElement) {
        observer.unobserve(executiveGridElement);
      }
    };
  }, []);

  // Intersection Observer for departments-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsDepartmentsGridVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const departmentsGridElement = document.querySelector('.departments-grid');
    if (departmentsGridElement) {
      observer.observe(departmentsGridElement);
    }

    return () => {
      if (departmentsGridElement) {
        observer.unobserve(departmentsGridElement);
      }
    };
  }, []);

  // Intersection Observer for facilities-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsFacilitiesGridVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const facilitiesGridElement = document.querySelector('.facilities-grid');
    if (facilitiesGridElement) {
      observer.observe(facilitiesGridElement);
    }

    return () => {
      if (facilitiesGridElement) {
        observer.unobserve(facilitiesGridElement);
      }
    };
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      // Get the total height of both navigation bars
      const topBar = document.querySelector('.top-bar');
      const mainNavbar = document.querySelector('.navbar');
      const aboutNavigation = document.querySelector('.about-navigation');
      
      const topBarHeight = topBar?.offsetHeight || 0;
      const navbarHeight = mainNavbar?.offsetHeight || 0;
      const aboutNavHeight = aboutNavigation?.offsetHeight || 0;
      
      // Calculate total header height plus some extra padding
      const totalHeaderHeight = topBarHeight + navbarHeight + aboutNavHeight + 20;
      
      const targetPosition = element.offsetTop - totalHeaderHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  const openMissionModal = (payload) => {
    setSelectedMission(payload);
    setIsMissionModalOpen(true);
  };

  const closeMissionModal = () => {
    setIsMissionModalOpen(false);
    setSelectedMission(null);
  };

  return (
    <div className="App aboutus-page">
      <Navbar isTopBarVisible={isTopBarVisible} />
      
      {/* About Us Hero Section */}
      <section className={`about-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">About City College of Bayawan</h1>
            <p className="hero-subtitle">Honor and Excellence for the Highest Good</p>
            <p className="hero-motto">Honus et Excellentia Ad Summum Bonum</p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="about-navigation">
        <div className="container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeSection === 'history' ? 'active' : ''}`}
              onClick={() => scrollToSection('history')}
            >
              History
            </button>
            <button 
              className={`nav-tab ${activeSection === 'mission' ? 'active' : ''}`}
              onClick={() => scrollToSection('mission')}
            >
              Mission & Vision
            </button>
            <button 
              className={`nav-tab ${activeSection === 'org-chart' ? 'active' : ''}`}
              onClick={() => scrollToSection('org-chart')}
            >
              Organizational Chart
            </button>
            <button 
              className={`nav-tab ${activeSection === 'officers' ? 'active' : ''}`}
              onClick={() => scrollToSection('officers')}
            >
              Administrative Officers
            </button>
            <button 
              className={`nav-tab ${activeSection === 'campus' ? 'active' : ''}`}
              onClick={() => scrollToSection('campus')}
            >
              Campus Facilities
            </button>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section id="history" className="about-section history-section">
        <div className="container">
          <h2 className="section-title">History of City College of Bayawan</h2>
          <div className="history-content">
            <div className="history-text">
              <p>
                The City College of Bayawan was established in [Year] as a response to the growing need for 
                accessible and quality higher education in Bayawan City and its surrounding communities. 
                What began as a small institution has grown into a comprehensive educational establishment 
                committed to academic excellence and community development.
              </p>
              <p>
                The college was founded with the vision of providing affordable, quality education to the 
                youth of Bayawan City, particularly those who may not have the means to pursue higher 
                education in distant institutions. Over the years, the college has expanded its academic 
                offerings and facilities to better serve the educational needs of the community.
              </p>
              <p>
                Throughout its history, the City College of Bayawan has remained steadfast in its commitment 
                to the values of honor, excellence, and service to the community. The institution has 
                produced thousands of graduates who have gone on to become successful professionals, 
                entrepreneurs, and community leaders.
              </p>
            </div>
            <div className="history-timeline">
              <div className="timeline-item">
                <div className="timeline-year">[2024]</div>
                <div className="timeline-content">
                  <h4>Establishment</h4>
                  <p>City College of Bayawan was officially established.</p>
                </div>
              </div>
              {/* <div className="timeline-item">
                <div className="timeline-year">[Year]</div>
                <div className="timeline-content">
                  <h4>First Graduation</h4>
                  <p>The first batch of students graduated from the institution</p>
                </div>
              </div> */}
              {/* <div className="timeline-item">
                <div className="timeline-year">[Year]</div>
                <div className="timeline-content">
                  <h4>Program Expansion</h4>
                  <p>Additional academic programs were introduced</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">[Year]</div>
                <div className="timeline-content">
                  <h4>Infrastructure Development</h4>
                  <p>New facilities and buildings were constructed</p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, and Core Values Section */}
      <section id="mission" className="about-section mission-section">
        <div className="container">
          <h2 className="section-title">Mission, Vision, Core Values, and Goals</h2>
          <div className={`mission-content ${isMissionContentVisible ? 'fade-in-visible' : ''}`}>
            <div className="mission-card" role="button" tabIndex={0}
                 onClick={() => openMissionModal({
                   title: 'Vision',
                   content: 'By 2034, City College of Bayawan is the leading tertiary institution in the southern part of Negros Island Region.'
                 })}
                 onKeyDown={(e) => { if (e.key === 'Enter') openMissionModal({ title: 'Vision', content: 'By 2034, City College of Bayawan is the leading tertiary institution in the southern part of Negros Island Region.' }); }}
            >
              <div className="mission-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Vision</h3>
              <p>
                By 2034, City College of Bayawan is the leading tertiary institution in the southern part of Negros Island Region.
              </p>
            </div>
            
            <div className="mission-card" role="button" tabIndex={0}
                 onClick={() => openMissionModal({
                   title: 'Mission',
                   content: 'City College of Bayawan is a center of quality education committed to produce innovative, service-oriented, and globally competitive graduates.'
                 })}
                 onKeyDown={(e) => { if (e.key === 'Enter') openMissionModal({ title: 'Mission', content: 'City College of Bayawan is a center of quality education committed to produce innovative, service-oriented, and globally competitive graduates.' }); }}
            >
              <div className="mission-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Mission</h3>
              <p>
                City College of Bayawan is a center of quality education committed to produce innovative, service-oriented, and globally competitive graduates.
              </p>
            </div>
            
            <div className="mission-card" role="button" tabIndex={0}
                 onClick={() => openMissionModal({
                   title: 'Core Values',
                   content: 'The City College of Bayawan adheres to: CHARACTER, COMPETENCE, BANKABILITY.'
                 })}
                 onKeyDown={(e) => { if (e.key === 'Enter') openMissionModal({ title: 'Core Values', content: 'The City College of Bayawan adheres to: CHARACTER, COMPETENCE, BANKABILITY.' }); }}
            >
              <div className="mission-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Core Values</h3>
              <div className="values-list">
                <p>The City College of Bayawan adheres to the following core values:</p>
                <div className="value-item">
                  <strong>C</strong> - CHARACTER
                </div>
                <div className="value-item">
                  <strong>C</strong> - COMPETENCE
                </div>
                <div className="value-item">
                  <strong>B</strong> - BANKABILITY
                </div>
              </div>
            </div>

            <div className="mission-card-goals" role="button" tabIndex={0}
                 onClick={() => openMissionModal({
                   title: 'Goals',
                   content: 'A committed and highly qualified academic community; A high-quality and relevant programs; A culture of excellence and innovation; The generation and transference of knowledge; An impact on improving quality of life and sustainable development.'
                 })}
                 onKeyDown={(e) => { if (e.key === 'Enter') openMissionModal({ title: 'Goals', content: 'A committed and highly qualified academic community; A high-quality and relevant programs; A culture of excellence and innovation; The generation and transference of knowledge; An impact on improving quality of life and sustainable development.' }); }}
            >
              <div className="mission-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Goals</h3>
              <p>The City College of Bayawan by 2029 will be known by having:</p>
              <ul className="goals-list">
                <li>
                  <span className="goal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z"/></svg>
                  </span>
                  A committed and highly qualified academic community true to its original objectives;
                </li>
                <li>
                  <span className="goal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z"/></svg>
                  </span>
                  A high-quality and relevant undergraduates and professional academic program immersed in a globalized and localized context, inclusive to all regardless of economic and social condition;
                </li>
                <li>
                  <span className="goal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z"/></svg>
                  </span>
                  A culture of excellence, quality and innovation in its academic and administrative processes;
                </li>
                <li>
                  <span className="goal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z"/></svg>
                  </span>
                  The generation and transference of knowledge with scientific and technological pertinent contributions; and
                </li>
                <li>
                  <span className="goal-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z"/></svg>
                  </span>
                  An impact on improving the quality of people’s lives, ratifying its commitment to society and constructing a country that lives around peace and sustainable development.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {isMissionModalOpen && selectedMission && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeMissionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={closeMissionModal}>×</button>
            <h3 className="modal-title">{selectedMission.title}</h3>
            <div className="modal-body">
              <p>{selectedMission.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Organizational Chart Section */}
      <section id="org-chart" className="about-section org-chart-section">
        <div className="container">
          <h2 className="section-title">Organizational Chart</h2>
          <div className={`org-chart-container ${isOrgChartVisible ? 'fade-in-visible' : ''}`}>
            <div className="org-chart">
              <div className="org-level president">
                <div className="org-position">
                  <div className="position-title">College President</div>
                  <div className="position-name">Dr. [Name]</div>
                </div>
              </div>
              
              <div className="org-level vice-presidents">
                <div className="org-position">
                  <div className="position-title">Vice President for Academic Affairs</div>
                  <div className="position-name">Dr. [Name]</div>
                </div>
                <div className="org-position">
                  <div className="position-title">Vice President for Administration</div>
                  <div className="position-name">Dr. [Name]</div>
                </div>
                <div className="org-position">
                  <div className="position-title">Vice President for Student Affairs</div>
                  <div className="position-name">Dr. [Name]</div>
                </div>
              </div>
              
              <div className="org-level departments">
                <div className="dept-group">
                  <h4>Academic Departments</h4>
                  <div className="dept-list">
                    <div className="dept-item">Business Administration</div>
                    <div className="dept-item">Information Technology</div>
                    <div className="dept-item">Education</div>
                    <div className="dept-item">Hospitality Management</div>
                  </div>
                </div>
                <div className="dept-group">
                  <h4>Support Services</h4>
                  <div className="dept-list">
                    <div className="dept-item">Registrar's Office</div>
                    <div className="dept-item">Student Affairs</div>
                    <div className="dept-item">Library Services</div>
                    <div className="dept-item">IT Services</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Administrative Officers and Staff Directory Section */}
      <section id="officers" className="about-section officers-section">
        <div className="container">
          <h2 className="section-title">Administrative Officers and Staff Directory</h2>
          <div className="officers-content">
            <div className="officers-category">
              <h3>Executive Officers</h3>
              <div className={`executive-grid ${isExecutiveGridVisible ? 'fade-in-visible' : ''}`}>
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Dr. [Name]</h4>
                    <p className="officer-position">College President</p>
                    <p className="officer-contact">📧 president@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Dr. [Name]</h4>
                    <p className="officer-position">Vice President for Academic Affairs</p>
                    <p className="officer-contact">📧 vpaa@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Dr. [Name]</h4>
                    <p className="officer-position">Vice President for Administration</p>
                    <p className="officer-contact">📧 vpa@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Dr. [Name]</h4>
                    <p className="officer-position">Vice President for Student Affairs</p>
                    <p className="officer-contact">📧 vpsa@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="officers-category">
              <h3>Department Heads</h3>
              <div className={`departments-grid ${isDepartmentsGridVisible ? 'fade-in-visible' : ''}`}>
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Prof. [Name]</h4>
                    <p className="officer-position">Dean, Business Administration</p>
                    <p className="officer-contact">📧 business@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Prof. [Name]</h4>
                    <p className="officer-position">Dean, Information Technology</p>
                    <p className="officer-contact">📧 it@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Prof. [Name]</h4>
                    <p className="officer-position">Dean, Education</p>
                    <p className="officer-contact">📧 education@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
                
                <div className="officer-card">
                  <div className="officer-photo">
                    <div className="photo-placeholder"></div>
                  </div>
                  <div className="officer-info">
                    <h4>Prof. [Name]</h4>
                    <p className="officer-position">Dean, Hospitality Management</p>
                    <p className="officer-contact">📧 hospitality@ccb.edu.ph</p>
                    <p className="officer-contact">📞 (035) XXX-XXXX</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Facilities Section */}
      <section id="campus" className="about-section campus-section">
        <div className="container">
          <h2 className="section-title">Campus Facilities</h2>
          <div className="facilities-content">
            <p className="facilities-subtitle">Explore our modern facilities designed to support academic excellence and student life</p>
            <div className={`facilities-grid ${isFacilitiesGridVisible ? 'fade-in-visible' : ''}`}>
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Academic Buildings</h4>
                  <p>Modern classrooms and lecture halls equipped with multimedia facilities, air conditioning, and comfortable seating for optimal learning environments.</p>
                </div>
              </div>
              
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Library & Learning Center</h4>
                  <p>Comprehensive collection of books, journals, and digital resources with quiet study areas, group study rooms, and computer workstations.</p>
                </div>
              </div>
              
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Computer Laboratories</h4>
                  <p>State-of-the-art computer labs with latest software, high-speed internet, and modern equipment for hands-on learning and research.</p>
                </div>
              </div>
              
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Student Center</h4>
                  <p>Multi-purpose facility for student activities, events, meetings, and social gatherings with modern amenities and flexible spaces.</p>
                </div>
              </div>
              
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Sports & Recreation</h4>
                  <p>Basketball court, volleyball court, and other sports amenities for physical fitness and recreational activities for students and staff.</p>
                </div>
              </div>
              
              <div className="facility-card">
                <div className="facility-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="facility-content">
                  <h4>Cafeteria & Dining</h4>
                  <p>Clean and comfortable dining area with affordable meals, snacks, and beverages to fuel students throughout their academic day.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="aboutus-footer">
        <Footer />
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default AboutUs;

