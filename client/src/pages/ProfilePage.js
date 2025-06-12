/**
 * This file contains ProfilePage component which allows users to view their profile information,
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import '../styles/ProfilePage.css';

/**
 * ProfilePage component
 */
function ProfilePage() {
    const { user, changePassword } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        new_password: ''
    });
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({ username: user.username, new_password: '' });
        }
    }, [user]);

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission for changing password
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.new_password) {
                await changePassword(formData.new_password);
                toast.success('Пароль змінено, будь ласка, увійдіть знову');
                navigate('/auth');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Помилка при зміні пароля');
        }
    };

    useEffect(() => {
        // Fetch user balance from the API
        const fetchBalance = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/budgets/balance`, { withCredentials: true });
                setBalance(response.data.data.total_balance);
            } catch (error) {
                throw error.response?.data || error;
            }
        };

        fetchBalance();
    }, []);


    if (!user) return <div>Завантаження...</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="content-container">
                <div className="profile-container">
                    <h1>Профіль користувача</h1>
                    <p>Перегляд даних про користувача та зміна паролю</p>
                    <div className="profile-cards">
                        <div className="profile-card avatar-card">
                            <div className="avatar-placeholder">
                                <i className="bx bx-user" style={{ fontSize: 'clamp(150px, 20vw, 200px)', color: '#4a4a4a' }}></i>
                            </div>
                        </div>
                        <div className="profile-card info-card">
                            <label>ЗАГАЛЬНА ІНФОРМАЦІЯ</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                disabled
                            />
                        </div>
                        <div className="profile-card balance-card">
                            <label>МІЙ БАЛАНС</label>
                            <input
                                type="text"
                                value={balance !== null ? `${balance} грн` : 'Завантаження...'}
                                disabled
                            />
                        </div>
                        <div className="profile-card login-card">
                            <form onSubmit={handleSubmit}>
                                <div className="input-group">
                                    <label>БЕЗПЕКА</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={user?.email || ''}
                                        disabled
                                        placeholder="ЕЛЕКТРОННА ПОШТА"
                                    />
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        placeholder="НОВИЙ ПАРОЛЬ"
                                    />
                                </div>
                                <button type="submit" className="btn">Зміна паролю</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;