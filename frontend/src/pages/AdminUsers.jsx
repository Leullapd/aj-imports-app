import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { API_ENDPOINTS } from '../config/api';
import './Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      // Process users to add full image URLs
      const processedUsers = data.map(user => ({
        ...user,
        idImageUrl: user.idImage ? `${API_ENDPOINTS.BASE_URL}/${user.idImage}` : null
      }));
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`API_ENDPOINTS.USERS/${userId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        // handle error
      }
    }
  };

  const handleSearch = (searchResults) => {
    setFilteredUsers(searchResults);
  };

  const userFilterOptions = [
    {
      value: 'verified',
      label: 'Verified Users',
      filterFn: (users) => users.filter(user => user.isVerified)
    },
    {
      value: 'unverified',
      label: 'Unverified Users',
      filterFn: (users) => users.filter(user => !user.isVerified)
    },
    {
      value: 'with-id',
      label: 'With ID Uploaded',
      filterFn: (users) => users.filter(user => user.idImage)
    },
    {
      value: 'without-id',
      label: 'Without ID Uploaded',
      filterFn: (users) => users.filter(user => !user.idImage)
    }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1>Manage Users</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
        <div className="admin-container">
          <div className="loading">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <div className="header-actions">
          <button 
            onClick={fetchUsers}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'loading' : ''}`}
          >
            <span className="refresh-icon">🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>
      <div className="admin-container">
        <div className="users-section">
          <div className="section-header">
            <h2>All Users ({filteredUsers.length} of {users.length})</h2>
            <SearchBar
              placeholder="Search users by name, email, phone, city..."
              onSearch={handleSearch}
              data={users}
              searchFields={['name', 'email', 'phone', 'city', 'address']}
              showFilters={true}
              filterOptions={userFilterOptions}
              className="users-search"
            />
          </div>
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No users found matching your search criteria.</p>
            </div>
          ) : (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>ID Image</th>
                    <th>Registered At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td className="user-id">{user._id.slice(-8)}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td className="address-cell">{user.address}</td>
                      <td>{user.city}</td>
                      <td className="id-image-cell">
                        {user.idImageUrl ? (
                          <div className="id-image-container">
                            <img 
                              src={user.idImageUrl} 
                              alt="User ID" 
                              className="id-image-thumbnail"
                              onClick={() => handleViewImage(user.idImageUrl)}
                              title="Click to view full size"
                            />
                            <button 
                              className="view-id-btn"
                              onClick={() => handleViewImage(user.idImageUrl)}
                            >
                              👁️ View ID
                            </button>
                          </div>
                        ) : (
                          <span className="no-id">No ID uploaded</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="view-btn"
                            title="View full user details"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="delete-btn"
                            title="Delete user"
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
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="user-detail-modal-overlay" onClick={handleCloseUserModal}>
          <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseUserModal}>×</button>
            
            <div className="modal-content">
              <h2>User Details</h2>
              
              <div className="user-info-grid">
                <div className="info-section">
                  <h3>Basic Information</h3>
                  <div className="info-item">
                    <strong>User ID:</strong> {selectedUser._id}
                  </div>
                  <div className="info-item">
                    <strong>Name:</strong> {selectedUser.name}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {selectedUser.email}
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {selectedUser.phone}
                  </div>
                  <div className="info-item">
                    <strong>Address:</strong> {selectedUser.address}
                  </div>
                  <div className="info-item">
                    <strong>City:</strong> {selectedUser.city}
                  </div>
                  <div className="info-item">
                    <strong>Registered:</strong> {new Date(selectedUser.createdAt).toLocaleString()}
                  </div>
                </div>

                                 <div className="id-section">
                   <h3>ID Verification</h3>
                   {selectedUser.idImageUrl ? (
                     <div className="id-image-display">
                       <img 
                         src={selectedUser.idImageUrl} 
                         alt="User ID" 
                         className="id-image-full"
                       />
                       <div className="id-actions">
                         <button 
                           className="download-btn"
                           onClick={() => handleViewImage(selectedUser.idImageUrl)}
                         >
                           📥 Download ID
                         </button>
                         <button 
                           className="view-full-btn"
                           onClick={() => handleViewImage(selectedUser.idImageUrl)}
                         >
                           👁️ View Full Size
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="no-id-uploaded">
                       <p>⚠️ No ID document uploaded</p>
                     </div>
                   )}
                 </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="close-modal-btn"
                  onClick={handleCloseUserModal}
                >
                  Close
                </button>
              </div>
            </div>
                     </div>
         </div>
       )}

       {/* Image Viewer Modal */}
       {showImageModal && selectedImage && (
         <div className="image-viewer-modal-overlay" onClick={handleCloseImageModal}>
           <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
             <button className="close-btn" onClick={handleCloseImageModal}>×</button>
             
             <div className="image-viewer-content">
               <img 
                 src={selectedImage} 
                 alt="ID Document" 
                 className="full-size-image"
               />
               <div className="image-actions">
                 <button 
                   className="download-image-btn"
                   onClick={() => {
                     const link = document.createElement('a');
                     link.href = selectedImage;
                     link.download = 'id-document.jpg';
                     link.click();
                   }}
                 >
                   📥 Download Image
                 </button>
                 <button 
                   className="close-image-btn"
                   onClick={handleCloseImageModal}
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default AdminUsers;