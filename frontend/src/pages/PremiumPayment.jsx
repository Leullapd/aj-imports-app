import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './PremiumPayment.css';

const PremiumPayment = () => {
  const { orderId, round = 'firstPayment' } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    senderName: '',
    paymentMethod: '',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentScreenshot: null
  });

  const paymentMethods = [
    { value: 'telebirr', label: 'Telebirr', description: 'Mobile money transfer via Telebirr', instructions: 'Send money to: 0912345678' },
    { value: 'cbe_birr', label: 'CBE Birr', description: 'Commercial Bank of Ethiopia', instructions: 'Account: 1000123456789' },
    { value: 'amole', label: 'Amole', description: 'Digital wallet payment', instructions: 'Send to: 0923456789' },
    { value: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer', instructions: 'Bank: CBE, Account: 1000123456789' }
  ];

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`API_ENDPOINTS.PREMIUM_ORDERS/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data);
        // Pre-fill form with existing payment data if available
        if (data.paymentPlan && data.paymentRounds) {
          const paymentRound = data.paymentRounds[round];
          if (paymentRound && paymentRound.senderName) {
            setFormData(prev => ({
              ...prev,
              senderName: paymentRound.senderName || '',
              paymentMethod: paymentRound.paymentMethod || '',
              transactionId: paymentRound.transactionId || '',
              paymentDate: paymentRound.paymentDate ? new Date(paymentRound.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            }));
          }
        }
      } else {
        setError(data.message || 'Failed to fetch order');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        paymentScreenshot: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.senderName || !formData.paymentMethod || !formData.transactionId || !formData.paymentScreenshot) {
      alert('Please fill in all required fields and upload a payment screenshot.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('senderName', formData.senderName);
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      formDataToSend.append('transactionId', formData.transactionId);
      formDataToSend.append('paymentDate', formData.paymentDate);
      formDataToSend.append('paymentScreenshot', formData.paymentScreenshot);

      const response = await fetch(`API_ENDPOINTS.PREMIUM_ORDERS/round/${orderId}/${round}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert('Payment submitted successfully! Please wait for admin verification.');
        navigate('/user-premium-orders');
      } else {
        setError(data.message || 'Failed to submit payment');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'ETB 0';
    }
    return `ETB ${Number(price).toLocaleString()}`;
  };

  const getPaymentAmount = () => {
    if (!order) return 0;
    
    if (order.paymentPlan === 'full') {
      return order.paymentRounds?.firstPayment?.amount || order.totalCost;
    } else {
      if (round === 'firstPayment') {
        return order.paymentRounds?.firstPayment?.amount || 0;
      } else if (round === 'secondPayment') {
        return order.paymentRounds?.secondPayment?.amount || 0;
      }
    }
    return 0;
  };

  const getPaymentDescription = () => {
    if (!order) return '';
    
    if (order.paymentPlan === 'full') {
      return 'Full Payment';
    } else {
      if (round === 'firstPayment') {
        return 'First Payment (50% + Air Cargo)';
      } else if (round === 'secondPayment') {
        return 'Second Payment (50%)';
      }
    }
    return '';
  };

  const canSubmitPayment = () => {
    if (!order) return false;
    
    if (order.paymentPlan === 'full') {
      return order.paymentRounds?.firstPayment?.status === 'pending';
    } else {
      if (round === 'firstPayment') {
        return order.paymentRounds?.firstPayment?.status === 'pending';
      } else if (round === 'secondPayment') {
        return order.paymentRounds?.firstPayment?.status === 'verified' && 
               order.paymentRounds?.secondPayment?.status === 'pending';
      }
    }
    return false;
  };

  if (loading) {
    return (
      <div className="premium-payment-page">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="premium-payment-page">
        <div className="error-message">Order not found</div>
      </div>
    );
  }

  if (!canSubmitPayment()) {
    return (
      <div className="premium-payment-page">
        <div className="payment-locked-info">
          <h2>Payment Not Available</h2>
          <p>This payment cannot be submitted at this time.</p>
          <button onClick={() => navigate('/user-premium-orders')} className="back-btn">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <button onClick={() => navigate('/user-premium-orders')} className="back-btn">
            ← Back to Orders
          </button>
          <h1>Submit Premium Payment</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span className="label">Order ID:</span>
              <span className="value">#{order._id.slice(-6)}</span>
            </div>
            <div className="summary-row">
              <span className="label">Campaign:</span>
              <span className="value">{order.premiumCampaign?.title || 'N/A'}</span>
            </div>
            <div className="summary-row">
              <span className="label">Quantity:</span>
              <span className="value">{order.quantity}</span>
            </div>
            <div className="summary-row">
              <span className="label">Payment Type:</span>
              <span className="value">{getPaymentDescription()}</span>
            </div>
            <div className="summary-row total">
              <span className="label">Payment Amount:</span>
              <span className="value">{formatPrice(getPaymentAmount())}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <h2>Payment Details</h2>
          
          <div className="form-group">
            <label htmlFor="senderName">Sender's Name *</label>
            <input
              type="text"
              id="senderName"
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              placeholder="Enter the name used for payment"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {formData.paymentMethod && (
            <div className="payment-instructions">
              <h4>Payment Instructions</h4>
              <p>{paymentMethods.find(m => m.value === formData.paymentMethod)?.instructions}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="transactionId">Transaction ID / Reference Number *</label>
            <input
              type="text"
              id="transactionId"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              placeholder="Enter transaction ID or reference number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentDate">Date of Payment *</label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentScreenshot">Payment Screenshot / Proof *</label>
            <input
              type="file"
              id="paymentScreenshot"
              name="paymentScreenshot"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              required
            />
            <small>Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/user-premium-orders')}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PremiumPayment;
