import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/SavingsPage.css';

const BudgetApp = () => {
  const [budgets, setBudgets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTransactionWarningModal, setShowTransactionWarningModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    initial: '',
    current: '',
    goal: '',
    created_at: new Date().toISOString().split('T')[0],
    end_at: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const apiCall = async (url, options = {}) => {
    try {
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      };

      const response = await axios({
        url: `${API_URL}/api/budgets${url}`,
        ...config
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate('/auth');
        throw new Error('Сесія закінчилася. Будь ласка, увійдіть знову.');
      }
      throw new Error(error.response?.data?.message || 'Помилка API');
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/', { method: 'GET' });
      setBudgets(data.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalBalance = async () => {
    try {
      const data = await apiCall('/balance', { method: 'GET' });
      setTotalBalance(data.data?.total_balance || 0);
    } catch (err) {
      console.error('Не вдалося отримати баланс:', err);
    }
  };

  const validateForm = () => {
    if (formData.goal && !formData.end_at) {
      setShowWarningModal(true);
      return false;
    }
    return true;
  };

  const createBudget = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        initial: parseFloat(formData.initial),
        current: formData.current ? parseFloat(formData.current) : undefined,
        goal: formData.goal ? parseFloat(formData.goal) : null,
        end_at: formData.end_at || null
      };
      await apiCall('/', { method: 'POST', data: submitData });
      setSuccess('Бюджет успішно створено!');
      resetForm();
      fetchBudgets();
      fetchTotalBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        initial: parseFloat(formData.initial),
        current: parseFloat(formData.current),
        goal: formData.goal ? parseFloat(formData.goal) : null,
        end_at: formData.end_at || null
      };
      await apiCall(`/${editingBudget.id}`, { method: 'PUT', data: submitData });
      setSuccess('Бюджет успішно оновлено!');
      resetForm();
      fetchBudgets();
      fetchTotalBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkTransactions = async (budgetId) => {
    try {
      const response = await axios({
        url: `${API_URL}/api/budgets/${budgetId}/transactions`,
        method: 'GET',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data.data && response.data.data.length > 0;
    } catch (error) {
      console.error('Помилка перевірки транзакцій:', error);
      return false;
    }
  };

  const deleteBudget = async (id) => {
    const confirmed = window.confirm('Ви впевнені, що хочете видалити цей бюджет?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const hasTransactions = await checkTransactions(id);
      if (hasTransactions) {
        setBudgetToDelete(id);
        setShowTransactionWarningModal(true);
      } else {
        await apiCall(`/${id}`, { method: 'DELETE' });
        setSuccess('Бюджет успішно видалено!');
        fetchBudgets();
        fetchTotalBalance();
        setSelectedBudget(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      initial: '',
      current: '',
      goal: '',
      created_at: new Date().toISOString().split('T')[0],
      end_at: ''
    });
    setShowCreateForm(false);
    setEditingBudget(null);
    setShowWarningModal(false);
    setShowTransactionWarningModal(false);
  };

  const startEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      initial: budget.initial.toString(),
      current: budget.current.toString(),
      goal: budget.goal ? budget.goal.toString() : '',
      created_at: budget.created_at,
      end_at: budget.end_at || ''
    });
    setShowCreateForm(true);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  const getProgress = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Помилка виходу:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchTotalBalance();
    }
  }, [user]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!user) {
    return (
      <div className="app-layout">
        <div className="content-container">
          <div className="text-center">
            <div className="text-4xl mb-2"></div>
            <p className="text-gray-600">Перенаправлення на сторінку входу...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`content-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="budgets-container">
          <h1>НАКОПИЧЕННЯ</h1>
          <div className="user-info">
            <p>Відстеження накопичень, постановка фінансових цілей</p>
          </div>
          {error && (
            <div className="message error">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="message success">
              ✅ {success}
            </div>
          )}
          <div className="total-balance">
            <h2>Загальний Баланс</h2>
            <p>{formatCurrency(totalBalance)}</p>
          </div>
          <div className="action-buttons">
            <button
              onClick={() => { fetchBudgets(); fetchTotalBalance(); }}
              className="action-button refresh"
            >
              Оновити
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="action-button add"
            >
              Новий бюджет
            </button>
          </div>
          {showCreateForm && (
            <div className="budget-form-modal">
              <div className="modal-content">
                <h2>{editingBudget ? 'РЕДАГУВАТИ БЮДЖЕТ' : 'НОВИЙ БЮДЖЕТ'}</h2>
                <form onSubmit={editingBudget ? updateBudget : createBudget}>
                  <div className="form-group">
                    <label>📝 НАЗВА БЮДЖЕТУ</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Введіть назву бюджету (3-30 символів)"
                      required
                      minLength={3}
                      maxLength={30}
                    />
                  </div>
                  <div className="form-group">
                    <label>💵 ПОЧАТКОВА СУМА</label>
                    <input
                      type="number"
                      value={formData.initial}
                      onChange={(e) => setFormData({...formData, initial: e.target.value})}
                      placeholder="0.00"
                      min="0"
                      max="100000000"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ПОТОЧНА СУМА</label>
                    <input
                      type="number"
                      value={formData.current}
                      onChange={(e) => setFormData({...formData, current: e.target.value})}
                      placeholder="Залиште пустим для використання початкової суми"
                      min="0"
                      max="100000000"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>ЦІЛЬОВА СУМА (ОПЦІОНАЛЬНО)</label>
                    <input
                      type="number"
                      value={formData.goal}
                      onChange={(e) => setFormData({...formData, goal: e.target.value})}
                      placeholder="0.00"
                      min="0"
                      max="100000000"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>ДАТА СТВОРЕННЯ</label>
                    <input
                      type="date"
                      value={formData.created_at}
                      onChange={(e) => setFormData({...formData, created_at: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>КІНЦЕВА ДАТА (ОПЦІОНАЛЬНО)</label>
                    <input
                      type="date"
                      value={formData.end_at}
                      onChange={(e) => setFormData({...formData, end_at: e.target.value})}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" disabled={loading}>
                      {loading ? 'Збереження...' : (editingBudget ? 'Оновити' : 'ДОДАТИ')}
                    </button>
                    <button type="button" className="cancel-button" onClick={resetForm}>
                      Скасувати
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showWarningModal && (
            <div className="warning-modal">
              <div className="modal-content">
                <h2>ПОПЕРЕДЖЕННЯ</h2>
                <p>Ви встановили цільову суму, але не вказали кінцеву дату. Будь ласка, вкажіть кінцеву дату для продовження.</p>
                <div className="form-buttons">
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="action-button"
                  >
                    Добре
                  </button>
                </div>
              </div>
            </div>
          )}
          {showTransactionWarningModal && (
            <div className="transaction-warning-modal">
              <div className="modal-content">
                <h2>ПОПЕРЕДЖЕННЯ</h2>
                <p>Неможливо видалити бюджет, оскільки він містить транзакції. Спочатку видаліть усі пов’язані транзакції.</p>
                <div className="form-buttons">
                  <button
                    onClick={() => setShowTransactionWarningModal(false)}
                    className="action-button"
                  >
                    Добре
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedBudget && (
            <div className="budget-detail-modal">
              <div className="modal-content">
                <h2>ДЕТАЛЬНІШЕ</h2>
                <div className="modal-details">
                  <div className="detail-item">
                    <span>Назва:</span>
                    <span>{selectedBudget.name}</span>
                  </div>
                  <div className="detail-item">
                    <span>Початкова сума:</span>
                    <span>{formatCurrency(selectedBudget.initial)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Поточна сума:</span>
                    <span>{formatCurrency(selectedBudget.current)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Ціль:</span>
                    <span>{selectedBudget.goal ? formatCurrency(selectedBudget.goal) : '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Створено:</span>
                    <span>{new Date(selectedBudget.created_at).toLocaleDateString('uk-UA')}</span>
                  </div>
                  <div className="detail-item">
                    <span>Закінчується:</span>
                    <span>{selectedBudget.end_at ? new Date(selectedBudget.end_at).toLocaleDateString('uk-UA') : '—'}</span>
                  </div>
                  <div className="detail-item progress">
                    <span>Прогрес:</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${getProgress(selectedBudget.current, selectedBudget.goal)}%` }}
                      ></div>
                    </div>
                    <span>{getProgress(selectedBudget.current, selectedBudget.goal).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={() => startEdit(selectedBudget)} className="action-button edit">
                    Редагувати
                  </button>
                  <button onClick={() => deleteBudget(selectedBudget.id)} className="action-button delete">
                    Видалити
                  </button>
                  <button onClick={() => setSelectedBudget(null)} className="action-button close">
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="budgets-cards">
            {loading && budgets.length === 0 ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Завантаження бюджетів...</p>
              </div>
            ) : budgets.length === 0 ? (
              <div className="empty-state">
                <div className="icon"></div>
                <p>Бюджетів не знайдено. Створіть свій перший бюджет!</p>
              </div>
            ) : (
              <div className="cards-container">
                {budgets.map((budget) => (
                  <div key={budget.id} className="budget-card">
                    <div className="card-header">
                      {budget.name === 'НА МОРЕ' ? (
                        <span className="icon"></span>
                      ) : (
                        <span className="icon"></span>
                      )}
                      <h3>{budget.name}</h3>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${getProgress(budget.current, budget.goal || budget.initial)}%` }}
                      ></div>
                    </div>
                    <div className="card-details">
                      <p>Ціль: {budget.goal ? formatCurrency(budget.goal) : '—'}</p>
                      <p>ЗБРАНО: {formatCurrency(budget.current)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBudget(budget)}
                      className="detail-button"
                    >
                      Детальніше
                    </button>
                  </div>
                ))}
                <div className="budget-card add-card">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="add-button"
                  >
                    ➕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetApp;