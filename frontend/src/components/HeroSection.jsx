import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll to campaigns page if section not found
      window.location.href = '/campaigns';
    }
  };

  return (
    <section className="hero">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-title">Order Together, Import Smartly!</h1>
          <p className="hero-subtitle">
            Join group orders and save big on imported items. We'll bring them to you when the deal closes.
          </p>
          <div className="hero-buttons">
            <Link to="/campaigns" className="btn btn-primary">Browse Items</Link>
            <button onClick={scrollToHowItWorks} className="btn btn-secondary">Learn How It Works</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 