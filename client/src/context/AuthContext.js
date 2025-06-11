/**
 * This file contains authentication context and functions for user management.
 */

import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * AuthContext provides authentication state and functions for user management.
 */
const AuthContext = createContext();

/**
 * My AuthProvider component wraps the application and provides authentication context.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /**
   * Logs in a user with email and password.
   */
  const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password }, { withCredentials: true });
    setUser(response.data.data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

  /**
   * Logs out the current user.
   */
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      throw error.response.data;
    }
  };

  /**
   * Crates a new user account.
   */
  const register = async (username, email, password, userType = 'default') => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, { username, email, password, user_type: userType }, { withCredentials: true });
    setUser(response.data.data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

  /**
   * Changes the password for the current user.
   */
  const changePassword = async (newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/change_password`, { new_password: newPassword }, { withCredentials: true });
      setUser(null);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);