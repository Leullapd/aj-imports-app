import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/api';
import './AdminProfile.css';
import './Admin.css';

const AdminProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Check if admin token exists
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchAdminProfile();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.admin-profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const fetchAdminProfile = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
             const response = await fetch('`${API_ENDPOINTS.BASE_URL}/api/auth/admin/profile`', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        username: data.username || data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || ''
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile information' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required' });
      return false;
    }

    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return false;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required to change password' });
      return false;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return false;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const adminToken = localStorage.getItem('adminToken');
      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim()
      };

      // Only include password fields if new password is provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

             console.log('Sending update data:', updateData);
       console.log('Admin token:', adminToken ? 'Present' : 'Missing');
       
       const response = await fetch('`${API_ENDPOINTS.BASE_URL}/api/auth/admin/profile`', {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${adminToken}`
         },
         body: JSON.stringify(updateData)
       });

       console.log('Response status:', response.status);
       console.log('Response headers:', response.headers);

       if (!response.ok) {
         const errorText = await response.text();
         console.error('Error response text:', errorText);
         throw new Error(`HTTP ${response.status}: ${errorText}`);
       }

                     const data = await response.json();

       setMessage({ type: 'success', text: 'Profile updated successfully!' });
       
       // Clear password fields after successful update
       setFormData(prev => ({
         ...prev,
         currentPassword: '',
         newPassword: '',
         confirmPassword: ''
       }));

       // If password was changed and new token is provided, update the token
       if (formData.newPassword && data.token) {
         localStorage.setItem('adminToken', data.token);
         setMessage({ type: 'success', text: 'Profile and password updated successfully! You can continue using the admin panel.' });
       } else if (formData.newPassword) {
         // If password was changed but no new token, redirect to login
         setTimeout(() => {
           localStorage.removeItem('adminToken');
           setMessage({ type: 'success', text: 'Password updated successfully! Please login again with your new password.' });
           setTimeout(() => {
             navigate('/admin/login');
           }, 2000);
         }, 1000);
       }

    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Edit Profile</h1>
        </div>
        <div className="admin-profile-dropdown">
          <div className="admin-profile-avatar" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
            <span className="admin-avatar">👨‍💼</span>
            <span className="admin-name">Admin</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          {profileDropdownOpen && (
            <div className="admin-dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate('/admin/profile')}>
                ✏️ Edit Profile
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <span>👨‍💼</span>
              </div>
              <h2>Admin Profile</h2>
              <p>Update your account information</p>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

                             <div className="form-group">
                 <label htmlFor="username">Username</label>
                 <input
                   type="text"
                   id="username"
                   name="username"
                   value={formData.username}
                   onChange={handleChange}
                   placeholder="Enter username"
                   required
                 />
               </div>

               <div className="form-group">
                 <label htmlFor="email">Email</label>
                 <input
                   type="email"
                   id="email"
                   name="email"
                   value={formData.email}
                   onChange={handleChange}
                   placeholder="Enter email"
                   required
                 />
               </div>

               <div className="form-group">
                 <label htmlFor="phone">Phone</label>
                 <input
                   type="text"
                   id="phone"
                   name="phone"
                   value={formData.phone}
                   onChange={handleChange}
                   placeholder="Enter phone number"
                 />
               </div>

               <div className="form-group">
                 <label htmlFor="address">Address</label>
                 <input
                   type="text"
                   id="address"
                   name="address"
                   value={formData.address}
                   onChange={handleChange}
                   placeholder="Enter address"
                 />
               </div>

               <div className="form-group">
                 <label htmlFor="city">City</label>
                 <input
                   type="text"
                   id="city"
                   name="city"
                   value={formData.city}
                   onChange={handleChange}
                   placeholder="Enter city"
                 />
               </div>

              <div className="password-section">
                <h3>Change Password (Optional)</h3>
                <p className="section-description">
                  Leave password fields empty if you don't want to change your password
                </p>

                                 <div className="form-group">
                   <label htmlFor="currentPassword">Current Password (Required to change password)</label>
                   <input
                     type="password"
                     id="currentPassword"
                     name="currentPassword"
                     value={formData.currentPassword}
                     onChange={handleChange}
                     placeholder="Enter current password"
                   />
                 </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
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
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate('/admin/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
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

export default AdminProfile;
