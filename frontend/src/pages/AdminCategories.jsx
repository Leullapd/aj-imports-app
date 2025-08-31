import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './Admin.css';

const AdminCategories = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
    const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    description: '',
    sortOrder: 0,
    active: true
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      setRefreshing(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.CATEGORIES}/admin`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
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
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      const url = editingCategory 
        ? `API_ENDPOINTS.CATEGORIES/${editingCategory._id}`
        : API_ENDPOINTS.CATEGORIES;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const requestBody = {
        ...formData,
        sortOrder: parseInt(formData.sortOrder)
      };
      
      console.log('Sending category data:', requestBody);
      console.log('Admin token:', adminToken ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Category created/updated successfully:', result);
        setShowAddForm(false);
        setEditingCategory(null);
        resetForm();
        fetchCategories();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(errorData.message || 'Error saving category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
      active: category.active
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch(`API_ENDPOINTS.CATEGORIES/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          fetchCategories();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Error deleting category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      }
    }
  };

  const handleToggleActive = async (categoryId, currentActive) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`API_ENDPOINTS.CATEGORIES/${categoryId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error toggling category status');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      alert('Error toggling category status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '📦',
      description: '',
      sortOrder: 0,
      active: true
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const popularIcons = [
    '📱', '👕', '🍳', '👜', '🏡', '⚽', '🚗', '🔒', '🔧', '💄',
    '📦', '🎮', '📚', '🏥', '🎨', '🎵', '📷', '💻', '⌚', '👟'
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Manage Categories</h1>
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
          <div className="loading">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🏷️ Category Management</h1>
        <div className="header-actions">
          <button 
            onClick={fetchCategories}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'loading' : ''}`}
          >
            <span className="refresh-icon">🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="add-btn"
            style={{ display: showAddForm ? 'none' : 'block' }}
          >
            🏷️ Add New Category
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-container">
        <div className="page-description">
          <p><strong>Category Management:</strong> Create and manage product categories. Categories help organize your product catalog and improve user experience.</p>
          <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#6c757d'}}>
            💡 <strong>Tip:</strong> Categories with higher sort order appear first. Use icons to make categories more visually appealing.
          </p>
        </div>

        {showAddForm ? (
          <div className="form-section">
            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Category Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter category name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="icon">Icon</label>
                  <div className="icon-selector">
                    <input
                      type="text"
                      id="icon"
                      name="icon"
                      value={formData.icon}
                      onChange={handleChange}
                      required
                      placeholder="📦"
                      maxLength="2"
                    />
                    <div className="icon-suggestions">
                      {popularIcons.map((icon, index) => (
                        <button
                          key={index}
                          type="button"
                          className="icon-option"
                          onClick={() => setFormData({...formData, icon})}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the category"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="sortOrder">Sort Order</label>
                  <input
                    type="number"
                    id="sortOrder"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                  <small>Higher numbers appear first</small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  Active (visible to users)
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button type="button" onClick={cancelForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="categories-section">
            <div className="categories-header">
              <h2>All Categories ({categories.length})</h2>
            </div>
            
            {categories.length > 0 ? (
              <div className="categories-grid">
                {categories.map(category => (
                  <div key={category._id} className={`category-card ${!category.active ? 'inactive-category' : ''}`}>
                    <div className="category-header">
                      <div className="category-info">
                        <span className="category-icon">{category.icon}</span>
                        <h3>{category.name}</h3>
                      </div>
                      <div className="category-actions">
                        <button
                          onClick={() => handleToggleActive(category._id, category.active)}
                          className={`toggle-btn ${category.active ? 'active' : 'inactive'}`}
                        >
                          {category.active ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => handleEdit(category)} className="edit-btn">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(category._id)} className="delete-btn">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="category-description">
                      {category.description || 'No description provided'}
                    </div>
                    
                    <div className="category-details">
                      <div className="detail-item">
                        <strong>Slug:</strong> {category.slug}
                      </div>
                      <div className="detail-item">
                        <strong>Sort Order:</strong> {category.sortOrder}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-categories">
                <p>No categories found. Create your first category to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
