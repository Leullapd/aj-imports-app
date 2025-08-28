import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">AJ Import</Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="nav desktop-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/campaigns" className="nav-link">Campaigns</Link>
          <Link to="/premium-campaigns" className="nav-link">🚀 Premium</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/create-campaign" className="nav-link">Create Campaign</Link>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </nav>

        {/* Mobile Hamburger Menu */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Desktop Profile Menu */}
        {user && (
          <div className="profile-menu desktop-profile" ref={dropdownRef}>
            <div className="profile-avatar" onClick={() => setDropdownOpen(v => !v)} title={user.name || user.email}>
              {user.name ? user.name.charAt(0).toUpperCase() : <span role="img" aria-label="profile">👤</span>}
            </div>
            {dropdownOpen && (
              <div className="profile-dropdown">
                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Edit Profile</Link>
                <button className="dropdown-item logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`} onClick={handleMobileNavClick}>
          <nav className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef} onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Menu</h3>
              <button className="mobile-close-btn" onClick={handleMobileNavClick}>×</button>
            </div>
            
            <div className="mobile-nav-links">
              <Link to="/" className="mobile-nav-link" onClick={handleMobileNavClick}>🏠 Home</Link>
              <Link to="/campaigns" className="mobile-nav-link" onClick={handleMobileNavClick}>📦 Campaigns</Link>
              <Link to="/premium-campaigns" className="mobile-nav-link" onClick={handleMobileNavClick}>🚀 Premium Campaigns</Link>
              
              {user && (
                <>
                  <Link to="/dashboard" className="mobile-nav-link" onClick={handleMobileNavClick}>📊 Dashboard</Link>
                  <Link to="/create-campaign" className="mobile-nav-link" onClick={handleMobileNavClick}>➕ Create Campaign</Link>
                  <div className="mobile-nav-divider"></div>
                  <Link to="/profile" className="mobile-nav-link" onClick={handleMobileNavClick}>👤 Edit Profile</Link>
                  <button className="mobile-nav-link logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </>
              )}
              
              {!user && (
                <>
                  <div className="mobile-nav-divider"></div>
                  <Link to="/login" className="mobile-nav-link" onClick={handleMobileNavClick}>🔐 Login</Link>
                  <Link to="/register" className="mobile-nav-link" onClick={handleMobileNavClick}>📝 Register</Link>
                </>
              )}
            </div>

            {user && (
              <div className="mobile-user-info">
                <div className="mobile-profile-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : <span role="img" aria-label="profile">👤</span>}
                </div>
                <div className="mobile-user-details">
                  <p className="mobile-user-name">{user.name || 'User'}</p>
                  <p className="mobile-user-email">{user.email}</p>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 