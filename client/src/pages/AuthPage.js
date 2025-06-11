import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/AuthPage.css';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname === '/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { email, password };
      if (!isLogin) {
        data.username = username;
        data.user_type = 'default';
        const response = await register(username, email, password, 'default');
        if (response.status === 'success') {
          alert('Реєстрація успішна! Будь ласка, увійдіть.');
          navigate('/auth');
        }
      } else {
        const response = await login(email, password);
        if (response.status === 'success') {
//          alert('Успішний вхід!');
          navigate('/profile');
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Помилка автентифікації');
    }
  };

  const handleToggle = () => {
    if (isLogin) {
      navigate('/register');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="auth-page">
      <div className={`container ${isLogin ? '' : 'active'}`}>
        <div className={`form-box login ${isLogin ? '' : 'hidden'}`}>
          <form onSubmit={handleSubmit}>
            <h1>Логін</h1>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Електронна пошта"
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="auth-btn">Увійти</button>
          </form>
        </div>
        <div className={`form-box register ${!isLogin ? 'active' : 'hidden'}`}>
          <form onSubmit={handleSubmit}>
            <h1>Реєстрація</h1>
            <div className="input-box">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ім'я користувача"
                required
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Електронна пошта"
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="auth-btn">Зареєструватися</button>
          </form>
        </div>
        <div className="toggle-box">
          <div className={`toggle-panel toggle-left ${!isLogin ? 'active' : ''}`}>
            <h1>Вітаємо!</h1>
            <p>Немає акаунта?</p>
            <button className="auth-btn" onClick={handleToggle}>
              Реєстрація
            </button>
          </div>
          <div className={`toggle-panel toggle-right ${isLogin ? 'active' : ''}`}>
            <h1>З поверненням!</h1>
            <p>Вже маєте акаунт?</p>
            <button className="auth-btn" onClick={handleToggle}>
              Логін
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;