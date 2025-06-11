/**
 * Configuration file for the application.
 */

import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import SavingsPage from './pages/SavingsPage';
import CalculatorsPage from './pages/CalculatorsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';
import FeedbackPage from './pages/FeedbackPage';


/**
 * ProtectedRoute component to restrict access to certain routes.
 */
function ProtectedRoute({children}) {
    const {user} = useAuth();
    return user ? children : <Navigate to="/auth"/>;
}

/**
 * Main application component that sets up routing and context providers.
 */
function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/auth"/>}/>
                    <Route path="/auth" element={<AuthPage/>}/>
                    <Route path="/register" element={<AuthPage/>}/>
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/history"
                        element={
                            <ProtectedRoute>
                                < HomePage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/savings"
                        element={
                            <ProtectedRoute>
                                <SavingsPage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/calculator"
                        element={
                            <ProtectedRoute>
                                <CalculatorsPage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/transactions"
                        element={
                            <ProtectedRoute>
                                <TransactionsPage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute>
                                <CategoriesPage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <AnalyticsPage/>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/budgets"
                        element={
                            <ProtectedRoute>
                                <FeedbackPage/>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;