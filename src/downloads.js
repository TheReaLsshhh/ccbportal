import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import './downloads.css';

const Downloads = () => {
  const [isPoliciesVisible, setIsPoliciesVisible] = useState(false);
  const [isFormsVisible, setIsFormsVisible] = useState(false);

  const handleDownload = (fileName, fileType) => {
    // Placeholder function for download functionality
    alert(`Downloading ${fileName} (${fileType})`);
  };

  // Intersection Observer for policies section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsPoliciesVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const policiesElement = document.querySelector('.policies-grid');
    if (policiesElement) {
      observer.observe(policiesElement);
    }

    return () => {
      if (policiesElement) {
        observer.unobserve(policiesElement);
      }
    };
  }, []);

  // Intersection Observer for forms section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsFormsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const formsElement = document.querySelector('.forms-grid');
    if (formsElement) {
      observer.observe(formsElement);
    }

    return () => {
      if (formsElement) {
        observer.unobserve(formsElement);
      }
    };
  }, []);

  return (
    <div className="App downloads-page">
      <Navbar />

      {/* Downloads Hero Section */}
      <section className="news-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Downloads</h1>
            <p className="hero-subtitle">Find all the recent downloads and resources at City College of Bayawan</p>
            <p className="hero-motto">Explore our updated files, helpful guides, and important downloads</p>
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section id="forms" className="section forms-section">
        <div className="container">
          <h2 className="section-title">Forms</h2>
          <p className="section-subtitle">Download essential forms for enrollment, clearance, leave, and other academic processes</p>
          
          <div className="downloads-grid">
            <div className="download-category">
              <div className="category-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h3>Enrollment</h3>
              <p className="category-description">These relate to student registration and academic load:</p>
              <div className="download-links">
                <button 
                  className="download-link"
                  onClick={() => handleDownload('Enrollment Load Form', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>Enrollment Load Form</strong>
                  </div>
                </button>
                <button 
                  className="download-link"
                  onClick={() => handleDownload('Load Slip', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>Load Slip</strong>
                  </div>
                </button>
              </div>
            </div>

            <div className="download-category">
              <div className="category-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3>Clearance</h3>
              <p className="category-description">These are likely used for approvals or exits:</p>
              <div className="download-links">
                <button 
                  className="download-link"
                  onClick={() => handleDownload('COPC Compilation', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>COPC Compilation</strong>
                  </div>
                </button>
                <button 
                  className="download-link"
                  onClick={() => handleDownload('EF Continuing', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>EF Continuing</strong>
                  </div>
                </button>
              </div>
            </div>

            <div className="download-category">
              <div className="category-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3>Request</h3>
              <p className="category-description">These involve formal requests or documentation:</p>
              <div className="download-links">
                <button 
                  className="download-link"
                  onClick={() => handleDownload('Request Slip', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>Request Slip</strong>
                  </div>
                </button>
              </div>
            </div>

            <div className="download-category">
              <div className="category-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Shift / Change</h3>
              <p className="category-description">Used for schedule or program adjustments:</p>
              <div className="download-links">
                <button 
                  className="download-link"
                  onClick={() => handleDownload('Shift Form', 'PDF')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM12 2v12l4-4h-3V2h-2v8H8l4 4z"/>
                  </svg>
                  <div className="download-link-content">
                    <strong>Shift Form</strong>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HR Policies and Downloadable Forms Section (moved from Faculty & Staff) */}
      <section className="faculty-staff-section hr-section">
        <div className="container">
          <h2 className="section-title">HR Policies and Downloadable Forms</h2>
          <p className="section-subtitle">Access important HR documents, policies, and forms for faculty and staff</p>
          
          <div className="hr-content">
            <div className={`policies-grid ${isPoliciesVisible ? 'fade-in-visible' : ''}`}>
              <div className="policy-card">
                <div className="policy-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M16 13H8"/>
                    <path d="M16 17H8"/>
                    <path d="M10 9H8"/>
                  </svg>
                </div>
                <h3>Employee Handbook</h3>
                <p>Comprehensive guide containing all employment policies, benefits, and procedures.</p>
                <button className="download-btn">Download PDF</button>
              </div>
              
              <div className="policy-card">
                <div className="policy-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3>Code of Ethics</h3>
                <p>Standards of professional conduct and ethical guidelines for all employees.</p>
                <button className="download-btn">Download PDF</button>
              </div>
              
              <div className="policy-card">
                <div className="policy-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3>Leave Policies</h3>
                <p>Comprehensive information about vacation, sick leave, and other leave types.</p>
                <button className="download-btn">Download PDF</button>
              </div>
            </div>
            
            <div className="forms-section">
              <h3>Downloadable Forms</h3>
              <div className={`forms-grid ${isFormsVisible ? 'fade-in-visible' : ''}`}>
                <div className="form-card">
                  <h4>Leave Request Form</h4>
                  <p>Submit requests for vacation, sick leave, or other types of leave.</p>
                  <button className="form-btn">Download Form</button>
                </div>
                
                <div className="form-card">
                  <h4>Travel Authorization</h4>
                  <p>Request authorization for official travel and conferences.</p>
                  <button className="form-btn">Download Form</button>
                </div>
                
                <div className="form-card">
                  <h4>Expense Reimbursement</h4>
                  <p>Submit expense reports for reimbursement of work-related expenses.</p>
                  <button className="form-btn">Download Form</button>
                </div>
                
                <div className="form-card">
                  <h4>Performance Evaluation</h4>
                  <p>Annual performance evaluation forms for faculty and staff.</p>
                  <button className="form-btn">Download Form</button>
                </div>
                
                <div className="form-card">
                  <h4>Professional Development</h4>
                  <p>Request approval for professional development activities and training.</p>
                  <button className="form-btn">Download Form</button>
                </div>
                
                <div className="form-card">
                  <h4>Change of Information</h4>
                  <p>Update personal information, contact details, or emergency contacts.</p>
                  <button className="form-btn">Download Form</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Syllabi, Manuals, and Handbooks Section */}
      <section id="documents" className="section documents-section">
        <div className="container">
          <h2 className="section-title">Syllabi, Manuals, and Handbooks</h2>
          <p className="section-subtitle">Access comprehensive academic resources, guidelines, and reference materials</p>
          
          <div className="downloads-grid">
            {/* Content will be added here when available */}
          </div>
        </div>
      </section>

      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Downloads;