import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Auth.css';

const CustomerProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          phone: userData.phone || '',
          password: '',
          confirmPassword: ''
        });
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if passwords match when updating password
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        phone: formData.phone
      };

      // Only include password if it's being updated
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        // Clear password fields
        setFormData({
          phone: formData.phone,
          password: '',
          confirmPassword: ''
        });
        // Refresh user data
        fetchUserProfile();
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-page">
        <Header />
        <div className="auth-container">
          <div className="auth-card">
            <h2>Loading...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <div className="auth-card">
          <h2>My Profile</h2>
          <p className="auth-subtitle">Manage your account information</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="profile-info">
            <div className="info-group">
              <label>Full Name</label>
              <div className="info-value">{user.name}</div>
            </div>

            <div className="info-group">
              <label>Email Address</label>
              <div className="info-value">{user.email}</div>
            </div>

            <div className="info-group">
              <label>Address</label>
              <div className="info-value">{user.address}</div>
            </div>

            <div className="info-group">
              <label>City</label>
              <div className="info-value">{user.city}</div>
            </div>

            <div className="info-group">
              <label>ID Image</label>
              <div className="info-value">
                {user.idImage ? (
                  <img 
                    src={`http://localhost:5000/${user.idImage}`} 
                    alt="ID" 
                    className="id-image"
                    style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                ) : (
                  <span>No ID image uploaded</span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">New Password (leave blank to keep current)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                minLength="6"
              />
            </div>
            
            <div className="profile-actions">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CustomerProfile;
