// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/AuthPage.css';
import AuthPage from './pages/AuthPage';

function App() {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <Router>
      <div className={`container ${isActive ? 'active' : ''}`}>
        <Routes>
          <Route path="/" element={<AuthPage isLogin={true} onToggle={handleToggle} />} />
          <Route path="/register" element={<AuthPage isLogin={false} onToggle={handleToggle} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;