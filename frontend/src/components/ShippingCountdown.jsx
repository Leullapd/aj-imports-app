import React, { useState, useEffect } from 'react';
import './ShippingCountdown.css';

const ShippingCountdown = ({ shippingDeadline, campaignDeadline }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  const [isCampaignActive, setIsCampaignActive] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const campaignDeadlineTime = new Date(campaignDeadline).getTime();
      const shippingDeadlineTime = new Date(shippingDeadline).getTime();

      // Check if campaign is still active
      if (now < campaignDeadlineTime) {
        setIsCampaignActive(true);
        setIsExpired(false);
        return;
      }

      setIsCampaignActive(false);

      // Check if shipping deadline has passed
      if (now >= shippingDeadlineTime) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const difference = shippingDeadlineTime - now;
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [shippingDeadline, campaignDeadline]);

  if (isCampaignActive) {
    return (
      <div className="shipping-countdown campaign-active">
        <div className="countdown-label">📅 Campaign Active</div>
        <div className="countdown-message">
          Shipping countdown will start after campaign deadline
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="shipping-countdown expired">
        <div className="countdown-label">⏰ Shipping Deadline Passed</div>
        <div className="countdown-message">
          Orders should have been shipped by now
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-countdown active">
      <div className="countdown-label">🚚 Shipping Deadline Countdown</div>
      <div className="countdown-timer">
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.days}</span>
          <span className="countdown-unit">Days</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.hours}</span>
          <span className="countdown-unit">Hours</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.minutes}</span>
          <span className="countdown-unit">Minutes</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-number">{timeLeft.seconds}</span>
          <span className="countdown-unit">Seconds</span>
        </div>
      </div>
      <div className="countdown-message">
        Time remaining to ship all orders
      </div>
    </div>
  );
};

export default ShippingCountdown;
