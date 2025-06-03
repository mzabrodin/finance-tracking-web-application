import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Sidebar.css';

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      toast.error('Помилка при виході');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>TUMBOCHKA</h2>
      </div>
      <div className="sidebar-section">
        <h3>ЗАГАЛЬНЕ</h3>
        <ul>
          <li>
            <Link to="/history">
              <i className="bx bx-home-alt"></i> Домашня сторінка
            </Link>
          </li>
          <li>
            <Link to="/settings">
             <i className="bx bx-wallet"></i>  Накопичення
            </Link>
          </li>
          <li>
            <Link to="/calculator">
              <i className="bx bx-math"></i> Калькулятор
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-section">
        <h3>БАЛАНС</h3>
        <ul>
          <li>
            <Link to="/transactions">
              <i className="bx bx-transfer"></i> Транзакції
            </Link>
          </li>
          <li>
            <Link to="/categories">
              <i className="bx bx-category"></i> Категорії
            </Link>
          </li>
          <li>
            <Link to="/analytics">
              <i className="bx bx-line-chart"></i> Аналітика
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-section">
        <h3>CASES</h3>
        <ul>
          <li>
            <Link to="/profile">
              <i className="bx bx-user"></i> Профіль
            </Link>
          </li>
          <li>
            <Link to="/budgets">
              <i className="bx bx-message-square-detail"></i> Зворотній зв'язок
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-footer">
        <h3 className="logout-btn" onClick={handleLogout}>
          <i className="bx bx-log-out"></i> Вихід
        </h3>
      </div>
    </div>
  );
}

export default Sidebar;