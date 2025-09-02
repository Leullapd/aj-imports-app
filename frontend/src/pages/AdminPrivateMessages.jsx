import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './AdminPrivateMessages.css';
import './Admin.css';

const AdminPrivateMessages = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
    // Check if admin token exists
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchConversation(selectedUser._id);
    }
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch('API_ENDPOINTS.PRIVATE_MESSAGES/admin', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      
      // Group messages by user to create conversations
      const userConversations = {};
      data.forEach(message => {
        const userId = message.user._id;
        if (!userConversations[userId]) {
          userConversations[userId] = {
            user: message.user,
            lastMessage: message,
            unreadCount: 0
          };
        }
        if (!message.isRead && message.sender === 'user') {
          userConversations[userId].unreadCount++;
        }
      });

      const conversationsList = Object.values(userConversations);
      setConversations(conversationsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchConversation = async (userId) => {
    try {
      const response = await fetch(`API_ENDPOINTS.PRIVATE_MESSAGES/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setMessages(data);
      scrollToBottom();
      
      // Mark messages as read when conversation is opened
      markConversationAsRead(userId);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const markConversationAsRead = async (userId) => {
    try {
      await fetch(`API_ENDPOINTS.PRIVATE_MESSAGES/conversation/read/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      // Update conversations to reflect read status
      setConversations(prev => prev.map(conv => 
        conv.user._id === userId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;

    const message = input;
    setInput('');

    // Optimistic update
    const optimisticMessage = {
      _id: Date.now().toString(),
      message,
      sender: 'admin',
      createdAt: new Date().toISOString(),
      isRead: false,
      user: selectedUser
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const response = await fetch(`API_ENDPOINTS.PRIVATE_MESSAGES/admin/${selectedUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Dispatch notification event for new admin private message
      window.dispatchEvent(new CustomEvent('new-private-message', {
        detail: {
          sender: 'Admin',
          message: message
        }
      }));

      // Refresh conversation with a small delay to ensure backend has saved
      setTimeout(() => {
        fetchConversation(selectedUser._id);
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <div className="header-left">
                      <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
            <h1>Private Messages</h1>
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
          <div className="loading">Loading conversations...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Private Messages</h1>
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
        <div className="admin-private-messages-container">
        <div className="page-header">
          <h1>🔒 Private Messages</h1>
          <p>Manage private conversations with customers</p>
        </div>

        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-sidebar">
            <h2>Conversations ({conversations.length})</h2>
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.user._id}
                    className={`conversation-item ${selectedUser?._id === conversation.user._id ? 'active' : ''}`}
                    onClick={() => setSelectedUser(conversation.user)}
                  >
                    <div className="conversation-avatar">
                      {conversation.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="conversation-info">
                      <h3>{conversation.user.name}</h3>
                      <p className="last-message">
                        {conversation.lastMessage.message.length > 50
                          ? conversation.lastMessage.message.substring(0, 50) + '...'
                          : conversation.lastMessage.message}
                      </p>
                      <small>{formatDate(conversation.lastMessage.createdAt)}</small>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">{conversation.unreadCount}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="chat-avatar">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{selectedUser.name}</h3>
                      <p>{selectedUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`message ${message.sender === 'admin' ? 'admin-message' : 'user-message'}`}
                      >
                        <div className="message-content">
                          <p>{message.message}</p>
                          <small>{formatDate(message.createdAt)}</small>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                    maxLength={500}
                  />
                  <button type="submit" className="send-btn" disabled={!input.trim()}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="no-selection">
                <div className="no-selection-content">
                  <h2>Select a conversation</h2>
                  <p>Choose a user from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
  );
};

export default AdminPrivateMessages;
