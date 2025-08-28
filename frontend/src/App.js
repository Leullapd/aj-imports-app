import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerProfile from './pages/CustomerProfile';
import TestProfile from './pages/TestProfile';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminOrdersAndPayments from './pages/AdminOrdersAndPayments';
import AdminUsers from './pages/AdminUsers';
import AdminMessages from './pages/AdminMessages';
import UserOrders from './pages/UserOrders';
import UserOrdersAndPayments from './pages/UserOrdersAndPayments';
import UserPremiumOrdersAndPayments from './pages/UserPremiumOrdersAndPayments';
import Payment from './pages/Payment';
import PremiumPayment from './pages/PremiumPayment';
import AdminPaymentMethods from './pages/AdminPaymentMethods';
import AdminPrivateMessages from './pages/AdminPrivateMessages';
import AdminCategories from './pages/AdminCategories';
import AdminProfile from './pages/AdminProfile';
import PremiumCampaigns from './pages/PremiumCampaigns';
import AdminPremiumCampaigns from './pages/AdminPremiumCampaigns';
import AdminPremiumOrders from './pages/AdminPremiumOrders';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminPrivacyPolicy from './pages/AdminPrivacyPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import FAQs from './pages/FAQs';
import ContactUs from './pages/ContactUs';
import PremiumCampaignDetail from './pages/PremiumCampaignDetail';
import PremiumOrder from './pages/PremiumOrder';
import './App.css';

function App() {
  const [toast, setToast] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setToast(`Order placed successfully for "${e.detail.product.title}" (x${e.detail.quantity})!`);
      setTimeout(() => setToast(''), 2500);
    };
    window.addEventListener('order-success', handler);
    return () => window.removeEventListener('order-success', handler);
  }, []);

  return (
    <Router>
      <div className="App">
        {toast && <div className="global-toast">{toast}</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/test-profile" element={<TestProfile />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/premium-campaigns" element={<PremiumCampaigns />} />
                      <Route path="/premium-campaigns/:id" element={<PremiumCampaignDetail />} />
                      <Route path="/premium-order/:id" element={<PremiumOrder />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<UserOrders />} />
          <Route path="/orders-payments" element={<UserOrdersAndPayments />} />
          <Route path="/user-premium-orders" element={<UserPremiumOrdersAndPayments />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/premium-payment/:orderId/:round" element={<PremiumPayment />} />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/admin/orders-payments" element={<AdminOrdersAndPayments />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/payment-methods" element={<AdminPaymentMethods />} />
          <Route path="/admin/private-messages" element={<AdminPrivateMessages />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/premium-campaigns" element={<AdminPremiumCampaigns />} />
          <Route path="/admin/premium-orders" element={<AdminPremiumOrders />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/privacy-policy" element={<AdminPrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
