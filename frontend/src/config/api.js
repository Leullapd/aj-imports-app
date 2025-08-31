// API Configuration
// This file centralizes all API endpoints

const API_CONFIG = {
  // Get base URL from environment variable or fallback to production backend
  get BASE_URL() {
    // Temporarily hardcode the backend URL for Netlify deployment
    const backendUrl = 'https://aj-imports-back.onrender.com';
    
    // Log for debugging
    console.log('API Config Debug:', {
      'REACT_APP_API_BASE_URL': process.env.REACT_APP_API_BASE_URL,
      'AJIMPORT_URL': process.env.AJIMPORT_URL,
      'backendUrl': backendUrl
    });
    
    return backendUrl;
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
  REGISTER: `${API_CONFIG.BASE_URL}/api/auth/register`,
  ADMIN_LOGIN: `${API_CONFIG.BASE_URL}/api/auth/admin-login`,
  
  // Products
  PRODUCTS: `${API_CONFIG.BASE_URL}/api/products`,
  
  // Campaigns
  CAMPAIGNS: `${API_CONFIG.BASE_URL}/api/campaigns`,
  PREMIUM_CAMPAIGNS: `${API_CONFIG.BASE_URL}/api/premium-campaigns`,
  
  // Orders
  ORDERS: `${API_CONFIG.BASE_URL}/api/orders`,
  PREMIUM_ORDERS: `${API_CONFIG.BASE_URL}/api/premium-orders`,
  
  // Payments
  PAYMENTS: `${API_CONFIG.BASE_URL}/api/payments`,
  PAYMENT_METHODS: `${API_CONFIG.BASE_URL}/api/payment-methods`,
  
  // Users
  USERS: `${API_CONFIG.BASE_URL}/api/users`,
  
  // Messages
  MESSAGES: `${API_CONFIG.BASE_URL}/api/messages`,
  PRIVATE_MESSAGES: `${API_CONFIG.BASE_URL}/api/private-messages`,
  
  // Categories
  CATEGORIES: `${API_CONFIG.BASE_URL}/api/categories`,
  
  // Notifications
  NOTIFICATIONS: `${API_CONFIG.BASE_URL}/api/notifications`,
  
  // Analytics
  ANALYTICS: `${API_CONFIG.BASE_URL}/api/analytics`,
  
  // Documents
  PRIVACY_POLICY: `${API_CONFIG.BASE_URL}/api/privacy-policy`,
  TERMS_OF_USE: `${API_CONFIG.BASE_URL}/api/terms-of-use`,
  FAQS: `${API_CONFIG.BASE_URL}/api/faqs`,
  CONTACT_US: `${API_CONFIG.BASE_URL}/api/contact-us`,
  
  // Health Check
  HEALTH: `${API_CONFIG.BASE_URL}/api/health`
};

export default API_CONFIG;
