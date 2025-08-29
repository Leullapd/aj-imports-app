import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';
import ProductDetailModal from '../components/ProductDetailModal';
import './Campaigns.css';

const Campaigns = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  useEffect(() => {
    fetch('API_ENDPOINTS.PRODUCTS')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      const filtered = products.filter(product => 
        product.category && product.category.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

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

  const clearFilter = () => {
    navigate('/campaigns');
  };

  if (loading) {
    return (
      <div className="campaigns-page">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="campaigns-page">
      <Header />
      <div className="campaigns-container">
        <div className="campaigns-header">
          <div className="header-content">
            <h1>
              {searchParams.get('category') 
                ? `${searchParams.get('category').charAt(0).toUpperCase() + searchParams.get('category').slice(1)} Deals`
                : 'Active Import Deals'
              }
            </h1>
            <p>
              {searchParams.get('category') 
                ? `Browse ${searchParams.get('category')} deals and join group orders to save big!`
                : 'Join a group order and save big on imported items!'
              }
            </p>
          </div>
          {searchParams.get('category') && (
            <div className="filter-controls">
              <button onClick={clearFilter} className="clear-filter-btn">
                ← Back to All Deals
              </button>
            </div>
          )}
        </div>

        <div className="campaigns-content">
          {filteredProducts.length > 0 ? (
            <div className="campaigns-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onOrderNow={handleOrderNow}
                  onSeeMore={handleSeeMore}
                />
              ))}
            </div>
          ) : (
            <div className="no-campaigns">
              <div className="no-campaigns-content">
                <h3>No Deals Available</h3>
                <p>
                  {searchParams.get('category') 
                    ? `No ${searchParams.get('category')} deals available at the moment. Check back soon!`
                    : 'No active deals at the moment. Check back soon!'
                  }
                </p>
                <button onClick={() => navigate('/')} className="browse-home-btn">
                  Browse Home Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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

export default Campaigns;