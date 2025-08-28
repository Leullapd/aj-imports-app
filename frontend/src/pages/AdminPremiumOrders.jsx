import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPremiumOrders.css';

const AdminPremiumOrders = () => {
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
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      let url = 'http://localhost:5000/api/premium-orders';
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.overallPaymentStatus) params.append('overallPaymentStatus', filters.overallPaymentStatus);
      if (filters.search) params.append('search', filters.search); // Add search parameter
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || data);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/premium-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        fetchOrders();
        alert('Order status updated successfully!');
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handlePaymentVerification = async (orderId, round, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      let notes = `Payment ${newStatus} by admin`;
      
      // If rejecting payment, prompt for rejection reason
      if (newStatus === 'rejected') {
        const roundText = round === 'firstPayment' ? 'first' : 'second';
        const rejectionReason = prompt(`Please provide a reason for rejecting the ${roundText} payment:`);
        if (rejectionReason === null) {
          // User cancelled the prompt
          return;
        }
        notes = rejectionReason.trim() || `Payment rejected by admin`;
      }

      const response = await fetch(`http://localhost:5000/api/premium-orders/verify/${orderId}/${round}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      const data = await response.json();

      if (response.ok) {
        fetchOrders();
        alert(`Payment ${round} ${newStatus} successfully!`);
      } else {
        alert(data.message || `Failed to ${newStatus} payment ${round}`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleLegacyPaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/premium-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });

      const data = await response.json();

      if (response.ok) {
        fetchOrders();
        alert('Payment status updated successfully!');
      } else {
        alert(data.message || 'Failed to update payment status');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleTrackingUpdate = async (orderId, trackingNumber) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/premium-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber })
      });

      const data = await response.json();

      if (response.ok) {
        fetchOrders();
        alert('Tracking number updated successfully!');
      } else {
        alert(data.message || 'Failed to update tracking number');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this premium order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log('Deleting premium order:', orderId);
      const response = await fetch(`http://localhost:5000/api/premium-orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete response:', response.status, data);

      if (response.ok) {
        fetchOrders();
        alert('Premium order deleted successfully!');
      } else {
        alert(data.message || 'Error deleting premium order');
      }
    } catch (error) {
      console.error('Delete premium order error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkDelete = async (statusFilter) => {
    const statusText = statusFilter ? ` with status "${statusFilter}"` : '';
    if (!window.confirm(`Are you sure you want to delete all premium orders${statusText}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log('Bulk deleting premium orders with status:', statusFilter);
      const response = await fetch(`http://localhost:5000/api/premium-orders/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusFilter })
      });

      const data = await response.json();
      console.log('Bulk delete response:', response.status, data);

      if (response.ok) {
        fetchOrders();
        alert(`Successfully deleted ${data.deletedCount} premium orders!`);
      } else {
        alert(data.message || 'Error bulk deleting premium orders');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Network error. Please try again.');
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
    const userName = (order.user?.name || '').toLowerCase();
    const userEmail = (order.user?.email || '').toLowerCase();
    const campaignTitle = (order.premiumCampaign?.title || '').toLowerCase();
    
    return orderId.includes(searchTerm) || 
           userName.includes(searchTerm) || 
           userEmail.includes(searchTerm) ||
           campaignTitle.includes(searchTerm);
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

  const hasPendingSecondPayment = (order) => {
    if (order.paymentPlan === 'installment' && 
        order.paymentRounds?.firstPayment?.status === 'verified' && 
        order.paymentRounds?.secondPayment?.status === 'pending') {
      return true;
    }
    return false;
  };

  const getPendingSecondPaymentCount = () => {
    return orders.filter(order => hasPendingSecondPayment(order)).length;
  };

  // Notification functions
  const hasOrderNotification = (order) => {
    return orderNotifications[order._id] && orderNotifications[order._id].length > 0;
  };

  if (loading) {
    return (
      <div className="admin-premium-orders-page">
        <div className="admin-header">
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
          <h1>Premium Orders & Payments Management</h1>
        </div>
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  const pendingSecondPayments = getPendingSecondPaymentCount();

  return (
    <div className="admin-premium-orders-page">
      <div className="admin-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
        <h1>Premium Orders & Payments Management</h1>
        {pendingSecondPayments > 0 && (
          <div className="notification-bell">
            🔔 {pendingSecondPayments} Pending Second Payment{pendingSecondPayments > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        {/* Search Bar */}
        <div className="search-group">
          <label>🔍 Search:</label>
          <input
            type="text"
            placeholder="Search by order ID, customer name, email, or campaign..."
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

        {pendingSecondPayments > 0 && (
          <button 
            onClick={() => setFilters(prev => ({ ...prev, overallPaymentStatus: 'partial' }))}
            className="pending-second-payment-btn"
          >
            🔔 Pending Second Payment ({pendingSecondPayments})
          </button>
        )}

        <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
      </div>

      {/* Cleanup Section */}
      <div className="cleanup-section">
        <h4>🗑️ Cleanup Options:</h4>
        <div className="cleanup-buttons">
          <button 
            onClick={() => handleBulkDelete('cancelled')}
            className="cleanup-btn cancelled"
            title="Delete all cancelled premium orders"
          >
            🗑️ Delete Cancelled Orders
          </button>
          <button 
            onClick={() => handleBulkDelete('delivered')}
            className="cleanup-btn delivered"
            title="Delete all delivered premium orders"
          >
            🗑️ Delete Delivered Orders
          </button>
          <button 
            onClick={() => handleBulkDelete()}
            className="cleanup-btn all"
            title="Delete all premium orders"
          >
            🗑️ Delete All Orders
          </button>
        </div>
      </div>

      <div className="orders-container">
        {!Array.isArray(orders) || orders.length === 0 ? (
          <div className="no-orders">
            <p>No premium orders found.</p>
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
                    <span className="label">Customer:</span>
                    <span className="value">{order.user?.name || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{order.quantity || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Payment Plan:</span>
                    <span className="value">{order.paymentPlan === 'installment' ? 'Installment' : 'Full Payment'}</span>
                  </div>
                  {order.paymentPlan === 'full' && order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                    <div className="info-row rejection-reason">
                      <span className="label">Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  {order.paymentPlan === 'installment' && order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                    <div className="info-row rejection-reason">
                      <span className="label">First Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  {order.paymentPlan === 'installment' && order.paymentRounds?.secondPayment?.status === 'rejected' && order.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                    <div className="info-row rejection-reason">
                      <span className="label">Second Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.secondPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Total Cost:</span>
                    <span className="value">{formatPrice(order.totalCost)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Order Date:</span>
                    <span className="value">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="order-actions">
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="view-details-btn"
                  >
                    📋 View Details
                  </button>
                  <button 
                    onClick={() => handleDeleteOrder(order._id)}
                    className="delete-order-btn"
                    title="Delete this premium order"
                  >
                    🗑️ Delete
                  </button>
                  
                  <div className="status-actions">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">📦 Pending</option>
                      <option value="processing">📦 Processing</option>
                      <option value="confirmed">📦 Confirmed</option>
                      <option value="shipped">📦 Shipped</option>
                      <option value="delivered">📦 Delivered</option>
                      <option value="cancelled">📦 Cancelled</option>
                    </select>

                    {/* Payment Verification Controls */}
                    <div className="payment-verification-controls">
                      {order.paymentPlan ? (
                        // New payment rounds system
                        order.paymentPlan === 'full' ? (
                          <div className="full-payment-controls">
                            <select 
                              value={order.paymentRounds?.firstPayment?.status || 'pending'}
                              onChange={(e) => handlePaymentVerification(order._id, 'firstPayment', e.target.value)}
                              className="payment-status-select"
                              disabled={order.paymentRounds?.firstPayment?.status === 'verified' || order.paymentRounds?.firstPayment?.status === 'rejected'}
                            >
                              <option value="pending">💳 Payment Pending</option>
                              <option value="verified">💳 Payment Verified</option>
                              <option value="rejected">💳 Payment Rejected</option>
                            </select>
                            {(order.paymentRounds?.firstPayment?.status === 'verified' || order.paymentRounds?.firstPayment?.status === 'rejected') && (
                              <div className="status-note warning">
                                ⚠️ Full payment status cannot be undone
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="installment-payment-controls">
                            <div className="first-payment-control">
                              <select 
                                value={order.paymentRounds?.firstPayment?.status || 'pending'}
                                onChange={(e) => handlePaymentVerification(order._id, 'firstPayment', e.target.value)}
                                className="payment-status-select"
                                disabled={order.paymentRounds?.firstPayment?.status === 'verified' || order.paymentRounds?.firstPayment?.status === 'rejected'}
                              >
                                <option value="pending">💳 1st Payment Pending</option>
                                <option value="verified">💳 1st Payment Verified</option>
                                <option value="rejected">💳 1st Payment Rejected</option>
                              </select>
                              {(order.paymentRounds?.firstPayment?.status === 'verified' || order.paymentRounds?.firstPayment?.status === 'rejected') && (
                                <div className="status-note warning">
                                  ⚠️ First payment status cannot be undone
                                </div>
                              )}
                            </div>
                            <div className="second-payment-control">
                              <select 
                                value={order.paymentRounds?.secondPayment?.status || 'pending'}
                                onChange={(e) => handlePaymentVerification(order._id, 'secondPayment', e.target.value)}
                                className="payment-status-select"
                                disabled={order.paymentRounds?.secondPayment?.status === 'verified'}
                              >
                                <option value="pending">💳 2nd Payment Pending</option>
                                <option value="verified">💳 2nd Payment Verified</option>
                                <option value="rejected">💳 2nd Payment Rejected</option>
                              </select>
                              {order.paymentRounds?.secondPayment?.status === 'verified' && (
                                <div className="status-note warning">
                                  ⚠️ Second payment verification cannot be undone
                                </div>
                              )}
                              {order.paymentRounds?.secondPayment?.status === 'rejected' && (
                                <div className="status-note info">
                                  ℹ️ Second payment rejection can be undone
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ) : (
                        // Legacy payment system
                        <select 
                          value={order.paymentStatus || 'pending'}
                          onChange={(e) => handleLegacyPaymentStatusUpdate(order._id, e.target.value)}
                          className="payment-status-select"
                        >
                          <option value="pending">💳 Payment Pending</option>
                          <option value="verified">💳 Payment Verified</option>
                          <option value="rejected">💳 Payment Rejected</option>
                        </select>
                      )}
                    </div>
                  </div>
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
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedOrder.user?.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedOrder.user?.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedOrder.user?.phone || 'N/A'}</span>
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
                  <h3>Customer Notes</h3>
                  <p className="user-notes">{selectedOrder.userNotes}</p>
                </div>
              )}

              <div className="details-section">
                <h3>Tracking Information</h3>
                <div className="detail-row">
                  <span className="label">Tracking Number:</span>
                  <div className="value">
                    <input 
                      type="text" 
                      value={selectedOrder.trackingNumber || ''}
                      onChange={(e) => handleTrackingUpdate(selectedOrder._id, e.target.value)}
                      placeholder="Enter tracking number"
                      className="tracking-input"
                    />
                  </div>
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

export default AdminPremiumOrders;
