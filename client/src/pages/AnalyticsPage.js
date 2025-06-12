/**
 * This file contains AnalyticsPage component which provides detailed financial analytics
 */

import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';
import Sidebar from '../components/Sidebar';
import '../styles/AnalyticsPage.css';
import {API_URL} from '../config';


// AnalyticsPage component
const AnalyticsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showReports, setShowReports] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('summary');
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Fetch transactions
    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/transactions/`, {withCredentials: true});
            if (response.data.status === 'success') {
                setTransactions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
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
            console.error('Error fetching categories:', error);
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
            console.error('Error fetching budgets:', error);
            setBudgets([]);
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

    // Set default report dates
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setReportDateFrom(firstDay.toISOString().split('T')[0]);
        setReportDateTo(now.toISOString().split('T')[0]);
    }, []);

    // Format amount to UAH currency
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH',
        }).format(amount || 0);
    };

    // Get category and budget names by ID
    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Невідома категорія';
    };

    // Get budget name by ID
    const getBudgetName = (budgetId) => {
        const budget = budgets.find(b => b.id === budgetId);
        return budget ? budget.name : 'Невідомий бюджет';
    };

    // Filter transactions by selected period
    const getFilteredTransactions = () => {
        const now = new Date();
        const currentYear = selectedYear;

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_at);
            const transactionYear = transactionDate.getFullYear();

            if (transactionYear !== currentYear) return false;

            switch (selectedPeriod) {
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return transactionDate >= weekAgo;
                case 'month':
                    return transactionDate.getMonth() === now.getMonth();
                case 'quarter':
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
                    return transactionQuarter === currentQuarter;
                case 'year':
                    return true;
                default:
                    return true;
            }
        });
    };

    // Filter transactions for reports by date range
    const getReportTransactions = () => {
        if (!reportDateFrom || !reportDateTo) return [];

        const fromDate = new Date(reportDateFrom);
        const toDate = new Date(reportDateTo);
        toDate.setHours(23, 59, 59, 999);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.created_at);
            return transactionDate >= fromDate && transactionDate <= toDate;
        });
    };

    const filteredTransactions = getFilteredTransactions();
    const reportTransactions = getReportTransactions();

    // Calculate totals
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netBalance = totalIncome - totalExpenses;

    // Report generation functions
    const generateSummaryReport = () => {
        const reportIncome = reportTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportExpenses = reportTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportBalance = reportIncome - reportExpenses;

        return {
            period: `${reportDateFrom} - ${reportDateTo}`,
            totalTransactions: reportTransactions.length,
            totalIncome: reportIncome,
            totalExpenses: reportExpenses,
            netBalance: reportBalance,
            incomeTransactions: reportTransactions.filter(t => t.type === 'income').length,
            expenseTransactions: reportTransactions.filter(t => t.type === 'expense').length,
            averageTransaction: reportTransactions.length > 0 ? (reportIncome + reportExpenses) / reportTransactions.length : 0,
            largestIncome: reportTransactions.filter(t => t.type === 'income').length > 0
                ? Math.max(...reportTransactions.filter(t => t.type === 'income').map(t => t.amount || 0)) : 0,
            largestExpense: reportTransactions.filter(t => t.type === 'expense').length > 0
                ? Math.max(...reportTransactions.filter(t => t.type === 'expense').map(t => t.amount || 0)) : 0,
        };
    };

    // Generate category and budget reports
    const generateCategoryReport = () => {
        const categoryData = {};

        reportTransactions.forEach(transaction => {
            const categoryName = getCategoryName(transaction.category_id);

            if (!categoryData[categoryName]) {
                categoryData[categoryName] = {
                    name: categoryName,
                    income: 0,
                    expenses: 0,
                    transactions: 0,
                };
            }

            if (transaction.type === 'income') {
                categoryData[categoryName].income += transaction.amount || 0;
            } else {
                categoryData[categoryName].expenses += transaction.amount || 0;
            }
            categoryData[categoryName].transactions += 1;
        });

        return Object.values(categoryData).sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses));
    };

    // Generate budget report
    const generateBudgetReport = () => {
        const budgetData = {};

        reportTransactions.forEach(transaction => {
            const budgetName = getBudgetName(transaction.budget_id);

            if (!budgetData[budgetName]) {
                budgetData[budgetName] = {
                    name: budgetName,
                    income: 0,
                    expenses: 0,
                    transactions: 0,
                };
            }

            if (transaction.type === 'income') {
                budgetData[budgetName].income += transaction.amount || 0;
            } else {
                budgetData[budgetName].expenses += transaction.amount || 0;
            }
            budgetData[budgetName].transactions += 1;
        });

        return Object.values(budgetData).sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses));
    };

    // Generate detailed report
    const generateDetailedReport = () => {
        return reportTransactions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(transaction => ({
                ...transaction,
                categoryName: getCategoryName(transaction.category_id),
                budgetName: getBudgetName(transaction.budget_id),
                formattedDate: new Date(transaction.created_at).toLocaleDateString('uk-UA'),
                formattedAmount: formatAmount(transaction.amount),
            }));
    };

    // Export report data to CSV
    const exportToCSV = (data, filename) => {
        let csvContent = '\uFEFF'; // BOM for UTF-8 to support Cyrillic

        if (selectedReportType === 'summary') {
            csvContent += 'Показник,Значення\n';
            csvContent += `Період,${data.period}\n`;
            csvContent += `Загальна кількість транзакцій,${data.totalTransactions}\n`;
            csvContent += `Загальні доходи,${formatAmount(data.totalIncome)}\n`;
            csvContent += `Загальні витрати,${formatAmount(data.totalExpenses)}\n`;
            csvContent += `Чистий баланс,${formatAmount(data.netBalance)}\n`;
            csvContent += `Кількість доходів,${data.incomeTransactions}\n`;
            csvContent += `Кількість витрат,${data.expenseTransactions}\n`;
            csvContent += `Середня транзакція,${formatAmount(data.averageTransaction)}\n`;
            csvContent += `Найбільший дохід,${formatAmount(data.largestIncome)}\n`;
            csvContent += `Найбільша витрата,${formatAmount(data.largestExpense)}\n`;
        } else if (selectedReportType === 'categories') {
            csvContent += 'Категорія,Доходи,Витрати,Транзакції,Загалом\n';
            data.forEach(item => {
                csvContent += `${item.name},${formatAmount(item.income)},${formatAmount(item.expenses)},${item.transactions},${formatAmount(item.income + item.expenses)}\n`;
            });
        } else if (selectedReportType === 'budgets') {
            csvContent += 'Бюджет,Доходи,Витрати,Транзакції,Загалом\n';
            data.forEach(item => {
                csvContent += `${item.name},${formatAmount(item.income)},${formatAmount(item.expenses)},${item.transactions},${formatAmount(item.income + item.expenses)}\n`;
            });
        } else if (selectedReportType === 'detailed') {
            csvContent += 'Дата,Тип,Сума,Опис,Категорія,Бюджет\n';
            data.forEach(transaction => {
                const description = transaction.description ? transaction.description.replace(/,/g, ';') : '-';
                csvContent += `${transaction.formattedDate},${transaction.type === 'income' ? 'Дохід' : 'Витрата'},${transaction.formattedAmount},"${description}",${transaction.categoryName},${transaction.budgetName}\n`;
            });
        }

        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle report generation
    const handleGenerateReport = () => {
        if (!reportDateFrom || !reportDateTo) {
            alert('Будь ласка, виберіть період для звіту.');
            return;
        }

        setGeneratingReport(true);

        setTimeout(() => {
            let generatedReportData;

            switch (selectedReportType) {
                case 'summary':
                    generatedReportData = generateSummaryReport();
                    break;
                case 'categories':
                    generatedReportData = generateCategoryReport();
                    break;
                case 'budgets':
                    generatedReportData = generateBudgetReport();
                    break;
                case 'detailed':
                    generatedReportData = generateDetailedReport();
                    break;
                default:
                    generatedReportData = generateSummaryReport();
            }

            setReportData(generatedReportData);
            setShowReportModal(true);
            setGeneratingReport(false);
        }, 1000);
    };

    // Handle report download
    const handleDownloadReport = () => {
        if (!reportData) return;

        const filename = `${selectedReportType}_report_${reportDateFrom}_${reportDateTo}.csv`;
        exportToCSV(reportData, filename);
    };

    // Close report modal
    const closeReportModal = () => {
        setShowReportModal(false);
        setReportData(null);
    };

    // Prepare data for charts
    const prepareMonthlyData = () => {
        const monthlyData = {};

        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {month: monthKey, income: 0, expenses: 0};
            }

            if (transaction.type === 'income') {
                monthlyData[monthKey].income += transaction.amount || 0;
            } else {
                monthlyData[monthKey].expenses += transaction.amount || 0;
            }
        });

        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    };

    // Prepare category data for pie chart
    const prepareCategoryData = () => {
        const categoryData = {};

        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                const categoryName = getCategoryName(transaction.category_id);

                if (!categoryData[categoryName]) {
                    categoryData[categoryName] = 0;
                }
                categoryData[categoryName] += transaction.amount || 0;
            });

        return Object.entries(categoryData)
            .map(([name, value]) => ({name, value}))
            .sort((a, b) => b.value - a.value);
    };

    // Prepare budget data for bar chart
    const prepareBudgetData = () => {
        const budgetData = {};

        filteredTransactions.forEach(transaction => {
            const budgetName = getBudgetName(transaction.budget_id);

            if (!budgetData[budgetName]) {
                budgetData[budgetName] = {name: budgetName, income: 0, expenses: 0};
            }

            if (transaction.type === 'income') {
                budgetData[budgetName].income += transaction.amount || 0;
            } else {
                budgetData[budgetName].expenses += transaction.amount || 0;
            }
        });

        return Object.values(budgetData);
    };

    const monthlyData = prepareMonthlyData();
    const categoryData = prepareCategoryData();
    const budgetData = prepareBudgetData();

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

    // Get available years from transactions
    const availableYears = [...new Set(transactions.map(t => new Date(t.created_at).getFullYear()))].sort((a, b) => b - a);

    // Render Report Preview Modal
    const renderReportModal = () => {
        if (!showReportModal || !reportData) return null;

        return (
            <div className="modal-overlay" onClick={closeReportModal}>
                <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>
                            Звіт
                            {selectedReportType === 'summary' && ' (Загальний)'}
                            {selectedReportType === 'categories' && ' (За категоріями)'}
                            {selectedReportType === 'budgets' && ' (За бюджетами)'}
                            {selectedReportType === 'detailed' && ' (Детальний)'}
                        </h3>
                        <button className="modal-close-btn" onClick={closeReportModal}>✕</button>
                    </div>

                    <div className="modal-body report-preview">
                        <div className="report-info">
                            <p><strong>Період:</strong> {reportDateFrom} - {reportDateTo}</p>
                            <p><strong>Кількість транзакцій:</strong> {reportTransactions.length}</p>
                        </div>

                        {selectedReportType === 'summary' && (
                            <div className="summary-report-preview">
                                <table className="report-table">
                                    <tbody>
                                    <tr>
                                        <td>Загальна кількість транзакцій</td>
                                        <td>{reportData.totalTransactions}</td>
                                    </tr>
                                    <tr>
                                        <td>Загальні доходи</td>
                                        <td className="income">{formatAmount(reportData.totalIncome)}</td>
                                    </tr>
                                    <tr>
                                        <td>Загальні витрати</td>
                                        <td className="expense">{formatAmount(reportData.totalExpenses)}</td>
                                    </tr>
                                    <tr>
                                        <td>Чистий баланс</td>
                                        <td className={reportData.netBalance >= 0 ? 'income' : 'expense'}>{formatAmount(reportData.netBalance)}</td>
                                    </tr>
                                    <tr>
                                        <td>Кількість доходів</td>
                                        <td>{reportData.incomeTransactions}</td>
                                    </tr>
                                    <tr>
                                        <td>Кількість витрат</td>
                                        <td>{reportData.expenseTransactions}</td>
                                    </tr>
                                    <tr>
                                        <td>Середня транзакція</td>
                                        <td>{formatAmount(reportData.averageTransaction)}</td>
                                    </tr>
                                    <tr>
                                        <td>Найбільший дохід</td>
                                        <td className="income">{formatAmount(reportData.largestIncome)}</td>
                                    </tr>
                                    <tr>
                                        <td>Найбільша витрата</td>
                                        <td className="expense">{formatAmount(reportData.largestExpense)}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {(selectedReportType === 'categories' || selectedReportType === 'budgets') && (
                            <div className="category-budget-report-preview">
                                <table className="report-table">
                                    <thead>
                                    <tr>
                                        <th>{selectedReportType === 'categories' ? 'Категорія' : 'Бюджет'}</th>
                                        <th>Доходи</th>
                                        <th>Витрати</th>
                                        <th>Транзакції</th>
                                        <th>Загалом</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reportData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td className="income">{formatAmount(item.income)}</td>
                                            <td className="expense">{formatAmount(item.expenses)}</td>
                                            <td>{item.transactions}</td>
                                            <td>{formatAmount(item.income + item.expenses)}</td>
                                        </tr>
                                    ))}
                                    {reportData.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="statistic-empty">Немає даних для відображення
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedReportType === 'detailed' && (
                            <div className="detailed-report-preview">
                                <table className="report-table">
                                    <thead>
                                    <tr>
                                        <th>Дата</th>
                                        <th>Тип</th>
                                        <th>Сума</th>
                                        <th>Опис</th>
                                        <th>Категорія</th>
                                        <th>Бюджет</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reportData.map((transaction, index) => (
                                        <tr key={index}>
                                            <td>{transaction.formattedDate}</td>
                                            <td>
                          <span className={`transaction-type ${transaction.type}`}>
                            {transaction.type === 'income' ? 'Дохід' : 'Витрата'}
                          </span>
                                            </td>
                                            <td className={transaction.type}>{transaction.formattedAmount}</td>
                                            <td>{transaction.description || '-'}</td>
                                            <td>{transaction.categoryName}</td>
                                            <td>{transaction.budgetName}</td>
                                        </tr>
                                    ))}
                                    {reportData.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="statistic-empty">Немає транзакцій для
                                                відображення
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                                {reportData.length > 50 && (
                                    <p className="report-note">Показано {reportData.length} транзакцій</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={closeReportModal}>
                            Закрити
                        </button>
                        <button className="btn-primary" onClick={handleDownloadReport}>
                            📥 Завантажити CSV
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar/>
                <div className="content-container">
                    <div className="loading-container">
                        <div>Завантаження аналітики...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar/>
            <div className="content-container">
                <div className="analytics-container">
                    <div className="page-header">
                        <div>
                            <h1>АНАЛІТИКА</h1>
                            <div className="page-subtitle">Детальний аналіз ваших фінансів</div>
                        </div>
                        <div className="analytics-filters">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="filter-select"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                                {availableYears.length === 0 && (
                                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                )}
                            </select>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="filter-select"
                            >
                                <option value="week">Тиждень</option>
                                <option value="month">Місяць</option>
                                <option value="quarter">Квартал</option>
                                <option value="year">Рік</option>
                            </select>
                            <button
                                onClick={() => setShowReports(!showReports)}
                                className="reports-toggle-btn"
                            >
                                📊 Звіти
                            </button>
                        </div>
                    </div>
                    {showReports && (
                        <div className="reports-panel">
                            <div className="reports-header">
                                <h3>Генерація звітів</h3>
                                <button
                                    onClick={() => setShowReports(false)}
                                    className="close-reports-btn"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="reports-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Тип звіту:</label>
                                        <select
                                            value={selectedReportType}
                                            onChange={(e) => setSelectedReportType(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="summary">Загальний звіт</option>
                                            <option value="categories">Звіт за категоріями</option>
                                            <option value="budgets">Звіт за бюджетами</option>
                                            <option value="detailed">Детальний звіт транзакцій</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Від дати:</label>
                                        <input
                                            type="date"
                                            value={reportDateFrom}
                                            onChange={(e) => setReportDateFrom(e.target.value)}
                                            className="form-input"
                                            max={reportDateTo || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>До дати:</label>
                                        <input
                                            type="date"
                                            value={reportDateTo}
                                            onChange={(e) => setReportDateTo(e.target.value)}
                                            className="form-input"
                                            min={reportDateFrom}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div className="reports-description">
                                    <div className="report-type-info">
                                        {selectedReportType === 'summary' && (
                                            <p>📈 Загальна статистика за обраний період: доходи, витрати, баланс, середні
                                                значення</p>
                                        )}
                                        {selectedReportType === 'categories' && (
                                            <p>🏷️ Детальний розбір витрат та доходів по категоріях</p>
                                        )}
                                        {selectedReportType === 'budgets' && (
                                            <p>💰 Аналіз фінансових потоків по бюджетах</p>
                                        )}
                                        {selectedReportType === 'detailed' && (
                                            <p>📋 Повний список всіх транзакцій за обраний період</p>
                                        )}
                                        <p><strong>Період:</strong> {reportTransactions.length} транзакцій
                                            з {reportDateFrom} по {reportDateTo}</p>
                                    </div>
                                </div>

                                <div className="reports-actions">
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={generatingReport || !reportDateFrom || !reportDateTo}
                                        className="generate-report-btn"
                                    >
                                        {generatingReport ? '⏳ Генерується...' : '👁️ Попередній перегляд'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="analytics-summary">
                        <div className="summary-card income">
                            <div className="summary-icon">↗</div>
                            <div className="summary-content">
                                <div className="summary-label">Загальні доходи</div>
                                <div className="summary-value">{formatAmount(totalIncome)}</div>
                            </div>
                        </div>
                        <div className="summary-card expense">
                            <div className="summary-icon">↙</div>
                            <div className="summary-content">
                                <div className="summary-label">Загальні витрати</div>
                                <div className="summary-value">{formatAmount(totalExpenses)}</div>
                            </div>
                        </div>
                        <div className={`summary-card balance ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                            <div className="summary-icon">⚖</div>
                            <div className="summary-content">
                                <div className="summary-label">Чистий баланс</div>
                                <div className="summary-value">{formatAmount(netBalance)}</div>
                            </div>
                        </div>
                        <div className="summary-card transactions">
                            <div className="summary-icon">📊</div>
                            <div className="summary-content">
                                <div className="summary-label">Кількість транзакцій</div>
                                <div className="summary-value">{filteredTransactions.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-container large">
                            <h3>Тренд доходів та витрат</h3>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3"/>
                                        <XAxis dataKey="month"/>
                                        <YAxis/>
                                        <Tooltip
                                            formatter={(value, name) => {
              if (name === "Доходи") return [`Доходи: ${formatAmount(value)}`, ''];
              if (name === "Витрати") return [`Витрати: ${formatAmount(value)}`, ''];
              return [formatAmount(value), ''];
            }}
                                            labelFormatter={(label) => `Місяць: ${label}`}
                                        />
                                        <Line type="monotone" dataKey="income" stroke="#00C49F" strokeWidth={3}
                                              name="Доходи"/>
                                        <Line type="monotone" dataKey="expenses" stroke="#FF8042" strokeWidth={3}
                                              name="Витрати"/>
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">
                                    <div className="empty-icon">📈</div>
                                    <p>Недостатньо даних для відображення тренду</p>
                                </div>
                            )}
                        </div>

                        <div className="chart-container">
                            <h3>Витрати за категоріями</h3>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [formatAmount(value), 'Сума']}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">
                                    <div className="empty-icon">🥧</div>
                                    <p>Немає витрат для аналізу</p>
                                </div>
                            )}
                        </div>

                        <div className="chart-container">
                            <h3>Аналіз за бюджетами</h3>
                            {budgetData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={budgetData}>
                                        <CartesianGrid strokeDasharray="3 3"/>
                                        <XAxis dataKey="name"/>
                                        <YAxis/>
                                        <Tooltip
                                      formatter={(value, name) => {
                                          if (name === "Доходи") return [`Доходи: ${formatAmount(value)}`, ''];
                                          if (name === "Витрати") return [`Витрати: ${formatAmount(value)}`, ''];
                                          return [formatAmount(value), ''];
                                        }}/>
                                        <Bar dataKey="income" fill="#00C49F" name="Доходи"/>
                                        <Bar dataKey="expenses" fill="#FF8042" name="Витрати"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">
                                    <div className="empty-icon">📊</div>
                                    <p>Немає даних для аналізу бюджетів</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="statistics-section">
                        <h3>Детальна статистика</h3>
                        <div className="statistics-grid">
                            <div className="statistic-card">
                                <h4>Топ-5 категорій витрат</h4>
                                <div className="statistic-list">
                                    {categoryData.slice(0, 5).map((category, index) => (
                                        <div key={category.name} className="statistic-item">
                                            <div className="statistic-rank">#{index + 1}</div>
                                            <div className="statistic-name">{category.name}</div>
                                            <div className="statistic-value">{formatAmount(category.value)}</div>
                                        </div>
                                    ))}
                                    {categoryData.length === 0 && (
                                        <div className="statistic-empty">Немає категорій для відображення</div>
                                    )}
                                </div>
                            </div>

                            <div className="statistic-card">
                                <h4>Останні транзакції</h4>
                                <div className="statistic-list">
                                    {filteredTransactions.slice(0, 5).map((transaction) => (
                                        <div key={transaction.id} className="statistic-item">
                                            <div className={`statistic-type ${transaction.type}`}>
                                                {transaction.type === 'income' ? '↗' : '↙'}
                                            </div>
                                            <div className="statistic-name">
                                                {transaction.description || getCategoryName(transaction.category_id)}
                                            </div>
                                            <div className={`statistic-value ${transaction.type}`}>
                                                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <div className="statistic-empty">Немає транзакцій для відображення</div>
                                    )}
                                </div>
                            </div>

                            <div className="statistic-card">
                                <h4>Загальні показники</h4>
                                <div className="health-metrics">
                                    <div className="health-metric">
                                        <div className="health-label">Коефіцієнт витрат</div>
                                        <div className="health-value">
                                            {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                    <div className="health-metric">
                                        <div className="health-label">Середня транзакція</div>
                                        <div className="health-value">
                                            {filteredTransactions.length > 0
                                                ? formatAmount((totalIncome + totalExpenses) / filteredTransactions.length)
                                                : formatAmount(0)
                                            }
                                        </div>
                                    </div>
                                    <div className="health-metric">
                                        <div className="health-label">Найбільша витрата</div>
                                        <div className="health-value">
                                            {filteredTransactions.filter(t => t.type === 'expense').length > 0
                                                ? formatAmount(Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount || 0)))
                                                : formatAmount(0)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {renderReportModal()}
        </div>
    );
};

export default AnalyticsPage;