import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/api';
import './PremiumCampaigns.css';

const PremiumCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ongoing');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Automotive', 'Health & Beauty', 'Toys', 'Food & Beverages', 'Other'
  ];

  const statusOptions = [
    { value: 'ongoing', label: 'Ongoing Campaigns' },
    { value: 'upcoming', label: 'Upcoming Campaigns' },
    { value: 'completed', label: 'Completed Campaigns' }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory, selectedStatus, currentPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage,
        limit: 12
      });
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`${API_ENDPOINTS.PREMIUM_CAMPAIGNS}?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCampaign = async (campaignId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Navigate directly to the premium order page
    navigate(`/premium-order/${campaignId}`);
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
      <div className="premium-campaigns-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading premium campaigns...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="premium-campaigns-page">
      <Header />
      
      <div className="premium-campaigns-container">
        <div className="premium-campaigns-header">
          <div className="header-content">
            <h1>🚀 Premium Campaigns</h1>
            <p>Exclusive fast-shipping campaigns with air cargo delivery</p>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="campaigns-content">
          {campaigns.length > 0 ? (
            <div className="campaigns-grid">
              {campaigns.map(campaign => (
                <div key={campaign._id} className="premium-campaign-card">
                  <div className="campaign-image">
                    <img 
                      src={`${API_ENDPOINTS.BASE_URL}/${campaign.image}`} 
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
                        <span className="price-label">Original Price:</span>
                        <span className="original-price">{formatPrice(campaign.originalPrice)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Premium Price:</span>
                        <span className="premium-price">{formatPrice(campaign.premiumPrice)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Shipping + Air Cargo:</span>
                        <span className="shipping-price">
                          {formatPrice(campaign.shippingCost + campaign.airCargoCost)}
                        </span>
                      </div>
                    </div>

                    <div className="campaign-details">
                      <div className="detail-row">
                        <span>📅 Duration:</span>
                        <span>{campaign.shippingDuration} days</span>
                      </div>
                      <div className="detail-row">
                        <span>👥 Participants:</span>
                        <span>{campaign.currentParticipants}</span>
                      </div>
                      {campaign.totalQuantity && (
                        <div className="detail-row">
                          <span>📦 Quantity:</span>
                          <span>{campaign.remainingQuantity || campaign.totalQuantity - campaign.orderedQuantity} remaining</span>
                        </div>
                      )}
                      {campaign.totalQuantity && (
                        <div className="quantity-progress-section">
                          <div className="quantity-info">
                            <span>Ordered: {campaign.orderedQuantity || 0}</span>
                            <span>Total: {campaign.totalQuantity}</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${campaign.quantityProgress || Math.round(((campaign.orderedQuantity || 0) / campaign.totalQuantity) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <div className="detail-row">
                        <span>📅 Start:</span>
                        <span>{formatDate(campaign.startDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span>📅 End:</span>
                        <span>{formatDate(campaign.endDate)}</span>
                      </div>
                    </div>

                    {campaign.benefits && campaign.benefits.length > 0 && (
                      <div className="benefits-section">
                        <h4>✨ Benefits:</h4>
                        <ul>
                          {campaign.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="campaign-actions">
                      <Link 
                        to={`/premium-campaigns/${campaign._id}`}
                        className="view-details-btn"
                      >
                        View Details
                      </Link>
                      
                      {campaign.isOngoing && !campaign.isFull && (
                        <button 
                          className="join-campaign-btn"
                          onClick={() => handleJoinCampaign(campaign._id)}
                        >
                          🚀 Order Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-campaigns">
              <div className="no-campaigns-content">
                <h3>No Premium Campaigns Found</h3>
                <p>No premium campaigns found matching your criteria.</p>
                <button onClick={() => navigate('/')} className="browse-home-btn">
                  Browse Home Page
                </button>
              </div>
            </div>
          )}

          {pagination && pagination.total > 1 && (
            <div className="pagination">
              {pagination.hasPrev && (
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="pagination-btn"
                >
                  Previous
                </button>
              )}
              
              <span className="page-info">
                Page {pagination.current} of {pagination.total}
              </span>
              
              {pagination.hasNext && (
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="pagination-btn"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PremiumCampaigns;
