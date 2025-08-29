import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TinyMCEEditor from '../components/TinyMCEEditor';
import { API_ENDPOINTS } from '../config/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeDocumentTab, setActiveDocumentTab] = useState('privacy-policy');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchDocumentContent(activeDocumentTab);
  }, [navigate, activeDocumentTab]);

  const fetchDocumentContent = async (documentType) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const endpoints = {
        'privacy-policy': `${API_ENDPOINTS.PRIVACY_POLICY}/admin`,
        'terms-of-use': `${API_ENDPOINTS.TERMS_OF_USE}/admin`,
        'faqs': `${API_ENDPOINTS.FAQS}/admin`,
        'contact-us': `${API_ENDPOINTS.CONTACT_US}/admin`
      };

      const response = await fetch(endpoints[documentType], {
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
        console.error(`Failed to fetch ${documentType}`);
      }
    } catch (error) {
      console.error(`Error fetching ${documentType}:`, error);
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

      const endpoints = {
        'privacy-policy': `${API_ENDPOINTS.PRIVACY_POLICY}/admin`,
        'terms-of-use': `${API_ENDPOINTS.TERMS_OF_USE}/admin`,
        'faqs': `${API_ENDPOINTS.FAQS}/admin`,
        'contact-us': `${API_ENDPOINTS.CONTACT_US}/admin`
      };

      const response = await fetch(endpoints[activeDocumentTab], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: documentContent
        })
      });

      if (response.ok) {
        const documentName = getDocumentName(activeDocumentTab);
        setSaveMessage(`${documentName} saved successfully!`);
        setContent(documentContent);
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const documentName = getDocumentName(activeDocumentTab);
        setSaveMessage(`Failed to save ${documentName}`);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error(`Error saving ${activeDocumentTab}:`, error);
      const documentName = getDocumentName(activeDocumentTab);
      setSaveMessage(`Error saving ${documentName}`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const getDocumentName = (type) => {
    const names = {
      'privacy-policy': 'Privacy Policy',
      'terms-of-use': 'Terms of Use',
      'faqs': 'FAQs',
      'contact-us': 'Contact Us'
    };
    return names[type] || 'Document';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDocumentContent(activeDocumentTab);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDocumentTabChange = (tab) => {
    setActiveDocumentTab(tab);
    setIsLoading(true);
  };

  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  if (isLoading) {
    return (
      <div className="admin-settings">
        <div className="loading">Loading Settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1 className="settings-title">Admin Settings</h1>
         
        </div>
        <button 
          className="refresh-button" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="settings-container">
        <div className="settings-content">
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
              {saveMessage}
            </div>
          )}

          <div className="settings-section">
            
            
            <div className="document-tabs">
              <div className="document-tab-nav">
                <button 
                  className={`document-tab ${activeDocumentTab === 'privacy-policy' ? 'active' : ''}`}
                  onClick={() => handleDocumentTabChange('privacy-policy')}
                >
                  📄 Privacy Policy
                </button>
                <button 
                  className={`document-tab ${activeDocumentTab === 'terms-of-use' ? 'active' : ''}`}
                  onClick={() => handleDocumentTabChange('terms-of-use')}
                >
                  📋 Terms of Use
                </button>
                <button 
                  className={`document-tab ${activeDocumentTab === 'faqs' ? 'active' : ''}`}
                  onClick={() => handleDocumentTabChange('faqs')}
                >
                  ❓ FAQs
                </button>
                <button 
                  className={`document-tab ${activeDocumentTab === 'contact-us' ? 'active' : ''}`}
                  onClick={() => handleDocumentTabChange('contact-us')}
                >
                  📞 Contact Us
                </button>
              </div>
              
              <div className="document-content">
             
                
                <div className="editor-container">
                  <TinyMCEEditor
                    onSave={handleSave}
                    initialContent={content}
                    height="600px"
                    readOnly={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
