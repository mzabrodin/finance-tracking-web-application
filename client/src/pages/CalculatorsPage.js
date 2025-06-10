import React, { useState } from 'react';
import '../styles/CalculatorsPage.css';
import Sidebar from '../components/Sidebar';
import '../styles/Sidebar.css';

const API_URL = 'http://localhost:5000';


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
    <div className="bg-white rounded-xl shadow-lg p-6">
         <Sidebar />
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">💰</span>
        Калькулятор заощаджень
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Початкова сума (грн)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.initial_sum}
            onChange={(e) => setFormData({...formData, initial_sum: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Термін (місяці)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={formData.term_months}
            onChange={(e) => setFormData({...formData, term_months: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="12"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Річна ставка (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="5.5"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обчислення...' : 'Розрахувати'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Результат:</h4>
          <p className="text-lg text-green-700">
            Кінцева сума: <span className="font-bold">{result.final_amount.toLocaleString()} грн</span>
          </p>
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">🏦</span>
        Кредитний калькулятор
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сума кредиту (грн)
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={formData.principal}
            onChange={(e) => setFormData({...formData, principal: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="100000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Річна ставка (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="15"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Термін (місяці)
          </label>
          <input
            type="number"
            min="1"
            value={formData.term_months}
            onChange={(e) => setFormData({...formData, term_months: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="24"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обчислення...' : 'Розрахувати'}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-3">Результат:</h4>
            <div className="space-y-2 text-red-700">
              <p>Щомісячний платіж: <span className="font-bold">{result.monthly_payment.toLocaleString()} грн</span></p>
              <p>Загальна сума: <span className="font-bold">{result.total_payment.toLocaleString()} грн</span></p>
              <p>Переплата: <span className="font-bold">{result.total_overpayment.toLocaleString()} грн</span></p>
            </div>
          </div>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            {showSchedule ? 'Сховати графік' : 'Показати графік платежів'}
          </button>

          {showSchedule && (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Місяць</th>
                    <th className="px-3 py-2 text-left">Платіж</th>
                    <th className="px-3 py-2 text-left">Основний борг</th>
                    <th className="px-3 py-2 text-left">Відсотки</th>
                    <th className="px-3 py-2 text-left">Залишок</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payment_schedule.map((payment) => (
                    <tr key={payment.month} className="border-t border-gray-100">
                      <td className="px-3 py-2">{payment.month}</td>
                      <td className="px-3 py-2">{payment.monthly_payment.toLocaleString()}</td>
                      <td className="px-3 py-2">{payment.principal_payment.toLocaleString()}</td>
                      <td className="px-3 py-2">{payment.interest_payment.toLocaleString()}</td>
                      <td className="px-3 py-2">{payment.remaining_balance.toLocaleString()}</td>
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">🏛️</span>
        Пенсійний калькулятор
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Початкова сума (грн) - необов'язково
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.initial_sum}
            onChange={(e) => setFormData({...formData, initial_sum: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Щомісячний внесок (грн)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.monthly_contribution}
            onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="1000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Середня річна дохідність (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.annual_rate}
            onChange={(e) => setFormData({...formData, annual_rate: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="7"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Термін накопичення (роки)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={formData.term_years}
            onChange={(e) => setFormData({...formData, term_years: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="30"
            required
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обчислення...' : 'Розрахувати'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Результат:</h4>
          <p className="text-lg text-green-700">
            Пенсійні заощадження: <span className="font-bold">{result.final_amount.toLocaleString()} грн</span>
          </p>
        </div>
      )}
    </div>
  );
};

const TaxFopCalculator = () => {
  const [formData, setFormData] = useState({
    income: '',
    tax_group: '3',
    unified_social_contribution: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requestData = {
        income: parseFloat(formData.income),
        tax_group: parseInt(formData.tax_group)
      };

      if (formData.unified_social_contribution) {
        requestData.unified_social_contribution = parseFloat(formData.unified_social_contribution);
      }

      const response = await fetch(`${API_URL}/api/calculators/tax-fop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">📊</span>
        Податковий калькулятор ФОП
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дохід (грн)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.income}
            onChange={(e) => setFormData({...formData, income: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="50000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Податкова група
          </label>
          <select
            value={formData.tax_group}
            onChange={(e) => setFormData({...formData, tax_group: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="3">3 група (3%)</option>
            <option value="5">5 група (5%)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ЄСВ (грн) - необов'язково
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.unified_social_contribution}
            onChange={(e) => setFormData({...formData, unified_social_contribution: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обчислення...' : 'Розрахувати'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3">Результат:</h4>
          <div className="space-y-2 text-purple-700">
            <p>Податок: <span className="font-bold">{result.tax_amount.toLocaleString()} грн</span></p>
            {result.unified_social_contribution && (
              <p>ЄСВ: <span className="font-bold">{result.unified_social_contribution.toLocaleString()} грн</span></p>
            )}
            {result.total_tax && (
              <p className="text-lg border-t border-purple-200 pt-2">
                Загалом до сплати: <span className="font-bold">{result.total_tax.toLocaleString()} грн</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorsPage = () => {
  const [activeTab, setActiveTab] = useState('savings');

  const tabs = [
    { id: 'savings', label: 'Заощадження', icon: '💰' },
    { id: 'credit', label: 'Кредит', icon: '🏦' },
    { id: 'pension', label: 'Пенсія', icon: '🏛️' },
    { id: 'tax', label: 'Податок ФОП', icon: '📊' }
  ];

  const renderCalculator = () => {
    switch (activeTab) {
      case 'savings':
        return <SavingsCalculator />;
      case 'credit':
        return <CreditCalculator />;
      case 'pension':
        return <PensionCalculator />;
      case 'tax':
        return <TaxFopCalculator />;
      default:
        return <SavingsCalculator />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Фінансові калькулятори
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Розрахуйте свої фінансові показники за допомогою наших професійних калькуляторів
          </p>
        </div>

        {}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-xl shadow-lg p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 mx-1 my-1 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-2 text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {}
        <div className="transition-all duration-300 ease-in-out">
          {renderCalculator()}
        </div>

        {}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Про наші калькулятори
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">💰 Калькулятор заощаджень</h3>
              <p>Розрахуйте майбутню вартість ваших заощаджень з урахуванням складних відсотків.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🏦 Кредитний калькулятор</h3>
              <p>Визначте щомісячні платежі та загальну переплату по кредиту з детальним графіком.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🏛️ Пенсійний калькулятор</h3>
              <p>Плануйте свою пенсію, розраховуючи накопичення від регулярних внесків.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📊 Податковий калькулятор ФОП</h3>
              <p>Розрахуйте податки для фізичних осіб-підприємців 3 та 5 групи.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorsPage;