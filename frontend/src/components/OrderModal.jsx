import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderModal.css';

const OrderModal = ({ product, isOpen, onClose, onOrder }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
    if (!isOpen || !product) return null;

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('You must be logged in to place an order.');
      setLoading(false);
      return;
    }

    // Check if product is still available
    const availableQuantity = product.totalQuantity - (product.orderedQuantity || 0);
    if (parseInt(quantity) > availableQuantity) {
      setError(`Only ${availableQuantity} units available`);
      setLoading(false);
      return;
    }

    try {
      // Create the order first
      const orderResponse = await fetch('API_ENDPOINTS.ORDERS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.id || user._id,
          product: product._id,
          quantity: parseInt(quantity),
          paymentPlan: paymentPlan
        })
      });

      const orderData = await orderResponse.json();
      
      if (orderResponse.ok) {
        setSuccess('Order created! Redirecting to payment...');
        
        // Dispatch notification event for new order
        const user = JSON.parse(localStorage.getItem('user'));
        window.dispatchEvent(new CustomEvent('new-order', {
          detail: {
            orderId: orderData._id,
            productName: product.title,
            userName: user.name || user.email
          }
        }));
        
        setTimeout(() => {
          navigate(`/payment/${orderData._id}`);
        }, 1000);
      } else {
        setError(orderData.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-modal-overlay">
      <div className="order-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Place Order: {product.title}</h2>
        <img src={product.image} alt={product.title} className="order-modal-img" />
        <form onSubmit={handleOrder} className="order-form">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            min="1"
            max={product.totalQuantity - (product.orderedQuantity || 0)}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
          />
          
          <label htmlFor="paymentPlan">Payment Plan</label>
          <select
            id="paymentPlan"
            value={paymentPlan}
            onChange={e => setPaymentPlan(e.target.value)}
            required
          >
            <option value="full">💳 Full Payment</option>
            <option value="installment">📅 Installment (50% + 50%)</option>
          </select>
          
          <div className="payment-plan-info">
            {paymentPlan === 'full' ? (
              <div className="plan-details">
                <span>💰 Total Amount: ETB {(product.price * quantity).toLocaleString()}</span>
                <span>📋 Pay once and done!</span>
              </div>
            ) : (
              <div className="plan-details">
                <span>💰 First Payment: ETB {Math.ceil((product.price * quantity * 0.5)).toLocaleString()}</span>
                <span>💰 Second Payment: ETB {(product.price * quantity - Math.ceil(product.price * quantity * 0.5)).toLocaleString()}</span>
                <span>📅 Second payment due in 30 days</span>
              </div>
            )}
          </div>
          <div className="order-modal-actions">
            <button type="submit" className="order-btn" disabled={loading}>
              {loading ? 'Creating Order...' : 'Order Now & Pay'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
          {error && <div className="order-error">{error}</div>}
          {success && <div className="order-success">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default OrderModal;