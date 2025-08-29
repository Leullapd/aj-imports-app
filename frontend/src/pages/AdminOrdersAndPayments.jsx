import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './AdminOrdersAndPayments.css';

const AdminOrdersAndPayments = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
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
      const response = await fetch(`API_ENDPOINTS.NOTIFICATIONS/orders`, {
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
        await fetch(`API_ENDPOINTS.NOTIFICATIONS/read/${notification._id}`, {
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

      let url = 'API_ENDPOINTS.ORDERS';
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus && filters.paymentStatus !== 'pending-second') {
        params.append('paymentStatus', filters.paymentStatus);
      }
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        let filteredData = data;
        
        // Client-side filtering for pending second payments
        if (filters.paymentStatus === 'pending-second') {
          filteredData = data.filter(hasPendingSecondPayment);
        }
        
        setOrders(filteredData);
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
      const response = await fetch(`API_ENDPOINTS.ORDERS/${orderId}`, {
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

  const handlePaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`API_ENDPOINTS.PAYMENTS/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newPaymentStatus })
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

  const handlePaymentRoundUpdate = async (orderId, round, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      let notes = `Payment ${status} by admin`;
      
      // If rejecting payment, prompt for rejection reason
      if (status === 'rejected') {
        const rejectionReason = prompt(`Please provide a reason for rejecting the ${round === 'first' ? 'first' : 'second'} payment:`);
        if (rejectionReason === null) {
          // User cancelled the prompt
          return;
        }
        notes = rejectionReason.trim() || `Payment rejected by admin`;
      }

      console.log('Payment verification request:', { orderId, round, status, notes });
      const response = await fetch(`API_ENDPOINTS.PAYMENTS/verify/${orderId}/${round}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      const data = await response.json();
      console.log('Payment verification response:', response.status, data);

      if (response.ok) {
        fetchOrders();
        alert(`${round === 'first' ? 'First' : 'Second'} payment ${status} successfully!`);
        
        // Dispatch notification event for payment verification/rejection
        const order = orders.find(o => o._id === orderId);
        if (order) {
          const paymentType = round === 'first' ? 'First' : 'Second';
          const amount = round === 'first' 
            ? `ETB ${(order.totalPrice * 0.5).toLocaleString()}`
            : `ETB ${(order.totalPrice * 0.5).toLocaleString()}`;
          
          if (status === 'verified') {
            window.dispatchEvent(new CustomEvent('payment-verified', {
              detail: {
                orderId: orderId,
                type: `${paymentType} installment`,
                status: status,
                userName: order.user?.name || order.user?.email,
                amount: amount
              }
            }));
          } else if (status === 'rejected') {
            window.dispatchEvent(new CustomEvent('payment-rejected', {
              detail: {
                orderId: orderId,
                type: `${paymentType} installment`,
                reason: notes,
                userName: order.user?.name || order.user?.email,
                amount: amount
              }
            }));
          }
        }
      } else {
        alert(data.message || `Failed to ${status} ${round} payment`);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Search functionality
  const filteredOrders = orders.filter(order => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const orderId = order._id.slice(-6).toLowerCase();
    const userName = (order.user?.name || '').toLowerCase();
    const userEmail = (order.user?.email || '').toLowerCase();
    const campaignTitle = (order.campaign?.title || '').toLowerCase();
    
    return orderId.includes(searchTerm) || 
           userName.includes(searchTerm) || 
           userEmail.includes(searchTerm) ||
           campaignTitle.includes(searchTerm);
  });

  const handleTrackingUpdate = async (orderId, trackingNumber) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`API_ENDPOINTS.ORDERS/${orderId}`, {
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
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log('Deleting order:', orderId, 'Type:', typeof orderId, 'Length:', orderId.length);
      const response = await fetch(`API_ENDPOINTS.ORDERS/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete response:', response.status, data);

      if (response.ok) {
        fetchOrders();
        alert('Order deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkDelete = async (statusFilter) => {
    const confirmMessage = statusFilter 
      ? `Are you sure you want to delete all orders with status "${statusFilter}"? This action cannot be undone.`
      : 'Are you sure you want to delete all orders? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log('Bulk deleting orders with status:', statusFilter);
      const response = await fetch(`API_ENDPOINTS.ORDERS/bulk-delete`, {
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
        alert(`Successfully deleted ${data.deletedCount} orders!`);
      } else {
        alert(data.message || 'Failed to delete orders');
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

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'pending',
      'verified': 'verified',
      'rejected': 'rejected'
    };
    return <span className={`payment-badge ${statusClasses[status] || 'pending'}`}>💳 {status}</span>;
  };

  // Check if there's a pending second payment that needs admin attention
  const hasPendingSecondPayment = (order) => {
    if (order.paymentPlan !== 'installment') return false;
    
    const secondPayment = order.paymentRounds?.secondPayment;
    return secondPayment?.paymentDetails && secondPayment?.status === 'pending';
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

  // No longer need event listeners as we use backend-driven notifications

  if (loading) {
    return (
      <div className="admin-orders-payments-page">
        <div className="admin-header">
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
          <h1>Orders & Payments Management</h1>
        </div>
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders-payments-page">
      <div className="admin-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back to Dashboard</button>
        <h1>
          Orders & Payments Management
          {orders.filter(hasPendingSecondPayment).length > 0 && (
            <span className="pending-payments-count">
              🔔 {orders.filter(hasPendingSecondPayment).length} pending second payments
            </span>
          )}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

             <div className="filters-section">
        {/* Search Bar */}
        <div className="search-group">
          <label>🔍 Search:</label>
          <input
            type="text"
            placeholder="Search by order ID, user name, email, or campaign..."
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
            value={filters.paymentStatus} 
            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
          >
            <option value="">All Payment Statuses</option>
            <option value="no-payment">💳 No Payment Submitted</option>
            <option value="pending">💳 Pending</option>
            <option value="verified">💳 Verified</option>
            <option value="rejected">💳 Rejected</option>
            <option value="pending-second">🔔 Pending Second Payment</option>
          </select>
        </div>

                 <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
         
         {orders.filter(hasPendingSecondPayment).length > 0 && (
           <button 
             onClick={() => setFilters(prev => ({ ...prev, paymentStatus: 'pending-second' }))}
             className="pending-payments-btn"
             title={`View ${orders.filter(hasPendingSecondPayment).length} pending second payments`}
           >
             🔔 View Pending Second Payments ({orders.filter(hasPendingSecondPayment).length})
           </button>
         )}

         {/* Cleanup Actions */}
         <div className="cleanup-actions">
           <button 
             onClick={() => handleBulkDelete('cancelled')}
             className="cleanup-btn cancelled"
             title="Delete all cancelled orders"
           >
             🗑️ Delete Cancelled Orders
           </button>
           <button 
             onClick={() => handleBulkDelete('delivered')}
             className="cleanup-btn delivered"
             title="Delete all delivered orders"
           >
             🗑️ Delete Delivered Orders
           </button>
           <button 
             onClick={() => handleBulkDelete()}
             className="cleanup-btn all"
             title="Delete all orders (use with caution)"
           >
             🗑️ Delete All Orders
           </button>
         </div>
      </div>

      <div className="orders-container">
        {!Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found{filters.search ? ` matching "${filters.search}"` : ''}.</p>
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
                  <h3>
                    Order #{order._id.slice(-6)}
                    {hasPendingSecondPayment(order) && (
                      <span className="notification-bell" title="Second payment submitted - needs verification">
                        🔔
                      </span>
                    )}
                  </h3>
                  <div className="order-badges">
                    <div className="status-label">Payment Status:</div>
                    {order.paymentPlan === 'installment' ? (
                      // For installment plans, show overall payment status
                      <span className={`payment-badge ${order.overallPaymentStatus || 'pending'}`}>
                        💳 {order.overallPaymentStatus || 'pending'}
                      </span>
                    ) : (
                      // For full payment plans, show legacy payment status
                      order.payment ? (
                        getPaymentStatusBadge(order.payment.status)
                      ) : (
                        <span className="payment-badge no-payment">💳 No Payment</span>
                      )
                    )}
                  </div>
                </div>

                <div className="order-info">
                  <div className="info-row">
                    <span className="label">Product:</span>
                    <span className="value">{order.product?.title || 'N/A'}</span>
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
                    <span className="label">Total Cost:</span>
                    <span className="value">{formatPrice(order.totalPrice)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Payment Plan:</span>
                    <span className="value">
                      {order.paymentPlan === 'installment' ? '📅 Installment (50% + 50%)' : '💳 Full Payment'}
                    </span>
                  </div>
                  {order.paymentPlan === 'full' && order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                    <div className="info-row rejection-reason">
                      <span className="label">Payment Rejection:</span>
                      <span className="value rejection-text">
                        ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                      </span>
                    </div>
                  )}
                  {order.paymentPlan === 'installment' && (
                    <>
                      <div className="info-row">
                        <span className="label">First Payment:</span>
                        <span className="value">
                          ETB {order.paymentRounds?.firstPayment?.amount || 0}
                          {order.paymentRounds?.firstPayment?.status && (
                            <span className={`payment-status ${order.paymentRounds.firstPayment.status}`}>
                              {order.paymentRounds.firstPayment.status === 'verified' ? '✅' : 
                               order.paymentRounds.firstPayment.status === 'rejected' ? '❌' : '⏳'}
                            </span>
                          )}
                        </span>
                      </div>
                      {order.paymentRounds?.firstPayment?.status === 'rejected' && order.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                        <div className="info-row rejection-reason">
                          <span className="label">First Payment Rejection:</span>
                          <span className="value rejection-text">
                            ❌ {order.paymentRounds.firstPayment.paymentDetails.notes}
                          </span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="label">Second Payment:</span>
                        <span className="value">
                          ETB {order.paymentRounds?.secondPayment?.amount || 0}
                          {order.paymentRounds?.secondPayment?.status && (
                            <span className={`payment-status ${order.paymentRounds.secondPayment.status}`}>
                              {order.paymentRounds.secondPayment.status === 'verified' ? '✅' : 
                               order.paymentRounds.secondPayment.status === 'rejected' ? '❌' : '⏳'}
                            </span>
                          )}
                        </span>
                      </div>
                      {order.paymentRounds?.secondPayment?.status === 'rejected' && order.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                        <div className="info-row rejection-reason">
                          <span className="label">Second Payment Rejection:</span>
                          <span className="value rejection-text">
                            ❌ {order.paymentRounds.secondPayment.paymentDetails.notes}
                          </span>
                        </div>
                      )}
                      
                    </>
                  )}
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
                     title="Delete this order"
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

                    {/* Two-Payment System Verification Controls */}
                    {order.paymentPlan === 'installment' ? (
                      <div className="payment-rounds-controls">
                        <div className="payment-round-control">
                          <label>First Payment:</label>
                          <select 
                            value={order.paymentRounds?.firstPayment?.status || 'pending'}
                            onChange={(e) => handlePaymentRoundUpdate(order._id, 'first', e.target.value)}
                            className={`payment-select ${order.paymentRounds?.firstPayment?.status === 'rejected' || order.paymentRounds?.firstPayment?.status === 'verified' ? 'disabled' : ''}`}
                            disabled={order.paymentRounds?.firstPayment?.status === 'rejected' || order.paymentRounds?.firstPayment?.status === 'verified'}
                            title={order.paymentRounds?.firstPayment?.status === 'rejected' ? 'Payment rejection cannot be undone' : 
                                   order.paymentRounds?.firstPayment?.status === 'verified' ? 'Payment verification cannot be undone' : ''}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="verified">✅ Verified</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                        </div>
                        
                        <div className="payment-round-control">
                          <label>Second Payment:</label>
                          <select 
                            value={order.paymentRounds?.secondPayment?.status || 'pending'}
                            onChange={(e) => handlePaymentRoundUpdate(order._id, 'second', e.target.value)}
                            className={`payment-select ${order.paymentRounds?.secondPayment?.status === 'verified' ? 'disabled' : ''}`}
                                                disabled={order.paymentRounds?.secondPayment?.status === 'verified'}
                    title={order.paymentRounds?.secondPayment?.status === 'verified' ? 'Payment verification cannot be undone' : 
                          order.paymentRounds?.secondPayment?.status === 'rejected' ? 'Second payment rejection can be undone' : ''}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="verified">✅ Verified</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      /* Full Payment System (Legacy) */
                      order.payment && (
                        <select 
                          value={order.payment.status}
                          onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                          className={`payment-select ${order.payment.status === 'rejected' || order.payment.status === 'verified' ? 'disabled' : ''}`}
                          disabled={order.payment.status === 'rejected' || order.payment.status === 'verified'}
                          title={order.payment.status === 'rejected' ? 'Payment rejection cannot be undone' : 
                                 order.payment.status === 'verified' ? 'Payment verification cannot be undone' : ''}
                        >
                          <option value="pending">💳 Payment Pending</option>
                          <option value="verified">💳 Payment Verified</option>
                          <option value="rejected">💳 Payment Rejected</option>
                        </select>
                      )
                    )}
                    
                    {/* Warning Messages */}
                    {order.paymentRounds?.firstPayment?.status === 'rejected' && (
                      <div className="rejection-warning">
                        ⚠️ First payment rejection cannot be undone
                      </div>
                    )}
                    {order.paymentRounds?.secondPayment?.status === 'rejected' && (
                      <div className="rejection-warning second-payment">
                        ⚠️ Second payment rejection can be undone (item already purchased)
                      </div>
                    )}
                    {(order.paymentRounds?.firstPayment?.status === 'verified' || order.paymentRounds?.secondPayment?.status === 'verified') && (
                      <div className="verification-warning">
                        ✅ Payment verification cannot be undone
                      </div>
                    )}
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
                <h3>Product Information</h3>
                <div className="detail-row">
                  <span className="label">Product:</span>
                  <span className="value">{selectedOrder.product?.title || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{selectedOrder.product?.category || 'N/A'}</span>
                </div>
                {selectedOrder.campaign && (
                  <div className="detail-row">
                    <span className="label">Campaign:</span>
                    <span className="value">{selectedOrder.campaign.title || 'N/A'}</span>
                  </div>
                )}
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
              </div>

              <div className="details-section">
                <h3>Order Information</h3>
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{selectedOrder.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price per unit:</span>
                  <span className="value">{formatPrice(selectedOrder.product?.price)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Cost:</span>
                  <span className="value total">{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Order Status:</span>
                  <span className="value">{getStatusBadge(selectedOrder.status)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Order Date:</span>
                  <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

                                                           {/* Payment Information for Full Payment Orders */}
                {selectedOrder.payment && selectedOrder.paymentPlan !== 'installment' && (
                  <div className="details-section">
                    <h3>Payment Details</h3>
                    <div className="detail-row">
                      <span className="label">Full Payment Amount:</span>
                      <span className="value">ETB {selectedOrder.payment.amount || selectedOrder.totalAmount || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className="value">{getPaymentStatusBadge(selectedOrder.payment.status)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Sender's Name:</span>
                      <span className="value">{selectedOrder.payment.senderName || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Payment Method:</span>
                      <span className="value">{selectedOrder.payment.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Transaction ID:</span>
                      <span className="value">{convertUrlsToLinks(selectedOrder.payment.transactionId || 'N/A')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Payment Date:</span>
                      <span className="value">{selectedOrder.payment.paymentDate ? formatDate(selectedOrder.payment.paymentDate) : 'N/A'}</span>
                    </div>
                    {selectedOrder.payment.notes && (
                       <div className="detail-row">
                         <span className="label">Admin Notes:</span>
                         <span className="value admin-notes">{selectedOrder.payment.notes}</span>
                       </div>
                     )}
                    <div className="detail-row">
                      <span className="label">Verified At:</span>
                      <span className="value">{selectedOrder.payment.verifiedAt ? formatDate(selectedOrder.payment.verifiedAt) : 'Not verified yet'}</span>
                    </div>
                     {selectedOrder.payment.paymentScreenshot && (
                       <div className="detail-row">
                         <span className="label">Payment Screenshot:</span>
                         <span className="value">
                                                      <a 
                              href={`${API_ENDPOINTS.BASE_URL}/payment_screenshots/${selectedOrder.payment.paymentScreenshot}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="screenshot-link"
                            >
                             📷 View Payment Proof
                           </a>
                         </span>
                       </div>
                     )}
                  </div>
                )}

               {/* Payment Information for Installment Orders */}
               {selectedOrder.paymentPlan === 'installment' && (
                 <div className="details-section">
                   <h3>Payment Details</h3>
                   <h4>Installment Payments</h4>
                   
                   {/* First Payment (50% + Air Cargo) */}
                   <div className="payment-subsection">
                     <h5>First Payment (50% + Air Cargo)</h5>
                     <div className="detail-row">
                       <span className="label">Amount:</span>
                       <span className="value">ETB {selectedOrder.paymentRounds?.firstPayment?.amount || 0}</span>
                     </div>
                     <div className="detail-row">
                       <span className="label">Status:</span>
                       <span className="value">
                         {selectedOrder.paymentRounds?.firstPayment?.status && (
                           <span className={`payment-status ${selectedOrder.paymentRounds.firstPayment.status}`}>
                             {selectedOrder.paymentRounds.firstPayment.status === 'verified' ? ' ✅ Verified' : 
                              selectedOrder.paymentRounds.firstPayment.status === 'rejected' ? ' ❌ Rejected' : ' ⏳ Pending'}
                           </span>
                         )}
                       </span>
                     </div>
                     {selectedOrder.paymentRounds?.firstPayment?.paymentDetails && (
                       <>
                         <div className="detail-row">
                           <span className="label">Sender's Name:</span>
                           <span className="value">{selectedOrder.paymentRounds.firstPayment.paymentDetails.senderName || 'N/A'}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Payment Method:</span>
                           <span className="value">{selectedOrder.paymentRounds.firstPayment.paymentDetails.paymentMethod || 'N/A'}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Transaction ID:</span>
                           <span className="value">{convertUrlsToLinks(selectedOrder.paymentRounds.firstPayment.paymentDetails.transactionId || 'N/A')}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Payment Date:</span>
                           <span className="value">{selectedOrder.paymentRounds.firstPayment.paymentDetails.paymentDate ? formatDate(selectedOrder.paymentRounds.firstPayment.paymentDetails.paymentDate) : 'N/A'}</span>
                         </div>
                         {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                           <div className="detail-row">
                             <span className="label">Admin Notes:</span>
                             <span className="value admin-notes">{selectedOrder.paymentRounds.firstPayment.paymentDetails.notes}</span>
                           </div>
                         )}
                         <div className="detail-row">
                           <span className="label">Verified At:</span>
                           <span className="value">{selectedOrder.paymentRounds.firstPayment.verifiedAt ? formatDate(selectedOrder.paymentRounds.firstPayment.verifiedAt) : 'Not verified yet'}</span>
                         </div>
                         {selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.paymentScreenshot && (
                           <div className="detail-row">
                             <span className="label">Payment Screenshot:</span>
                             <span className="value">
                               <a 
                                 href={`${API_ENDPOINTS.BASE_URL}/payment_screenshots/${selectedOrder.paymentRounds.firstPayment.paymentDetails.paymentScreenshot}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="screenshot-link"
                               >
                                📷 View Payment Proof
                               </a>
                             </span>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                   
                   {/* Second Payment (50%) */}
                   <div className="payment-subsection">
                     <h5>Second Payment (50%)</h5>
                     <div className="detail-row">
                       <span className="label">Amount:</span>
                       <span className="value">ETB {selectedOrder.paymentRounds?.secondPayment?.amount || 0}</span>
                     </div>
                     <div className="detail-row">
                       <span className="label">Status:</span>
                       <span className="value">
                         {selectedOrder.paymentRounds?.secondPayment?.status && (
                           <span className={`payment-status ${selectedOrder.paymentRounds.secondPayment.status}`}>
                             {selectedOrder.paymentRounds.secondPayment.status === 'verified' ? ' ✅ Verified' : 
                              selectedOrder.paymentRounds.secondPayment.status === 'rejected' ? ' ❌ Rejected' : ' ⏳ Pending'}
                           </span>
                         )}
                       </span>
                     </div>
                     {selectedOrder.paymentRounds?.secondPayment?.paymentDetails && (
                       <>
                         <div className="detail-row">
                           <span className="label">Sender's Name:</span>
                           <span className="value">{selectedOrder.paymentRounds.secondPayment.paymentDetails.senderName || 'N/A'}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Payment Method:</span>
                           <span className="value">{selectedOrder.paymentRounds.secondPayment.paymentDetails.paymentMethod || 'N/A'}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Transaction ID:</span>
                           <span className="value">{convertUrlsToLinks(selectedOrder.paymentRounds.secondPayment.paymentDetails.transactionId || 'N/A')}</span>
                         </div>
                         <div className="detail-row">
                           <span className="label">Payment Date:</span>
                           <span className="value">{selectedOrder.paymentRounds.secondPayment.paymentDetails.paymentDate ? formatDate(selectedOrder.paymentRounds.secondPayment.paymentDetails.paymentDate) : 'N/A'}</span>
                         </div>
                         {selectedOrder.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                           <div className="detail-row">
                             <span className="label">Admin Notes:</span>
                             <span className="value admin-notes">{selectedOrder.paymentRounds.secondPayment.paymentDetails.notes}</span>
                           </div>
                         )}
                         <div className="detail-row">
                           <span className="label">Verified At:</span>
                           <span className="value">{selectedOrder.paymentRounds.secondPayment.verifiedAt ? formatDate(selectedOrder.paymentRounds.secondPayment.verifiedAt) : 'Not verified yet'}</span>
                         </div>
                         {selectedOrder.paymentRounds?.secondPayment?.paymentDetails?.paymentScreenshot && (
                           <div className="detail-row">
                             <span className="label">Payment Screenshot:</span>
                             <span className="value">
                               <a 
                                 href={`${API_ENDPOINTS.BASE_URL}/payment_screenshots/${selectedOrder.paymentRounds.secondPayment.paymentDetails.paymentScreenshot}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="screenshot-link"
                               >
                                📷 View Payment Proof
                               </a>
                             </span>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 </div>
               )}

               {/* No Payment Submitted */}
               {!selectedOrder.payment && selectedOrder.paymentPlan !== 'installment' && (
                 <div className="details-section">
                   <h3>Payment Status</h3>
                   <p className="payment-required">No payment has been submitted for this order.</p>
                 </div>
               )}

              {selectedOrder.campaign?.shippingDeadline && (
                <div className="details-section">
                  <h3>Campaign Information</h3>
                  <div className="detail-row">
                    <span className="label">Campaign Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.campaign.deadline)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Shipping Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.campaign.shippingDeadline)}</span>
                  </div>
                </div>
              )}

              {selectedOrder.product?.shippingDeadline && !selectedOrder.campaign?.shippingDeadline && (
                <div className="details-section">
                  <h3>Product Information</h3>
                  <div className="detail-row">
                    <span className="label">Product Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.product.deadline)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Shipping Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.product.shippingDeadline)}</span>
                  </div>
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

export default AdminOrdersAndPayments;
