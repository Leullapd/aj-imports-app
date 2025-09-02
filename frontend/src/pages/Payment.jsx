import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();

  const { orderId } = useParams();
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    senderName: '',
    paymentMethod: '',
    transactionId: '',
    paymentDate: '',
    paymentScreenshot: null
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPaymentRound, setCurrentPaymentRound] = useState('first');

  // Function to determine which payment round should be selected
  const getDefaultPaymentRound = (order) => {
    if (order.paymentPlan !== 'installment') return 'first';
    
    const firstPaymentStatus = order.paymentRounds?.firstPayment?.status;
    const secondPaymentStatus = order.paymentRounds?.secondPayment?.status;
    
    // If first payment is not verified, select first payment
    if (firstPaymentStatus !== 'verified') {
      return 'first';
    }
    
    // If first payment is verified but second payment is not verified, select second payment
    if (firstPaymentStatus === 'verified' && secondPaymentStatus !== 'verified') {
      return 'second';
    }
    
    // If both payments are verified, default to first (shouldn't happen in practice)
    return 'first';
  };

  // Function to check if second payment is allowed
  const isSecondPaymentAllowed = (order) => {
    if (order.paymentPlan !== 'installment') return false;
    const firstPaymentStatus = order.paymentRounds?.firstPayment?.status;
    return firstPaymentStatus === 'verified';
  };

  useEffect(() => {
    // Fetch order details using orderId from URL
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`API_ENDPOINTS.ORDERS/${orderId}`);
        if (response.ok) {
                  const order = await response.json();
        setOrderDetails(order);
        
        // Set the correct payment round based on order status
        const defaultRound = getDefaultPaymentRound(order);
        setCurrentPaymentRound(defaultRound);
        } else {
          setError('Order not found');
          navigate('/orders');
          return;
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
        navigate('/orders');
        return;
      }
    };

    if (orderId) {
      fetchOrderDetails();
    } else {
      navigate('/orders');
      return;
    }
    
    // Set default payment date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setPaymentData(prev => ({ ...prev, paymentDate: todayString }));
    
    // Fetch available payment methods
    fetchPaymentMethods();
  }, [orderId, navigate]);

  const fetchPaymentMethods = async () => {
    try {
      console.log('Fetching payment methods...');
      const response = await fetch(API_ENDPOINTS.PAYMENT_METHODS);
      console.log('Payment methods response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment methods data:', data);
        setPaymentMethods(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch payment methods:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setPaymentData(prev => ({
        ...prev,
        paymentScreenshot: file
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!paymentData.senderName || !paymentData.paymentMethod || 
        !paymentData.transactionId || !paymentData.paymentDate || 
        !paymentData.paymentScreenshot) {
      setError('Please fill in all required fields and upload payment proof');
      setLoading(false);
      return;
    }

    // Validate payment round for installment plans
    if (orderDetails.paymentPlan === 'installment') {
      if (currentPaymentRound === 'second' && !isSecondPaymentAllowed(orderDetails)) {
        setError('Cannot submit second payment. First payment must be verified by admin before submitting second payment.');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('Submitting payment...');
      
      // Choose the correct API endpoint based on payment plan
      let paymentUrl;
      const formData = new FormData();
      
      if (orderDetails.paymentPlan === 'installment') {
        // Use the new two-payment system for installment plans
        paymentUrl = `API_ENDPOINTS.PAYMENTS/round/${orderId}/${currentPaymentRound}`;
        formData.append('senderName', paymentData.senderName);
        formData.append('paymentMethod', paymentData.paymentMethod);
        formData.append('transactionId', paymentData.transactionId);
        formData.append('paymentDate', paymentData.paymentDate);
        formData.append('paymentScreenshot', paymentData.paymentScreenshot);
      } else {
        // Use the legacy payment system for full payments
        paymentUrl = API_ENDPOINTS.PAYMENTS;
        formData.append('orderId', orderId);
        formData.append('senderName', paymentData.senderName);
        formData.append('paymentMethod', paymentData.paymentMethod);
        formData.append('transactionId', paymentData.transactionId);
        formData.append('paymentDate', paymentData.paymentDate);
        formData.append('paymentScreenshot', paymentData.paymentScreenshot);
      }

      const paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        body: formData
      });

      const paymentResponseData = await paymentResponse.json();
      console.log('Payment response:', paymentResponse.status, paymentResponseData);

      if (paymentResponse.ok) {
        const successMessage = orderDetails.paymentPlan === 'installment' 
          ? `${currentPaymentRound === 'first' ? 'First' : 'Second'} payment submitted successfully! We will verify your payment and update your order status.`
          : 'Payment submitted successfully! We will verify your payment and update your order status.';
        
        setSuccess(successMessage);
        
        // Dispatch notification event for new payment
        const user = JSON.parse(localStorage.getItem('user'));
        const paymentType = orderDetails.paymentPlan === 'installment' 
          ? `${currentPaymentRound === 'first' ? 'First' : 'Second'} installment`
          : 'Full payment';
        const amount = orderDetails.paymentPlan === 'installment'
          ? currentPaymentRound === 'first' 
            ? `ETB ${(orderDetails.totalPrice * 0.5).toLocaleString()}`
            : `ETB ${(orderDetails.totalPrice * 0.5).toLocaleString()}`
          : `ETB ${orderDetails.totalPrice.toLocaleString()}`;
        
        window.dispatchEvent(new CustomEvent('new-payment', {
          detail: {
            orderId: orderId,
            amount: amount,
            userName: user.name || user.email,
            paymentType: paymentType
          }
        }));
        
        // Dispatch a custom event for global notification
        window.dispatchEvent(new CustomEvent('order-success', { 
          detail: { 
            product: orderDetails.product, 
            quantity: orderDetails.quantity 
          } 
        }));
        
        setTimeout(() => {
          navigate('/orders-payments');
        }, 3000);
      } else {
        setError(paymentResponseData.message || 'Failed to submit payment');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setError('Network error. Please try again. Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!orderDetails) {
    return null;
  }

  const { product, quantity, totalPrice } = orderDetails;

  return (
    <div className="payment-page">
      <Header />
      
      <div className="payment-container">
        <div className="payment-content">
          <h1>Payment Details</h1>
          
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-item">
              <span>Product:</span>
              <span>{product.title || product.name}</span>
            </div>
            <div className="summary-item">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="summary-item">
              <span>Price per unit:</span>
              <span>ETB {product.price}</span>
            </div>
            <div className="summary-item total">
              <span>Total Amount:</span>
              <span>ETB {totalPrice}</span>
            </div>
            <div className="summary-item">
              <span>Payment Plan:</span>
              <span>{orderDetails.paymentPlan === 'installment' ? '📅 Installment (50% + 50%)' : '💳 Full Payment'}</span>
            </div>
            {orderDetails.paymentPlan === 'installment' && (
              <>
                <div className="summary-item">
                  <span>First Payment:</span>
                  <span>ETB {orderDetails.paymentRounds?.firstPayment?.amount}</span>
                </div>
                <div className="summary-item">
                  <span>Second Payment:</span>
                  <span>ETB {orderDetails.paymentRounds?.secondPayment?.amount}</span>
                </div>
                <div className="summary-item">
                  <span>Second Payment Due:</span>
                  <span>{orderDetails.paymentRounds?.secondPayment?.dueDate ? new Date(orderDetails.paymentRounds.secondPayment.dueDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </>
            )}
            <div className="summary-item">
              <span>Order ID:</span>
              <span className="order-id">{orderId}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="payment-methods">
            <h2>Payment Methods</h2>
            
            {paymentMethods.length > 0 ? (
              paymentMethods.map(method => (
                <div key={method._id} className="payment-method">
                  <h3>{method.icon} {method.name}</h3>
                  <div className="payment-details">
                    <p><strong>Description:</strong> {method.description}</p>
                    {method.instructions && (
                      <p><strong>Instructions:</strong> {method.instructions}</p>
                    )}
                    {method.accountInfo && (
                      <p><strong>Account Info:</strong> {method.accountInfo}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="loading-payment-methods">Loading payment methods...</div>
            )}
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="payment-form">
            <h2>Payment Details</h2>
            
            {orderDetails.paymentPlan === 'installment' && (
              <div className="form-group">
                <label htmlFor="paymentRound">Payment Round *</label>
                <select
                  id="paymentRound"
                  value={currentPaymentRound}
                  onChange={(e) => setCurrentPaymentRound(e.target.value)}
                  required
                >
                  <option 
                    value="first" 
                    disabled={orderDetails.paymentRounds?.firstPayment?.status === 'verified'}
                  >
                    First Payment (50%) {orderDetails.paymentRounds?.firstPayment?.status === 'verified' ? '✅' : ''}
                  </option>
                  <option 
                    value="second" 
                    disabled={orderDetails.paymentRounds?.secondPayment?.status === 'verified' || !isSecondPaymentAllowed(orderDetails)}
                  >
                    Second Payment (50%) {orderDetails.paymentRounds?.secondPayment?.status === 'verified' ? '✅' : !isSecondPaymentAllowed(orderDetails) ? '🔒' : ''}
                  </option>
                </select>
                <div className="payment-round-info">
                  {currentPaymentRound === 'first' ? (
                    <span>💰 Amount: ETB {orderDetails.paymentRounds?.firstPayment?.amount}</span>
                  ) : (
                    <span>💰 Amount: ETB {orderDetails.paymentRounds?.secondPayment?.amount}</span>
                  )}
                  {!isSecondPaymentAllowed(orderDetails) && (
                    <div className="payment-locked-info">
                      🔒 Second payment is locked until first payment is verified by admin
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="senderName">Sender's Name *</label>
              <input
                type="text"
                id="senderName"
                name="senderName"
                value={paymentData.senderName}
                onChange={handleInputChange}
                required
                placeholder="Enter the name used for payment"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method *</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleInputChange}
                required
              >
                <option value="">Select payment method</option>
                {paymentMethods.map(method => (
                  <option key={method._id} value={method.code}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
              {paymentData.paymentMethod && (
                <div className="payment-method-info">
                  {(() => {
                    const selectedMethod = paymentMethods.find(m => m.code === paymentData.paymentMethod);
                    return selectedMethod ? (
                      <div>
                        <p><strong>{selectedMethod.description}</strong></p>
                        {selectedMethod.instructions && (
                          <p><strong>Instructions:</strong> {selectedMethod.instructions}</p>
                        )}
                        {selectedMethod.accountInfo && (
                          <p><strong>Account Info:</strong> {selectedMethod.accountInfo}</p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="transactionId">Transaction ID / Reference Number *</label>
              <input
                type="text"
                id="transactionId"
                name="transactionId"
                value={paymentData.transactionId}
                onChange={handleInputChange}
                required
                placeholder="Enter transaction ID or reference number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentDate">Date of Payment *</label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={paymentData.paymentDate}
                onChange={handleInputChange}
                required
                max={(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentScreenshot">Payment Screenshot / Proof *</label>
              <input
                type="file"
                id="paymentScreenshot"
                name="paymentScreenshot"
                onChange={handleFileChange}
                required
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <small>Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 
               orderDetails.paymentPlan === 'installment' && currentPaymentRound === 'second' ? 
               'Submit Second Payment' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Payment;
