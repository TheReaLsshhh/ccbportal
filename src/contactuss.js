import React, { useState, useEffect } from 'react';
import './contactuss.css';
import Navbar from './components/Navbar';
import Footer from './components/footer';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';

const ContactUs = () => {
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Animation state
  const [isMapContainerVisible, setIsMapContainerVisible] = useState(false);

  // Input sanitization function (for submission, not real-time)
  const sanitizeInput = (value, maxLength = null, allowSpaces = true) => {
    if (!value) return '';
    // Remove null bytes and control characters (preserve spaces and newlines)
    let sanitized = String(value);
    // Remove null bytes and control characters (except newlines)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // Trim only leading/trailing whitespace (not spaces in the middle)
    sanitized = sanitized.trim();
    // Limit length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Minimal sanitization in real-time (preserve spaces for name and message)
    let sanitizedValue = value;
    if (name === 'name') {
      // Only remove dangerous control chars, preserve spaces
      sanitizedValue = String(value).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitizedValue.length > 200) {
        sanitizedValue = sanitizedValue.substring(0, 200);
      }
    } else if (name === 'email') {
      // Remove dangerous chars and convert to lowercase
      sanitizedValue = String(value).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').toLowerCase();
      if (sanitizedValue.length > 254) {
        sanitizedValue = sanitizedValue.substring(0, 254);
      }
    } else if (name === 'phone') {
      // Remove dangerous chars
      sanitizedValue = String(value).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitizedValue.length > 20) {
        sanitizedValue = sanitizedValue.substring(0, 20);
      }
    } else if (name === 'subject') {
      // Remove dangerous chars
      sanitizedValue = String(value).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitizedValue.length > 100) {
        sanitizedValue = sanitizedValue.substring(0, 100);
      }
    } else if (name === 'message') {
      // Allow newlines and spaces in message, but sanitize other control chars
      sanitizedValue = String(value).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      if (sanitizedValue.length > 5000) {
        sanitizedValue = sanitizedValue.substring(0, 5000);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear error when user starts typing
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const sanitizedName = sanitizeInput(formData.name, 200);
    const sanitizedEmail = sanitizeInput(formData.email, 254).toLowerCase();
    const sanitizedPhone = sanitizeInput(formData.phone, 20);
    const sanitizedSubject = sanitizeInput(formData.subject, 100);
    const sanitizedMessage = sanitizeInput(formData.message, 5000);
    
    // Validate required fields
    if (!sanitizedName || !sanitizedEmail || !sanitizedMessage || !sanitizedSubject) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitStatus("error");
      return;
    }
    
    // Validate name length
    if (sanitizedName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      setSubmitStatus("error");
      return;
    }
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setSubmitStatus("error");
      return;
    }
    
    // Validate message length
    if (sanitizedMessage.length < 10) {
      setErrorMessage('Message must be at least 10 characters long.');
      setSubmitStatus("error");
      return;
    }
    
    // Validate subject
    const allowedSubjects = ['admissions', 'academics', 'student-services', 'faculty', 'general', 'complaint', 'suggestion', 'other'];
    if (!allowedSubjects.includes(sanitizedSubject)) {
      setErrorMessage('Please select a valid subject.');
      setSubmitStatus("error");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('');
    setErrorMessage('');
  
    try {
      // Prepare sanitized data
      const sanitizedData = {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        message: sanitizedMessage
      };
      
      const response = await fetch(`${API_BASE}/api/contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });
      
      let result = {};
      try {
        result = await response.json();
      } catch (_) {}

      if (response.ok && result.status === "success") {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          setSubmitStatus("");
        }, 10000);
      } else {
        // Handle specific error cases
        if (response.status === 429) {
          const retryAfter = result.retry_after || 60;
          const minutes = Math.floor(retryAfter / 60);
          setErrorMessage(result.message || `Too many submissions. Please try again in ${minutes} minutes.`);
        } else if (response.status === 413) {
          setErrorMessage('Message too long. Please reduce the size of your message.');
        } else {
          const msg = (result && (result.message || result.detail)) || response.statusText || 'Unknown error';
          setErrorMessage(msg);
        }
        setSubmitStatus("error");
      }
    } catch (error) {
      setErrorMessage(error?.message || 'Network error. Please check your connection and try again.');
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Intersection Observer for map-container section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsMapContainerVisible(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation 50px before element comes into view
      }
    );

    const mapContainerElement = document.querySelector('.map-container');
    if (mapContainerElement) {
      observer.observe(mapContainerElement);
    }

    return () => {
      if (mapContainerElement) {
        observer.unobserve(mapContainerElement);
      }
    };
  }, []);

  return (
    <div className="App contactus-page nav-animations-complete">
      <SEO
        title="Contact Us"
        description="Get in touch with City College of Bayawan. Find our address, phone numbers, email addresses, office hours, and location. Send us a message or visit our campus in Bayawan City, Negros Oriental."
        keywords="contact City College of Bayawan, CCB contact, Bayawan City college contact, college address, college phone number, college email"
        url="/contact"
      />
      <ScrollToTop />
      <Navbar isHomePage={true} />
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Contact Us</h1>
            <p className="hero-subtitle">Get in touch with City College of Bayawan</p>
            <p className="hero-motto">Excellence in Education, Service to the Community</p>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-content">
            {/* Contact Information Cards */}
            <div className="contact-info-section">
              <h2>Get In Touch</h2>
              <div className="contact-cards">
                <div className="contact-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <h3>Address</h3>
                  <p>City College of Bayawan<br />
                  Government Center, Banga, Bayawan City<br />
                  Negros Oriental<br/>(035) 430-0263<br />
                  Philippines 6221</p>
                </div>

                <div className="contact-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <h3>Phone</h3>
                  {/* Phone Numbers */}
                  <p>Main Office: (035) xxx-xxxx<br />
                  Registrar: (035) xxx-xxxx<br />
                  Student Affairs: (035) xxx-xxx</p>
                </div>

                <div className="contact-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <h3>Email</h3>
                  <p className='ccbemail'>citycollegeofbayawan<br/>@gmail.com<br /></p>
                  <p className='registraremail'>ccbregistrar@gmail.com<br /></p>
                </div>

                <div className="contact-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3>Office Hours</h3>
                  <p>Monday - Friday:<br/>8:00 AM - 5:00 PM<br />
                  Saturday: Closed<br />
                  Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="admissions">Admissions Inquiry</option>
                      <option value="academics">Academic Programs</option>
                      <option value="student-services">Student Services</option>
                      <option value="faculty">Faculty & Staff</option>
                      <option value="general">General Information</option>
                      <option value="complaint">Complaint</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    placeholder="Enter your message here..."
                  ></textarea>
                </div>

                {submitStatus === 'success' && (
                  <div className="form-message success">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Thank you! Your message has been sent successfully.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="form-message error">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Sorry, there was an error sending your message. {errorMessage ? `(${errorMessage})` : 'Please try again.'}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <h2>Find Us</h2>
            <div className={`map-container ${isMapContainerVisible ? 'fade-in-visible' : ''}`}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9748.767870023932!2d122.79048882158217!3d9.385277212274497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33ac93001a7a1fdd%3A0xbc6a4b9b655068bd!2sCity%20College%20of%20Bayawan!5e1!3m2!1sen!2sph!4v1760407443690!5m2!1sen!2sph" 
                width="100%" 
                height="450" 
                style={{border: 0}} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="City College of Bayawan Location"
              ></iframe>
            </div>  
          </div>
        </div>
      </section>


      <div className="contactus-footer">
        <Footer />
      </div>
      
    </div>
  );
};

export default ContactUs;
