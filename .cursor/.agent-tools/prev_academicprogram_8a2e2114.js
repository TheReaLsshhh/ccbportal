import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import './academicprogram.css';

const AcademicPrograms = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  return (
    <div className="App">
      <Navbar isTopBarVisible={isTopBarVisible} />
      
      {/* Academic Programs Hero Section */}
      <section className={`admissions-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Academic Programs</h1>
            <p className="hero-subtitle">Begin your journey to academic excellence at City College of Bayawan</p>
            <p className="hero-motto">Your future starts here with quality education and endless opportunities</p>
          </div>
        </div>
      </section>

      {/* List of Degree Programs Section */}
      <section className="academics-section programs-list-section">
        <div className="container">
          <h2 className="section-title">List of Degree Programs</h2>
          <p className="section-subtitle">Choose from our diverse selection of undergraduate programs</p>
          
          <div className="programs-grid">
            <div className="program-card">
              <div className="program-icon">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3>Bachelor of Science in Business Administration</h3>
              <div className="program-details">
                <p className="program-description">Develop essential business skills and knowledge for leadership roles in various industries.</p>
                <div className="program-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-value">4 Years</span>
                </div>
                <div className="program-units">
                  <span className="units-label">Total Units:</span>
                  <span className="units-value">124 Units</span>
                </div>
              </div>
            </div>

            <div className="program-card">
              <div className="program-icon">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3>Bachelor of Science in Information Technology</h3>
              <div className="program-details">
                <p className="program-description">Master the latest technologies and prepare for careers in the digital world.</p>
                <div className="program-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-value">4 Years</span>
                </div>
                <div className="program-units">
                  <span className="units-label">Total Units:</span>
                  <span className="units-value">120 Units</span>
                </div>
              </div>
            </div>

            <div className="program-card">
              <div className="program-icon">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13L3.74 11 12 6.82 20.26 11 12 16z"/>
                </svg>
              </div>
              <h3>Bachelor of Science in Education</h3>
              <div className="program-details">
                <p className="program-description">Shape the future by becoming an educator and inspiring the next generation.</p>
                <div className="program-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-value">4 Years</span>
                </div>
                <div className="program-units">
                  <span className="units-label">Total Units:</span>
                  <span className="units-value">126 Units</span>
                </div>
              </div>
            </div>

            <div className="program-card">
              <div className="program-icon">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Bachelor of Science in Hospitality Management</h3>
              <div className="program-details">
                <p className="program-description">Excel in the dynamic world of hospitality and tourism management.</p>
                <div className="program-duration">
                  <span className="duration-label">Duration:</span>
                  <span className="duration-value">4 Years</span>
                </div>
                <div className="program-units">
                  <span className="units-label">Total Units:</span>
                  <span className="units-value">122 Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Descriptions and Course Outlines Section */}
      <section className="academics-section descriptions-section">
        <div className="container">
          <h2 className="section-title">Program Descriptions & Course Outlines</h2>
          <p className="section-subtitle">Detailed information about each program's curriculum and learning outcomes</p>
          
          <div className="descriptions-content">
            <div className="description-card">
              <h3>Bachelor of Science in Business Administration</h3>
              <div className="description-details">
                <div className="program-overview">
                  <h4>Program Overview</h4>
                  <p>The BSBA program prepares students for managerial and leadership positions in various business sectors. Students develop critical thinking, analytical skills, and practical business knowledge through comprehensive coursework and hands-on experiences.</p>
                </div>
                <div className="core-courses">
                  <h4>Core Courses</h4>
                  <ul>
                    <li>Financial Management and Analysis</li>
                    <li>Marketing Management and Strategy</li>
                    <li>Human Resource Management</li>
                    <li>Operations and Supply Chain Management</li>
                    <li>Business Ethics and Corporate Governance</li>
                    <li>Strategic Management</li>
                    <li>Entrepreneurship and Innovation</li>
                    <li>International Business</li>
                  </ul>
                </div>
                <div className="career-prospects">
                  <h4>Career Prospects</h4>
                  <p>Graduates can pursue careers as business managers, financial analysts, marketing specialists, HR professionals, entrepreneurs, and consultants in various industries.</p>
                </div>
              </div>
            </div>

            <div className="description-card">
              <h3>Bachelor of Science in Information Technology</h3>
              <div className="description-details">
                <div className="program-overview">
                  <h4>Program Overview</h4>
                  <p>The BSIT program focuses on the practical application of technology in solving business problems. Students learn programming, database management, network administration, and emerging technologies.</p>
                </div>
                <div className="core-courses">
                  <h4>Core Courses</h4>
                  <ul>
                    <li>Programming Fundamentals and Data Structures</li>
                    <li>Database Design and Management</li>
                    <li>Web Development and Technologies</li>
                    <li>Network Administration and Security</li>
                    <li>Software Engineering and Project Management</li>
                    <li>Mobile Application Development</li>
                    <li>Cybersecurity and Information Assurance</li>
                    <li>Artificial Intelligence and Machine Learning</li>
                  </ul>
                </div>
                <div className="career-prospects">
                  <h4>Career Prospects</h4>
                  <p>Graduates can work as software developers, system administrators, database administrators, web developers, cybersecurity specialists, and IT consultants.</p>
                </div>
              </div>
            </div>

            <div className="description-card">
              <h3>Bachelor of Science in Education</h3>
              <div className="description-details">
                <div className="program-overview">
                  <h4>Program Overview</h4>
                  <p>The BSEd program prepares future educators with strong pedagogical skills, subject matter expertise, and the ability to inspire and guide students in their learning journey.</p>
                </div>
                <div className="core-courses">
                  <h4>Core Courses</h4>
                  <ul>
                    <li>Educational Psychology and Child Development</li>
                    <li>Curriculum Development and Assessment</li>
                    <li>Teaching Methods and Strategies</li>
                    <li>Classroom Management and Discipline</li>
                    <li>Educational Technology and Innovation</li>
                    <li>Special Education and Inclusive Teaching</li>
                    <li>Research in Education</li>
                    <li>Student Teaching and Practicum</li>
                  </ul>
                </div>
                <div className="career-prospects">
                  <h4>Career Prospects</h4>
                  <p>Graduates can become elementary or secondary school teachers, curriculum developers, educational administrators, guidance counselors, and educational consultants.</p>
                </div>
              </div>
            </div>

            <div className="description-card">
              <h3>Bachelor of Science in Hospitality Management</h3>
              <div className="description-details">
                <div className="program-overview">
                  <h4>Program Overview</h4>
                  <p>The BSHM program combines theoretical knowledge with practical training in hospitality operations, preparing students for leadership roles in the tourism and hospitality industry.</p>
                </div>
                <div className="core-courses">
                  <h4>Core Courses</h4>
                  <ul>
                    <li>Hotel Operations and Management</li>
                    <li>Food and Beverage Service Management</li>
                    <li>Tourism Planning and Development</li>
                    <li>Event Management and Planning</li>
                    <li>Hospitality Marketing and Sales</li>
                    <li>Front Office Operations</li>
                    <li>Hospitality Law and Ethics</li>
                    <li>Internship and On-the-Job Training</li>
                  </ul>
                </div>
                <div className="career-prospects">
                  <h4>Career Prospects</h4>
                  <p>Graduates can work in hotels, resorts, restaurants, event planning companies, tourism boards, and cruise lines as managers, coordinators, and specialists.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admission Requirements Section */}
      <section className="academics-section admission-requirements-section">
        <div className="container">
          <h2 className="section-title">Admission Requirements per Program</h2>
          <p className="section-subtitle">Specific requirements and qualifications for each academic program</p>
          
          <div className="requirements-content">
            <div className="general-requirements">
              <h3>General Admission Requirements</h3>
              <div className="requirements-grid">
                <div className="requirement-category">
                  <div className="category-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M16 13H8"/>
                      <path d="M16 17H8"/>
                      <path d="M10 9H8"/>
                    </svg>
                  </div>
                  <h4>Application Documents</h4>
                  <ul>
                    <li>Completed Application Form (2 copies)</li>
                    <li>High School Diploma or Equivalent</li>
                    <li>Official Transcript of Records</li>
                    <li>Certificate of Good Moral Character</li>
                  </ul>
                </div>
                
                <div className="requirement-category">
                  <div className="category-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h4>Medical & Identification</h4>
                  <ul>
                    <li>Medical Certificate (Physical Examination)</li>
                    <li>2x2 ID Pictures (4 copies)</li>
                    <li>Birth Certificate (NSO/PSA)</li>
                    <li>Valid Government ID</li>
                  </ul>
                </div>
                
                <div className="requirement-category">
                  <div className="category-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h4>Additional Requirements</h4>
                  <ul>
                    <li>Certificate of Residency</li>
                    <li>Parent/Guardian Consent Form</li>
                    <li>Application Fee Receipt</li>
                    <li>Interview Schedule Confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="program-specific-requirements">
              <h3>Program-Specific Requirements</h3>
              <div className="specific-requirements-grid">
                <div className="specific-req-card">
                  <h4>Business Administration</h4>
                  <ul>
                    <li>Minimum GPA of 2.5 in high school</li>
                    <li>Pass the entrance examination</li>
                    <li>Basic mathematics proficiency test</li>
                    <li>English proficiency assessment</li>
                  </ul>
                </div>

                <div className="specific-req-card">
                  <h4>Information Technology</h4>
                  <ul>
                    <li>Strong background in mathematics</li>
                    <li>Basic computer literacy test</li>
                    <li>Logical reasoning assessment</li>
                    <li>Pass the IT aptitude exam</li>
                  </ul>
                </div>

                <div className="specific-req-card">
                  <h4>Education</h4>
                  <ul>
                    <li>Minimum GPA of 2.75 in high school</li>
                    <li>Pass the LET readiness exam</li>
                    <li>Communication skills assessment</li>
                    <li>Teaching aptitude evaluation</li>
                  </ul>
                </div>

                <div className="specific-req-card">
                  <h4>Hospitality Management</h4>
                  <ul>
                    <li>Customer service orientation test</li>
                    <li>Basic English communication skills</li>
                    <li>Personality and attitude assessment</li>
                    <li>Pass the hospitality aptitude exam</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="requirements-note">
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
      </section>

      {/* Application Process Section */}
      <section className="academics-section application-process-section">
        <div className="container">
          <h2 className="section-title">Application Process</h2>
          <p className="section-subtitle">Follow these steps to apply for your chosen program</p>
          
          <div className="process-timeline">
            <div className="timeline-item">
              <div className="timeline-number">1</div>
              <div className="timeline-content">
                <h4>Choose Your Program</h4>
                <p>Review program descriptions and select the degree program that aligns with your career goals and interests.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">2</div>
              <div className="timeline-content">
                <h4>Prepare Requirements</h4>
                <p>Gather all required documents including transcripts, certificates, and identification documents.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">3</div>
              <div className="timeline-content">
                <h4>Submit Application</h4>
                <p>Complete the application form and submit it along with all required documents to the Admissions Office.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">4</div>
              <div className="timeline-content">
                <h4>Take Entrance Exam</h4>
                <p>Attend the scheduled entrance examination and program-specific assessments.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">5</div>
              <div className="timeline-content">
                <h4>Interview & Evaluation</h4>
                <p>Participate in the interview process and await evaluation results from the admissions committee.</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-number">6</div>
              <div className="timeline-content">
                <h4>Enrollment</h4>
                <p>Upon acceptance, complete enrollment procedures and begin your academic journey at CCB.</p>
              </div>
            </div>
          </div>
          
          <div className="section-cta">
            <a href="/admissions" className="btn btn-primary">Apply Now</a>
            <a href="/contact" className="btn btn-secondary">Contact Admissions Office</a>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default AcademicPrograms;
