// pages/AuthPage.js
import React from 'react';
import '../styles/AuthPage.css';

function AuthPage({ isLogin, onToggle }) {
  return (
    <>
      <div className={`form-box login ${isLogin ? '' : 'hidden'}`}>
        <form>
          <h1>Логін</h1>
          <div className="input-box">
            <input type="email" placeholder="Електронна пошта" required />
            <i className="bx bxs-envelope"></i>
          </div>
          <div className="input-box">
            <input type="password" placeholder="Пароль" required />
            <i className="bx bxs-lock-alt"></i>
          </div>
          <div className="forgot-link">
            <a href="#">Забули пароль?</a>
          </div>
          <button type="submit" className="btn">Увійти</button>
        </form>
      </div>
      <div className={`form-box register ${!isLogin ? 'active' : 'hidden'}`}>
        <form>
          <h1>Реєстрація</h1>
          <div className="input-box">
            <input type="text" placeholder="Ім'я користувача" required />
            <i className="bx bxs-user"></i>
          </div>
          <div className="input-box">
            <input type="email" placeholder="Електронна пошта" required />
            <i className="bx bxs-envelope"></i>
          </div>
          <div className="input-box">
            <input type="password" placeholder="Пароль" required />
            <i className="bx bxs-lock-alt"></i>
          </div>
          <button type="submit" className="btn">Зареєструватися</button>
        </form>
      </div>
      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Вітаємо!</h1>
          <p>Немає акаунта?</p>
          <button className="btn" onClick={onToggle}>
            Реєстрація
          </button>
        </div>
        <div className="toggle-panel toggle-right">
          <h1>З поверненням!</h1>
          <p>Вже маєте акаунт?</p>
          <button className="btn" onClick={onToggle}>
            Логін
          </button>
        </div>
      </div>
    </>
  );
}

export default AuthPage;