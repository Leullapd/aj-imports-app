import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCampaigns: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalPrivateMessages: 0,
    unreadPrivateMessages: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalPremiumCampaigns: 0,
    totalPremiumOrders: 0,
    pendingPremiumPayments: 0
  });
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    // Fetch stats from backend
    fetchStats();
    fetchMessages();
    fetchPrivateMessages();
    fetchNotifications();
    setupNotificationPolling();
  }, [navigate]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Refresh stats when component mounts or when payments change
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      fetchStats();
    }
  }, []);

  // Close dropdown when clicking outside
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

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return;

      // Fetch products count
      const productsRes = await fetch('API_ENDPOINTS.PRODUCTS');
      const products = await productsRes.json();
      
      // Fetch campaigns count
      const campaignsRes = await fetch('API_ENDPOINTS.CAMPAIGNS');
      const campaigns = await campaignsRes.json();
      
      // Fetch orders count
      const ordersRes = await fetch('API_ENDPOINTS.ORDERS');
      const orders = await ordersRes.json();

      // Fetch users count
      const usersRes = await fetch('API_ENDPOINTS.USERS');
      const users = await usersRes.json();

      // Fetch payments count
      const paymentsRes = await fetch('API_ENDPOINTS.PAYMENTS', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      let totalPayments = 0;
      let pendingPayments = 0;
      
      if (paymentsRes.ok) {
        const payments = await paymentsRes.json();
        totalPayments = payments.length;
        pendingPayments = payments.filter(p => p.status === 'pending').length;
      }

      // Fetch private messages count
      const privateMessagesRes = await fetch('API_ENDPOINTS.PRIVATE_MESSAGES/admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      let totalPrivateMessages = 0;
      let unreadPrivateMessages = 0;
      
      if (privateMessagesRes.ok) {
        const privateMessages = await privateMessagesRes.json();
        totalPrivateMessages = privateMessages.length;
        unreadPrivateMessages = privateMessages.filter(msg => !msg.isRead && msg.sender === 'user').length;
      }

      // Fetch group messages count
      const groupMessagesRes = await fetch('API_ENDPOINTS.MESSAGES');
      const groupMessages = await groupMessagesRes.json();
      let unreadMessages = 0;
      if (groupMessagesRes.ok) {
        unreadMessages = groupMessages.filter(msg => !msg.isRead).length;
      }

      // Fetch premium campaigns count
      const premiumCampaignsRes = await fetch('API_ENDPOINTS.PREMIUM_CAMPAIGNS');
      let totalPremiumCampaigns = 0;
      if (premiumCampaignsRes.ok) {
        const premiumCampaignsData = await premiumCampaignsRes.json();
        totalPremiumCampaigns = premiumCampaignsData.campaigns ? premiumCampaignsData.campaigns.length : 0;
      }

      // Fetch premium orders count and pending payments
      const premiumOrdersRes = await fetch('API_ENDPOINTS.PREMIUM_ORDERS', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      let totalPremiumOrders = 0;
      let pendingPremiumPayments = 0;
      if (premiumOrdersRes.ok) {
        const premiumOrdersData = await premiumOrdersRes.json();
        const premiumOrders = premiumOrdersData.orders || premiumOrdersData;
        totalPremiumOrders = premiumOrders.length;
        
        // Count pending premium payments (orders with pending second payments)
        pendingPremiumPayments = premiumOrders.filter(order => {
          if (order.paymentPlan === 'installment' && 
              order.paymentRounds?.firstPayment?.status === 'verified' && 
              order.paymentRounds?.secondPayment?.status === 'pending') {
            return true;
          }
          return false;
        }).length;
      }

      setStats({
        totalProducts: products.length,
        totalCampaigns: campaigns.length,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalPayments,
        pendingPayments,
        totalPrivateMessages,
        unreadPrivateMessages,
        totalMessages: groupMessages.length,
        unreadMessages,
        totalPremiumCampaigns,
        totalPremiumOrders,
        pendingPremiumPayments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.MESSAGES');
      const data = await response.json();
      // Get only the 5 most recent messages
      setMessages(data.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPrivateMessages = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return;

      const response = await fetch('API_ENDPOINTS.PRIVATE_MESSAGES/admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Get only the 5 most recent private messages
        setPrivateMessages(data.slice(-5).reverse());
      }
    } catch (error) {
      console.error('Error fetching private messages:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`API_ENDPOINTS.MESSAGES/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin: true })
      });

      if (response.ok) {
        // Remove the message from state
        setMessages(messages.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Notification functions
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('API_ENDPOINTS.NOTIFICATIONS/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadNotificationCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('API_ENDPOINTS.NOTIFICATIONS/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const setupNotificationPolling = () => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadNotificationCount();
    }, 30000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`API_ENDPOINTS.NOTIFICATIONS/read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        fetchUnreadNotificationCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('API_ENDPOINTS.NOTIFICATIONS/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`API_ENDPOINTS.NOTIFICATIONS/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        fetchUnreadNotificationCount();
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'payment':
        return '💳';
      case 'message':
        return '💬';
      case 'private-message':
        return '🔒';
      default:
        return '🔔';
    }
  };

  const getNotificationStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
        return 'success';
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'pending':
      case 'processing':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    fetchStats();
    fetchMessages();
    fetchPrivateMessages();
    fetchNotifications();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'loading' : ''}`}
          >
            <span className="refresh-icon">🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <div className="admin-header-actions">
            {/* Notification Bell */}
            <div className="notification-container">
              <button 
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadNotificationCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="mark-all-read-btn"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification._id} 
                          className={`notification-item ${!notification.read ? 'unread' : ''} ${getNotificationStatusColor(notification.status)}`}
                          onClick={() => markNotificationAsRead(notification._id)}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="notification-content">
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <small>{new Date(notification.createdAt).toLocaleString()}</small>
                          </div>
                          <button 
                            className="remove-notification-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification._id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Admin Profile Dropdown */}
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
        </div>
      </div>

      <div className="admin-container">
        <div className="page-description">
          <p><strong>Admin Dashboard:</strong> Welcome to your central command center. Here you can monitor all aspects of your import business, from products and campaigns to orders and user management.</p>
          <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#6c757d'}}>
            💡 <strong>Tip:</strong> Use the refresh button to update all data in real-time. Click on any stat card to navigate to its management page.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>📦 Campaigns</h3>
            <p className="stat-number">{stats.totalProducts}</p>
            <Link to="/admin/products" className="stat-link">Manage Product Catalog</Link>
          </div>

          <div className="stat-card">
            <h3>⭐ Premium Campaigns</h3>
            <p className="stat-number">{stats.totalPremiumCampaigns}</p>
            <Link to="/admin/premium-campaigns" className="stat-link">Manage Premium Campaigns</Link>
          </div>

          <div className="stat-card">
            <h3>📦 Orders & Payments</h3>
            <p className="stat-number">{stats.totalOrders}</p>
            <p className="stat-subtitle">{stats.pendingPayments} pending payments</p>
            <Link to="/admin/orders-payments" className="stat-link">Manage Orders & Payments</Link>
          </div>

          <div className="stat-card">
            <h3>👤 Registered Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <Link to="/admin/users" className="stat-link">Manage Users</Link>
          </div>
          
          <div className="stat-card">
            <h3>🚀 Premium Orders</h3>
            <p className="stat-number">{stats.totalPremiumOrders}</p>
            {stats.pendingPremiumPayments > 0 && (
              <p className="stat-subtitle">{stats.pendingPremiumPayments} pending payments</p>
            )}
            <Link to="/admin/premium-orders" className="stat-link">Manage Premium Orders</Link>
          </div>
          
          <div className="stat-card">
            <h3>✉ Group Messages</h3>
            <p className="stat-number">{stats.totalMessages}</p>
            {stats.unreadMessages > 0 && (
              <p className="stat-subtitle">{stats.unreadMessages} unread</p>
            )}
            <Link to="/admin/messages" className="stat-link">View Messages</Link>
          </div>
          
          <div className="stat-card">
            <h3>📩 Private Messages</h3>
            <p className="stat-number">{stats.totalPrivateMessages}</p>
            <p className="stat-subtitle">{stats.unreadPrivateMessages} unread</p>
            <Link to="/admin/private-messages" className="stat-link">View Private Messages</Link>
          </div>
        </div>

        {/* Workflow Guide */}
        <div className="workflow-guide">
          <h2>📋 How to Create an Import Campaign</h2>
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>📦 Add Products</h4>
                <p>First, add products to your catalog using the "Add New Product" option</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>🚀 Create Campaign</h4>
                <p>Then create a campaign and select which products to include</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>📋 Manage Orders</h4>
                <p>Monitor orders and payments from customers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/products" className="action-card">
              <h3>📦 Add New Product</h3>
              <p>Add items to your product catalog</p>
            </Link>
            
            <Link to="/admin/premium-campaigns" className="action-card">
              <h3>⭐ Create Premium Campaign</h3>
              <p>Create fast-shipping premium campaigns</p>
            </Link>
            
            <Link to="/admin/premium-orders" className="action-card">
              <h3>🚀 Premium Orders</h3>
              <p>Manage premium campaign orders</p>
              {stats.pendingPremiumPayments > 0 && (
                <div className="notification-badge">{stats.pendingPremiumPayments}</div>
              )}
            </Link>
            
            <Link to="/admin/orders-payments" className="action-card">
              <h3>📦 Orders & Payments</h3>
              <p>Manage all orders and payments</p>
              {stats.pendingPayments > 0 && (
                <div className="notification-badge">{stats.pendingPayments}</div>
              )}
            </Link>
            
            <Link to="/admin/payment-methods" className="action-card">
              <h3>🏦 Payment Methods</h3>
              <p>Configure available payment options</p>
            </Link>
            
            <Link to="/admin/categories" className="action-card">
              <h3>🏷️ Categories</h3>
              <p>Manage product categories and organization</p>
            </Link>
            
            <Link to="/admin/messages" className="action-card">
              <h3>✉️ Group Messages</h3>
              <p>View and manage group messages</p>
              {stats.unreadMessages > 0 && (
                <div className="notification-badge">{stats.unreadMessages}</div>
              )}
            </Link>
            
            <Link to="/admin/private-messages" className="action-card">
              <h3>🔒 Private Messages</h3>
              <p>Manage private conversations with customers</p>
              {stats.unreadPrivateMessages > 0 && (
                <div className="notification-badge">{stats.unreadPrivateMessages}</div>
              )}
            </Link>
            
            <Link to="/admin/settings" className="action-card">
              <h3>⚙️ Settings</h3>
              <p>Manage system settings, privacy policy, and configurations</p>
            </Link>
            
            <Link to="/admin/analytics" className="action-card">
              <h3>📊 Analytics Dashboard</h3>
              <p>View comprehensive business analytics and insights</p>
            </Link>
          </div>
        </div>

        {/* Messages Section */}
        <div className="messages-sections">
          {/* Group Messages Card */}
          <div className="messages-section">
            <h2>Recent Group Messages</h2>
            <div className="messages-card">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet</p>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div key={message._id} className="message-item">
                      <div className="message-header">
                        <span className="message-user">{message.user}</span>
                        <span className="message-time">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="message-text">{message.text}</p>
                      <button 
                        onClick={() => handleDeleteMessage(message._id)}
                        className="delete-message-btn"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/messages" className="view-all-messages">
                View All Group Messages
              </Link>
            </div>
          </div>

          {/* Private Messages Card */}
          <div className="messages-section">
            <h2>Recent Private Messages</h2>
            <div className="messages-card">
              {privateMessages.length === 0 ? (
                <p className="no-messages">No private messages yet</p>
              ) : (
                <div className="messages-list">
                  {privateMessages.map((message) => (
                    <div key={message._id} className="message-item private-message">
                      <div className="message-header">
                        <span className="message-user">{message.user.name}</span>
                        <span className="message-time">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        {!message.isRead && message.sender === 'user' && (
                          <span className="unread-badge">●</span>
                        )}
                      </div>
                      <p className="message-text">{message.message}</p>
                      <div className="message-sender">
                        <span className={`sender-badge ${message.sender}`}>
                          {message.sender === 'user' ? '👤 User' : '👨‍💼 Admin'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/private-messages" className="view-all-messages">
                View All Private Messages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 