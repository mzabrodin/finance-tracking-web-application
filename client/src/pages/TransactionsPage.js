import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import '../styles/TransactionsPage.css';
import { API_URL } from '../config';

/**
 * WarningModal component to display budget goal or insufficient funds warnings.
 */
const WarningModal = ({ isOpen, type, amount, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    /**
     * Method to format the amount in UAH currency.
     */
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH'
        }).format(amount);
    };

    const title = type === 'budget_exceeded' ? 'Попередження про перевищення бюджету' : 'Недостатньо коштів';
    const message = type === 'budget_exceeded'
        ? `Перевищення бюджету на ${formatAmount(amount)}`
        : `Сума витрати (${formatAmount(amount)}) перевищує доступний баланс`;

    return (
        <div className="transaction-modal">
            <div className="transaction-form warning-modal-pop">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="form-actions">
                    <button
                        type="button"
                        className="form-btn secondary"
                        onClick={onCancel}
                    >
                        Скасувати
                    </button>
                    {type === 'budget_exceeded' && (
                        <button
                            type="button"
                            className="form-btn primary"
                            onClick={onConfirm}
                        >
                            Підтвердити
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * TransactionsPage component to manage and display transactions.
 */
const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        type: 'expense',
        category_id: '',
        budget_id: ''
    });
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningData, setWarningData] = useState({ type: '', amount: 0 });
    const [pendingTransaction, setPendingTransaction] = useState(null);
    const [notification, setNotification] = useState(null);
    const [totalBalance, setTotalBalance] = useState(0);

    // Show notification with a message and type
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Close the notification
    const closeNotification = () => {
        setNotification(null);
    };

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/transactions/`, { withCredentials: true });
            if (response.data.status === 'success') {
                setTransactions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            if (error.response?.status === 404) {
                setTransactions([]);
            }
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/categories/`, { withCredentials: true });
            if (response.data.status === 'success') {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            if (error.response?.status === 404) {
                setCategories([]);
            }
        }
    };

    // Fetch budgets
    const fetchBudgets = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/budgets/`, { withCredentials: true });
            if (response.data.status === 'success') {
                setBudgets(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching budgets:', error);
            if (error.response?.status === 404) {
                setBudgets([]);
            }
        }
    };

    // Fetch total balance from API
    const fetchTotalBalance = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/budgets/balance`, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });
            setTotalBalance(response.data.data?.total_balance || 0);
        } catch (error) {
            console.error('Error fetching total balance:', error);
            showNotification('Не вдалося отримати загальний баланс', 'error');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchTransactions(), fetchCategories(), fetchBudgets(), fetchTotalBalance()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    const checkBudgetGoal = (budgetId, newAmount, isEditing = false, originalAmount = 0) => {
        /**
         * Check if the new transaction amount exceeds the budget goal.
         */
        const budget = budgets.find(b => b.id === parseInt(budgetId));
        if (!budget || !budget.goal) return { isExceeded: false };

        const budgetIncome = transactions
            .filter(t => t.budget_id === parseInt(budgetId) && t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const adjustedIncome = isEditing
            ? budgetIncome - originalAmount + parseFloat(newAmount)
            : budgetIncome + parseFloat(newAmount);

        if (adjustedIncome > budget.goal) {
            return {
                isExceeded: true,
                excessAmount: adjustedIncome - budget.goal
            };
        }
        return { isExceeded: false };
    };

    const checkInsufficientFunds = (amount, isEditing = false, originalAmount = 0) => {
        /**
         * Check if the expense amount exceeds the available balance.
         */
        const adjustedAmount = isEditing ? parseFloat(amount) - originalAmount : parseFloat(amount);
        if (adjustedAmount > totalBalance) {
            return {
                isInsufficient: true,
                amount: parseFloat(amount)
            };
        }
        return { isInsufficient: false };
    };

    // Handle form submission saving or updating
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.category_id || (!editingTransaction && !formData.budget_id)) {
            showNotification('Заповніть усі обов\'язкові поля', 'error');
            return;
        }

        const transactionData = {
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            type: formData.type,
            category_id: parseInt(formData.category_id),
            budget_id: editingTransaction ? editingTransaction.budget_id : parseInt(formData.budget_id)
        };

        if (formData.type === 'expense') {
            const fundsCheck = checkInsufficientFunds(
                formData.amount,
                !!editingTransaction,
                editingTransaction?.amount || 0
            );
            if (fundsCheck.isInsufficient) {
                setWarningData({ type: 'insufficient_funds', amount: fundsCheck.amount });
                setPendingTransaction(transactionData);
                setShowWarningModal(true);
                return;
            }
        }

        if (formData.type === 'income') {
            const goalCheck = checkBudgetGoal(
                transactionData.budget_id,
                formData.amount,
                !!editingTransaction,
                editingTransaction?.amount || 0
            );

            if (goalCheck.isExceeded) {
                setWarningData({ type: 'budget_exceeded', amount: goalCheck.excessAmount });
                setPendingTransaction(transactionData);
                setShowWarningModal(true);
                return;
            }
        }

        await submitTransaction(transactionData);
    };

    /**
     * Submit transaction data to the server.
     */
    const submitTransaction = async (transactionData) => {
        try {
            let response;
            if (editingTransaction) {
                response = await axios.put(
                    `${API_URL}/api/transactions/${editingTransaction.id}`,
                    transactionData,
                    { withCredentials: true }
                );
                if (response.data.status === 'success') {
                    showNotification('Транзакція оновлена успішно!');
                    setTransactions(prev =>
                        prev.map(t =>
                            t.id === editingTransaction.id
                                ? { ...t, ...transactionData }
                                : t
                        )
                    );
                }
            } else {
                response = await axios.post(
                    `${API_URL}/api/transactions/`,
                    transactionData,
                    { withCredentials: true }
                );
                if (response.data.status === 'success') {
                    showNotification('Транзакція створена успішно!');
                }
            }

            setFormData({
                amount: '',
                description: '',
                type: 'expense',
                category_id: '',
                budget_id: ''
            });
            setShowForm(false);
            setEditingTransaction(null);
            setShowWarningModal(false);
            setPendingTransaction(null);
            await Promise.all([fetchTransactions(), fetchTotalBalance()]);
        } catch (error) {
            console.error('Error saving transaction:', error);
            showNotification(error.response?.data?.message || 'Помилка при збереженні транзакції', 'error');
        }
    };

    // Handle warning modal confirm and cancel actions
    const handleWarningConfirm = () => {
        if (pendingTransaction && warningData.type === 'budget_exceeded') {
            submitTransaction(pendingTransaction);
        }
    };

    // Cancel warning modal
    const handleWarningCancel = () => {
        setShowWarningModal(false);
        setPendingTransaction(null);
    };

    // Handle edit and delete actions
    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            amount: transaction.amount.toString(),
            description: transaction.description || '',
            type: transaction.type,
            category_id: transaction.category_id.toString(),
            budget_id: transaction.budget_id.toString()
        });
        setShowForm(true);
    };

    /**
     * Handle delete transaction action.
     */
    const handleDelete = async (transactionId) => {
        try {
            const response = await axios.delete(
                `${API_URL}/api/transactions/${transactionId}`,
                { withCredentials: true }
            );
            if (response.data.status === 'success') {
                showNotification('Транзакція видалена успішно!');
                await Promise.all([fetchTransactions(), fetchTotalBalance()]);
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showNotification(error.response?.data?.message || 'Помилка при видаленні транзакції', 'error');
        }
    };

    // Retrieve category and budget names by ID
    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Невідома категорія';
    };

    // Retrieve budget name by ID
    const getBudgetName = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        return budget ? budget.name : 'Невідомий бюджет';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format amount in UAH currency
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH'
        }).format(amount);
    };

    // Calculate total income and expenses for display
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    const filteredTransactions = transactions.filter(transaction => {
        if (activeTab === 'all') return true;
        return transaction.type === activeTab;
    });

    const filteredCategories = categories.filter(category =>
        formData.type === 'income' ? category.type === 'incomes' : category.type === 'expenses'
    );

    // Handle cancel action in the form
    const handleCancel = () => {
        setShowForm(false);
        setEditingTransaction(null);
        setFormData({
            amount: '',
            description: '',
            type: 'expense',
            category_id: '',
            budget_id: ''
        });
    };

    useEffect(() => {
        if (editingTransaction && formData.category_id) {
            const selectedCategory = categories.find(cat => cat.id === parseInt(formData.category_id));
            if (selectedCategory && selectedCategory.type !== (formData.type === 'income' ? 'incomes' : 'expenses')) {
                setFormData(prev => ({ ...prev, category_id: '' }));
            }
        }
    }, [formData.type, formData.category_id, editingTransaction, categories]);

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar />
                <div className="content-container">
                    <div className="loading-container">
                        <div>Завантаження...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="content-container">
                <div className="transactions-container">
                    <div className="page-header">
                        <div>
                            <h1>ТРАНЗАКЦІЇ</h1>
                            <div className="page-subtitle">Керування витратами/доходом</div>
                        </div>
                        <button
                            className="add-transaction-btn"
                            onClick={() => {
                                setShowForm(true);
                                setEditingTransaction(null);
                                setFormData({
                                    amount: '',
                                    description: '',
                                    type: 'expense',
                                    category_id: '',
                                    budget_id: ''
                                });
                            }}
                        >
                            <span>+</span> НОВА ТРАНЗАКЦІЯ
                        </button>
                    </div>

                    <div className="transactions-layout">
                        <div className="transactions-main">
                            <div className="transactions-section">
                                <div className="transactions-tabs">
                                    <button
                                        className={`transactions-tab ${activeTab === 'all' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('all')}
                                    >
                                        УСІ
                                    </button>
                                    <button
                                        className={`transactions-tab ${activeTab === 'income' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('income')}
                                    >
                                        ДОХОДИ
                                    </button>
                                    <button
                                        className={`transactions-tab ${activeTab === 'expense' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('expense')}
                                    >
                                        ВИТРАТИ
                                    </button>
                                </div>

                                <div className="transactions-table">
                                    {filteredTransactions.length === 0 ? (
                                        <div className="empty-state">
                                            <div className="icon">💳</div>
                                            <h3>Транзакцій поки немає</h3>
                                            <p>Додайте вашу першу транзакцію, щоб почати відстежувати фінанси</p>
                                        </div>
                                    ) : (
                                        <table>
                                            <thead>
                                            <tr>
                                                <th>Тип</th>
                                                <th>Опис</th>
                                                <th>Сума</th>
                                                <th>Категорія</th>
                                                <th>Бюджет</th>
                                                <th>Дата</th>
                                                <th>Дії</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {filteredTransactions.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td>
                                                        <div className={`transaction-type ${transaction.type}`}>
                                                            <span>{transaction.type === 'income' ? '↗' : '↙'}</span>
                                                            {transaction.type === 'income' ? 'Дохід' : 'Витрата'}
                                                        </div>
                                                    </td>
                                                    <td>{transaction.description || 'Без опису'}</td>
                                                    <td>
                                                        <div className={`transaction-amount ${transaction.type}`}>
                                                            {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="transaction-category">
                                                            {getCategoryName(transaction.category_id)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="transaction-budget">
                                                            {getBudgetName(transaction.budget_id)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="transaction-date">
                                                            {formatDate(transaction.created_at)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="transaction-actions">
                                                            <button
                                                                className="action-btn edit"
                                                                onClick={() => handleEdit(transaction)}
                                                                title="Редагувати"
                                                            >
                                                                <i className="bx bx-edit"></i>
                                                            </button>
                                                            <button
                                                                className="action-btn delete"
                                                                onClick={() => handleDelete(transaction.id)}
                                                                title="Видалити"
                                                            >
                                                                <i className="bx bx-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <button className="details-btn">
                                    ДЕТАЛЬНІШЕ
                                </button>
                            </div>
                        </div>

                        <div className="transactions-sidebar">
                            <div className="account-balance">
                                <div className="balance-header">
                                    <div className="balance-title">
                                        <i className="bx bx-dollar-circle"></i>
                                        На рахунку:
                                    </div>
                                </div>
                                <div className="balance-amount">
                                    {formatAmount(totalBalance)}
                                </div>

                                <div className="balance-percentage">
                                    <div className="balance-percentage-label">
                                        ВІДНОШЕННЯ ВИТРАТ І НАДХОДЖЕНЬ:
                                    </div>
                                    <div className="balance-percentage-value">
                                        {expenseRatio.toFixed(1)}%
                                    </div>
                                </div>

                                <div className="balance-stats">
                                    <div className="balance-stat">
                                        <div className="balance-stat-label">
                                            <i className="bx bx-trending-up"></i>
                                            НАДХОДЖЕННЯ:
                                        </div>
                                        <div className="balance-stat-value">
                                            {formatAmount(totalIncome)}
                                        </div>
                                    </div>
                                </div>

                                <div className="balance-stats">
                                    <div className="balance-stat">
                                        <div className="balance-stat-label">
                                            <i className="bx bx-trending-down"></i>
                                            ВИТРАТИ:
                                        </div>
                                        <div className="balance-stat-value">
                                            {formatAmount(totalExpenses)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showForm && (
                    <div className="transaction-modal">
                        <div className="transaction-form">
                            <h2>
                                {editingTransaction ? 'Редагувати транзакцію' : 'Нова транзакція'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Сума *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="1000000"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Опис</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Введіть опис транзакції..."
                                        rows="3"
                                    />
                                </div>

                                {!editingTransaction && (
                                    <div className="form-group">
                                        <label>Тип *</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                type: e.target.value,
                                                category_id: ''
                                            })}
                                            required
                                        >
                                            <option value="expense">Витрата</option>
                                            <option value="income">Дохід</option>
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Категорія *</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Оберіть категорію</option>
                                        {filteredCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!editingTransaction && (
                                    <div className="form-group">
                                        <label>Бюджет *</label>
                                        <select
                                            value={formData.budget_id}
                                            onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Оберіть бюджет</option>
                                            {budgets.map((budget) => (
                                                <option key={budget.id} value={budget.id}>
                                                    {budget.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="form-btn secondary"
                                        onClick={handleCancel}
                                    >
                                        Скасувати
                                    </button>
                                    <button
                                        type="submit"
                                        className="form-btn primary"
                                    >
                                        {editingTransaction ? 'Оновити' : 'Створити'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <WarningModal
                    isOpen={showWarningModal}
                    type={warningData.type}
                    amount={warningData.amount}
                    onConfirm={handleWarningConfirm}
                    onCancel={handleWarningCancel}
                />

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={closeNotification}
                    />
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;
