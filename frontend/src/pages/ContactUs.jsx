import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContactUs.css';

const ContactUs = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContactUs();
  }, []);

  const fetchContactUs = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.CONTACT_US/public');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        setError('Failed to load Contact Information');
      }
    } catch (error) {
      console.error('Error fetching Contact Us:', error);
      setError('Error loading Contact Information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="contact-us-page">
        <div className="loading">Loading Contact Information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contact-us-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="contact-us-page">
      <div className="contact-header">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Contact Us</h1>
      </div>

      <div className="contact-content">
        <div 
          className="contact-body"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      <div className="contact-footer">
        <p>&copy; 2024 AJ Import. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ContactUs;
