import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onOrderNow, onSeeMore }) => {
  const progress = (product.orderedQuantity / product.totalQuantity) * 100;
  const timeLeft = new Date(product.deadline) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  // Check if campaign is closed (quantity full or deadline expired)
  const isQuantityFull = product.orderedQuantity >= product.totalQuantity;
  const isDeadlineExpired = daysLeft <= 0;
  const isClosed = isQuantityFull || isDeadlineExpired;

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.title} />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">ETB {product.price} per unit</p>
        
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">
            {product.orderedQuantity} of {product.totalQuantity} ordered
          </p>
        </div>
        
        {!isClosed && (
          <p className="deadline">⏰ {daysLeft} days left</p>
        )}
        
        <div className="button-group">
          <button 
            className="see-more-btn"
            onClick={() => onSeeMore && onSeeMore(product)}
          >
            See More
          </button>
          <button 
            className={`order-btn ${isClosed ? 'closed-btn' : ''}`} 
            onClick={() => !isClosed && onOrderNow && onOrderNow(product)}
            disabled={isClosed}
          >
            {isClosed ? 'Closed' : 'Order Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 