import React from 'react';
import './ProductDetailModal.css';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const progress = (product.orderedQuantity / product.totalQuantity) * 100;
  const timeLeft = new Date(product.deadline) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  const isQuantityFull = product.orderedQuantity >= product.totalQuantity;
  const isDeadlineExpired = daysLeft <= 0;
  const isClosed = isQuantityFull || isDeadlineExpired;

  return (
    <div className="product-detail-modal-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-content">
          <div className="product-image-section">
            <img src={product.image} alt={product.title} />
          </div>
          
          <div className="product-details-section">
            <h2 className="product-title">{product.title}</h2>
            <p className="product-category">{product.category}</p>
            <p className="product-description">{product.description || 'No description available.'}</p>
            
            <div className="price-section">
              <h3 className="price-label">Price per unit:</h3>
              <p className="product-price">ETB {product.price}</p>
            </div>
            
            <div className="campaign-stats">
              <div className="stat-item">
                <span className="stat-label">Total Quantity:</span>
                <span className="stat-value">{product.totalQuantity}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ordered Quantity:</span>
                <span className="stat-value">{product.orderedQuantity}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">{product.totalQuantity - product.orderedQuantity}</span>
              </div>
            </div>
            
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">
                {product.orderedQuantity} of {product.totalQuantity} ordered ({progress.toFixed(1)}%)
              </p>
            </div>
            
            <div className="deadline-section">
              {!isClosed ? (
                <p className="deadline">⏰ {daysLeft} days left to join this campaign</p>
              ) : (
                <p className="deadline closed">Campaign is closed</p>
              )}
            </div>
            
            {product.specifications && (
              <div className="specifications">
                <h3>Specifications:</h3>
                <ul>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {product.terms && (
              <div className="terms">
                <h3>Terms & Conditions:</h3>
                <p>{product.terms}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
