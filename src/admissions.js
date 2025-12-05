import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import './admissions.css';

const Admissions = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isRequirementsNoteVisible, setIsRequirementsNoteVisible] = useState(false);
  const [isProcessTimelineVisible, setIsProcessTimelineVisible] = useState(false);

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
  useEffect(() => {
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
    }

    return () => {
      if (processTimelineElement) {
        observer.unobserve(processTimelineElement);
      }
    };
  }, []);

  return (
    <div className="App admissions-page">
      <Navbar isTopBarVisible={isTopBarVisible} />
      
      {/* Admissions Hero Section */}
      <section className={`news-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Admissions</h1>
            <p className="hero-subtitle">Begin your journey to academic excellence at City College of Bayawan</p>
            <p className="hero-motto">Your future starts here with quality education and endless opportunities</p>
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
                  
                  <div className="enrollment-requirements">
                    <h4>REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Scholarship)</h4>
                    <ul>
                      <li>✓ Accident Insurance with One (1) Year Coverage (Original and Photocopy)</li>
                      <li>✓ Form 138- SHS Report Card (Original copy)</li>
                      <li>✓ Certificate of GOOD MORAL CHARACTER (Original copy)</li>
                      <li>✓ PSA Birth Certificate (Photocopy)</li>
                      <li>✓ CLEAR COPY of 2x2 ID Picture with Name Tag & on a White Background (2pcs)</li>
                      <li>✓ One (1) Long-size Brown Expanded Envelope</li>
                    </ul>
                    <h4>REQUIREMENTS FOR ENROLLMENT OF NEW STUDENTS (Non-Scholarship)</h4>
                    <ul>
                      <li>✓ Official Receipt for Tuition and Fees</li>
                    </ul>
                  </div>

                  <div className="transferee-requirements">
                    <h4>REQUIREMENTS FOR ENROLLMENT OF TRANSFEREES</h4>
                    <ul>
                      <li>✓ Accident Insurance with One (1) Year Coverage (Original and Photocopy)</li>
                      <li>✓ Transcript of Records (TOR) (Original copy)</li>
                      <li>✓ Honorable Dismissal/Certificate of Transfer Credential (Original copy)</li>
                      <li>✓ Certificate of GOOD MORAL CHARACTER (Original copy)</li>
                      <li>✓ PSA Birth Certificate (Photocopy)</li>
                      <li>✓ CLEAR COPY of 2x2 ID Picture with Name Tag & on a White Background (2pcs)</li>
                      <li>✓ Accreditation of Subjects Form (Original copy)</li>
                      <li>✓ One (1) Long-size Brown Expanded Envelope</li>
                    </ul>
                  </div>
                </div>

                <div className={`requirements-note ${isRequirementsNoteVisible ? 'fade-in-visible' : ''}`}>
                  <div className="note-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="note-content">
                    <h5>Important Notes:</h5>
                    <ul>
                      <li>All documents must be original or certified true copies</li>
                      <li>Foreign documents must be authenticated by the Philippine Embassy</li>
                      <li>Application deadline: March 31, 2026 for Academic Year 2026-2027</li>
                      <li>Incomplete applications will not be processed</li>
                      <li>Entrance examination fee: ₱500.00 (non-refundable)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Process Section */}
            <div className="process-section">
              <h2>Enrollment Process</h2>
              <p className="section-subtitle">Follow these steps to apply for your chosen program</p>
              
              <div className={`process-timeline ${isProcessTimelineVisible ? 'fade-in-visible' : ''}`}>
                <div className="timeline-item">
                  <div className="timeline-number">1</div>
                  <div className="timeline-content">
                    <h4>Secure & Accomplish Enrollment Form</h4>
                    <p>Respective program head offices.</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-number">2</div>
                  <div className="timeline-content">
                    <h4>Subject Advising</h4>
                    <p>Respective program head offices.</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-number">3</div>
                  <div className="timeline-content">
                    <h4>Payment of School Fees (Non-Scholar)</h4>
                    <p>Proceed to Treasurer's Office (Note: Photocopy your OFFICIAL RECEIPT and submit together with the original copy for encoding.)</p>

                    <h4>Verification of Scholarship (Paglambo Scholar)</h4>
                    <p>Registrar`s Office</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-number">4</div>
                  <div className="timeline-content">
                    <h4>Submit Enrollment Load Form for Encoding of Subjects</h4>
                    <p>Registrar`s Office</p>
                  </div>
                </div>
                
                <div className="timeline-item">
                  <div className="timeline-number">5</div>
                  <div className="timeline-content">
                    <h4>Releasing of Enrollment Load Slip</h4>
                    <p>Registrar`s Office <br />
                    (Load Slip will be released during enrollment time only.)</p>
                  </div>
                </div>

              </div>
              
              <div className="section-cta">
                <a href="/contact" className="btn btn-secondary">Contact Admissions Office</a>
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

