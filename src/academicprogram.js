import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './academicprogram.css';

const AcademicPrograms = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch academic programs
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

  return (
    <div className="App academic-page nav-animations-complete">
      <SEO
        title="Academic Programs"
        description="Explore our comprehensive academic programs at City College of Bayawan. Discover degree programs in Business Administration, Information Technology, Education, and Hospitality Management."
        keywords="academic programs, degree programs, college courses, Business Administration, Information Technology, Education, Hospitality Management"
        url="/academics"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Hero Section */}
      <section className={`academics-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Academic Programs</h1>
            <p className="hero-subtitle">Begin your journey to academic excellence at City College of Bayawan</p>
            <p className="hero-motto">Empowering learners through excellence, innovation, and service</p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="academics-navigation">
        <div className="container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Degree Programs
            </button>
            <button 
              className={`nav-tab ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum & Courses
            </button>
            <button 
              className={`nav-tab ${activeTab === 'careers' ? 'active' : ''}`}
              onClick={() => setActiveTab('careers')}
            >
              Career Prospects
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="section-academics academics-section">
        <div className="container">
          <div className="academics-content">
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading programs...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-secondary">
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Overview Tab Content */}
                {activeTab === 'overview' && (
                  <div className="tab-content fade-in-visible">
                    <h2 className="section-title">Our Degree Programs</h2>
                    <p className="section-subtitle">Choose from our diverse selection of undergraduate programs</p>
                    
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
                            <div className="program-meta">
                              <div className="meta-row">
                                <span className="meta-label">Duration:</span>
                                <span className="meta-value">{program.duration_text}</span>
                              </div>
                              <div className="meta-row">
                                <span className="meta-label">Units:</span>
                                <span className="meta-value">{program.units_text}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Curriculum Tab Content */}
                {activeTab === 'curriculum' && (
                  <div className="tab-content fade-in-visible">
                    <h2 className="section-title">Course Outlines</h2>
                    <p className="section-subtitle">Comprehensive curriculum designed for industry readiness</p>
                    
                    <div className="curriculum-list">
                      {programs.map((program) => (
                        <div key={program.id} className="detail-card">
                          <h3>{program.title}</h3>
                          <div className="card-section">
                            <h4>Program Overview</h4>
                            <p>{program.program_overview || 'Program overview details will be available soon.'}</p>
                          </div>
                          <div className="card-section">
                            <h4>Core Courses</h4>
                            <ul className="check-list">
                              {program.core_courses && program.core_courses.length > 0 ? (
                                program.core_courses.map((course, index) => (
                                  <li key={index}>{course}</li>
                                ))
                              ) : (
                                <li>Core course details will be available soon.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Careers Tab Content */}
                {activeTab === 'careers' && (
                  <div className="tab-content fade-in-visible">
                    <h2 className="section-title">Career Opportunities</h2>
                    <p className="section-subtitle">Pathways to your professional future</p>
                    
                    <div className="careers-list">
                      {programs.map((program) => (
                        <div key={program.id} className="detail-card">
                          <h3>{program.title}</h3>
                          <div className="card-section">
                            <h4>Career Prospects</h4>
                            <ul className="check-list">
                              {program.career_prospects && program.career_prospects.split('\n').filter(item => item.trim()).length > 0 ? (
                                program.career_prospects.split('\n').filter(item => item.trim()).map((prospect, index) => (
                                  <li key={index}>{prospect.trim()}</li>
                                ))
                              ) : (
                                <li>Career prospects information will be available soon.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="section-cta">
              <Link to="/admissions" className="btn btn-primary">Apply Now</Link>
            </div>

          </div>
        </div>
      </section>
      
      <div className="footer-section-academics">
        <Footer />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default AcademicPrograms;
