import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/Sidebar.css';
import { API_URL } from '../config';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    budget_id: ''
  });

  // Fetch data functions
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchCategories(), fetchBudgets()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.category_id || !formData.budget_id) {
      alert('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    try {
      const transactionData = {
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        type: formData.type,
        category_id: parseInt(formData.category_id),
        budget_id: parseInt(formData.budget_id)
      };

      if (editingTransaction) {
        const response = await axios.put(
          `${API_URL}/api/transactions/${editingTransaction.id}`,
          transactionData,
          { withCredentials: true }
        );
        if (response.data.status === 'success') {
          alert('Транзакція оновлена успішно!');
        }
      } else {
        const response = await axios.post(
          `${API_URL}/api/transactions/`,
          transactionData,
          { withCredentials: true }
        );
        if (response.data.status === 'success') {
          alert('Транзакція створена успішно!');
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
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert(error.response?.data?.message || 'Помилка при збереженні транзакції');
    }
  };

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

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю транзакцію?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/api/transactions/${transactionId}`,
        { withCredentials: true }
      );
      if (response.data.status === 'success') {
        alert('Транзакція видалена успішно!');
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert(error.response?.data?.message || 'Помилка при видаленні транзакції');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Невідома категорія';
  };

  const getBudgetName = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget ? budget.name : 'Невідомий бюджет';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div>Завантаження...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Sidebar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Транзакції</h1>
        <button
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
          style={{
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>+</span> Додати транзакцію
        </button>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingTransaction ? 'Редагувати транзакцію' : 'Нова транзакція'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Сума *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Опис
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    minHeight: '80px'
                  }}
                  placeholder="Опис транзакції..."
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Тип *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="expense">Витрата</option>
                  <option value="income">Дохід</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Категорія *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Оберіть категорію</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Бюджет *
                </label>
                <select
                  value={formData.budget_id}
                  onChange={(e) => setFormData({...formData, budget_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  <option value="">Оберіть бюджет</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTransaction(null);
                  }}
                  style={{
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {editingTransaction ? 'Оновити' : 'Створити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {transactions.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>💳</div>
            <h3 style={{ margin: '0 0 10px 0' }}>Транзакцій поки немає</h3>
            <p style={{ margin: 0 }}>Додайте вашу першу транзакцію, щоб почати відстежувати фінанси</p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto auto auto auto',
              gap: '15px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
              borderBottom: '1px solid #dee2e6'
            }}>
              <div>Тип</div>
              <div>Опис</div>
              <div>Сума</div>
              <div>Категорія</div>
              <div>Бюджет</div>
              <div>Дата</div>
              <div>Дії</div>
            </div>
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto auto auto',
                  gap: '15px',
                  padding: '20px',
                  borderBottom: '1px solid #dee2e6',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: transaction.type === 'income' ? '#28a745' : '#dc3545'
                }}>
                  <span>{transaction.type === 'income' ? '↗' : '↙'}</span>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    {transaction.type === 'income' ? 'Дохід' : 'Витрата'}
                  </span>
                </div>
                <div>{transaction.description || 'Без опису'}</div>
                <div style={{
                  fontWeight: 'bold',
                  color: transaction.type === 'income' ? '#28a745' : '#dc3545'
                }}>
                  {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                </div>
                <div style={{
                  backgroundColor: '#e9ecef',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {getCategoryName(transaction.category_id)}
                </div>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {getBudgetName(transaction.budget_id)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(transaction.created_at)}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleEdit(transaction)}
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    style={{
                      backgroundColor: '#333',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;