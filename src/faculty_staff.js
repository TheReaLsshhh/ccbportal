import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import SEO from './components/SEO';
import apiService from './services/api';
import './faculty_staff.css';

const FacultyStaff = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState(null);

  // Animation states
  const [isResourceCardsVisible, setIsResourceCardsVisible] = useState(false);
  const [isAdminCardsVisible, setIsAdminCardsVisible] = useState(false);
  const [isDepartmentsVisible, setIsDepartmentsVisible] = useState(false);

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

  // Load departments data
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        console.log('Loading departments...');
        const response = await apiService.getDepartments();
        console.log('Departments API response:', response);
        console.log('Response status:', response.status);
        console.log('Departments array:', response.departments);
        
        if (response.status === 'success' && Array.isArray(response.departments)) {
          console.log('Departments loaded successfully:', response.departments.length, 'departments');
          console.log('Setting departments state:', response.departments);
          setDepartments(response.departments);
        } else {
          console.error('Invalid response format:', response);
          setDepartmentsError('Failed to load departments data.');
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
        console.error('Error details:', error.message, error.stack);
        setDepartmentsError('Failed to load departments data.');
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, []);

  // Intersection Observer for departments-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsDepartmentsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
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
  }, [departments]);

  // Intersection Observer for resources-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsResourceCardsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const resourcesGridElement = document.querySelector('.resources-grid');
    if (resourcesGridElement) {
      observer.observe(resourcesGridElement);
    }

    return () => {
      if (resourcesGridElement) {
        observer.unobserve(resourcesGridElement);
      }
    };
  }, []);

  // Intersection Observer for admin-grid section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAdminCardsVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const adminGridElement = document.querySelector('.admin-grid');
    if (adminGridElement) {
      observer.observe(adminGridElement);
    }

    return () => {
      if (adminGridElement) {
        observer.unobserve(adminGridElement);
      }
    };
  }, []);

  return (
    <div className="App faculty-staff-page nav-animations-complete">
      <SEO
        title="Faculty & Staff Portal"
        description="Resources and information for faculty and administrative staff at City College of Bayawan. Access department directory, teaching resources, administrative systems, and support services."
        keywords="faculty portal, staff portal, faculty resources, teaching resources, administrative systems, department directory, City College of Bayawan faculty"
        url="/faculty"
      />
      <Navbar isTopBarVisible={isTopBarVisible} isHomePage={true} />
      
      {/* Faculty & Staff Page Header */}
      <section className="faculty-staff-header">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Faculty & Staff Portal</h1>
            <p className="hero-subtitle">Essential resources and information for faculty and administrative staff</p>
            <p className="hero-motto">Supporting Excellence in Teaching and Administration</p>
          </div>
        </div>
      </section>

      {/* Directory of Departments and Personnel Section */}
      <section className="faculty-staff-section directory-section">
        <div className="container">
          <h2 className="section-title">Directory of Departments and Personnel</h2>
          <p className="section-subtitle">Find contact information for all academic departments and administrative offices</p>
          
          <div className="directory-content">
            {loadingDepartments ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading departments...</p>
              </div>
            ) : departmentsError ? (
              <div className="error-container">
                <p className="error-message">{departmentsError}</p>
              </div>
            ) : departments.length === 0 ? (
              <div className="empty-state-container">
                <p>No departments available.</p>
              </div>
            ) : (
              <div className={`departments-grid ${isDepartmentsVisible ? 'fade-in-visible' : ''}`}>
                {departments.map((department, index) => (
                  <div key={department.id} className="department-card">
                    <div className="department-icon">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                        {department.department_type === 'academic' ? (
                          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16z"/>
                        ) : (
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        )}
                      </svg>
                    </div>
                    <h3>{department.name}</h3>
                    <div className="department-info">
                      {department.head_name && (
                        <p><strong>{department.head_title || 'Head'}:</strong> {department.head_name}</p>
                      )}
                      {department.office_location && (
                        <p><strong>Office:</strong> {department.office_location}</p>
                      )}
                      {department.phone && (
                        <p><strong>Phone:</strong> {department.phone}</p>
                      )}
                      {department.email && (
                        <p><strong>Email:</strong> {department.email}</p>
                      )}
                    </div>
                    {department.personnel && department.personnel.length > 0 && (
                      <div className="faculty-list">
                        <h4>Faculty Members:</h4>
                        <ul>
                          {department.personnel.map((person) => (
                            <li key={person.id}>
                              {person.full_name} - {person.specialization || person.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Link to="/contact" className="contact-btn">Contact Department</Link>
                  </div>
                ))}
              </div>
            )}
            
            {/* Administrative Offices - Show only administrative departments */}
            {departments.filter(dept => dept.department_type === 'administrative').length > 0 && (
              <div className="administrative-offices">
                <h3>Administrative Offices</h3>
                <div className="offices-grid">
                  {departments
                    .filter(dept => dept.department_type === 'administrative')
                    .map((department) => (
                      <div key={department.id} className="office-card">
                        <h4>{department.name}</h4>
                        {department.head_name && (
                          <p><strong>{department.head_title || 'Head'}:</strong> {department.head_name}</p>
                        )}
                        {department.phone && (
                          <p><strong>Phone:</strong> {department.phone}</p>
                        )}
                        {department.email && (
                          <p><strong>Email:</strong> {department.email}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Resources for Teaching and Admin Staff Section */}
      <section className="faculty-staff-section resources-section">
        <div className="container">
          <h2 className="section-title">Resources for Teaching and Admin Staff</h2>
          <p className="section-subtitle">Essential tools, training materials, and support resources for faculty and administrative staff</p>
          
          <div className="resources-content">
            <div className="teaching-resources">
              <h3>Teaching Resources</h3>
              <div className={`resources-grid ${isResourceCardsVisible ? 'fade-in-visible' : ''}`}>
                <div className="resource-card">
                  <div className="resource-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                      <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/>
                    </svg>
                  </div>
                  <h4>Learning Management System</h4>
                  <p>Access to online course management tools and student engagement platforms.</p>
                  <ul>
                    <li>Course Creation Tools</li>
                    <li>Assignment Management</li>
                    <li>Grade Book</li>
                    <li>Discussion Forums</li>
                  </ul>
                  <button className="resource-btn">Access LMS</button>
                </div>
                
                <div className="resource-card">
                  <div className="resource-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                    </svg>
                  </div>
                  <h4>Library Resources</h4>
                  <p>Access to academic databases, journals, and research materials.</p>
                  <ul>
                    <li>Online Databases</li>
                    <li>E-Journals</li>
                    <li>Research Guides</li>
                    <li>Citation Tools</li>
                  </ul>
                  <button className="resource-btn">Access Library</button>
                </div>
                
                <div className="resource-card">
                  <div className="resource-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h4>Professional Development</h4>
                  <p>Training programs and workshops for continuous professional growth.</p>
                  <ul>
                    <li>Teaching Workshops</li>
                    <li>Technology Training</li>
                    <li>Research Methods</li>
                    <li>Leadership Development</li>
                  </ul>
                  <button className="resource-btn">View Programs</button>
                </div>
              </div>
            </div>
            
            <div className="admin-resources">
              <h3>Administrative Resources</h3>
              <div className={`admin-grid ${isAdminCardsVisible ? 'fade-in-visible' : ''}`}>
                <div className="admin-card">
                  <h4>Administrative Systems</h4>
                  <div className="admin-links">
                    <button className="admin-link" onClick={() => alert('Student Information System - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Student Information System
                    </button>
                    <button className="admin-link" onClick={() => alert('Financial Management System - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Financial Management System
                    </button>
                    <button className="admin-link" onClick={() => alert('Inventory Management - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Inventory Management
                    </button>
                    <button className="admin-link" onClick={() => alert('Facility Booking System - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Facility Booking System
                    </button>
                  </div>
                </div>
                
                <div className="admin-card">
                  <h4>Communication Tools</h4>
                  <div className="admin-links">
                    <button className="admin-link" onClick={() => alert('Email System - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      Email System
                    </button>
                    <button className="admin-link" onClick={() => alert('Video Conferencing - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                      Video Conferencing
                    </button>
                    <button className="admin-link" onClick={() => alert('Internal Messaging - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                      Internal Messaging
                    </button>
                    <button className="admin-link" onClick={() => alert('Announcement Portal - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Announcement Portal
                    </button>
                  </div>
                </div>
                
                <div className="admin-card">
                  <h4>Support Services</h4>
                  <div className="admin-links">
                    <button className="admin-link" onClick={() => alert('IT Support - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      IT Support
                    </button>
                    <button className="admin-link" onClick={() => alert('Facilities Maintenance - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16z"/>
                      </svg>
                      Facilities Maintenance
                    </button>
                    <button className="admin-link" onClick={() => alert('Security Services - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                      Security Services
                    </button>
                    <button className="admin-link" onClick={() => alert('Emergency Procedures - Coming Soon')}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Emergency Procedures
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    
      <div className="faculty-staff-footer">
        <Footer />
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default FacultyStaff;

