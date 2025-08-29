import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
    useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch('API_ENDPOINTS.ANALYTICS/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="analytics-header">
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-analytics-page">
        <div className="analytics-header">
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-page">
      <div className="analytics-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
        <h1>Analytics Dashboard</h1>
        <button 
          onClick={fetchAnalytics} 
          disabled={refreshing}
          className={`refresh-btn ${refreshing ? 'loading' : ''}`}
        >
          <span className="refresh-icon">🔄</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {analytics && (
        <div className="analytics-container">
          {/* Campaign Analytics */}
          <div className="analytics-section">
            <h2>📊 Campaign Analytics</h2>
            <div className="campaign-stats-grid">
              <div className="stat-card">
                <h3>Total Campaigns</h3>
                <p className="stat-number">{analytics.campaignAnalytics.total}</p>
                <div className="stat-breakdown">
                  <span>Regular: {analytics.campaignAnalytics.regular.total}</span>
                  <span>Premium: {analytics.campaignAnalytics.premium.total}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Active Campaigns</h3>
                <p className="stat-number">
                  {analytics.campaignAnalytics.regular.active + analytics.campaignAnalytics.premium.active}
                </p>
                <div className="stat-breakdown">
                  <span>Regular: {analytics.campaignAnalytics.regular.active}</span>
                  <span>Premium: {analytics.campaignAnalytics.premium.active}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Completed Campaigns</h3>
                <p className="stat-number">
                  {analytics.campaignAnalytics.regular.completed + analytics.campaignAnalytics.premium.completed}
                </p>
                <div className="stat-breakdown">
                  <span>Regular: {analytics.campaignAnalytics.regular.completed}</span>
                  <span>Premium: {analytics.campaignAnalytics.premium.completed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Analytics */}
          <div className="analytics-section">
            <h2>💰 Revenue Analytics</h2>
            <div className="revenue-stats-grid">
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p className="stat-number">{formatCurrency(analytics.revenueAnalytics.total)}</p>
                <div className="stat-breakdown">
                  <span>Regular: {formatCurrency(analytics.revenueAnalytics.regular)}</span>
                  <span>Premium: {formatCurrency(analytics.revenueAnalytics.premium)}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Weekly Revenue</h3>
                <p className="stat-number">{formatCurrency(analytics.revenueAnalytics.weekly)}</p>
              </div>
              
              <div className="stat-card">
                <h3>Monthly Revenue</h3>
                <p className="stat-number">{formatCurrency(analytics.revenueAnalytics.monthly)}</p>
              </div>
              
              <div className="stat-card">
                <h3>Yearly Revenue</h3>
                <p className="stat-number">{formatCurrency(analytics.revenueAnalytics.yearly)}</p>
              </div>
            </div>
          </div>

          {/* User Analytics */}
          <div className="analytics-section">
            <h2>👥 User Analytics</h2>
            <div className="user-stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">{analytics.userAnalytics.total}</p>
              </div>
              
              <div className="stat-card">
                <h3>New Users (30 days)</h3>
                <p className="stat-number">{analytics.userAnalytics.newUsers}</p>
              </div>
              
              <div className="stat-card">
                <h3>Active Users</h3>
                <p className="stat-number">{analytics.userAnalytics.activeUsers}</p>
              </div>
              
              <div className="stat-card">
                <h3>Repeat Buyers</h3>
                <p className="stat-number">{analytics.userAnalytics.repeatBuyers}</p>
              </div>
              
              <div className="stat-card">
                <h3>Premium Users</h3>
                <p className="stat-number">{analytics.userAnalytics.premiumUsers}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="analytics-section">
            <h2>💳 Payment Breakdown</h2>
            <div className="payment-stats-grid">
              <div className="stat-card">
                <h3>Full Payments</h3>
                <p className="stat-number">
                  {analytics.paymentBreakdown.fullPayment.regular + analytics.paymentBreakdown.fullPayment.premium}
                </p>
                <div className="stat-breakdown">
                  <span>Regular: {analytics.paymentBreakdown.fullPayment.regular}</span>
                  <span>Premium: {analytics.paymentBreakdown.fullPayment.premium}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Installment Payments</h3>
                <p className="stat-number">
                  {analytics.paymentBreakdown.installment.regular + analytics.paymentBreakdown.installment.premium}
                </p>
                <div className="stat-breakdown">
                  <span>Regular: {analytics.paymentBreakdown.installment.regular}</span>
                  <span>Premium: {analytics.paymentBreakdown.installment.premium}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Campaigns */}
          <div className="analytics-section">
            <h2>🏆 Popular Campaigns</h2>
            <div className="campaigns-grid">
              <div className="campaign-list">
                <h3>Most Joined Campaigns</h3>
                <div className="campaign-items">
                  {analytics.popularCampaigns.map((campaign, index) => (
                    <div key={campaign.id} className="campaign-item">
                      <div className="campaign-rank">#{index + 1}</div>
                      <div className="campaign-info">
                        <h4>{campaign.title}</h4>
                        <div className="campaign-details">
                          <span className={`campaign-type ${campaign.type}`}>
                            {campaign.type === 'premium' ? '⭐ Premium' : '📦 Regular'}
                          </span>
                          <span className="campaign-status">{campaign.status}</span>
                        </div>
                      </div>
                      <div className="campaign-stats">
                        <div className="stat">
                          <span className="label">Orders:</span>
                          <span className="value">{campaign.orders}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Revenue:</span>
                          <span className="value">{formatCurrency(campaign.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="campaign-list">
                <h3>Top Revenue Campaigns</h3>
                <div className="campaign-items">
                  {analytics.topRevenueCampaigns.map((campaign, index) => (
                    <div key={campaign.id} className="campaign-item">
                      <div className="campaign-rank">#{index + 1}</div>
                      <div className="campaign-info">
                        <h4>{campaign.title}</h4>
                        <div className="campaign-details">
                          <span className={`campaign-type ${campaign.type}`}>
                            {campaign.type === 'premium' ? '⭐ Premium' : '📦 Regular'}
                          </span>
                          <span className="campaign-status">{campaign.status}</span>
                        </div>
                      </div>
                      <div className="campaign-stats">
                        <div className="stat">
                          <span className="label">Revenue:</span>
                          <span className="value">{formatCurrency(campaign.revenue)}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Orders:</span>
                          <span className="value">{campaign.orders}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Time Analytics */}
          <div className="analytics-section">
            <h2>⏰ Time-based Analytics</h2>
            <div className="time-analytics-grid">
              <div className="time-chart">
                <h3>Hourly Activity (When Users Join Campaigns)</h3>
                <div className="hourly-chart">
                  {analytics.timeAnalytics.hourlyActivity.map((count, hour) => (
                    <div key={hour} className="hour-bar">
                      <div 
                        className="bar" 
                        style={{ height: `${(count / Math.max(...analytics.timeAnalytics.hourlyActivity)) * 100}%` }}
                      ></div>
                      <span className="hour-label">{hour}:00</span>
                      <span className="count-label">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="time-chart">
                <h3>Daily Activity</h3>
                <div className="daily-chart">
                  {analytics.timeAnalytics.dailyActivity.map((count, day) => (
                    <div key={day} className="day-bar">
                      <div 
                        className="bar" 
                        style={{ height: `${(count / Math.max(...analytics.timeAnalytics.dailyActivity)) * 100}%` }}
                      ></div>
                      <span className="day-label">{getDayName(day)}</span>
                      <span className="count-label">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="analytics-section">
            <h2>🔄 Recent Activity</h2>
            <div className="recent-activity-grid">
              <div className="recent-orders">
                <h3>Recent Orders</h3>
                <div className="activity-list">
                  {analytics.recentActivity.orders.map((order) => (
                    <div key={order._id} className="activity-item">
                      <div className="activity-icon">📦</div>
                      <div className="activity-content">
                        <h4>Order #{order._id.slice(-6)}</h4>
                        <p>
                          {order.user?.name || 'Unknown User'} - 
                          {order.campaign?.title || order.premiumCampaign?.title || 'Unknown Campaign'}
                        </p>
                        <small>{formatDate(order.createdAt)}</small>
                      </div>
                      <div className="activity-amount">
                        {formatCurrency(order.totalPrice || order.totalCost || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="recent-messages">
                <h3>Recent Messages</h3>
                <div className="activity-list">
                  {analytics.recentActivity.messages.map((message) => (
                    <div key={message._id} className="activity-item">
                      <div className="activity-icon">💬</div>
                      <div className="activity-content">
                        <h4>{message.user}</h4>
                        <p>{message.text.substring(0, 50)}...</p>
                        <small>{formatDate(message.createdAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
