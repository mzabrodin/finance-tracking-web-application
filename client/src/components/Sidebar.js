import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Sidebar.css';

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      toast.error('Помилка при виході');
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className={isCollapsed ? 'hidden' : ''}>TUMBOCHKA</h2>
        <button onClick={toggleSidebar} className="toggle-btn">
          <i className={`bx ${isCollapsed ? 'bx-chevron-right' : 'bx-chevron-left'}`}></i>
        </button>
      </div>
      <div className="sidebar-section">
        <h3 className={isCollapsed ? 'hidden' : ''}>ЗАГАЛЬНЕ</h3>
        <ul>
          <li>
            <Link to="/history">
              <i className="bx bx-home-alt"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Домашня сторінка</span>
            </Link>
          </li>
          <li>
            <Link to="/savings">
              <i className="bx bx-wallet"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Накопичення</span>
            </Link>
          </li>
          <li>
            <Link to="/calculator">
              <i className="bx bx-math"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Калькулятор</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-section">
        <h3 className={isCollapsed ? 'hidden' : ''}>БАЛАНС</h3>
        <ul>
          <li>
            <Link to="/transactions">
              <i className="bx bx-transfer"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Транзакції</span>
            </Link>
          </li>
          <li>
            <Link to="/categories">
              <i className="bx bx-category"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Категорії</span>
            </Link>
          </li>
          <li>
            <Link to="/analytics">
              <i className="bx bx-line-chart"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Аналітика</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-section">
        <h3 className={isCollapsed ? 'hidden' : ''}>CASES</h3>
        <ul>
          <li>
            <Link to="/profile">
              <i className="bx bx-user"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Профіль</span>
            </Link>
          </li>
          <li>
            <Link to="/budgets">
              <i className="bx bx-message-square-detail"></i>
              <span className={isCollapsed ? 'hidden' : ''}>Зворотній зв'язок</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-footer">
        <h3 className={`logout-btn ${isCollapsed ? 'hidden-text' : ''}`} onClick={handleLogout}>
          <i className="bx bx-log-out"></i>
          <span className={isCollapsed ? 'hidden' : ''}>Вихід</span>
        </h3>
      </div>
    </div>
  );
}

export default Sidebar;