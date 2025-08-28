import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserPremiumOrdersAndPayments.css';

const UserPremiumOrdersAndPayments = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    overallPaymentStatus: '',
    search: '' // Add search filter
  });
  const [orderNotifications, setOrderNotifications] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  useEffect(() => {
    // Fetch notifications for orders when orders change
    if (orders.length > 0) {
      fetchOrderNotifications();
    }
  }, [orders]);

  // Set up polling for notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (orders.length > 0) {
        fetchOrderNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orders]);

  const fetchOrderNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const orderIds = orders.map(order => order._id);
      
      // Fetch notifications for all orders
      const response = await fetch(`http://localhost:5000/api/notifications/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderIds })
      });

      if (response.ok) {
        const notifications = await response.json();
        
        // Group notifications by order ID
        const notificationsByOrder = {};
        notifications.forEach(notification => {
          const orderId = notification.data?.orderId;
          if (orderId && !notification.read) {
            if (!notificationsByOrder[orderId]) {
              notificationsByOrder[orderId] = [];
            }
            notificationsByOrder[orderId].push(notification);
          }
        });
        
        setOrderNotifications(notificationsByOrder);
      }
    } catch (error) {
      console.error('Error fetching order notifications:', error);
    }
  };

  const markOrderNotificationAsRead = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const notifications = orderNotifications[orderId] || [];
      
      // Mark all notifications for this order as read
      for (const notification of notifications) {
        await fetch(`http://localhost:5000/api/notifications/read/${notification._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      // Remove notifications from state
      setOrderNotifications(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    } catch (error) {
      console.error('Error marking order notification as read:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Frontend - Token exists:', !!token);
      console.log('Frontend - Token length:', token ? token.length : 0);
      
      if (!token) {
        console.log('Frontend - No token found, redirecting to login');
        navigate('/login');
        return;
      }

      let url = 'http://localhost:5000/api/premium-orders/my-orders';
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.overallPaymentStatus) params.append('overallPaymentStatus', filters.overallPaymentStatus);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Frontend - Response status:', response.status);
      console.log('Frontend - Response data:', data);

      if (response.ok) {
        setOrders(data);
      } else {
        console.log('Frontend - Error response:', data);
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to convert URLs in text to clickable links
  const convertUrlsToLinks = (text) => {
    if (!text) return text;
    
    // Split text by spaces to find URLs
    const words = text.split(' ');
    const processedWords = words.map((word, index) => {
      // Check if word contains https://
      if (word.includes('https://')) {
        // Find the end of the URL (until space or end of string)
        const urlMatch = word.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          const remainingText = word.substring(url.length);
          
          return (
            <span key={index}>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007bff', textDecoration: 'underline' }}
              >
                {url}
              </a>
              {remainingText}
            </span>
          );
        }
      }
      return word;
    });
    
    // Join words back together with spaces
    return processedWords.map((word, index) => (
      <span key={index}>
        {word}
        {index < processedWords.length - 1 && ' '}
      </span>
    ));
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'ETB 0';
    }
    return `ETB ${Number(price).toLocaleString()}`;
  };

  // Search functionality
  const filteredOrders = orders.filter(order => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const orderId = order._id.slice(-6).toLowerCase();
    const campaignTitle = (order.premiumCampaign?.title || '').toLowerCase();
    const status = (order.status || '').toLowerCase();
    
    return orderId.includes(searchTerm) || 
           campaignTitle.includes(searchTerm) ||
           status.includes(searchTerm);
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'pending',
      'processing': 'processing',
      'confirmed': 'confirmed',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return <span className={`status-badge ${statusClasses[status] || 'pending'}`}>📦 {status}</span>;
  };

  const getPaymentStatusBadge = (order) => {
    if (!order.paymentPlan) {
      // Legacy payment system
      const status = order.paymentStatus || 'pending';
      const statusClasses = {
        'pending': 'pending',
        'verified': 'verified',
        'rejected': 'rejected'
      };
      return <span className={`payment-badge ${statusClasses[status] || 'pending'}`}>💳 {status}</span>;
    }

    if (order.paymentPlan === 'full') {
      const status = order.paymentRounds?.firstPayment?.status || 'pending';
      const statusClasses = {
        'pending': 'pending',
        'verified': 'verified',
        'rejected': 'rejected'
      };
      return <span className={`payment-badge ${statusClasses[status] || 'pending'}`}>💳 {status}</span>;
    } else {
      // Installment payment
      const firstStatus = order.paymentRounds?.firstPayment?.status || 'pending';
      const secondStatus = order.paymentRounds?.secondPayment?.status || 'pending';
      
      if (firstStatus === 'verified' && secondStatus === 'verified') {
        return <span className="payment-badge verified">💳 Fully Paid</span>;
      } else if (firstStatus === 'verified') {
        return <span className="payment-badge partial">💳 Partially Paid</span>;
      } else {
        return <span className="payment-badge pending">💳 Payment Pending</span>;
      }
    }
  };

  const getPaymentProgress = (order) => {
    if (!order.paymentPlan) {
      return order.paymentStatus === 'verified' ? 100 : 0;
    }

    if (order.paymentPlan === 'full') {
      return order.paymentRounds?.firstPayment?.status === 'verified' ? 100 : 0;
    } else {
      let progress = 0;
      if (order.paymentRounds?.firstPayment?.status === 'verified') progress += 50;
      if (order.paymentRounds?.secondPayment?.status === 'verified') progress += 50;
      return progress;
    }
  };

  const getNextPaymentAmount = (order) => {
    if (!order.paymentPlan) {
      return order.paymentStatus === 'pending' ? order.totalCost : 0;
    }

    if (order.paymentPlan === 'full') {
      return order.paymentRounds?.firstPayment?.status === 'pending' ? order.paymentRounds.firstPayment.amount : 0;
    } else {
      if (order.paymentRounds?.firstPayment?.status === 'pending') {
        return order.paymentRounds.firstPayment.amount;
      } else if (order.paymentRounds?.firstPayment?.status === 'verified' && order.paymentRounds?.secondPayment?.status === 'pending') {
        return order.paymentRounds.secondPayment.amount;
      }
      return 0;
    }
  };

  const canSubmitPayment = (order, round = 'firstPayment') => {
    if (!order.paymentPlan) {
      return order.paymentStatus === 'pending';
    }

    if (order.paymentPlan === 'full') {
      return order.paymentRounds?.firstPayment?.status === 'pending';
    } else {
      if (round === 'firstPayment') {
        return order.paymentRounds?.firstPayment?.status === 'pending';
      } else if (round === 'secondPayment') {
        return order.paymentRounds?.firstPayment?.status === 'verified' && order.paymentRounds?.secondPayment?.status === 'pending';
      }
    }
    return false;
  };

  const handleSubmitPayment = (order, round = 'firstPayment') => {
    navigate(`/premium-payment/${order._id}/${round}`);
  };

  // Notification functions
  const hasOrderNotification = (order) => {
    return orderNotifications[order._id] && orderNotifications[order._id].length > 0;
  };

  const addOrderNotification = (orderId) => {
    // This function is no longer needed as notifications are fetched via polling
  };

  const removeOrderNotification = (orderId) => {
    // This function is no longer needed as notifications are fetched via polling
  };

  if (loading) {
    return (
      <div className="user-premium-orders-page">
        <div className="page-header">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
          <h1>My Premium Orders & Payments</h1>
        </div>
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="user-premium-orders-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>
        <h1>My Premium Orders & Payments</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        {/* Search Bar */}
        <div className="search-group">
          <label>🔍 Search:</label>
          <input
            type="text"
            placeholder="Search by order ID, campaign, or status..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>📦 Order Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Order Statuses</option>
            <option value="pending">📦 Pending</option>
            <option value="processing">📦 Processing</option>
            <option value="confirmed">📦 Confirmed</option>
            <option value="shipped">📦 Shipped</option>
            <option value="delivered">📦 Delivered</option>
            <option value="cancelled">📦 Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>💳 Payment Status:</label>
          <select 
            value={filters.overallPaymentStatus} 
            onChange={(e) => setFilters(prev => ({ ...prev, overallPaymentStatus: e.target.value }))}
          >
            <option value="">All Payment Statuses</option>
            <option value="pending">💳 Pending</option>
            <option value="partial">💳 Partially Paid</option>
            <option value="completed">💳 Completed</option>
            <option value="overdue">💳 Overdue</option>
          </select>
        </div>

        <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
      </div>

      <div className="orders-container">
        {!Array.isArray(orders) || orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">⭐</div>
            <h3>No Premium Orders Found</h3>
            <p>You haven't placed any premium orders yet.</p>
            <button onClick={() => navigate('/premium-campaigns')} className="browse-premium-btn">
              Browse Premium Campaigns
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="order-card"
                onClick={() => {
                  if (hasOrderNotification(order)) {
                    markOrderNotificationAsRead(order._id);
                  }
                }}
              >
                {/* Notification Badge for Order */}
                {hasOrderNotification(order) && (
                  <div className="order-notification-badge">
                    🔔 {orderNotifications[order._id].length} Update{orderNotifications[order._id].length > 1 ? 's' : ''}
                  </div>
                )}
                
                <div className="order-header">
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <div className="order-badges">
                    <div className="status-label">Payment Status:</div>
                    {getPaymentStatusBadge(order)}
                  </div>
                </div>

                <div className="order-info">
                  <div className="info-row">
                    <span className="label">Campaign:</span>
                    <span className="value">{order.premiumCampaign?.title || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{order.quantity || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Payment Plan:</span>
                    <span className="value">{order.paymentPlan === 'installment' ? 'Installment' : 'Full Payment'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Cost:</span>
                    <span className="value">{formatPrice(order.totalCost)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Order Date:</span>
                    <span className="value">{formatDate(order.createdAt)}</span>
                  </div>
                  
                  {/* Rejection Reasons Display */}
                  {order.paymentPlan === 'full' && order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                    <div className="rejection-reason">
                      <span className="label">Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  {order.paymentPlan === 'installment' && order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                    <div className="rejection-reason">
                      <span className="label">First Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  {order.paymentPlan === 'installment' && order.paymentRounds?.secondPayment?.status === 'rejected' && order.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                    <div className="rejection-reason">
                      <span className="label">Second Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.secondPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Progress */}
                <div className="payment-progress-section">
                  <div className="progress-info">
                    <span>Payment Progress: {getPaymentProgress(order)}%</span>
                    <span>Next Payment: {formatPrice(getNextPaymentAmount(order))}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${getPaymentProgress(order)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="view-details-btn"
                  >
                    📋 View Details
                  </button>
                  
                  {/* Payment Action Buttons */}
                  {!order.paymentPlan ? (
                    // Legacy payment system
                    canSubmitPayment(order) && (
                      <button 
                        onClick={() => handleSubmitPayment(order)}
                        className="submit-payment-btn"
                      >
                        💳 Submit Payment
                      </button>
                    )
                  ) : order.paymentPlan === 'full' ? (
                    // Full payment system
                    canSubmitPayment(order, 'firstPayment') && (
                      <button 
                        onClick={() => handleSubmitPayment(order, 'firstPayment')}
                        className="submit-payment-btn"
                      >
                        💳 Submit Payment
                      </button>
                    )
                  ) : (
                    // Installment payment system
                    <div className="installment-payment-buttons">
                      {canSubmitPayment(order, 'firstPayment') && (
                        <button 
                          onClick={() => handleSubmitPayment(order, 'firstPayment')}
                          className="submit-payment-btn"
                        >
                          💳 Submit First Payment
                        </button>
                      )}
                      {canSubmitPayment(order, 'secondPayment') && (
                        <button 
                          onClick={() => handleSubmitPayment(order, 'secondPayment')}
                          className="submit-payment-btn second"
                        >
                          💳 Submit Second Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipping Status at Bottom */}
                <div className="shipping-status-bottom">
                  <div className="status-label">Shipping Status:</div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details #{selectedOrder._id.slice(-6)}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="close-btn">×</button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h3>Campaign Information</h3>
                <div className="detail-row">
                  <span className="label">Campaign:</span>
                  <span className="value">{selectedOrder.premiumCampaign?.title || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{selectedOrder.premiumCampaign?.category || 'N/A'}</span>
                </div>
              </div>

              <div className="details-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{selectedOrder.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Payment Plan:</span>
                  <span className="value">{selectedOrder.paymentPlan === 'installment' ? 'Installment' : 'Full Payment'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Premium Price:</span>
                  <span className="value">{formatPrice(selectedOrder.premiumCampaign?.premiumPrice || 0)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Air Cargo Cost:</span>
                  <span className="value">{formatPrice(selectedOrder.airCargoCost)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Cost:</span>
                  <span className="value total">{formatPrice(selectedOrder.totalCost)}</span>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="details-section">
                <h3>Payment Details</h3>
                
                {selectedOrder.paymentPlan ? (
                  // New payment rounds system
                  selectedOrder.paymentPlan === 'full' ? (
                    <div className="payment-round-section">
                      <h4>Full Payment</h4>
                      <div className="payment-round-info">
                        <div className="detail-row">
                          <span className="label">Amount:</span>
                          <span className="value">{formatPrice(selectedOrder.paymentRounds?.firstPayment?.amount || selectedOrder.totalCost)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Status:</span>
                          <span className="value">
                            <span className={`payment-status-badge ${selectedOrder.paymentRounds?.firstPayment?.status || 'pending'}`}>
                              {selectedOrder.paymentRounds?.firstPayment?.status || 'pending'}
                            </span>
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Sender's Name:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.senderName || selectedOrder.senderName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Payment Method:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.paymentMethod || selectedOrder.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Transaction ID:</span>
                          <span className="value">{convertUrlsToLinks(selectedOrder.paymentRounds?.firstPayment?.transactionId || selectedOrder.transactionId || 'N/A')}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Payment Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.paymentDate ? formatDate(selectedOrder.paymentRounds.firstPayment.paymentDate) : (selectedOrder.paymentDate ? formatDate(selectedOrder.paymentDate) : 'N/A')}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Due Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.dueDate ? formatDate(selectedOrder.paymentRounds.firstPayment.dueDate) : 'N/A'}</span>
                        </div>
                        {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                          <div className="detail-row">
                            <span className="label">Admin Notes:</span>
                            <span className="value">{selectedOrder.paymentRounds.firstPayment.paymentDetails.notes}</span>
                          </div>
                        )}
                        {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.verifiedAt && (
                          <div className="detail-row">
                            <span className="label">Verified At:</span>
                            <span className="value">{formatDate(selectedOrder.paymentRounds.firstPayment.paymentDetails.verifiedAt)}</span>
                          </div>
                        )}
                        {(selectedOrder.paymentRounds?.firstPayment?.paymentScreenshot || selectedOrder.paymentScreenshot) && (
                          <div className="detail-row">
                            <span className="label">Payment Screenshot:</span>
                            <div className="value">
                              <a 
                                href={`http://localhost:5000/premium-payments/${selectedOrder.paymentRounds?.firstPayment?.paymentScreenshot || selectedOrder.paymentScreenshot}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="screenshot-link"
                              >
                                View Screenshot
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="payment-rounds-section">
                      <h4>Installment Payments</h4>
                      
                      {/* First Payment */}
                      <div className="payment-round-section">
                        <h5>First Payment (50% + Air Cargo)</h5>
                        <div className="payment-round-info">
                          <div className="detail-row">
                            <span className="label">Amount:</span>
                            <span className="value">{formatPrice(selectedOrder.paymentRounds?.firstPayment?.amount || 0)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Status:</span>
                            <span className="value">
                              <span className={`payment-status-badge ${selectedOrder.paymentRounds?.firstPayment?.status || 'pending'}`}>
                                {selectedOrder.paymentRounds?.firstPayment?.status || 'pending'}
                              </span>
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Sender's Name:</span>
                            <span className="value">{selectedOrder.paymentRounds?.firstPayment?.senderName || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Payment Method:</span>
                            <span className="value">{selectedOrder.paymentRounds?.firstPayment?.paymentMethod || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Transaction ID:</span>
                            <span className="value">{convertUrlsToLinks(selectedOrder.paymentRounds?.firstPayment?.transactionId || 'N/A')}</span>
                          </div>
                                                  <div className="detail-row">
                          <span className="label">Payment Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.paymentDate ? formatDate(selectedOrder.paymentRounds.firstPayment.paymentDate) : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Due Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.firstPayment?.dueDate ? formatDate(selectedOrder.paymentRounds.firstPayment.dueDate) : 'N/A'}</span>
                        </div>
                        {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                          <div className="detail-row">
                            <span className="label">Admin Notes:</span>
                            <span className="value">{selectedOrder.paymentRounds.firstPayment.paymentDetails.notes}</span>
                          </div>
                        )}
                        {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.verifiedAt && (
                          <div className="detail-row">
                            <span className="label">Verified At:</span>
                            <span className="value">{formatDate(selectedOrder.paymentRounds.firstPayment.paymentDetails.verifiedAt)}</span>
                          </div>
                        )}
                        {selectedOrder.paymentRounds?.firstPayment?.paymentScreenshot && (
                            <div className="detail-row">
                              <span className="label">Payment Screenshot:</span>
                              <div className="value">
                                <a 
                                  href={`http://localhost:5000/premium-payments/${selectedOrder.paymentRounds.firstPayment.paymentScreenshot}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="screenshot-link"
                                >
                                  View Screenshot
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Second Payment */}
                      <div className="payment-round-section">
                        <h5>Second Payment (50%)</h5>
                        <div className="payment-round-info">
                          <div className="detail-row">
                            <span className="label">Amount:</span>
                            <span className="value">{formatPrice(selectedOrder.paymentRounds?.secondPayment?.amount || 0)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Status:</span>
                            <span className="value">
                              <span className={`payment-status-badge ${selectedOrder.paymentRounds?.secondPayment?.status || 'pending'}`}>
                                {selectedOrder.paymentRounds?.secondPayment?.status || 'pending'}
                              </span>
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Sender's Name:</span>
                            <span className="value">{selectedOrder.paymentRounds?.secondPayment?.senderName || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Payment Method:</span>
                            <span className="value">{selectedOrder.paymentRounds?.secondPayment?.paymentMethod || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Transaction ID:</span>
                            <span className="value">{convertUrlsToLinks(selectedOrder.paymentRounds?.secondPayment?.transactionId || 'N/A')}</span>
                          </div>
                                                  <div className="detail-row">
                          <span className="label">Payment Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.secondPayment?.paymentDate ? formatDate(selectedOrder.paymentRounds.secondPayment.paymentDate) : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Due Date:</span>
                          <span className="value">{selectedOrder.paymentRounds?.secondPayment?.dueDate ? formatDate(selectedOrder.paymentRounds.secondPayment.dueDate) : 'N/A'}</span>
                        </div>
                        {selectedOrder.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                          <div className="detail-row">
                            <span className="label">Admin Notes:</span>
                            <span className="value">{selectedOrder.paymentRounds.secondPayment.paymentDetails.notes}</span>
                          </div>
                        )}
                        {selectedOrder.paymentRounds?.secondPayment?.paymentDetails?.verifiedAt && (
                          <div className="detail-row">
                            <span className="label">Verified At:</span>
                            <span className="value">{formatDate(selectedOrder.paymentRounds.secondPayment.paymentDetails.verifiedAt)}</span>
                          </div>
                        )}
                        {selectedOrder.paymentRounds?.secondPayment?.paymentScreenshot && (
                            <div className="detail-row">
                              <span className="label">Payment Screenshot:</span>
                              <div className="value">
                                <a 
                                  href={`http://localhost:5000/premium-payments/${selectedOrder.paymentRounds.secondPayment.paymentScreenshot}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="screenshot-link"
                                >
                                  View Screenshot
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // Legacy payment system (for backward compatibility)
                  <div className="payment-round-section">
                    <h4>Payment Information (Legacy)</h4>
                    <div className="payment-round-info">
                      <div className="detail-row">
                        <span className="label">Amount:</span>
                        <span className="value">{formatPrice(selectedOrder.totalCost)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Status:</span>
                        <span className="value">
                          <span className={`payment-status-badge ${selectedOrder.paymentStatus || 'pending'}`}>
                            {selectedOrder.paymentStatus || 'pending'}
                          </span>
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Sender's Name:</span>
                        <span className="value">{selectedOrder.senderName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Payment Method:</span>
                        <span className="value">{selectedOrder.paymentMethod || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Transaction ID:</span>
                        <span className="value">{convertUrlsToLinks(selectedOrder.transactionId || 'N/A')}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Payment Date:</span>
                        <span className="value">{selectedOrder.paymentDate ? formatDate(selectedOrder.paymentDate) : 'N/A'}</span>
                      </div>
                      {selectedOrder.paymentScreenshot && (
                        <div className="detail-row">
                          <span className="label">Payment Screenshot:</span>
                          <div className="value">
                            <a 
                              href={`http://localhost:5000/premium-payments/${selectedOrder.paymentScreenshot}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="screenshot-link"
                            >
                              View Screenshot
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedOrder.userNotes && (
                <div className="details-section">
                  <h3>Your Notes</h3>
                  <p className="user-notes">{selectedOrder.userNotes}</p>
                </div>
              )}

              <div className="details-section">
                <h3>Tracking Information</h3>
                <div className="detail-row">
                  <span className="label">Tracking Number:</span>
                  <span className="value">{selectedOrder.trackingNumber || 'Not available yet'}</span>
                </div>
                {selectedOrder.estimatedDelivery && (
                  <div className="detail-row">
                    <span className="label">Estimated Delivery:</span>
                    <span className="value">{formatDate(selectedOrder.estimatedDelivery)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPremiumOrdersAndPayments;
