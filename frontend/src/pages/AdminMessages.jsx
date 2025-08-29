import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import './Admin.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchMessages();
  }, [navigate]);

  const fetchMessages = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('API_ENDPOINTS.MESSAGES');
      const data = await response.json();
      setMessages(data.reverse()); // Show newest first
    } catch (error) {
      setMessages([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(`API_ENDPOINTS.MESSAGES/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setMessages(messages.filter(msg => msg._id !== messageId));
        alert('Message deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting message');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkDeleteMessages = async () => {
    if (!window.confirm('Are you sure you want to delete ALL messages? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch('API_ENDPOINTS.MESSAGES/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages([]);
        alert('All messages deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Error deleting messages');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch('API_ENDPOINTS.MESSAGES', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'Admin',
          text: newMessage,
          avatar: '👨‍💼' // Admin avatar
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages([sentMessage, ...messages]); // Add new message at the top
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (originalMessage) => {
    const replyText = prompt(`Reply to ${originalMessage.user}:`);
    if (!replyText || !replyText.trim()) return;

    setSending(true);
    try {
      const response = await fetch('API_ENDPOINTS.MESSAGES', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'Admin',
          text: `@${originalMessage.user} ${replyText}`,
          avatar: '👨‍💼'
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages([sentMessage, ...messages]);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>All Chat Messages</h1>
        <div className="header-actions">
          <button 
            onClick={fetchMessages}
            disabled={refreshing}
            className={`refresh-btn ${refreshing ? 'loading' : ''}`}
          >
            <span className="refresh-icon">🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleBulkDeleteMessages} className="bulk-delete-btn">🗑️ Delete All Messages</button>
          <button onClick={() => navigate('/admin/dashboard')} className="logout-btn">Back to Dashboard</button>
        </div>
      </div>
      <div className="admin-container">
        <div className="messages-section">
          <h2>All User Messages</h2>
          <div className="messages-card">
            {loading ? (
              <p className="no-messages">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="no-messages">No messages found</p>
            ) : (
              <div className="messages-list">
                {messages.map((message) => (
                  <div key={message._id} className="message-item">
                    <div className="message-header">
                      <span className="message-user">
                        {message.user} {message.user === 'Admin' && '👨‍💼'}
                      </span>
                      <span className="message-time">{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="message-text">{message.text}</p>
                    <div className="message-actions">
                      {message.user !== 'Admin' && (
                        <button 
                          onClick={() => handleReply(message)} 
                          className="reply-btn"
                        >
                          Reply
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteMessage(message._id)} 
                        className="delete-message-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Message Input */}
          <div className="admin-message-input">
            <h3>Send Message as Admin</h3>
            <form onSubmit={handleSendMessage} className="message-form">
              <div className="input-group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="message-textarea"
                  rows="3"
                  disabled={sending}
                />
                <button 
                  type="submit" 
                  className="send-message-btn"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
