import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import '../styles/ProfilePage.css';

function ProfilePage() {
  const { user, logout, changePassword } = useAuth();
  const [passwordData, setPasswordData] = useState({ new_password: '' });
  const navigate = useNavigate();

  console.log('ProfilePage user:', user); // Дебаг

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await changePassword(passwordData.new_password);
      toast.success('Пароль змінено, будь ласка, увійдіть знову');
      navigate('/auth');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Помилка при зміні пароля');
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ new_password: e.target.value });
  };

  if (!user) return <div>Завантаження...</div>;

  return (
    <div className="profile-container">
      <h1>Профіль</h1>
      <div className="user-info">
        <p><strong>Ім'я користувача:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Тип користувача:</strong> {user.type}</p>
      </div>
      <Link to="/budgets" className="btn">Переглянути бюджети</Link>
      <form onSubmit={handleChangePassword} className="change-password-form">
        <h2>Змінити пароль</h2>
        <div className="input-box">
          <input
            type="password"
            name="new_password"
            placeholder="Новий пароль"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            required
          />
          <i className="bx bxs-lock-alt"></i>
        </div>
        <button type="submit" className="btn">Змінити пароль</button>
      </form>
      <button className="btn logout-btn" onClick={logout}>Вийти</button>
    </div>
  );
}

export default ProfilePage;