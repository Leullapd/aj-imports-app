import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TermsOfUse.css';

const TermsOfUse = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTermsOfUse();
  }, []);

  const fetchTermsOfUse = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/terms-of-use/public');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        setError('Failed to load Terms of Use');
      }
    } catch (error) {
      console.error('Error fetching Terms of Use:', error);
      setError('Error loading Terms of Use');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="terms-of-use-page">
        <div className="loading">Loading Terms of Use...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terms-of-use-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="terms-of-use-page">
      <div className="terms-header">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        <h1>Terms of Use</h1>
      </div>

      <div className="terms-content">
        <div 
          className="terms-body"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      <div className="terms-footer">
        <p>&copy; 2024 AJ Import. All rights reserved.</p>
      </div>
    </div>
  );
};

export default TermsOfUse;
