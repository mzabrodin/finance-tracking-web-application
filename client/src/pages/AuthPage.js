/**
 * This file contains AuthPage component which handles user authentication
 */

import React, {useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {useNavigate, useLocation} from 'react-router-dom';
import '../styles/AuthPage.css';

// Компонент сповіщення
const Notification = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getNotificationStyle = () => {
        const baseStyle = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 9999,
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideIn 0.3s ease-out'
        };

        const typeStyles = {
            success: { backgroundColor: '#10b981' },
            error: { backgroundColor: '#ef4444' },
            info: { backgroundColor: '#3b82f6' }
        };

        return { ...baseStyle, ...typeStyles[type] };
    };

    const getIcon = () => {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    };

    return (
        <>
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
            <div style={getNotificationStyle()}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '10px' }}>{getIcon()}</span>
                    <span>{message}</span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        marginLeft: '15px',
                        padding: '0',
                        lineHeight: '1'
                    }}
                >
                    ×
                </button>
            </div>
        </>
    );
};

// AuthPage component
function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const {login, register} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isLogin = location.pathname === '/auth';

    // Функція для показу сповіщення
    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    // Функція для закриття сповіщення
    const closeNotification = () => {
        setNotification(null);
    };

    // Handle form submission for login or registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = {email, password};
            if (!isLogin) {
                data.username = username;
                data.user_type = 'default';
                const response = await register(username, email, password, 'default');
                if (response.status === 'success') {
                    showNotification('Реєстрація успішна! Будь ласка, увійдіть в систему.', 'success');
                    // Очищення форми
                    setUsername('');
                    setEmail('');
                    setPassword('');
                    // Перехід на сторінку логіну через 2 секунди
                    setTimeout(() => {
                        navigate('/auth');
                    }, 2000);
                }
            } else {
                const response = await login(email, password);
                if (response.status === 'success') {
                    showNotification('Успішний вхід в систему!', 'success');
                    setTimeout(() => {
                        navigate('/profile');
                    }, 1500);
                }
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Помилка автентифікації';

            // Специфічна обробка для різних типів помилок
            if (errorMessage.includes('вже існує') ||
                errorMessage.includes('already exists') ||
                errorMessage.includes('User already exists') ||
                errorMessage.toLowerCase().includes('duplicate')) {
                showNotification('Користувач з такою електронною поштою або ніком вже зареєстрований. Спробуйте увійти або використайте іншу пошту/нік.', 'error');
            } else if (errorMessage.includes('Невірний') ||
                       errorMessage.includes('Invalid') ||
                       errorMessage.includes('incorrect')) {
                showNotification('Невірний email або пароль. Перевірте введені дані.', 'error');
            } else {
                showNotification(errorMessage, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle toggle between login and registration
    const handleToggle = () => {
        if (isLogin) {
            navigate('/register');
        } else {
            navigate('/auth');
        }
        // Очищення форми при перемиканні
        setEmail('');
        setPassword('');
        setUsername('');
        closeNotification();
    };

    return (
        <div className="auth-page">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={closeNotification}
                />
            )}

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
                                disabled={isLoading}
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
                                disabled={isLoading}
                            />
                            <i className="bx bxs-lock-alt"></i>
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={isLoading}
                            style={{
                                backgroundColor: isLoading ? '#666' : '#333',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Входжу...' : 'Увійти'}
                        </button>
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
                            />
                            <i className="bx bxs-lock-alt"></i>
                        </div>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={isLoading}
                            style={{
                                backgroundColor: isLoading ? '#666' : '#333',
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Реєструю...' : 'Зареєструватися'}
                        </button>
                    </form>
                </div>
                <div className="toggle-box">
                    <div className={`toggle-panel toggle-left ${!isLogin ? 'active' : ''}`}>
                        <h1>Вітаємо!</h1>
                        <p>Немає акаунта?</p>
                        <button
                            className="auth-btn"
                            onClick={handleToggle}
                            disabled={isLoading}
                            style={{
                                opacity: isLoading ? 0.5 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Реєстрація
                        </button>
                    </div>
                    <div className={`toggle-panel toggle-right ${isLogin ? 'active' : ''}`}>
                        <h1>З поверненням!</h1>
                        <p>Вже маєте акаунт?</p>
                        <button
                            className="auth-btn"
                            onClick={handleToggle}
                            disabled={isLoading}
                            style={{
                                opacity: isLoading ? 0.5 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Логін
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;