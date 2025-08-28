import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>AJ Import</h3>
          <p>Order together, import smartly. Join group orders and save big on imported items.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-of-use">Terms of Use</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/contact-us">Contact Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Contact Info</h4>
          <p>📧 info@ajimport.com</p>
          <p>📞 +251 112-23-34-45</p>
          <p>📞 +251 112-23-44-45</p>
          <p>💬 Telegram/WhatsApp</p>
        </div>
        
        <div className="footer-section">
          <h4>Newsletter</h4>
          <div className="newsletter">
            <input type="email" placeholder="Enter your email" />
            <button>Subscribe</button>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 AJ Import. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 