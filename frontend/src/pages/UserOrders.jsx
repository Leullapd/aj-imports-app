import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShippingCountdown from '../components/ShippingCountdown';
import { API_ENDPOINTS } from '../config/api';
import './UserOrders.css';


const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('You must be logged in to view your orders.');
      setLoading(false);
      return;
    }
    fetch(`API_ENDPOINTS.ORDERS?user=${user.id || user._id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch orders.');
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'payment_pending': return 'status-payment-pending';
      case 'payment_rejected': return 'status-payment-rejected';
      default: return 'status-pending';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending': return 'payment-pending';
      case 'verified': return 'payment-verified';
      case 'rejected': return 'payment-rejected';
      default: return 'payment-pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-orders-page">
      <Header />
      <div className="user-orders-container">
        <h1>My Orders</h1>
        {loading ? (
          <div className="loading">Loading your orders...</div>
        ) : error ? (
          <div className="order-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
            <Link to="/campaigns" className="shop-now-btn">Browse Campaigns</Link>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Order #{order._id.slice(-8)}</div>
                  <div className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                
                <div className="order-content">
                  <div className="product-info">
                    <img 
                      src={order.product?.image || '/placeholder-product.jpg'} 
                      alt={order.product?.title || 'Product'} 
                      className="product-image"
                    />
                    <div className="product-details">
                      <h3>{order.product?.title || 'Product Unavailable'}</h3>
                      <p className="product-category">{order.product?.category || 'General'}</p>
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-row">
                      <span>Quantity:</span>
                      <span>{order.quantity}</span>
                    </div>
                    <div className="detail-row">
                      <span>Price per unit:</span>
                      <span>ETB {order.product?.price || 0}</span>
                    </div>
                    <div className="detail-row total">
                      <span>Total:</span>
                      <span>ETB {(order.quantity * (order.product?.price || 0)).toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Ordered:</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                                         <div className="detail-row">
                       <span>Payment Status:</span>
                       {order.payment ? (
                         <span className={`payment-status ${getPaymentStatusColor(order.payment.status)}`}>
                           {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
                         </span>
                       ) : (
                         <span className="payment-status payment-not-submitted">No Payment Submitted</span>
                       )}
                     </div>
                    {order.payment?.verifiedAt && (
                      <div className="detail-row">
                        <span>Payment Verified:</span>
                        <span>{formatDate(order.payment.verifiedAt)}</span>
                      </div>
                    )}
                    {order.payment?.notes && (
                      <div className="detail-row">
                        <span>Admin Notes:</span>
                        <span className="admin-notes">{order.payment.notes}</span>
                      </div>
                    )}
                    {order.campaign?.shippingDeadline && (
                      <div className="detail-row shipping-countdown-row">
                        <ShippingCountdown 
                          shippingDeadline={order.campaign.shippingDeadline}
                          campaignDeadline={order.campaign.deadline}
                        />
                      </div>
                    )}
                    {order.product?.shippingDeadline && !order.campaign?.shippingDeadline && (
                      <div className="detail-row shipping-countdown-row">
                        <ShippingCountdown 
                          shippingDeadline={order.product.shippingDeadline}
                          campaignDeadline={order.product.deadline}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserOrders;