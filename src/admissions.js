import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './admissions.css';

const Admissions = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRequirementsNoteVisible, setIsRequirementsNoteVisible] = useState(false);
  const [isProcessTimelineVisible, setIsProcessTimelineVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('new-scholar');
  const [admissionsData, setAdmissionsData] = useState({
    requirements: {},
    processSteps: {},
    notes: []
  });
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('Admissions data state updated:', admissionsData);
    console.log('Selected category:', selectedCategory);
    console.log('Process steps for category:', admissionsData.processSteps?.[selectedCategory]);
  }, [admissionsData, selectedCategory]);
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

  // Intersection Observer for requirements-note section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRequirementsNoteVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const requirementsNoteElement = document.querySelector('.requirements-note');
    if (requirementsNoteElement) {
      observer.observe(requirementsNoteElement);
    }

    return () => {
      if (requirementsNoteElement) {
        observer.unobserve(requirementsNoteElement);
      }
    };
  }, []);

  // Intersection Observer for process-timeline section
  // Re-run when data changes or category changes to catch the element when it's rendered
  useEffect(() => {
    // Reset visibility when category or data changes
    setIsProcessTimelineVisible(false);
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsProcessTimelineVisible(true);
            }
          });
        },
        {
          threshold: 0.1, // Trigger when 10% of the element is visible
          rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
        }
      );

      const processTimelineElement = document.querySelector('.process-timeline');
      if (processTimelineElement) {
        observer.observe(processTimelineElement);
        // If element is already in viewport, trigger immediately
        const rect = processTimelineElement.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInViewport) {
          setIsProcessTimelineVisible(true);
        }
      }

      return () => {
        if (processTimelineElement) {
          observer.unobserve(processTimelineElement);
        }
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [admissionsData.processSteps, selectedCategory, loading]);

  // Fetch admissions data
  useEffect(() => {
    const fetchAdmissionsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getAdmissionsInfo();
        
        console.log('Admissions data received:', data); // Debug log
        
        // Use process_steps_by_category if available, otherwise group from flat list
        let processStepsByCategory = {};
        
        // First, try to use the grouped data from backend
        if (data.process_steps_by_category && typeof data.process_steps_by_category === 'object') {
          processStepsByCategory = data.process_steps_by_category;
          console.log('Using process_steps_by_category from API:', processStepsByCategory); // Debug log
        }
        
        // Also check if we have a flat list and need to group it (or if grouped data is empty)
        if (data.process_steps && Array.isArray(data.process_steps) && data.process_steps.length > 0) {
          // Check if grouped data has any steps, if not, group from flat list
          const hasGroupedSteps = Object.values(processStepsByCategory).some(steps => Array.isArray(steps) && steps.length > 0);
          
          if (!hasGroupedSteps) {
            console.log('Grouped data empty, grouping from flat list:', data.process_steps); // Debug log
            data.process_steps.forEach(step => {
              const category = step.category || 'new-scholar';
              if (!processStepsByCategory[category]) {
                processStepsByCategory[category] = [];
              }
              processStepsByCategory[category].push(step);
            });
          }
        }
        
        console.log('Final processStepsByCategory:', processStepsByCategory); // Debug log
        console.log('Steps for new-scholar:', processStepsByCategory['new-scholar']); // Debug log
        
        setAdmissionsData({
          requirements: data.requirements || {},
          processSteps: processStepsByCategory,
          notes: data.notes || []
        });
      } catch (err) {
        console.error('Error fetching admissions data:', err);
        setError('Failed to load admissions information. Please try again later.');
        // Set default/fallback data
        setAdmissionsData({
          requirements: {},
          processSteps: {},
          notes: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissionsData();
  }, []);

  return (
    <div className="App admissions-page nav-animations-complete">
      <SEO
        title="Admissions"
        description="Begin your journey at City College of Bayawan. Find complete admission requirements, enrollment process steps, and important dates for new and continuing students. Apply now for quality education."
        keywords="admissions, enrollment, application, requirements, City College of Bayawan admission, how to apply, college admission process"
        url="/admissions"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Admissions Hero Section */}
      <section className={`admissions-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Admissions</h1>
            <p className="hero-subtitle">Begin your journey to academic excellence at City College of Bayawan</p>
            <p className="hero-motto">Your future starts here with quality education and endless opportunities</p>
          </div>
        </div>
      </section>

      {/* Admissions Navigation Tabs */}
      <section className="admissions-navigation">
        <div className="container">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${selectedCategory === 'new-scholar' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('new-scholar')}
            >
              New Student (Scholar)
            </button>
            <button 
              className={`nav-tab ${selectedCategory === 'new-non-scholar' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('new-non-scholar')}
            >
              New Student (Non-Scholar)
            </button>
            <button 
              className={`nav-tab ${selectedCategory === 'continuing-scholar' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('continuing-scholar')}
            >
              Continuing Student (Scholar)
            </button>
            <button 
              className={`nav-tab ${selectedCategory === 'continuing-non-scholar' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('continuing-non-scholar')}
            >
              Continuing Student (Non-Scholar)
            </button>
          </div>
        </div>
      </section>

      {/* Admissions Section */}
      <section className="section-admissions admissions-section">
        <div className="container">
          
          <div className="admissions-content">
            {/* Requirements Section */}
            <div className="requirements-section">
              <h2>Admission Requirements</h2>
              <p className="section-subtitle">Complete requirements and qualifications for enrollment at City College of Bayawan</p>
              
              <div className="requirements-content">
                <div className="general-requirements">
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <p>Loading requirements...</p>
                    </div>
                  ) : error ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                      <p>{error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Dynamic Requirements by Category */}
                      {selectedCategory && admissionsData.requirements[selectedCategory] && admissionsData.requirements[selectedCategory].length > 0 && (
                        <div className="enrollment-requirements">
                          <h4>
                            {selectedCategory === 'new-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Scholarship)'}
                            {selectedCategory === 'new-non-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Non-Scholarship)'}
                            {selectedCategory === 'continuing-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF CONTINUING STUDENTS (Scholarship)'}
                            {selectedCategory === 'continuing-non-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF CONTINUING STUDENTS (Non-Scholarship)'}
                          </h4>
                          <ul>
                            {admissionsData.requirements[selectedCategory].map((req, index) => {
                              // If requirement_text contains newlines, split and display as list items
                              const requirementLines = req.text ? req.text.split('\n').filter(line => line.trim()) : [];
                              if (requirementLines.length > 1) {
                                // Multiple lines - display each as a list item with checkmark
                                return requirementLines.map((line, lineIndex) => {
                                  const lineText = line.trim();
                                  // Remove existing checkmark if present to avoid duplicates
                                  const cleanText = lineText.startsWith('✓') ? lineText.substring(1).trim() : lineText;
                                  return (
                                    <li key={`${req.id || index}-${lineIndex}`}>
                                      <span className="requirement-checkmark">✓</span> {cleanText}
                                    </li>
                                  );
                                });
                              } else {
                                // Single line - display with checkmark
                                const reqText = req.text || '';
                                // Remove existing checkmark if present to avoid duplicates
                                const cleanText = reqText.startsWith('✓') ? reqText.substring(1).trim() : reqText;
                                return (
                                  <li key={req.id || index}>
                                    <span className="requirement-checkmark">✓</span> {cleanText}
                                  </li>
                                );
                              }
                            })}
                          </ul>
                        </div>
                      )}
                      
                      {/* Show message if no requirements for selected category */}
                      {selectedCategory && (!admissionsData.requirements[selectedCategory] || admissionsData.requirements[selectedCategory].length === 0) && (
                        <div className="enrollment-requirements">
                          <h4>
                            {selectedCategory === 'new-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Scholarship)'}
                            {selectedCategory === 'new-non-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Non-Scholarship)'}
                            {selectedCategory === 'continuing-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF CONTINUING STUDENTS (Scholarship)'}
                            {selectedCategory === 'continuing-non-scholar' && 'REQUIREMENTS FOR ENROLLMENT OF CONTINUING STUDENTS (Non-Scholarship)'}
                          </h4>
                          <p style={{ color: '#666', fontStyle: 'italic' }}>No requirements available for this category at this time.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Dynamic Notes */}
                {admissionsData.notes && admissionsData.notes.length > 0 && (
                  <div className={`requirements-note ${isRequirementsNoteVisible ? 'fade-in-visible' : ''}`}>
                    <div className="note-icon">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div className="note-content">
                      <h5>Important Notes:</h5>
                      <ul>
                        {admissionsData.notes.map((note, index) => (
                          <li key={note.id || index}>{note.text}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Process Section */}
            <div className="process-section">
              <h2>Enrollment Process</h2>
              <p className="section-subtitle">Follow these steps to apply for your chosen program</p>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading enrollment process...</p>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#dc3545' }}>
                  <p>{error}</p>
                </div>
              ) : (() => {
                // Get steps for selected category
                const currentSteps = admissionsData.processSteps?.[selectedCategory];
                
                // Debug logging
                console.log('Rendering Enrollment Process:', {
                  selectedCategory,
                  allProcessSteps: admissionsData.processSteps,
                  currentSteps,
                  stepsCount: currentSteps?.length || 0
                });
                
                // Check if we have steps for the selected category
                if (currentSteps && Array.isArray(currentSteps) && currentSteps.length > 0) {
                  // Always show the timeline - animation is optional
                  return (
                    <div className="process-timeline fade-in-visible">
                      {currentSteps.map((step, index) => (
                        <div key={step.id || `step-${index}`} className="timeline-item">
                          <div className="timeline-number">{step.step_number || index + 1}</div>
                          <div className="timeline-content">
                            <h4>{step.title || 'Untitled Step'}</h4>
                            <p dangerouslySetInnerHTML={{ 
                              __html: (step.description || 'No description available')
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#039;')
                                .replace(/\n/g, '<br />') 
                            }}></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Show helpful message
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      <p>No enrollment process steps available for this category at this time.</p>
                      <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#999' }}>
                        Please check back later or contact the admissions office for more information.
                      </p>
                    </div>
                  );
                }
              })()}
              
              <div className="section-cta">
                <Link to="/contact" className="btn btn-secondary">Contact Admissions Office</Link>
              </div>
            </div>


          </div>
        </div>
      </section>

      <div className="footer-section-admissions">
        <Footer />
      </div>        
      
      {/* Scroll to Top Button */}
      <ScrollToTop />

    </div>
  );
};

export default Admissions;

