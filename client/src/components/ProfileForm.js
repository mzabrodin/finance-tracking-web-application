/**
 * This file contains profile form component for user profile management.
 */

import React, {useState, useEffect} from 'react';
import '../styles/ProfilePage.css';

/**
 * Creates a form for user profile creation and updates.
 */
const ProfileForm = ({user, balance, loading, handleSubmit}) => {
    const [formData, setFormData] = useState({
        username: user?.username || '',
        new_password: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({username: user.username, new_password: ''});
        }
    }, [user]);

    /**
     * Handles input changes in the form.
     */
    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    /**
     * Handles form submission to update the user's password.
     */
    const onSubmit = (e) => {
        e.preventDefault();
        if (formData.new_password) {
            handleSubmit(formData.new_password);
        }
    };

    return (
        <>
            <div className="profile-card info-card">
                <label>ЗАГАЛЬНА ІНФОРМАЦІЯ</label>
                <input type="text" value={formData.username} onChange={handleChange} disabled/>
            </div>
            <div className="profile-card balance-card">
                <label>МІЙ БАЛАНС</label>
                <input
                    type="text"
                    value={loading ? 'Завантаження...' : balance !== null ? `${balance} грн` : 'Немає даних'}
                    disabled
                />
            </div>
            <div className="profile-card login-card">
                <form onSubmit={onSubmit}>
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
        </>
    );
};

export default ProfileForm;