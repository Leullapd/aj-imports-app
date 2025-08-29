import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import OrderModal from '../components/OrderModal';
import ProductDetailModal from '../components/ProductDetailModal';

import { API_ENDPOINTS } from '../config/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  useEffect(() => {
    // Fetch products from your backend API
    fetch('API_ENDPOINTS.PRODUCTS')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);
  const handleOrderNow = (product) => {
    setSelectedProduct(product);
    setOrderModalOpen(true);
  };

  const handleSeeMore = (product) => {
    setSelectedProductForDetail(product);
    setDetailModalOpen(true);
  };

  const handleOrderModalClose = () => {
    setOrderModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedProductForDetail(null);
  };
  const handleOrderPlaced = () => {
    // Optionally refresh products or show a toast
  };

  const handleCategoryClick = (category) => {
    navigate(`/campaigns?category=${category}`);
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories from API
    fetch('API_ENDPOINTS.CATEGORIES')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        // Fallback to default categories if API fails
        setCategories([
          { name: 'Electronics', icon: '📱', slug: 'electronics' },
          { name: 'Fashion', icon: '👕', slug: 'fashion' },
          { name: 'Kitchen', icon: '🍳', slug: 'kitchen' },
          { name: 'Accessories', icon: '👜', slug: 'accessories' },
          { name: 'Home & Garden', icon: '🏡', slug: 'home-garden' },
          { name: 'Sports', icon: '⚽', slug: 'sports' },
          { name: 'Automotive Parts', icon: '🚗', slug: 'automotive' },
          { name: 'Security Items', icon: '🔒', slug: 'security' },
          { name: 'Tools', icon: '🔧', slug: 'tools' },
          { name: 'Cosmetics', icon: '💄', slug: 'cosmetics' }
        ]);
      });
  }, []);

  const howItWorks = [
    {
      step: 1,
      title: 'Choose Items',
      description: 'Browse active import deals and select what you want.',
      icon: '🔍'
    },
    {
      step: 2,
      title: 'Join the Order',
      description: 'Place your order before the quantity or time runs out.',
      icon: '✅'
    },
    {
      step: 3,
      title: 'Wait for Import',
      description: 'Once the order is closed, we\'ll ship and notify you.',
      icon: '📦'
    }
  ];

  const testimonials = [
    {
      name: 'Amanuel',
      text: 'AJ import helped me save money and get what I needed from overseas!',
      rating: 5
    },
    {
      name: 'Sarah',
      text: 'Great experience with group orders. Highly recommended!',
      rating: 5
    },
    {
      name: 'Mike',
      text: 'Fast delivery and excellent customer service.',
      rating: 5
    }
  ];

  return (
    <div className="home">
      <Header />
      <HeroSection />
      
      {/* Featured Categories */}
      <section className="categories-section">
        <div className="container">
          <h2>Featured Categories</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div 
                key={category._id || index} 
                className="category-card"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-grid">
            {howItWorks.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Import Deals */}
      <section className="products-section">
        <div className="container">
          <h2>Top Rated Import Deals</h2>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {products.length > 0 ? (
                products
                  .sort((a, b) => {
                    // Sort by popularity (you can adjust this logic based on your data)
                    // For now, we'll sort by order count if available, otherwise by creation date
                    const aOrders = a.orderedQuantity || 0;
                    const bOrders = b.orderedQuantity || 0;
                    return bOrders - aOrders;
                  })
                  .slice(0, 4) // Show only top 4 products
                  .map(product => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      onOrderNow={handleOrderNow}
                      onSeeMore={handleSeeMore}
                    />
                  ))
              ) : (
                <div className="no-products">
                  <p>No active deals at the moment. Check back soon!</p>
                </div>
              )}
            </div>
          )}
          {products.length > 4 && (
            <div className="view-all-container">
              <Link to="/campaigns" className="view-all-btn">
                View All Campaigns
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2>What Our Users Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="stars">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p>"{testimonial.text}"</p>
                <h4>- {testimonial.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-badges">
            <div className="badge">✅ Secure Payment</div>
            <div className="badge">✅ Verified Importer</div>
            <div className="badge">✅ Money-Back Guarantee</div>
            <div className="badge">✅ Fast Delivery</div>
          </div>
        </div>
      </section>

      <OrderModal
        product={selectedProduct}
        isOpen={orderModalOpen}
        onClose={handleOrderModalClose}
        onOrder={handleOrderPlaced}
      />
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={detailModalOpen}
        onClose={handleDetailModalClose}
      />

      <Footer />
    </div>
  );
};

export default Home; 