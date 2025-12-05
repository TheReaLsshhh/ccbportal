import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave" aria-hidden="true">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layered waves for a smooth transition */}
          <path d="M0,0V46.29c47.79,22,103.59,32,158,28,70.36-5,136.69-33.65,207-38,73.61-4.58,147,17.58,218,35,69.6,17,138,29,209,26,36-.96,69.67-7.69,104-15.39C972.26,63.14,1047.14,42.8,1122.6,22.86,1148.4,16,1174.2,8,1200,0V0Z" opacity=".25" className="shape-fill-1"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,110.55,165,111,224.58,91.58c31.15-10.2,60.09-26.25,89.67-40.29C438.11,9.64,512.9-9.79,587.77,6.1c61.24,13.1,113.57,48.89,173.74,67.64,63.05,19.75,133.61,17.73,197.12-1.93,36.86-11.39,70.7-29.22,106.09-43.05C1091.93,13.2,1145.84,3.27,1200,0V0Z" opacity=".5" className="shape-fill-2"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.39,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48-4.24,167.53,14.29,59.66,20.53,113.2,54,173.39,73.36,70.24,22.76,142.31,24.21,215.64,5.11,13.09-3.43,26-7.54,39-11.61V0Z" className="shape-fill-3"></path>
        </svg>
      </div>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>City College of Bayawan</h3>
            <p>Honor and Excellence for the Highest Good</p>
            <p>Honus et Excellentia Ad Summum Bonum</p>
            <a href="/ccb-logo">CCB Logo</a>
          </div>
          <div className="footer-section">
            <h4>Contact Information</h4>
            <p> Bayawan City, Negros Oriental</p>
            <p> (035) XXX-XXXX</p>
            <p> info@ccb.edu.ph</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <a href="https://www.facebook.com/profile.php?id=61574582660823">
              <img src="/images/fblogo.png" alt="Facebook" className="social-icon" onError={(e) => { e.target.style.display = 'none'; }} /> City College of Bayawan Facebook Page
            </a>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/academics">Academic Programs</a>
            <a href="/admissions">Admissions</a>
            <a href="/news">News & Events</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 City College of Bayawan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;