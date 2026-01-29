import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './academicprogram.css';

const AcademicPrograms = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescriptionsVisible, setIsDescriptionsVisible] = useState(false);

  // Fetch academic programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAcademicPrograms();
        if (response.status === 'success') {
          setPrograms(response.programs);
        } else {
          setError('Failed to load programs');
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

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

  // Intersection Observer for descriptions section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsDescriptionsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const descriptionsElement = document.querySelector('.descriptions-content');
    if (descriptionsElement) {
      observer.observe(descriptionsElement);
    }

    return () => {
      if (descriptionsElement) {
        observer.unobserve(descriptionsElement);
      }
    };
  }, [programs]); // Re-run when programs are loaded

  return (
    <div className="App academic-page nav-animations-complete">
      <SEO
        title="Academic Programs"
        description="Explore our comprehensive academic programs at City College of Bayawan. Discover degree programs in Business Administration, Information Technology, Education, and Hospitality Management with detailed course information and career prospects."
        keywords="academic programs, degree programs, college courses, Business Administration, Information Technology, Education, Hospitality Management, City College of Bayawan programs"
        url="/academics"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Academic Programs Hero Section */}
      <section className={`academics-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Academic Programs</h1>
            <p className="hero-subtitle">Begin your journey to academic excellence at City College of Bayawan</p>
            <p className="hero-motto">Empowering learners through excellence, innovation, and service</p>
          </div>
        </div>
      </section>

      {/* List of Degree Programs Section */}
      <section className="academics-section programs-list-section">
        <div className="container">
          <h2 className="section-title">List of Degree Programs</h2>
          <p className="section-subtitle">Choose from our diverse selection of undergraduate programs</p>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading programs...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Try Again
              </button>
            </div>
          ) : (
            <div className="programs-grid">
              {programs.map((program) => (
                <div key={program.id} className="program-card">
                  <div className="program-icon">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                  </div>
                  <h3>{program.title}</h3>
                  <div className="program-details">
                    <p className="program-description">{program.description}</p>
                    <div className="program-duration">
                      <span className="duration-label">Duration:</span>
                      <span className="duration-value">{program.duration_text}</span>
                    </div>
                    <div className="program-units">
                      <span className="units-label">Total Units:</span>
                      <span className="units-value">{program.units_text}</span>
                    </div>
                    <div className="program-enhancements">
                      <span className="enhancements-label">Enhancements:</span>
                      <span className="enhancements-value">{program.enhancements_text}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Program Descriptions and Course Outlines Section */}
      <section className="academics-section descriptions-section">
        <div className="container">
          <h2 className="section-title">Program Descriptions & Course Outlines</h2>
          <p className="section-subtitle">Detailed information about each program's curriculum and learning outcomes</p>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading program details...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className={`descriptions-content ${isDescriptionsVisible ? 'fade-in-visible' : ''}`}>
              {programs.map((program) => (
                <div key={`desc-${program.id}`} className="description-card">
                  <h3>{program.title}</h3>
                  <div className="description-details">
                    <div className="program-overview">
                      <h4>Program Overview</h4>
                      <p>{program.program_overview || 'Program overview details will be available soon.'}</p>
                    </div>
                    <div className="core-courses">
                      <h4>Core Courses</h4>
                      <ul>
                        {program.core_courses && program.core_courses.length > 0 ? (
                          program.core_courses.map((course, index) => (
                            <li key={index}>{course}</li>
                          ))
                        ) : (
                          <li>Core course details will be available soon.</li>
                        )}
                      </ul>
                    </div>
                    <div className="career-prospects">
                      <h4>Career Prospects</h4>
                      <ul>
                        {program.career_prospects && program.career_prospects.split('\n').filter(item => item.trim()) && program.career_prospects.split('\n').filter(item => item.trim()).length > 0 ? (
                          program.career_prospects.split('\n').filter(item => item.trim()).map((prospect, index) => (
                            <li key={index}>{prospect.trim()}</li>
                          ))
                        ) : (
                          <li>Career prospects information will be available soon.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      <div className="academic-footer">
        <Footer />
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default AcademicPrograms;
