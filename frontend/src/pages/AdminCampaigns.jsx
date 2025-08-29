import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import './Admin.css';

const AdminCampaigns = () => {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    products: [],
    deadline: '',
    shippingDeadline: ''
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchCampaigns();
    fetchProducts();
  }, [navigate]);

  const fetchCampaigns = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('API_ENDPOINTS.CAMPAIGNS');
      const data = await response.json();
      setCampaigns(data);
      setFilteredCampaigns(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.PRODUCTS');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProductChange = (e) => {
    const selectedProducts = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      products: selectedProducts
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCampaign 
        ? `API_ENDPOINTS.CAMPAIGNS/${editingCampaign._id}`
        : 'API_ENDPOINTS.CAMPAIGNS';
      
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: 'admin' // You can replace this with actual admin user ID
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingCampaign(null);
        resetForm();
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      products: campaign.products.map(p => p._id || p),
      deadline: campaign.deadline ? new Date(campaign.deadline).toISOString().split('T')[0] : '',
      shippingDeadline: campaign.shippingDeadline ? new Date(campaign.shippingDeadline).toISOString().split('T')[0] : ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        const response = await fetch(`API_ENDPOINTS.CAMPAIGNS/${campaignId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchCampaigns();
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      products: [],
      deadline: '',
      shippingDeadline: ''
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingCampaign(null);
    resetForm();
  };

  const getProductNames = (productIds) => {
    if (!Array.isArray(productIds)) return 'No products';
    return productIds.map(id => {
      const product = products.find(p => p._id === id);
      return product ? product.title : 'Unknown Product';
    }).join(', ');
  };

  const handleSearch = (searchResults) => {
    setFilteredCampaigns(searchResults);
  };

  const campaignFilterOptions = [
    {
      value: 'active',
      label: 'Active Campaigns',
      filterFn: (campaigns) => campaigns.filter(campaign => new Date(campaign.deadline) > new Date())
    },
    {
      value: 'expired',
      label: 'Expired Campaigns',
      filterFn: (campaigns) => campaigns.filter(campaign => new Date(campaign.deadline) <= new Date())
    },
    {
      value: 'with-products',
      label: 'With Products',
      filterFn: (campaigns) => campaigns.filter(campaign => campaign.products && campaign.products.length > 0)
    }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Manage Campaigns</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
        <div className="admin-container">
          <div className="loading">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🚀 Import Campaign Management</h1>
        <div className="header-actions">
          <button 
            onClick={() => {
              fetchCampaigns();
              fetchProducts();
            }}
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
            🚀 Create New Campaign
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-container">
        <div className="page-description">
          <p><strong>Import Campaigns:</strong> Create and manage group buying campaigns. Each campaign can include multiple products and has a deadline for orders.</p>
        </div>
        {showAddForm ? (
          <div className="form-section">
            <h2>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label htmlFor="title">Campaign Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter campaign title"
                />
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
                  placeholder="Enter campaign description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="products">Select Products (Hold Ctrl/Cmd to select multiple)</label>
                <select
                  id="products"
                  name="products"
                  value={formData.products}
                  onChange={handleProductChange}
                  required
                  multiple
                  size="6"
                >
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.title} - ETB {product.price} ({product.category})
                    </option>
                  ))}
                </select>
                <small>Selected: {formData.products.length} products</small>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Campaign Deadline</label>
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
                  min={formData.deadline} // Shipping deadline must be after campaign deadline
                />
                <small>This is the deadline for shipping orders after the campaign closes</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button type="button" onClick={cancelForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="campaigns-section">
            <div className="section-header">
              <h2>All Campaigns ({filteredCampaigns.length} of {campaigns.length})</h2>
              <SearchBar
                placeholder="Search campaigns by title, description, products..."
                onSearch={handleSearch}
                data={campaigns}
                searchFields={['title', 'description']}
                showFilters={true}
                filterOptions={campaignFilterOptions}
                className="campaigns-search"
              />
            </div>
            
            {filteredCampaigns.length === 0 ? (
              <div className="no-campaigns">
                <p>No campaigns found matching your search criteria.</p>
              </div>
            ) : (
              <div className="campaigns-grid">
                {filteredCampaigns.map(campaign => (
                  <div key={campaign._id} className="campaign-card">
                    <div className="campaign-header">
                      <h3>{campaign.title}</h3>
                      <div className="campaign-actions">
                        <button 
                          onClick={() => handleEdit(campaign)}
                          className="edit-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(campaign._id)}
                          className="delete-btn"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    
                    <p className="campaign-description">{campaign.description}</p>
                    
                    <div className="campaign-details">
                      <div className="detail-item">
                        <strong>Products:</strong> {getProductNames(campaign.products)}
                      </div>
                      <div className="detail-item">
                        <strong>Campaign Deadline:</strong> {new Date(campaign.deadline).toLocaleDateString()}
                      </div>
                      <div className="detail-item">
                        <strong>Shipping Deadline:</strong> {campaign.shippingDeadline ? new Date(campaign.shippingDeadline).toLocaleDateString() : 'Not set'}
                      </div>
                      <div className="detail-item">
                        <strong>Created:</strong> {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaigns; 