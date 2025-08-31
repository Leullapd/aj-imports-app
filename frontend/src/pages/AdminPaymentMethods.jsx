import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminPaymentMethods = () => {
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    icon: '💳',
    instructions: '',
    accountInfo: '',
    isActive: true
  });
    useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchPaymentMethods();
  }, [navigate]);

  const fetchPaymentMethods = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('API_ENDPOINTS.PAYMENT_METHODS/admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        setError('Failed to fetch payment methods');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const url = editingMethod 
        ? `API_ENDPOINTS.PAYMENT_METHODS/${editingMethod._id}`
        : API_ENDPOINTS.PAYMENT_METHODS;
      
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingMethod(null);
        resetForm();
        fetchPaymentMethods();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save payment method');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description,
      icon: method.icon,
      instructions: method.instructions,
      accountInfo: method.accountInfo,
      isActive: method.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`API_ENDPOINTS.PAYMENT_METHODS/${methodId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          fetchPaymentMethods();
        } else {
          setError('Failed to delete payment method');
        }
      } catch (err) {
        setError('Network error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      icon: '💳',
      instructions: '',
      accountInfo: '',
      isActive: true
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingMethod(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Manage Payment Methods</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
        <div className="admin-container">
          <div className="loading">Loading payment methods...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Manage Payment Methods</h1>
        <div className="header-actions">
          <button 
            className="add-btn" 
            onClick={() => setShowForm(true)}
          >
            + Add Payment Method
          </button>
          <button 
            className="back-btn" 
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-container">
        {error && <div className="error-message">{error}</div>}

        {/* Payment Methods Form */}
        {showForm && (
          <div className="form-section">
            <h2>{editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Bank Transfer"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="code">Code *</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., bank_transfer"
                  />
                  <small>Unique identifier (no spaces, use underscores)</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Brief description of the payment method"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="icon">Icon</label>
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="💳"
                  />
                  <small>Emoji or icon symbol</small>
                </div>
                <div className="form-group">
                  <label htmlFor="isActive">Status</label>
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Active (visible to customers)</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="instructions">Instructions</label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Step-by-step instructions for customers"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountInfo">Account Information</label>
                <textarea
                  id="accountInfo"
                  name="accountInfo"
                  value={formData.accountInfo}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Bank account details, phone numbers, etc."
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={cancelForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingMethod ? 'Update' : 'Create'} Payment Method
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Methods List */}
        <div className="payment-methods-section">
          <h2>All Payment Methods ({paymentMethods.length})</h2>
          
          {paymentMethods.length === 0 ? (
            <div className="no-payment-methods">
              <p>No payment methods configured. Add your first one above!</p>
            </div>
          ) : (
            <div className="payment-methods-grid">
              {paymentMethods.map(method => (
                <div key={method._id} className={`payment-method-card ${!method.isActive ? 'inactive' : ''}`}>
                  <div className="method-header">
                    <div className="method-icon">{method.icon}</div>
                    <div className="method-info">
                      <h3>{method.name}</h3>
                      <span className="method-code">{method.code}</span>
                    </div>
                    <div className="method-status">
                      <span className={`status-badge ${method.isActive ? 'active' : 'inactive'}`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="method-description">
                    <p>{method.description}</p>
                  </div>

                  {method.instructions && (
                    <div className="method-instructions">
                      <strong>Instructions:</strong>
                      <p>{method.instructions}</p>
                    </div>
                  )}

                  {method.accountInfo && (
                    <div className="method-account">
                      <strong>Account Info:</strong>
                      <p>{method.accountInfo}</p>
                    </div>
                  )}

                  <div className="method-actions">
                    <button
                      onClick={() => handleEdit(method)}
                      className="edit-btn"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(method._id)}
                      className="delete-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentMethods;
