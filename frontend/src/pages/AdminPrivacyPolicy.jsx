import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TinyMCEEditor from '../components/TinyMCEEditor';
import './AdminPrivacyPolicy.css';

const AdminPrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
    useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch('API_ENDPOINTS.PRIVACY_POLICY', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
      } else if (response.status === 404) {
        setContent('');
      } else {
        console.error('Failed to fetch privacy policy');
      }
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (documentContent) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch('API_ENDPOINTS.PRIVACY_POLICY', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: documentContent })
      });

      if (response.ok) {
        setSaveMessage('Document saved successfully!');
        setContent(documentContent); // Update local content
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save document');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setSaveMessage('Error saving document');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  if (isLoading) {
    return (
      <div className="admin-privacy-policy">
        <div className="loading">Loading Professional Document Editor...</div>
      </div>
    );
  }

  return (
    <div className="admin-privacy-policy">
      <div className="document-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1 className="document-title">Privacy Policy Document Editor</h1>
          <p className="document-subtitle">
            Professional document editor with full formatting capabilities
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      <div className="document-editor-container">
        <TinyMCEEditor
          onSave={handleSave}
          initialContent={content}
          height="700px"
          readOnly={false}
        />
      </div>

      <div className="document-footer">
        <div className="footer-info">
          <h3>Professional TinyMCE Editor Features:</h3>
          <ul>
            <li>✅ Full professional editor</li>
            <li>✅ Advanced formatting tools</li>
            <li>✅ Tables, images, and media</li>
            <li>✅ Image editing and resizing</li>
            <li>✅ Print and preview</li>
            <li>✅ Word count and statistics</li>
            <li>✅ Search and replace</li>
            <li>✅ Full-screen editing</li>
            <li>✅ Quick action bars</li>
            <li>✅ Accessibility features</li>
          </ul>
        </div>
        <p className="footer-note">
          💡 <strong>TinyMCE Professional Editor:</strong> This is a full-featured professional document editor 
          with all the capabilities of modern word processors. Use the toolbar above to format your Privacy Policy 
          with advanced features like tables, images, media, and more.
        </p>
      </div>
    </div>
  );
};

export default AdminPrivacyPolicy;
