import React, { useState } from 'react';
import '../styles/CalculatorsPage.css';
import Sidebar from '../components/Sidebar';
import '../styles/Sidebar.css';

const API_URL = 'http://localhost:5000';

// Компоненти калькуляторів (без змін)
const SavingsCalculator = () => {
  const [formData, setFormData] = useState({
    initial_sum: '',
    term_months: '',
    annual_rate: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calculators/savings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          initial_sum: parseFloat(formData.initial_sum),
          term_months: parseInt(formData.term_months),
          annual_rate: parseFloat(formData.annual_rate)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Помилка обчислення');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert(error.message || 'Помилка обчислення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-card">
      <div className="calculator-header">
        <div className="calculator-icon savings">💰</div>
        <h3 className="calculator-title">Калькулятор заощаджень</h3>
      </div>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Початкова сума (грн)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.initial_sum}
            onChange={(e) => setFormData({...formData, initial_sum: e.target.value})}
            placeholder="10000"
            required
          />
        </div>
        <div className="form-group">
          <label>Термін (місяці)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={formData.term_months}
            onChange={(e) => setFormData({...formData, term_months: e.target.value})}
            placeholder="12"
            required
          />
        </div>
        <div className="form-group">
          <label>Річна ставка (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            placeholder="5.5"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="calculate-btn"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Обчислення...
            </>
          ) : (
            'Розрахувати'
          )}
        </button>
      </form>
      {result && (
        <div className="calculator-result">
          <div className="result-header">Результат розрахунку</div>
          <div className="result-value positive">
            {result.final_amount.toLocaleString('uk-UA')} грн
          </div>
          <div className="result-details">
            <div className="result-detail">
              <span className="result-label">Початкова сума:</span>
              <span className="result-amount">{parseFloat(formData.initial_sum).toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Прибуток:</span>
              <span className="result-amount positive">{(result.final_amount - parseFloat(formData.initial_sum)).toLocaleString('uk-UA')} грн</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreditCalculator = () => {
  const [formData, setFormData] = useState({
    principal: '',
    annual_rate: '',
    term_months: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calculators/credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          principal: parseFloat(formData.principal),
          annual_rate: parseFloat(formData.annual_rate),
          term_months: parseInt(formData.term_months)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Помилка обчислення');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert(error.message || 'Помилка обчислення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-card">
      <div className="calculator-header">
        <div className="calculator-icon credit">🏦</div>
        <h3 className="calculator-title">Кредитний калькулятор</h3>
      </div>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Сума кредиту (грн)</label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={formData.principal}
            onChange={(e) => setFormData({...formData, principal: e.target.value})}
            placeholder="100000"
            required
          />
        </div>
        <div className="form-group">
          <label>Річна ставка (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            placeholder="15"
            required
          />
        </div>
        <div className="form-group">
          <label>Термін (місяці)</label>
          <input
            type="number"
            min="1"
            value={formData.term_months}
            onChange={(e) => setFormData({...formData, term_months: e.target.value})}
            placeholder="24"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="calculate-btn"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Обчислення...
            </>
          ) : (
            'Розрахувати'
          )}
        </button>
      </form>
      {result && (
        <div className="calculator-result">
          <div className="result-header">Результат розрахунку</div>
          <div className="result-details">
            <div className="result-detail">
              <span className="result-label">Щомісячний платіж:</span>
              <span className="result-amount negative">{result.monthly_payment.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Загальна сума:</span>
              <span className="result-amount negative">{result.total_payment.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Переплата:</span>
              <span className="result-amount negative">{result.total_overpayment.toLocaleString('uk-UA')} грн</span>
            </div>
          </div>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="schedule-toggle"
          >
            {showSchedule ? 'Сховати графік' : 'Показати графік платежів'}
          </button>
          {showSchedule && (
            <div className="schedule-table">
              <table>
                <thead>
                  <tr>
                    <th>Місяць</th>
                    <th>Платіж</th>
                    <th>Основний борг</th>
                    <th>Відсотки</th>
                    <th>Залишок</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payment_schedule.map((payment) => (
                    <tr key={payment.month}>
                      <td>{payment.month}</td>
                      <td>{payment.monthly_payment.toLocaleString('uk-UA')}</td>
                      <td>{payment.principal_payment.toLocaleString('uk-UA')}</td>
                      <td>{payment.interest_payment.toLocaleString('uk-UA')}</td>
                      <td>{payment.remaining_balance.toLocaleString('uk-UA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PensionCalculator = () => {
  const [formData, setFormData] = useState({
    initial_sum: '',
    monthly_contribution: '',
    annual_rate: '',
    term_years: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calculators/pension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          initial_sum: parseFloat(formData.initial_sum) || 0,
          monthly_contribution: parseFloat(formData.monthly_contribution),
          annual_rate: parseFloat(formData.annual_rate),
          term_years: parseInt(formData.term_years)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Помилка обчислення');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert(error.message || 'Помилка обчислення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-card">
      <div className="calculator-header">
        <div className="calculator-icon pension">🏛️</div>
        <h3 className="calculator-title">Пенсійний калькулятор</h3>
      </div>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Початкова сума (грн) - необов'язково</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.initial_sum}
            onChange={(e) => setFormData({...formData, initial_sum: e.target.value})}
            placeholder="0"
          />
        </div>
        <div className="form-group">
          <label>Щомісячний внесок (грн)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.monthly_contribution}
            onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
            placeholder="1000"
            required
          />
        </div>
        <div className="form-group">
          <label>Середня річна дохідність (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            placeholder="7"
            required
          />
        </div>
        <div className="form-group">
          <label>Термін накопичення (роки)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={formData.term_years}
            onChange={(e) => setFormData({...formData, term_years: e.target.value})}
            placeholder="30"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="calculate-btn"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Обчислення...
            </>
          ) : (
            'Розрахувати'
          )}
        </button>
      </form>
      {result && (
        <div className="calculator-result">
          <div className="result-header">Результат розрахунку</div>
          <div className="result-value positive">
            {result.final_amount.toLocaleString('uk-UA')} грн
          </div>
          <div className="result-details">
            <div className="result-detail">
              <span className="result-label">Внесено всього:</span>
              <span className="result-amount">{result.total_contributions.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Дохід від інвестицій:</span>
              <span className="result-amount positive">{result.investment_income.toLocaleString('uk-UA')} грн</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaxCalculator = () => {
  const [formData, setFormData] = useState({
    gross_salary: '',
    tax_rate: '18',
    military_tax: '1.5',
    social_contribution: '22'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calculators/tax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gross_salary: parseFloat(formData.gross_salary),
          tax_rate: parseFloat(formData.tax_rate),
          military_tax: parseFloat(formData.military_tax),
          social_contribution: parseFloat(formData.social_contribution)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Помилка обчислення');
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert(error.message || 'Помилка обчислення');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculator-card">
      <div className="calculator-header">
        <div className="calculator-icon tax">📊</div>
        <h3 className="calculator-title">Податковий калькулятор</h3>
      </div>
      <form className="calculator-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Валова зарплата (грн)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.gross_salary}
            onChange={(e) => setFormData({...formData, gross_salary: e.target.value})}
            placeholder="25000"
            required
          />
        </div>
        <div className="form-group">
          <label>Податок на доходи (%)</label>
          <select
            value={formData.tax_rate}
            onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
          >
            <option value="18">18% (стандартна ставка)</option>
            <option value="5">5% (для ФОП)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Військовий збір (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.military_tax}
            onChange={(e) => setFormData({...formData, military_tax: e.target.value})}
            placeholder="1.5"
            required
          />
        </div>
        <div className="form-group">
          <label>Соціальний внесок (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="30"
            value={formData.social_contribution}
            onChange={(e) => setFormData({...formData, social_contribution: e.target.value})}
            placeholder="22"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="calculate-btn"
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Обчислення...
            </>
          ) : (
            'Розрахувати'
          )}
        </button>
      </form>
      {result && (
        <div className="calculator-result">
          <div className="result-header">Результат розрахунку</div>
          <div className="result-value positive">
            {result.net_salary.toLocaleString('uk-UA')} грн
          </div>
          <div className="result-details">
            <div className="result-detail">
              <span className="result-label">Валова зарплата:</span>
              <span className="result-amount">{result.gross_salary.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Податок на доходи:</span>
              <span className="result-amount negative">-{result.income_tax.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Військовий збір:</span>
              <span className="result-amount negative">-{result.military_tax.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Соціальний внесок:</span>
              <span className="result-amount negative">-{result.social_contribution.toLocaleString('uk-UA')} грн</span>
            </div>
            <div className="result-detail">
              <span className="result-label">Всього утримано:</span>
              <span className="result-amount negative">-{result.total_deductions.toLocaleString('uk-UA')} грн</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorsPage = () => {
  const [activeTab, setActiveTab] = useState('savings');
  const [showInfo, setShowInfo] = useState(false);

  const renderCalculator = () => {
    switch (activeTab) {
      case 'savings':
        return <SavingsCalculator />;
      case 'credit':
        return <CreditCalculator />;
      case 'pension':
        return <PensionCalculator />;
      case 'tax':
        return <TaxCalculator />;
      default:
        return <SavingsCalculator />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-container">
        <div className="calculators-container">
          <div className="page-header">
            <div>
              <h1>Фінансові калькулятори</h1>
              <p className="page-subtitle">
                Плануйте своє фінансове майбутнє з нашими професійними калькуляторами
              </p>
            </div>
            <button
              className="info-toggle-btn"
              onClick={() => setShowInfo(!showInfo)}
              title="Корисна інформація"
              aria-expanded={showInfo}
              aria-controls="calculator-info"
            >
              <i className="bx bx-info-circle"></i>
            </button>
          </div>

          {showInfo && (
            <div className="calculator-info" id="calculator-info">
              <h2>Корисна інформація</h2>
              <div className="info-grid">
                <div className="info-item">
                  <h3>
                    <span className="info-icon">💰</span> Заощадження
                  </h3>
                  <p>
                    Розрахуйте майбутню вартість ваших заощаджень з урахуванням
                    складних відсотків та регулярних внесків.
                  </p>
                </div>
                <div className="info-item">
                  <h3>
                    <span className="info-icon">🏦</span> Кредити
                  </h3>
                  <p>
                    Визначте розмір щомісячного платежу, загальну переплату
                    та отримайте детальний графік погашення кредиту.
                  </p>
                </div>
                <div className="info-item">
                  <h3>
                    <span className="info-icon">🏛️</span> Пенсійні накопичення
                  </h3>
                  <p>
                    Плануйте своє пенсійне забезпечення, розраховуючи накопичення
                    з урахуванням інфляції та дохідності інвестицій.
                  </p>
                </div>
                <div className="info-item">
                  <h3>
                    <span className="info-icon">📊</span> Податки
                  </h3>
                  <p>
                    Розрахуйте чисту зарплату після сплати всіх обов'язкових
                    податків та зборів в Україні.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="calculator-tabs">
            <button
              className={`calculator-tab ${activeTab === 'savings' ? 'active' : ''}`}
              onClick={() => setActiveTab('savings')}
            >
              <span className="tab-icon">💰</span>
              Заощадження
            </button>
            <button
              className={`calculator-tab ${activeTab === 'credit' ? 'active' : ''}`}
              onClick={() => setActiveTab('credit')}
            >
              <span className="tab-icon">🏦</span>
              Кредит
            </button>
            <button
              className={`calculator-tab ${activeTab === 'pension' ? 'active' : ''}`}
              onClick={() => setActiveTab('pension')}
            >
              <span className="tab-icon">🏛️</span>
              Пенсія
            </button>
            <button
              className={`calculator-tab ${activeTab === 'tax' ? 'active' : ''}`}
              onClick={() => setActiveTab('tax')}
            >
              <span className="tab-icon">📊</span>
              Податки
            </button>
          </div>

          {renderCalculator()}
        </div>
      </div>
    </div>
  );
};

export default CalculatorsPage;