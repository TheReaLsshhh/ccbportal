import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/footer';
import './CCBlogo.css';

const CCBlogo = () => {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Animation states
  const [isProfileCardVisible, setIsProfileCardVisible] = useState(false);
  const [isContactSectionVisible, setIsContactSectionVisible] = useState(false);
  const [isSealsSectionVisible, setIsSealsSectionVisible] = useState(false);
  const [isCcbLogoVisible, setIsCcbLogoVisible] = useState(false);
  const [isExplanationItemVisible, setIsExplanationItemVisible] = useState(false);

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

  // Intersection Observer for profile-card section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsProfileCardVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const profileCardElement = document.querySelector('.profile-card');
    if (profileCardElement) {
      observer.observe(profileCardElement);
    }

    return () => {
      if (profileCardElement) {
        observer.unobserve(profileCardElement);
      }
    };
  }, []);

  // Intersection Observer for contact-section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContactSectionVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const contactSectionElement = document.querySelector('.contact-section');
    if (contactSectionElement) {
      observer.observe(contactSectionElement);
    }

    return () => {
      if (contactSectionElement) {
        observer.unobserve(contactSectionElement);
      }
    };
  }, []);

  // Intersection Observer for seals-section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsSealsSectionVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const sealsSectionElement = document.querySelector('.seals-section');
    if (sealsSectionElement) {
      observer.observe(sealsSectionElement);
    }

    return () => {
      if (sealsSectionElement) {
        observer.unobserve(sealsSectionElement);
      }
    };
  }, []);

  // Intersection Observer for ccb-logo section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCcbLogoVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const ccbLogoElement = document.querySelector('.ccb-logo');
    if (ccbLogoElement) {
      observer.observe(ccbLogoElement);
    }

    return () => {
      if (ccbLogoElement) {
        observer.unobserve(ccbLogoElement);
      }
    };
  }, []);

  // Intersection Observer for explanation-item section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsExplanationItemVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const explanationItemElement = document.querySelector('.logo-explanation');
    if (explanationItemElement) {
      observer.observe(explanationItemElement);
    }

    return () => {
      if (explanationItemElement) {
        observer.unobserve(explanationItemElement);
      }
    };
  }, []);

  return (
    <div className="App ccb-logo-page">
      <Navbar isTopBarVisible={isTopBarVisible} />
      
      {/* CCB Logo Hero Section */}
      <section className={`ccb-hero ${!isTopBarVisible ? 'navbar-collapsed' : ''}`}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">CCB Logo</h1>
            <p className="hero-subtitle">Understanding the Symbolism of City College of Bayawan</p>
            <p className="hero-motto">Discover the meaning behind our institutional emblem</p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="section ccb-content-section">
        <div className="container">
          <div className="ccb-content">
            
            {/* Timeline Component */}
            <div className="timeline-container">
              <div className="timeline-line"></div>
              <div className="timeline-dot timeline-dot-1"></div>
              <div className="timeline-dot timeline-dot-2"></div>
              <div className="timeline-dot timeline-dot-3"></div>
              <div className="timeline-dot timeline-dot-4"></div>
            </div>
            
            {/* Left Column - Profile and Contact */}
            <div className="left-column">
              {/* Profile Card */}
              <div className={`profile-card ${isProfileCardVisible ? 'fade-in-visible' : ''}`}>
                <div className="profile-image">
                  <img src="/images/ccb-logo.png" alt="CCB President" className="profile-photo" loading="lazy" />
                </div>
                <div className="profile-info">
                  <h3>Dr. [President Name]</h3>
                  <p className="profile-title">University President</p>
                </div>
              </div>

              {/* Contact Us Section */}
              <div className={`contact-section ${isContactSectionVisible ? 'fade-in-visible' : ''}`}>
                <h4>Contact Us</h4>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <span>info@ccb.edu.ph</span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <span>(+63)(035) XXX-XXXX local 1000</span>
                </div>
              </div>

              {/* Official Seals */}
              <div className={`seals-section ${isSealsSectionVisible ? 'fade-in-visible' : ''}`}>
                <div className="seal-item">
                  <div className="seal-icon philippine-seal">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span>PHILIPPINE TRANSPARENCY SEAL</span>
                </div>
                <div className="seal-item">
                  <div className="seal-icon foi-seal">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <span>FREEDOM OF INFORMATION PHILIPPINES</span>
                </div>
              </div>
            </div>

            {/* Right Column - Logo and Explanation */}
            <div className="right-column">
              <div className="logo-section">
                <h2>CCB Logo</h2>
                <div className="logo-container">
                  <img src="/images/ccb-logo.png" alt="CCB Logo" className={`ccb-logo ${isCcbLogoVisible ? 'fade-in-visible' : ''}`} />
                </div>
                
                <div className={`logo-explanation ${isExplanationItemVisible ? 'fade-in-visible' : ''}`}>
                  <div className="explanation-item">
                    <h4>Circular Shape with Compass Points</h4>
                    <p>Represents unity, wholeness, and the college's role in guiding learners in all directions of life.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Outer Ring Text: "CITY COLLEGE OF BAYAWAN"</h4>
                    <p>Declares institutional identity and civic pride.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Roman Numerals "MMXXV" (2025)</h4>
                    <p>Marks the founding year, symbolizing a new chapter in Bayawan's educational journey.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Hands Holding a Torch</h4>
                    <p>Embodies enlightenment, the pursuit of truth, and the transformative power of education.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Flame</h4>
                    <p>Represents passion, wisdom, and the enduring light of learning.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Open Book</h4>
                    <p>Symbolizes knowledge, academic freedom, and the foundation of learning.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Gear</h4>
                    <p>Reflects industrial progress, technical education, and innovation.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Sun Over Water</h4>
                    <p>Highlights Bayawan's coastal geography and natural beauty, suggesting hope and vitality.</p>
                  </div>
                  
                  <div className="explanation-item">
                    <h4>Latin Motto: "Honus et Excellentia Ad Summum Bonum"</h4>
                    <p>"Honor and Excellence for the Highest Good"—a call to moral integrity and academic excellence in service of society.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default CCBlogo;
