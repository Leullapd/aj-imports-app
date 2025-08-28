import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShippingCountdown from '../components/ShippingCountdown';
import './UserOrdersAndPayments.css';

const UserOrdersAndPayments = () => {
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
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('You must be logged in to view your orders.');
      setLoading(false);
      return;
    }
    fetchOrders(user.id || user._id);
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

  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      setError('');

      let url = `http://localhost:5000/api/orders?user=${userId}`;
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (params.toString()) url += `&${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
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
    const campaignTitle = (order.campaign?.title || '').toLowerCase();
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
    // For installment orders, show overall payment status
    if (order.paymentPlan === 'installment') {
      const firstPaymentStatus = order.paymentRounds?.firstPayment?.status;
      const secondPaymentStatus = order.paymentRounds?.secondPayment?.status;
      
      if (firstPaymentStatus === 'verified' && secondPaymentStatus === 'verified') {
        return <span className="payment-badge verified">💳 Fully Paid</span>;
      } else if (firstPaymentStatus === 'verified' && secondPaymentStatus !== 'verified') {
        return <span className="payment-badge partial">💳 Partially Paid</span>;
      } else if (firstPaymentStatus === 'pending' && order.paymentRounds?.firstPayment?.paymentDetails) {
        return <span className="payment-badge pending">💳 Payment Pending</span>;
      } else {
        return <span className="payment-badge no-payment">💳 No Payment</span>;
      }
    }
    
    // For full payment orders, use legacy payment status
    if (order.payment) {
      const statusClasses = {
        'pending': 'pending',
        'verified': 'verified',
        'rejected': 'rejected'
      };
      return <span className={`payment-badge ${statusClasses[order.payment.status] || 'pending'}`}>💳 {order.payment.status}</span>;
    }
    
    return <span className="payment-badge no-payment">💳 No Payment</span>;
  };

  const handleRefresh = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      fetchOrders(user.id || user._id);
    }
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

  // Listen for payment verification/rejection events
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      const { orderId, action } = event.detail;
      if (action === 'verified' || action === 'rejected') {
        // This event listener is no longer needed as notifications are fetched via polling
      }
    };

    window.addEventListener('payment-verified', handlePaymentUpdate);
    window.addEventListener('payment-rejected', handlePaymentUpdate);

    return () => {
      window.removeEventListener('payment-verified', handlePaymentUpdate);
      window.removeEventListener('payment-rejected', handlePaymentUpdate);
    };
  }, []);



  if (loading) {
    return (
      <div className="user-orders-payments-page">
        <Header />
        <div className="user-orders-payments-container">
          <h1>My Orders & Payments</h1>
          <div className="loading">Loading your orders...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="user-orders-payments-page">
      <Header />
      
      <div className="user-orders-payments-container">
        <h1>My Orders & Payments</h1>
        
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
              value={filters.paymentStatus} 
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
            >
              <option value="">All Payment Statuses</option>
              <option value="no-payment">💳 No Payment Submitted</option>
              <option value="pending">💳 Pending</option>
              <option value="verified">💳 Verified</option>
              <option value="rejected">💳 Rejected</option>
            </select>
          </div>

          <button onClick={handleRefresh} className="refresh-btn">🔄 Refresh</button>
        </div>

                 

        <div className="orders-container">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No Orders Yet</h3>
              <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
              <Link to="/campaigns" className="shop-now-btn">Browse Campaigns</Link>
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
                    <div className="product-info">
                      <img 
                        src={order.product?.image || '/placeholder-product.jpg'} 
                        alt={order.product?.title || 'Product'} 
                        className="product-image"
                      />
                      <div className="product-details">
                        <h4>{order.product?.title || 'Product Unavailable'}</h4>
                        <p className="product-category">{order.product?.category || 'General'}</p>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{order.quantity}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Price per unit:</span>
                      <span className="value">{formatPrice(order.product?.price)}</span>
                    </div>
                    <div className="info-row total">
                      <span className="label">Total Cost:</span>
                      <span className="value">{formatPrice(order.totalPrice)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Order Date:</span>
                      <span className="value">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.campaign?.shippingDeadline && (
                      <div className="info-row shipping-countdown-row">
                        <ShippingCountdown 
                          shippingDeadline={order.campaign.shippingDeadline}
                          campaignDeadline={order.campaign.deadline}
                        />
                      </div>
                    )}
                    {order.product?.shippingDeadline && !order.campaign?.shippingDeadline && (
                      <div className="info-row shipping-countdown-row">
                        <ShippingCountdown 
                          shippingDeadline={order.product.shippingDeadline}
                          campaignDeadline={order.product.deadline}
                        />
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                                         <button 
                       onClick={() => viewOrderDetails(order)}
                       className="view-details-btn"
                     >
                       📋 View Details
                     </button>
                    
                    {/* Payment Action Buttons */}
                    {order.paymentPlan === 'installment' ? (
                      // Installment payment logic
                      (() => {
                        const firstPaymentStatus = order.paymentRounds?.firstPayment?.status;
                        const secondPaymentStatus = order.paymentRounds?.secondPayment?.status;
                        
                        // If first payment is not verified, show first payment button
                        if (firstPaymentStatus !== 'verified') {
                          return (
                            <Link 
                              to={`/payment/${order._id}`}
                              className="submit-payment-btn"
                            >
                              💳 Submit First Payment
                            </Link>
                          );
                        }
                        
                        // If first payment is verified but second payment is not verified, show second payment button
                        if (firstPaymentStatus === 'verified' && secondPaymentStatus !== 'verified') {
                          return (
                            <Link 
                              to={`/payment/${order._id}`}
                              className="submit-payment-btn"
                            >
                              💳 Submit Second Payment
                            </Link>
                          );
                        }
                        
                        // If both payments are verified, no button needed
                        return null;
                      })()
                    ) : (
                      // Full payment logic
                      !order.payment && (
                        <Link 
                          to={`/payment/${order._id}`}
                          className="submit-payment-btn"
                        >
                          💳 Submit Payment
                        </Link>
                      )
                    )}
                  </div>

                  {/* Shipping Status at Bottom */}
                  <div className="shipping-status-bottom">
                    <div className="status-label">Shipping Status:</div>
                    {getStatusBadge(order.status)}
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
              ))}
            </div>
          )}
        </div>
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

                             {/* Payment Information for Installment Orders */}
               {selectedOrder.paymentPlan === 'installment' && (
                 <div className="details-section">
                   <h3>Payment Details</h3>
                   <h4>Installment Payments</h4>
                   
                   {/* Payment Action Button for Installment Orders */}
                   {(() => {
                     const firstPaymentStatus = selectedOrder.paymentRounds?.firstPayment?.status;
                     const secondPaymentStatus = selectedOrder.paymentRounds?.secondPayment?.status;
                     
                     // If first payment is not verified, show first payment button
                     if (firstPaymentStatus !== 'verified') {
                       return (
                         <div className="detail-row">
                           <span className="label">Action Required:</span>
                           <span className="value">
                             <Link 
                               to={`/payment/${selectedOrder._id}`}
                               className="submit-payment-btn modal-btn"
                             >
                               💳 Submit First Payment
                             </Link>
                           </span>
                         </div>
                       );
                     }
                     
                     // If first payment is verified but second payment is not verified, show second payment button
                     if (firstPaymentStatus === 'verified' && secondPaymentStatus !== 'verified') {
                       return (
                         <div className="detail-row">
                           <span className="label">Action Required:</span>
                           <span className="value">
                             <Link 
                               to={`/payment/${selectedOrder._id}`}
                               className="submit-payment-btn modal-btn"
                             >
                               💳 Submit Second Payment
                             </Link>
                           </span>
                         </div>
                       );
                     }
                     
                     // If both payments are verified, show completion message
                     if (firstPaymentStatus === 'verified' && secondPaymentStatus === 'verified') {
                       return (
                         <div className="detail-row">
                           <span className="label">Payment Status:</span>
                           <span className="value">✅ All payments completed</span>
                         </div>
                       );
                     }
                     
                     return null;
                   })()}
                   
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
                     {selectedOrder.paymentRounds?.firstPayment?.status === 'rejected' && selectedOrder.paymentRounds?.firstPayment?.paymentDetails?.notes && (
                       <div className="detail-row rejection-reason">
                         <span className="label">Payment Rejection:</span>
                         <span className="value rejection-text">
                           ❌ {selectedOrder.paymentRounds.firstPayment.paymentDetails.notes}
                         </span>
                       </div>
                     )}
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
                                 href={`http://localhost:5000/payment_screenshots/${selectedOrder.paymentRounds.firstPayment.paymentDetails.paymentScreenshot}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="screenshot-link"
                               >
                                📷 View Screenshot
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
                     {selectedOrder.paymentRounds?.secondPayment?.status === 'rejected' && selectedOrder.paymentRounds?.secondPayment?.paymentDetails?.notes && (
                       <div className="detail-row rejection-reason">
                         <span className="label">Payment Rejection:</span>
                         <span className="value rejection-text">
                           ❌ {selectedOrder.paymentRounds.secondPayment.paymentDetails.notes}
                         </span>
                       </div>
                     )}
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
                                 href={`http://localhost:5000/payment_screenshots/${selectedOrder.paymentRounds.secondPayment.paymentDetails.paymentScreenshot}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="screenshot-link"
                               >
                                📷 View Screenshot
                               </a>
                             </span>
                           </div>
                         )}
                       </>
                     )}
                   </div>
                 </div>
               )}

                               {/* Payment Information for Full Payment Orders */}
                {selectedOrder.paymentPlan !== 'installment' && selectedOrder.payment && (
                  <div className="details-section">
                    <h3>Payment Details</h3>
                    <div className="detail-row">
                      <span className="label">Full Payment Amount:</span>
                      <span className="value">ETB {selectedOrder.payment.amount || selectedOrder.totalAmount || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className="value">{getPaymentStatusBadge(selectedOrder)}</span>
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
                            href={`http://localhost:5000/payment_screenshots/${selectedOrder.payment.paymentScreenshot}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="screenshot-link"
                          >
                            📷 View Screenshot
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                )}

               {/* Payment Required for Full Payment Orders */}
               {selectedOrder.paymentPlan !== 'installment' && !selectedOrder.payment && (
                 <div className="details-section">
                   <h3>Payment Required</h3>
                   <p className="payment-required">This order requires payment submission.</p>
                   <Link 
                     to={`/payment/${selectedOrder._id}`}
                     className="submit-payment-btn modal-btn"
                   >
                     💳 Submit Payment Now
                   </Link>
                 </div>
               )}

              {selectedOrder.campaign?.shippingDeadline && (
                <div className="details-section">
                  <h3>Shipping Information</h3>
                  <div className="detail-row">
                    <span className="label">Campaign Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.campaign.deadline)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Shipping Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.campaign.shippingDeadline)}</span>
                  </div>
                  <div className="detail-row">
                    <ShippingCountdown 
                      shippingDeadline={selectedOrder.campaign.shippingDeadline}
                      campaignDeadline={selectedOrder.campaign.deadline}
                    />
                  </div>
                </div>
              )}

              {selectedOrder.product?.shippingDeadline && !selectedOrder.campaign?.shippingDeadline && (
                <div className="details-section">
                  <h3>Shipping Information</h3>
                  <div className="detail-row">
                    <span className="label">Product Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.product.deadline)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Shipping Deadline:</span>
                    <span className="value">{formatDate(selectedOrder.product.shippingDeadline)}</span>
                  </div>
                  <div className="detail-row">
                    <ShippingCountdown 
                      shippingDeadline={selectedOrder.product.shippingDeadline}
                      campaignDeadline={selectedOrder.product.deadline}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default UserOrdersAndPayments;
