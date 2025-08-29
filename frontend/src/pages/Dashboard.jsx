import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

      const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayments: 0,
    confirmedOrders: 0,
    totalSpent: 0,
    premiumOrders: 0,
    premiumSpent: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPremiumOrders, setRecentPremiumOrders] = useState([]);
  
  // Messages state
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [input, setInput] = useState('');
  const [privateInput, setPrivateInput] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, group-chat, private-chat
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const chatBoxRef = useRef(null);
  const privateChatBoxRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardData();
    fetchMessages();
    fetchPrivateMessages();
    fetchUnreadCount();
    fetchNotifications();
    setupNotificationPolling();
  }, []);

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

  // Mark messages as read when private chat tab is opened
  useEffect(() => {
    if (activeTab === 'private-chat' && unreadCount > 0) {
      markMessagesAsRead();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch user stats
      const statsResponse = await fetch('API_ENDPOINTS.USERS/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent orders
      const ordersResponse = await fetch('API_ENDPOINTS.ORDERS/my-orders?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.slice(0, 5));
      }

      // Fetch recent premium orders
      const premiumOrdersResponse = await fetch('API_ENDPOINTS.PREMIUM_ORDERS/my-orders?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (premiumOrdersResponse.ok) {
        const premiumOrdersData = await premiumOrdersResponse.json();
        setRecentPremiumOrders(premiumOrdersData.slice(0, 5));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchMessages();
    await fetchPrivateMessages();
    await fetchUnreadCount();
    setRefreshing(false);
  };

  const fetchMessages = () => {
    fetch('API_ENDPOINTS.MESSAGES')
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        scrollToBottom();
      })
      .catch(err => console.error('Error fetching messages:', err));
  };

  const fetchPrivateMessages = () => {
    if (!user) return;
    
    fetch('API_ENDPOINTS.PRIVATE_MESSAGES/user', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.message || 'Failed to fetch private messages');
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('Fetched private messages:', data);
        // Sort messages by createdAt (oldest first for display)
        const sortedData = data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        console.log('Sorted private messages:', sortedData);
        
        // Check if any optimistic messages are still in the current state
        setPrivateMessages(prev => {
          const optimisticMessages = prev.filter(msg => msg._id && msg._id.toString().length < 20);
          if (optimisticMessages.length > 0) {
            console.log('Found optimistic messages that might not be saved:', optimisticMessages);
          }
          return sortedData;
        });
        
        scrollToPrivateBottom();
      })
      .catch(err => {
        console.error('Error fetching private messages:', err);
        if (err.message.includes('Failed to fetch')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        // Keep existing messages if fetch fails
        console.log('Keeping existing messages due to fetch error');
      });
  };

  const fetchUnreadCount = () => {
    if (!user) return;
    
    fetch('API_ENDPOINTS.PRIVATE_MESSAGES/user/unread-count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(err => {
        console.error('Error fetching unread count:', err);
      });
  };

  const markMessagesAsRead = () => {
    if (!user) return;
    
    fetch('API_ENDPOINTS.PRIVATE_MESSAGES/user/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(() => {
        setUnreadCount(0);
        setPrivateMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      })
      .catch(err => {
        console.error('Error marking messages as read:', err);
      });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      const msg = {
        user: user?.name || 'User',
        text: input,
        avatar: user?.name ? user.name.charAt(0).toUpperCase() : '👤',
      };
      setInput('');
      // Optimistic update
      setMessages(prev => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
      scrollToBottom();
      // Save to backend
      await fetch('API_ENDPOINTS.MESSAGES', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
      
      // Dispatch notification event for new message
      window.dispatchEvent(new CustomEvent('new-message', {
        detail: {
          sender: msg.user,
          message: msg.text
        }
      }));
      
      fetchMessages();
    }
  };

  const handlePrivateSend = async (e) => {
    e.preventDefault();
    if (!privateInput.trim() || !user) return;
    
    const message = privateInput;
    setPrivateInput('');
    
    // Optimistic update
    const optimisticMessage = {
      _id: Date.now().toString(),
      message,
      sender: 'user',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    console.log('Adding optimistic message:', optimisticMessage);
    setPrivateMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log('Updated private messages with optimistic:', newMessages);
      return newMessages;
    });
    scrollToPrivateBottom();
    
    // Save to backend
    try {
      const response = await fetch('API_ENDPOINTS.PRIVATE_MESSAGES/user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      // Dispatch notification event for new private message
      window.dispatchEvent(new CustomEvent('new-private-message', {
        detail: {
          sender: user?.name || user?.email,
          message: message
        }
      }));
      
      // Refresh messages to get the real message from server
      console.log('Message sent successfully, refreshing messages...');
      // Add a small delay to ensure the backend has saved the message
      setTimeout(() => {
        console.log('Fetching messages after send, current optimistic message ID:', optimisticMessage._id);
        fetchPrivateMessages();
      }, 500);
    } catch (error) {
      console.error('Error sending private message:', error);
      alert(`Failed to send message: ${error.message}`);
      // Remove optimistic message on error, but only if it's still there
      setPrivateMessages(prev => {
        const filtered = prev.filter(msg => msg._id !== optimisticMessage._id);
        console.log('Removing optimistic message due to error, remaining messages:', filtered.length);
        return filtered;
      });
    }
  };

  const handleEdit = (idx, msg) => {
    setEditingIdx(idx);
    setEditInput(msg.text);
  };

  const handleEditSave = async (msg, idx) => {
    if (!editInput.trim()) return;
    await fetch(`API_ENDPOINTS.MESSAGES/${msg._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user?.name || 'User', text: editInput }),
    });
    setEditingIdx(null);
    setEditInput('');
    fetchMessages();
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    await fetch(`API_ENDPOINTS.MESSAGES/${msg._id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: user?.name || 'User' }),
    });
    fetchMessages();
  };

  const canEditOrDelete = (msg) => {
    if (!user) return false;
    if (msg.user !== (user.name || 'User')) return false;
    const now = new Date();
    const created = new Date(msg.createdAt);
    return (now - created) <= 10 * 60 * 1000;
  };

  const isAdmin = user && user.email && user.email.includes('admin');

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  const scrollToPrivateBottom = () => {
    setTimeout(() => {
      if (privateChatBoxRef.current) {
        privateChatBoxRef.current.scrollTop = privateChatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'ETB 0';
    }
    return `ETB ${Number(price).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'confirmed': 'status-confirmed',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>{status}</span>;
  };

  const getPaymentStatusBadge = (order) => {
    if (!order.paymentPlan) {
      const status = order.paymentStatus || 'pending';
      return <span className={`payment-badge ${status}`}>{status}</span>;
    }

    if (order.paymentPlan === 'full') {
      const status = order.paymentRounds?.firstPayment?.status || 'pending';
      return <span className={`payment-badge ${status}`}>{status}</span>;
    } else {
      const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
      const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
      
      if (firstStatus === 'verified' && secondStatus === 'verified') {
        return <span className="payment-badge verified">Fully Paid</span>;
      } else if (firstStatus === 'verified') {
        return <span className="payment-badge partial">Partially Paid</span>;
      } else {
        return <span className="payment-badge pending">Payment Pending</span>;
      }
    }
  };

  // Notification functions
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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
      case 'payment':
        return '💳';
      case 'order':
        return '📦';
      case 'message':
        return '💬';
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

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome back, {user?.name || 'User'}! 👋</h1>
            <p>Here's what's happening with your orders and campaigns</p>
          </div>
          <div> </div>
          <div className="welcome-actions">
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
            
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <Link to="/campaigns" className="btn-primary">
              🚀 Browse Campaigns
            </Link>
            <Link to="/premium-campaigns" className="btn-secondary">
              ⭐ Premium Campaigns
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'group-chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('group-chat')}
          >
            💬 Group Chat
          </button>
          <button 
            className={`tab-btn ${activeTab === 'private-chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('private-chat')}
          >
            🔒 Private Messages
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>{stats.totalOrders}</h3>
                  <p>Total Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💳</div>
                <div className="stat-content">
                  <h3>{stats.pendingPayments}</h3>
                  <p>Pending Payments</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{stats.confirmedOrders}</h3>
                  <p>Confirmed Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>{formatPrice(stats.totalSpent)}</h3>
                  <p>Total Spent</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <h3>{stats.premiumOrders}</h3>
                  <p>Premium Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💎</div>
                <div className="stat-content">
                  <h3>{formatPrice(stats.premiumSpent)}</h3>
                  <p>Premium Spent</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <Link to="/orders-payments" className="quick-action-card">
                  <div className="action-icon">📋</div>
                  <h3>My Orders & Payments</h3>
                  <p>View and manage your regular orders</p>
                </Link>
                
                <Link to="/user-premium-orders" className="quick-action-card">
                  <div className="action-icon">⭐</div>
                  <h3>Premium Orders</h3>
                  <p>Manage your premium campaign orders</p>
                </Link>
                
                <Link to="/campaigns" className="quick-action-card">
                  <div className="action-icon">🚀</div>
                  <h3>Browse Campaigns</h3>
                  <p>Explore available campaigns</p>
                </Link>
                
                <Link to="/premium-campaigns" className="quick-action-card">
                  <div className="action-icon">💎</div>
                  <h3>Premium Campaigns</h3>
                  <p>Fast shipping premium campaigns</p>
                </Link>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-section">
              <div className="section-header">
                <h2>Recent Regular Orders</h2>
                <Link to="/orders-payments" className="view-all-link">View All →</Link>
              </div>
              
              {recentOrders.length > 0 ? (
                <div className="orders-grid">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="order-card">
                      <div className="order-header">
                        <h4>Order #{order._id.slice(-6)}</h4>
                        <div className="order-badges">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order)}
                        </div>
                      </div>
                      
                      <div className="order-details">
                        <p><strong>Campaign:</strong> {order.campaign?.title || 'N/A'}</p>
                        <p><strong>Amount:</strong> {formatPrice(order.totalAmount || order.totalPrice)}</p>
                        <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                      </div>
                      
                      <Link to={`/orders-payments?order=${order._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <h3>No orders yet</h3>
                  <p>Start by exploring our campaigns</p>
                  <Link to="/campaigns" className="btn-primary">Browse Campaigns</Link>
                </div>
              )}
            </div>

            {/* Recent Premium Orders */}
            <div className="recent-section">
              <div className="section-header">
                <h2>Recent Premium Orders</h2>
                <Link to="/user-premium-orders" className="view-all-link">View All →</Link>
              </div>
              
              {recentPremiumOrders.length > 0 ? (
                <div className="orders-grid">
                  {recentPremiumOrders.map((order) => (
                    <div key={order._id} className="order-card premium">
                      <div className="order-header">
                        <h4>Premium Order #{order._id.slice(-6)}</h4>
                        <div className="order-badges">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order)}
                        </div>
                      </div>
                      
                      <div className="order-details">
                        <p><strong>Campaign:</strong> {order.premiumCampaign?.title || 'N/A'}</p>
                        <p><strong>Amount:</strong> {formatPrice(order.totalAmount || order.totalCost)}</p>
                        <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                      </div>
                      
                      <Link to={`/user-premium-orders?order=${order._id}`} className="view-details-btn">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⭐</div>
                  <h3>No premium orders yet</h3>
                  <p>Explore our premium campaigns for fast shipping</p>
                  <Link to="/premium-campaigns" className="btn-primary">Browse Premium Campaigns</Link>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="help-section">
              <h2>Need Help?</h2>
              <div className="help-grid">
                <div className="help-card">
                  <div className="help-icon">📞</div>
                  <h3>Contact Support</h3>
                  <p>Get help with your orders and payments</p>
                  <Link to="/contact" className="help-link">Contact Us</Link>
                </div>
                
                <div className="help-card">
                  <div className="help-icon">📖</div>
                  <h3>How It Works</h3>
                  <p>Learn about our ordering process</p>
                  <Link to="/how-it-works" className="help-link">Learn More</Link>
                </div>
                
                <div className="help-card">
                  <div className="help-icon">❓</div>
                  <h3>FAQ</h3>
                  <p>Find answers to common questions</p>
                  <Link to="/faq" className="help-link">View FAQ</Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Group Chat Tab */}
        {activeTab === 'group-chat' && (
          <div className="chat-section">
            <div className="chat-header">
              <h2>💬 Group Chat</h2>
              <p>Chat with other customers and get community support</p>
            </div>
          <div className="chat-card">
            <div className="chat-box" ref={chatBoxRef}>
                {messages.length === 0 ? (
                  <div className="no-messages">No messages yet. Be the first to say hello! 👋</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg._id || idx} className="chat-message">
                    <span className="chat-avatar">{msg.avatar || (msg.user ? msg.user.charAt(0).toUpperCase() : '👤')}</span>
                    <span className="chat-user">{msg.user}</span>
                    {editingIdx === idx ? (
                      <>
                        <input
                          className="chat-edit-input"
                          value={editInput}
                          onChange={e => setEditInput(e.target.value)}
                          maxLength={300}
                        />
                        <button className="chat-edit-btn" onClick={() => handleEditSave(msg, idx)}>Save</button>
                        <button className="chat-cancel-btn" onClick={() => setEditingIdx(null)}>Cancel</button>
                      </>
                    ) : (
                      <span className="chat-text">{msg.text}</span>
                    )}
                    <span className="chat-timestamp">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    {(isAdmin || canEditOrDelete(msg)) && editingIdx !== idx && (
                      <>
                        {canEditOrDelete(msg) && (
                          <button className="chat-edit-btn" onClick={() => handleEdit(idx, msg)}>Edit</button>
                        )}
                        <button className="chat-delete-btn" onClick={() => handleDelete(msg)}>Delete</button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            <form className="chat-form" onSubmit={handleSend} autoComplete="off">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
                autoComplete="off"
                maxLength={300}
              />
              <button type="submit" className="chat-send-btn">Send</button>
            </form>
          </div>
        </div>
        )}

        {/* Private Chat Tab */}
        {activeTab === 'private-chat' && (
          <div className="chat-section">
            <div className="chat-header">
              <h2>🔒 Private Messages {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h2>
              <p>Send private messages to admin - only you and admin can see these</p>
              {unreadCount > 0 && (
                <button className="mark-read-btn" onClick={markMessagesAsRead}>
                  Mark all as read
                </button>
              )}
            </div>
            <div className="chat-card">
              <div className="chat-box" ref={privateChatBoxRef}>
                {privateMessages.length === 0 ? (
                  <div className="no-messages">No private messages yet. Start a conversation with admin!</div>
                ) : (
                  privateMessages.map((msg, idx) => (
                    <div key={msg._id || idx} className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'admin-message'}`}>
                      <span className="chat-avatar">
                        {msg.sender === 'user' ? (user?.name ? user.name.charAt(0).toUpperCase() : '👤') : '👨‍💼'}
                      </span>
                      <span className="chat-user">
                        {msg.sender === 'user' ? (user?.name || 'You') : 'Admin'}
                      </span>
                      <span className="chat-text">{msg.message}</span>
                      <span className="chat-timestamp">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {!msg.isRead && msg.sender === 'admin' && (
                        <span className="unread-indicator">●</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              <form className="chat-form" onSubmit={handlePrivateSend} autoComplete="off">
                <input
                  type="text"
                  value={privateInput}
                  onChange={e => setPrivateInput(e.target.value)}
                  placeholder="Type a private message to admin..."
                  className="chat-input"
                  autoComplete="off"
                  maxLength={300}
                />
                <button type="submit" className="chat-send-btn">Send</button>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard; 