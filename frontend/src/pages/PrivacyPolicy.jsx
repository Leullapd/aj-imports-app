import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
             const response = await fetch('API_ENDPOINTS.PRIVACY_POLICY/public');
      
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
      } else if (response.status === 404) {
        setContent('<div class="no-content"><h2>Privacy Policy</h2><p>No privacy policy has been published yet. Please check back later.</p></div>');
      } else {
        setError('Failed to load Privacy Policy');
      }
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
      setError('Error loading Privacy Policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="privacy-policy-page">
        <div className="loading">Loading Privacy Policy...</div>
      </div>
    );
  }

  return (
    <div className="privacy-policy-page">
      <div className="privacy-policy-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <h1>Privacy Policy</h1>
      </div>

      {error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPrivacyPolicy} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <div className="privacy-policy-content">
          <div 
            className="policy-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      <div className="privacy-policy-footer">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>For questions about this Privacy Policy, please contact us.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
