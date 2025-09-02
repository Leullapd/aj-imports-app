import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import './Admin.css';

const AdminProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
    const [formData, setFormData] = useState({
    title: '',
    category: '',
    image: '',
    price: '',
    totalQuantity: '',
    deadline: '',
    shippingDeadline: '',
    description: '',
    active: true
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      // Fetch all products (including inactive ones) for admin
      const response = await fetch('API_ENDPOINTS.PRODUCTS?admin=true');
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('API_ENDPOINTS.CATEGORIES/admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs properly
    if (type === 'number') {
      // Allow empty string for number inputs
      if (value === '') {
        setFormData({
          ...formData,
          [name]: ''
        });
      } else {
        // Convert to number and validate
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
          setFormData({
            ...formData,
            [name]: value // Keep as string to avoid input issues
          });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `API_ENDPOINTS.PRODUCTS/${editingProduct._id}`
        : API_ENDPOINTS.PRODUCTS;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      // Prepare the data to send
      const productData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        totalQuantity: formData.totalQuantity ? parseInt(formData.totalQuantity) : 0,
        active: formData.active
      };
      
      // Only set orderedQuantity to 0 for new products, preserve it for edits
      if (!editingProduct) {
        productData.orderedQuantity = 0;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      category: product.category,
      image: product.image,
      price: product.price ? product.price.toString() : '',
      totalQuantity: product.totalQuantity ? product.totalQuantity.toString() : '',
      deadline: product.deadline ? new Date(product.deadline).toISOString().split('T')[0] : '',
      shippingDeadline: product.shippingDeadline ? new Date(product.shippingDeadline).toISOString().split('T')[0] : '',
      description: product.description,
      active: product.active !== false // Default to true if not set
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`API_ENDPOINTS.PRODUCTS/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchProducts();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleToggleActive = async (productId, currentActive) => {
    try {
      const response = await fetch(`API_ENDPOINTS.PRODUCTS/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      image: '',
      price: '',
      totalQuantity: '',
      deadline: '',
      shippingDeadline: '',
      description: '',
      active: true
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    fetchProducts();
    fetchCategories();
  };

  const handleSearch = (searchResults) => {
    setFilteredProducts(searchResults);
  };

  const productFilterOptions = [
    {
      value: 'active',
      label: 'Active Products',
      filterFn: (products) => products.filter(product => product.active)
    },
    {
      value: 'inactive',
      label: 'Inactive Products',
      filterFn: (products) => products.filter(product => !product.active)
    },
    {
      value: 'in-stock',
      label: 'In Stock',
      filterFn: (products) => products.filter(product => (product.totalQuantity - (product.orderedQuantity || 0)) > 0)
    },
    {
      value: 'out-of-stock',
      label: 'Out of Stock',
      filterFn: (products) => products.filter(product => (product.totalQuantity - (product.orderedQuantity || 0)) <= 0)
    }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
                              <div className="admin-header">
          <h1>Manage Products</h1>
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
          <div className="loading">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>📦 Product Catalog Management</h1>
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
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
            📦 Add New Product
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-container">
        <div className="page-description">
          <p><strong>Product Catalog:</strong> Manage your inventory of importable items. These products can be included in campaigns for group buying.</p>
          <p style={{marginTop: '10px', fontSize: '0.9rem', color: '#6c757d'}}>
            💡 <strong>Tip:</strong> Create products here first, then use the Campaigns page to create group buying campaigns that include these products.
          </p>
        </div>
        {showAddForm ? (
          <div className="form-section">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Product Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter product title"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <small style={{color: '#dc3545'}}>
                      No categories available. Please create categories first in the Categories section.
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price per Unit (ETB)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="99.99"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="totalQuantity">Total Quantity</label>
                  <input
                    type="number"
                    id="totalQuantity"
                    name="totalQuantity"
                    value={formData.totalQuantity}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Product Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="shippingDeadline">Shipping Deadline</label>
                <input
                  type="date"
                  id="shippingDeadline"
                  name="shippingDeadline"
                  value={formData.shippingDeadline}
                  onChange={handleChange}
                  required
                  min={formData.deadline} // Shipping deadline must be after product deadline
                />
                <small>This is the deadline for shipping orders after the product deadline closes</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Enter product description"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Active (Visible to users)
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" onClick={cancelForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="products-section">
            <div className="section-header">
              <h2>All Products ({filteredProducts.length} of {products.length})</h2>
              <SearchBar
                placeholder="Search products by title, category, description..."
                onSearch={handleSearch}
                data={products}
                searchFields={['title', 'category', 'description']}
                showFilters={true}
                filterOptions={productFilterOptions}
                className="products-search"
              />
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found matching your search criteria.</p>
              </div>
            ) : (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Product Deadline</th>
                      <th>Shipping Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product._id} className={!product.active ? 'inactive-product' : ''}>
                        <td>
                          <img 
                            src={product.image} 
                            alt={product.title} 
                            className="product-thumbnail"
                          />
                        </td>
                        <td>{product.title}</td>
                        <td>{product.category}</td>
                        <td>ETB {product.price}</td>
                        <td>{product.orderedQuantity || 0}/{product.totalQuantity}</td>
                        <td>{new Date(product.deadline).toLocaleDateString()}</td>
                        <td>{product.shippingDeadline ? new Date(product.shippingDeadline).toLocaleDateString() : 'Not set'}</td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(product._id, product.active)}
                            className={`toggle-btn ${product.active ? 'active' : 'inactive'}`}
                            title={product.active ? 'Click to hide from users' : 'Click to show to users'}
                          >
                            {product.active ? '🟢 Active' : '🔴 Inactive'}
                          </button>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleEdit(product)}
                              className="edit-btn"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(product._id)}
                              className="delete-btn"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts; 