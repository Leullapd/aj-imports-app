import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './AdminPremiumCampaigns.css';
import './Admin.css';

const AdminPremiumCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    originalPrice: '',
    premiumPrice: '',
    shippingCost: '',
    airCargoCost: '',
    totalQuantity: '',
    startDate: '',
    endDate: '',
    shippingDeadline: '',
    shippingDuration: '2',
    requirements: '',
    benefits: '',
    image: null
  });

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Automotive', 'Health & Beauty', 'Toys', 'Food & Beverages', 'Other'
  ];

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchCampaigns();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.admin-profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/premium-campaigns', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns || []);
      } else {
        setError(data.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'requirements' || key === 'benefits') {
          const values = formData[key].split('\n').filter(item => item.trim());
          formDataToSend.append(key, JSON.stringify(values));
        } else if (key === 'image' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== 'image') {
          formDataToSend.append(key, formData[key]);
        }
      });

      const url = editingCampaign 
        ? `http://localhost:5000/api/premium-campaigns/${editingCampaign._id}`
        : 'http://localhost:5000/api/premium-campaigns';

      const response = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingCampaign ? 'Campaign updated successfully!' : 'Campaign created successfully!');
        setShowCreateForm(false);
        setEditingCampaign(null);
        resetForm();
        fetchCampaigns();
      } else {
        setError(data.message || 'Failed to save campaign');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      originalPrice: campaign.originalPrice.toString(),
      premiumPrice: campaign.premiumPrice.toString(),
      shippingCost: campaign.shippingCost.toString(),
      airCargoCost: campaign.airCargoCost.toString(),
      totalQuantity: campaign.totalQuantity ? campaign.totalQuantity.toString() : '',
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: new Date(campaign.endDate).toISOString().split('T')[0],
      shippingDeadline: campaign.shippingDeadline ? new Date(campaign.shippingDeadline).toISOString().split('T')[0] : '',
      shippingDuration: campaign.shippingDuration.toString(),
      requirements: campaign.requirements.join('\n'),
      benefits: campaign.benefits.join('\n'),
      image: null
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/premium-campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        alert('Campaign deleted successfully!');
        fetchCampaigns();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Electronics',
      originalPrice: '',
      premiumPrice: '',
      shippingCost: '',
      airCargoCost: '',
      totalQuantity: '',
      startDate: '',
      endDate: '',
      shippingDeadline: '',
      shippingDuration: '2',
      requirements: '',
      benefits: '',
      image: null
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const getStatusBadge = (campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    if (campaign.isCompleted) {
      return <span className="status-badge completed">Completed</span>;
    } else if (now < startDate) {
      return <span className="status-badge upcoming">Upcoming</span>;
    } else if (now >= startDate && now <= endDate) {
      if (campaign.isFull) {
        return <span className="status-badge full">Full</span>;
      } else {
        return <span className="status-badge ongoing">Active</span>;
      }
    } else {
      return <span className="status-badge ended">Ended</span>;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>Premium Campaigns</h1>
          </div>
          <div className="admin-profile-dropdown">
            <div className="admin-profile-avatar" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
              <span className="admin-avatar">👨‍💼</span>
              <span className="admin-name">Admin</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {profileDropdownOpen && (
              <div className="admin-dropdown-menu">
                <button className="dropdown-item" onClick={() => navigate('/admin/profile')}>
                  ✏️ Edit Profile
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="loading">Loading premium campaigns...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Premium Campaigns</h1>
        </div>
        <div className="admin-profile-dropdown">
          <div className="admin-profile-avatar" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
            <span className="admin-avatar">👨‍💼</span>
            <span className="admin-name">Admin</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          {profileDropdownOpen && (
            <div className="admin-dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate('/admin/profile')}>
                ✏️ Edit Profile
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="admin-premium-campaigns-container">
        <div className="campaigns-header">
          <h2>Manage Premium Campaigns</h2>
          <button 
            className="create-campaign-btn"
            onClick={() => {
              setShowCreateForm(true);
              setEditingCampaign(null);
              resetForm();
            }}
          >
            + Create Premium Campaign
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showCreateForm && (
          <div className="create-campaign-form">
            <h3>{editingCampaign ? 'Edit Premium Campaign' : 'Create New Premium Campaign'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Original Price (ETB) *</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Premium Price (ETB) *</label>
                  <input
                    type="number"
                    name="premiumPrice"
                    value={formData.premiumPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>

                             <div className="form-row">
                 <div className="form-group">
                   <label>Shipping Cost (ETB) *</label>
                   <input
                     type="number"
                     name="shippingCost"
                     value={formData.shippingCost}
                     onChange={handleInputChange}
                     required
                     min="0"
                     placeholder="Enter shipping cost"
                   />
                 </div>
                <div className="form-group">
                  <label>Air Cargo Cost (ETB) *</label>
                  <input
                    type="number"
                    name="airCargoCost"
                    value={formData.airCargoCost}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>

                                           <div className="form-row">
                 <div className="form-group">
                   <label>Total Quantity *</label>
                   <input
                     type="number"
                     name="totalQuantity"
                     value={formData.totalQuantity}
                     onChange={handleInputChange}
                     required
                     min="1"
                   />
                 </div>
                 <div className="form-group">
                   <label>Shipping Duration (days) *</label>
                   <input
                     type="number"
                     name="shippingDuration"
                     value={formData.shippingDuration}
                     onChange={handleInputChange}
                     required
                     min="1"
                     max="7"
                   />
                 </div>
               </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Shipping Deadline *</label>
                <input
                  type="date"
                  name="shippingDeadline"
                  value={formData.shippingDeadline}
                  onChange={handleInputChange}
                  required
                  min={formData.endDate} // Shipping deadline must be after campaign end date
                />
                <small>This is the deadline for shipping orders after the premium campaign ends</small>
              </div>

              <div className="form-group">
                <label>Requirements (one per line)</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter requirements, one per line..."
                />
              </div>

              <div className="form-group">
                <label>Benefits (one per line)</label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter benefits, one per line..."
                />
              </div>

              <div className="form-group">
                <label>Campaign Image *</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                  required={!editingCampaign}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowCreateForm(false);
                  setEditingCampaign(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="campaigns-grid">
          {campaigns.map(campaign => (
            <div key={campaign._id} className="premium-campaign-card">
              <div className="campaign-image">
                <img 
                  src={`http://localhost:5000/${campaign.image}`} 
                  alt={campaign.title}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                {getStatusBadge(campaign)}
              </div>

              <div className="campaign-content">
                <h3>{campaign.title}</h3>
                <p className="campaign-description">{campaign.description}</p>
                
                <div className="campaign-category">
                  <span className="category-badge">{campaign.category}</span>
                </div>

                <div className="price-section">
                  <div className="price-row">
                    <span>Original:</span>
                    <span className="original-price">{formatPrice(campaign.originalPrice)}</span>
                  </div>
                  <div className="price-row">
                    <span>Premium:</span>
                    <span className="premium-price">{formatPrice(campaign.premiumPrice)}</span>
                  </div>
                  <div className="price-row">
                    <span>Shipping + Air:</span>
                    <span className="shipping-price">
                      {formatPrice(campaign.shippingCost + campaign.airCargoCost)}
                    </span>
                  </div>
                </div>

                <div className="campaign-details">
                  <div className="detail-row">
                    <span>Duration:</span>
                    <span>{campaign.shippingDuration} days</span>
                  </div>
                  <div className="detail-row">
                    <span>Participants:</span>
                    <span>{campaign.currentParticipants}</span>
                  </div>
                  <div className="detail-row">
                    <span>Start:</span>
                    <span>{formatDate(campaign.startDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span>End:</span>
                    <span>{formatDate(campaign.endDate)}</span>
                  </div>
                </div>

                <div className="campaign-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(campaign)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(campaign._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && !loading && (
          <div className="no-campaigns">
            <p>No premium campaigns found. Create your first premium campaign!</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminPremiumCampaigns;
