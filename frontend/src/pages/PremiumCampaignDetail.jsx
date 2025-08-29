import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/api';
import './PremiumCampaignDetail.css';

const PremiumCampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`API_ENDPOINTS.PREMIUM_CAMPAIGNS/${id}`);
      const data = await response.json();

      if (response.ok) {
        setCampaign(data);
      } else {
        setError(data.message || 'Failed to fetch campaign details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const calculateTotalCost = () => {
    if (!campaign) return 0;
    return campaign.premiumPrice + campaign.shippingCost + campaign.airCargoCost;
  };

  if (loading) {
    return (
      <div className="premium-campaign-detail-page">
        <Header />
        <div className="loading-container">
          <div className="loading">Loading campaign details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="premium-campaign-detail-page">
        <Header />
        <div className="error-container">
          <div className="error-message">
            {error || 'Campaign not found'}
          </div>
          <Link to="/premium-campaigns" className="back-link">
            ← Back to Premium Campaigns
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="premium-campaign-detail-page">
      <Header />
      
      <div className="campaign-detail-container">
        <div className="breadcrumb">
          <Link to="/premium-campaigns">← Back to Premium Campaigns</Link>
        </div>

        <div className="campaign-detail-content">
          <div className="campaign-image-section">
            <div className="campaign-image-container">
              <img 
                src={`${API_ENDPOINTS.BASE_URL}/${campaign.image}`} 
                alt={campaign.title}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
              {getStatusBadge(campaign)}
            </div>
          </div>

          <div className="campaign-info-section">
            <div className="campaign-header">
              <h1>{campaign.title}</h1>
              <div className="campaign-category">
                <span className="category-badge">{campaign.category}</span>
              </div>
            </div>

            <div className="campaign-description">
              <h3>Description</h3>
              <p>{campaign.description}</p>
            </div>

            <div className="pricing-section">
              <h3>Pricing Details</h3>
              <div className="price-cards">
                <div className="price-card original">
                  <h4>Original Price</h4>
                  <div className="price">{formatPrice(campaign.originalPrice)}</div>
                  <p>Regular market price</p>
                </div>
                <div className="price-card premium">
                  <h4>Premium Price</h4>
                  <div className="price">{formatPrice(campaign.premiumPrice)}</div>
                  <p>Special campaign price</p>
                </div>
                <div className="price-card shipping">
                  <h4>Shipping & Air Cargo</h4>
                  <div className="price">{formatPrice(campaign.shippingCost + campaign.airCargoCost)}</div>
                  <p>Fast delivery service</p>
                </div>
              </div>
              <div className="total-cost">
                <h4>Total Cost</h4>
                <div className="total-price">{formatPrice(calculateTotalCost())}</div>
              </div>
            </div>

            <div className="campaign-details">
              <h3>Campaign Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">📅 Start Date:</span>
                  <span className="value">{formatDate(campaign.startDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">📅 End Date:</span>
                  <span className="value">{formatDate(campaign.endDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">🚚 Shipping Duration:</span>
                  <span className="value">{campaign.shippingDuration} days</span>
                </div>
                <div className="detail-item">
                  <span className="label">👥 Participants:</span>
                  <span className="value">{campaign.currentParticipants}</span>
                </div>
                {campaign.totalQuantity && (
                  <div className="detail-item">
                    <span className="label">📦 Quantity:</span>
                    <span className="value">{campaign.remainingQuantity || campaign.totalQuantity - campaign.orderedQuantity} remaining</span>
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
                <div className="detail-item">
                  <span className="label">⭐ Campaign Type:</span>
                  <span className="value">Premium Fast Shipping</span>
                </div>
                <div className="detail-item">
                  <span className="label">✈️ Delivery Method:</span>
                  <span className="value">Air Cargo</span>
                </div>
              </div>
            </div>

            {campaign.benefits && campaign.benefits.length > 0 && (
              <div className="benefits-section">
                <h3>✨ Benefits</h3>
                <ul className="benefits-list">
                  {campaign.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {campaign.requirements && campaign.requirements.length > 0 && (
              <div className="requirements-section">
                <h3>📋 Requirements</h3>
                <ul className="requirements-list">
                  {campaign.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="campaign-actions">
              {(() => {
                const now = new Date();
                const startDate = new Date(campaign.startDate);
                const endDate = new Date(campaign.endDate);
                
                if (campaign.isCompleted) {
                  return (
                    <div className="campaign-completed">
                      <p>✅ This campaign has been completed</p>
                    </div>
                  );
                } else if (now < startDate) {
                  return (
                    <div className="campaign-upcoming">
                      <p>⏰ This campaign starts on {formatDate(campaign.startDate)}</p>
                    </div>
                  );
                } else if (now >= startDate && now <= endDate) {
                  if (campaign.isFull) {
                    return (
                      <div className="campaign-full">
                        <p>❌ This campaign is full</p>
                      </div>
                    );
                  } else {
                    return (
                      <Link 
                        to={`/premium-order/${campaign._id}`}
                        className="order-now-btn"
                      >
                        🚀 Order Now
                      </Link>
                    );
                  }
                } else {
                  return (
                    <div className="campaign-ended">
                      <p>⏰ This campaign has ended</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PremiumCampaignDetail;
