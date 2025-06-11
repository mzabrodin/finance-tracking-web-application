/**
 * This file contains HomePage component which serves as the main dashboard for the application.
 */

import React, {useState, useEffect} from 'react';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {API_URL} from '../config';
import '../styles/HomePage.css';

// HomePage component
const HomePage = () => {
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
        } else {
            fetchData();
        }
    }, [user, navigate]);

    // Fetch data from the API
    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTransactions(),
                fetchCategories(),
                fetchBudgets(),
                fetchTotalBalance(),
            ]);
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/transactions/`, {withCredentials: true});
            if (response.data.status === 'success') {
                const transactionsData = response.data.data || [];
                setTransactions(transactionsData);
                calculateTotals(transactionsData); // Викликаємо calculateTotals після оновлення transactions
            }
        } catch (error) {
            console.error('Помилка завантаження транзакцій:', error);
            setTransactions([]);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/categories/`, {withCredentials: true});
            if (response.data.status === 'success') {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Помилка завантаження категорій:', error);
            setCategories([]);
        }
    };

    // Fetch budgets
    const fetchBudgets = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/budgets/`, {withCredentials: true});
            if (response.data.status === 'success') {
                setBudgets(response.data.data || []);
            }
        } catch (error) {
            console.error('Помилка завантаження бюджетів:', error);
            setBudgets([]);
        }
    };

    // Fetch total balance
    const fetchTotalBalance = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/budgets/balance`, {withCredentials: true});
            setTotalBalance(response.data.data?.total_balance || 0);
        } catch (error) {
            console.error('Помилка завантаження балансу:', error);
        }
    };

    // Calculate totals for income and expenses
    const calculateTotals = (transactionsData) => {
        const income = transactionsData
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenses = transactionsData
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        setTotalIncome(income);
        setTotalExpenses(expenses);
    };

    // Helper functions to get category and budget names
    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Невідома категорія';
    };

    // Helper function to get budget name
    const getBudgetName = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        return budget ? budget.name : 'Невідомий бюджет';
    };

    // Format amount to currency
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
        }).format(amount || 0);
    };

    // Format date to a readable format
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth');
        } catch (error) {
            console.error('Помилка виходу:', error);
        }
    };

    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    if (loading || !user) {
        return (
            <div className="app-layout">
                <Sidebar/>
                <div className="content-container">
                    <div className="loading-container">
                        <div>Завантаження...</div>
                    </div>
                </div>
            </div>
        );
    }

    const recentTransactions = transactions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    return (
        <div className="app-layout">
            <Sidebar/>
            <div className="content-container">
                <div className="home-container">
                    <div className="welcome-section">
                        <h1>Ласкаво просимо, {user.username}!</h1>
                        <p>Ваш особистий фінансовий помічник готовий допомогти вам керувати коштами.</p>
                    </div>

                    <div className="dashboard-grid">
                        <div className="dashboard-card balance">
                            <div className="card-icon">💰</div>
                            <div className="card-content">
                                <div className="card-label">Загальний баланс</div>
                                <div className="card-value">{formatAmount(totalBalance)}</div>
                            </div>
                        </div>
                        <div className="dashboard-card income">
                            <div className="card-icon">↗</div>
                            <div className="card-content">
                                <div className="card-label">Доходи</div>
                                <div className="card-value">{formatAmount(totalIncome)}</div>
                            </div>
                        </div>
                        <div className="dashboard-card expense">
                            <div className="card-icon">↙</div>
                            <div className="card-content">
                                <div className="card-label">Витрати</div>
                                <div className="card-value">{formatAmount(totalExpenses)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="recent-transactions">
                        <h2>Останні транзакції</h2>
                        {recentTransactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">💳</div>
                                <p>Транзакцій поки немає. Додайте першу транзакцію!</p>
                                <button
                                    className="action-btn"
                                    onClick={() => navigate('/transactions')}
                                >
                                    Додати транзакцію
                                </button>
                            </div>
                        ) : (
                            <table className="transactions-table">
                                <thead>
                                <tr>
                                    <th>Тип</th>
                                    <th>Опис</th>
                                    <th>Сума</th>
                                    <th>Категорія</th>
                                    <th>Бюджет</th>
                                    <th>Дата</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>
                                            <div className={`transaction-type ${transaction.type}`}>
                                                {transaction.type === 'income' ? 'Дохід' : 'Витрата'}
                                            </div>
                                        </td>
                                        <td>{transaction.description || 'Без опису'}</td>
                                        <td>
                                            <div className={`transaction-amount ${transaction.type}`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                                            </div>
                                        </td>
                                        <td>{getCategoryName(transaction.category_id)}</td>
                                        <td>{getBudgetName(transaction.budget_id)}</td>
                                        <td>{formatDate(transaction.created_at)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        {recentTransactions.length > 0 && (
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/transactions')}
                            >
                                Переглянути всі транзакції
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;