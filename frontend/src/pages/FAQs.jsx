import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FAQs.css';

const FAQs = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/faqs/public');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        setError('Failed to load FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Error loading FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="faqs-page">
        <div className="loading">Loading FAQs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="faqs-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="faqs-page">
      <div className="faqs-header">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Frequently Asked Questions</h1>
      </div>

      <div className="faqs-content">
        <div 
          className="faqs-body"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      <div className="faqs-footer">
        <p>&copy; 2024 AJ Import. All rights reserved.</p>
      </div>
    </div>
  );
};

export default FAQs;
