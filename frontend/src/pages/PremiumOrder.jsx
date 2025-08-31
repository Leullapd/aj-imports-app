import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/api';
import './PremiumOrder.css';

const PremiumOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [formData, setFormData] = useState({
    quantity: 1,
    paymentPlan: 'full', // Default to full payment
    paymentMethod: '',
    senderName: '',
    transactionId: '',
    paymentDate: '',
    userNotes: '',
    paymentScreenshot: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [transactionIdError, setTransactionIdError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchCampaign();
    fetchPaymentMethods();
    
    // Set default payment date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setFormData(prev => ({ ...prev, paymentDate: todayString }));
  }, [id, navigate]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.PREMIUM_CAMPAIGNS}/${id}`);
      const data = await response.json();

      if (response.ok) {
        setCampaign(data);
      } else {
        setError(data.message || 'Failed to fetch campaign details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT_METHODS);
      const data = await response.json();

      if (response.ok) {
        setPaymentMethods(data);
      } else {
        console.error('Failed to fetch payment methods:', data.message);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'paymentScreenshot') {
      setFormData(prev => ({ ...prev, paymentScreenshot: files[0] }));
    } else if (name === 'paymentMethod') {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Find and set the selected payment method details
      const selectedMethod = paymentMethods.find(method => method.name === value);
      setSelectedPaymentMethod(selectedMethod || null);
    } else if (name === 'transactionId') {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear transaction ID error when user starts typing
      setTransactionIdError('');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateTransactionId = async (transactionId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PREMIUM_ORDERS}/check-transaction-id?transactionId=${encodeURIComponent(transactionId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking transaction ID:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTransactionIdError('');
    setSubmitting(true);

    // Validate required fields
    if (!formData.paymentScreenshot) {
      setError('Please upload a payment screenshot');
      setSubmitting(false);
      return;
    }

    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      setSubmitting(false);
      return;
    }

    if (!formData.senderName?.trim()) {
      setError('Please enter the sender\'s name');
      setSubmitting(false);
      return;
    }

    if (!formData.transactionId?.trim()) {
      setError('Please enter the transaction ID or reference number');
      setSubmitting(false);
      return;
    }

    if (!formData.paymentDate) {
      setError('Please select the payment date');
      setSubmitting(false);
      return;
    }

    // Validate transaction ID uniqueness
    if (formData.transactionId.trim()) {
      const transactionExists = await validateTransactionId(formData.transactionId.trim());
      if (transactionExists) {
        setTransactionIdError('This transaction ID has already been used. Please use a unique transaction ID.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('premiumCampaignId', id);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('paymentPlan', formData.paymentPlan);
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      formDataToSend.append('senderName', formData.senderName);
      formDataToSend.append('transactionId', formData.transactionId);
      formDataToSend.append('paymentDate', formData.paymentDate);
      formDataToSend.append('userNotes', formData.userNotes);
      formDataToSend.append('paymentScreenshot', formData.paymentScreenshot);

      const response = await fetch(API_ENDPOINTS.PREMIUM_ORDERS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        alert('Premium order placed successfully!');
        navigate('/dashboard'); // Navigate to dashboard where user can see their premium orders
      } else {
        console.error('Order creation failed:', data);
        setError(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const calculateTotalCost = () => {
    if (!campaign) return 0;
    const totalPrice = campaign.premiumPrice * formData.quantity;
    const airCargoCost = campaign.airCargoCost; // Air cargo cost is fixed, not multiplied by quantity
    return totalPrice + airCargoCost;
  };

  if (loading) {
    return (
      <div className="premium-order-page">
        <Header />
        <div className="loading-container">
          <div className="loading">Loading campaign details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="premium-order-page">
        <Header />
        <div className="error-container">
          <div className="error-message">
            {error || 'Campaign not found'}
          </div>
          <Link to="/premium-campaigns" className="back-link">
            ← Back to Premium Campaigns
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="premium-order-page">
      <Header />
      
      <div className="premium-order-container">
        <div className="breadcrumb">
          <Link to="/premium-campaigns">← Back to Premium Campaigns</Link>
        </div>

        <div className="order-content">
          <div className="campaign-summary">
            <h1>Place Premium Order</h1>
            <div className="campaign-card">
              <div className="campaign-image">
                <img 
                  src={`${API_ENDPOINTS.BASE_URL}/${campaign.image}`} 
                  alt={campaign.title}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              <div className="campaign-info">
                <h3>{campaign.title}</h3>
                <p className="campaign-description">{campaign.description}</p>
                <div className="campaign-category">
                  <span className="category-badge">{campaign.category}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-form-section">
            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-section">
                <h3>Order Details</h3>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    max={campaign.totalQuantity - campaign.orderedQuantity}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Payment Plan *</label>
                  <div className="payment-plan-options">
                    <label className="payment-plan-option">
                      <input
                        type="radio"
                        name="paymentPlan"
                        value="full"
                        checked={formData.paymentPlan === 'full'}
                        onChange={handleInputChange}
                      />
                      <div className="plan-details">
                        <span className="plan-name">💳 Full Payment</span>
                        <span className="plan-amount">
                          {formatPrice(campaign.premiumPrice * formData.quantity + campaign.airCargoCost)}
                        </span>
                        <span className="plan-description">Pay the full amount upfront</span>
                      </div>
                    </label>
                    
                    <label className="payment-plan-option">
                      <input
                        type="radio"
                        name="paymentPlan"
                        value="installment"
                        checked={formData.paymentPlan === 'installment'}
                        onChange={handleInputChange}
                      />
                      <div className="plan-details">
                        <span className="plan-name">💳 Installment Payment</span>
                        <span className="plan-amount">
                          First: {formatPrice((campaign.premiumPrice * formData.quantity * 0.5) + campaign.airCargoCost)}<br/>
                          Second: {formatPrice(campaign.premiumPrice * formData.quantity * 0.5)}
                        </span>
                        <span className="plan-description">Pay 50% + air cargo cost first, then 50% later</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

                             <div className="form-section">
                 <h3>Payment Details</h3>
                 <div className="form-group">
                   <label>Sender's Name *</label>
                   <input
                     type="text"
                     name="senderName"
                     value={formData.senderName}
                     onChange={handleInputChange}
                     required
                     placeholder="Enter the name used for payment"
                   />
                 </div>
                 <div className="form-group">
                   <label>Payment Method *</label>
                   <select
                     name="paymentMethod"
                     value={formData.paymentMethod}
                     onChange={handleInputChange}
                     required
                   >
                     <option value="">Select payment method</option>
                     {paymentMethods.map((method) => (
                       <option key={method._id} value={method.name}>
                         {method.icon} {method.name}
                       </option>
                     ))}
                   </select>
                   {paymentMethods.length === 0 && (
                     <p className="help-text">No payment methods available. Please contact admin.</p>
                   )}
                 </div>

                 {/* Payment Method Details */}
                 {selectedPaymentMethod && (
                   <div className="payment-method-details">
                     <div className="method-info">
                       <h4>📋 {selectedPaymentMethod.name} Details</h4>
                       {selectedPaymentMethod.description && (
                         <div className="detail-section">
                           <strong>Description:</strong>
                           <p>{selectedPaymentMethod.description}</p>
                         </div>
                       )}
                       {selectedPaymentMethod.instructions && (
                         <div className="detail-section">
                           <strong>Instructions:</strong>
                           <p>{selectedPaymentMethod.instructions}</p>
                         </div>
                       )}
                       {selectedPaymentMethod.accountInfo && (
                         <div className="detail-section">
                           <strong>Account Information:</strong>
                           <p>{selectedPaymentMethod.accountInfo}</p>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
                 <div className="form-group">
                   <label>Transaction ID / Reference Number *</label>
                   <input
                     type="text"
                     name="transactionId"
                     value={formData.transactionId}
                     onChange={handleInputChange}
                     required
                     placeholder="Enter transaction ID or reference number"
                     className={transactionIdError ? 'error' : ''}
                   />
                   {transactionIdError && (
                     <p className="error-text">{transactionIdError}</p>
                   )}
                   <small className="help-text">This must be a unique transaction ID that hasn't been used before.</small>
                 </div>
                 <div className="form-group">
                   <label>Date of Payment *</label>
                   <input
                     type="date"
                     name="paymentDate"
                     value={formData.paymentDate}
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
                   <label>Payment Screenshot / Proof *</label>
                   <input
                     type="file"
                     name="paymentScreenshot"
                     onChange={handleInputChange}
                     accept=".jpg,.jpeg,.png,.pdf"
                     required
                   />
                   <small>Accepted formats: JPG, PNG, PDF (Max 5MB)</small>
                 </div>
               </div>

              <div className="form-section">
                <h3>Additional Notes</h3>
                <div className="form-group">
                  <textarea
                    name="userNotes"
                    value={formData.userNotes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any additional notes or special instructions..."
                  />
                </div>
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Premium Price:</span>
                  <span>{formatPrice(campaign.premiumPrice)} × {formData.quantity}</span>
                </div>
                <div className="summary-item">
                  <span>Air Cargo Cost:</span>
                  <span>{formatPrice(campaign.airCargoCost)}</span>
                </div>
                <div className="summary-total">
                  <span>Total Cost:</span>
                  <span>{formatPrice(calculateTotalCost())}</span>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => navigate('/premium-campaigns')}>
                  Cancel
                </button>
                                 <button type="submit" className="place-order-btn" disabled={submitting}>
                   {submitting ? 'Submitting Payment...' : 'Submit Payment'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PremiumOrder;
