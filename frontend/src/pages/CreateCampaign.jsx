import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Placeholder.css';

const CreateCampaign = () => {
  return (
    <div className="placeholder-page">
      <Header />
      <div className="placeholder-content">
        <h1>Create Campaign</h1>
        <p>Start your own import campaign and invite others to join.</p>
        <div className="coming-soon">
          <h2>🚧 Coming Soon</h2>
          <p>This page is under development. Check back soon!</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateCampaign; 