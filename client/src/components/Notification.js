/**
 * This file contains notification component code.
 */

import React, { useEffect } from 'react';
import '../styles/Notification.css';

/**
 * Notification component to display messages.
 */
const Notification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
};

export default Notification;