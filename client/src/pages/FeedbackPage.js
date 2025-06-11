import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import { API_URL } from '../config';
import '../styles/FeedbackPage.css';

const InputGroup = ({ label, name, value, onChange, error, placeholder, type = 'text', icon, autoFocus }) => (
  <div className="input-group" role="group" aria-labelledby={`${name}-label`}>
    <label id={`${name}-label`} htmlFor={name}>
      {icon && <i className={`bx ${icon}`} style={{ marginRight: '8px' }}></i>}
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={error ? 'error' : ''}
      autoFocus={autoFocus}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
    />
    {error && (
      <p id={`${name}-error`} className="error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

const TextAreaGroup = ({ label, name, value, onChange, error, placeholder, charCount }) => (
  <div className="input-group" role="group" aria-labelledby={`${name}-label`}>
    <label id={`${name}-label`} htmlFor={name}>
      <i className="bx bx-message-square-detail" style={{ marginRight: '8px' }}></i>
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={error ? 'error' : ''}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : `${name}-char-count`}
    />
    <p
      id={`${name}-char-count`}
      className={`char-count ${charCount < 10 ? 'error-text' : ''}`}
      aria-live="polite"
    >
      {charCount}/10 символів
    </p>
    {error && (
      <p id={`${name}-error`} className="error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

const RatingInput = ({ rating, onRatingClick, hoveredRating, setHoveredRating, error, getRatingText }) => (
  <div className="input-group" role="radiogroup" aria-labelledby="rating-label">
    <label id="rating-label">Оцініть застосунок</label>
    <div className="rating-group">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingClick(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          className="star-button"
          aria-label={`Оцінка ${star} - ${getRatingText(star)}`}
          aria-checked={rating === star}
        >
          <i
            className={`bx ${star <= (hoveredRating || rating) ? 'bxs-star' : 'bx-star'}`}
            style={{ fontSize: '30px', color: star <= (hoveredRating || rating) ? '#333' : '#ddd' }}
          ></i>
        </button>
      ))}
    </div>
    {rating > 0 && (
      <p className="rating-text" aria-live="polite">
        {getRatingText(rating)}
      </p>
    )}
    {error && (
      <p id="rating-error" className="error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

const CategorySelect = ({ value, onChange, categories, error }) => (
  <div className="input-group" role="group" aria-labelledby="category-label">
    <label id="category-label" htmlFor="category">Категорія відгуку</label>
    <select
      id="category"
      name="category"
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
      aria-describedby={error ? 'category-error' : undefined}
    >
      {categories.map(category => (
        <option key={category.value} value={category.value}>
          {category.label}
        </option>
      ))}
    </select>
    {error && (
      <p id="category-error" className="error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

const SuccessMessage = ({ onNewFeedback }) => (
  <div className="feedback-card" role="alert">
    <div className="icon">
      <i className="bx bx-check-circle" style={{ fontSize: '50px', color: '#333' }}></i>
    </div>
    <h2>Дякуємо за відгук!</h2>
    <p>Ваш відгук було успішно відправлено. Ми цінуємо вашу думку.</p>
    <button
      onClick={onNewFeedback}
      className="action-btn"
      aria-label="Залишити ще один відгук"
    >
      Залишити ще один відгук
    </button>
  </div>
);

const InfoSection = () => (
  <div className="info-section">
    <h2>Чому ваш відгук важливий?</h2>
    <div className="info-grid">
      {[
        { icon: 'bx-bolt-circle', title: 'Швидке покращення', text: 'Ми швидко реагуємо на ваші пропозиції' },
        { icon: 'bx-check-circle', title: 'Якість сервісу', text: 'Допомагаєте нам покращити якість' },
        { icon: 'bx-group', title: 'Спільнота', text: 'Формуємо майбутнє продукту' },
      ].map((item, index) => (
        <div key={index} className="info-card">
          <div className="icon">
            <i className={`bx ${item.icon}`} style={{ fontSize: '30px', color: '#333' }}></i>
          </div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const FeedbackPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    rating: 0,
    feedback: '',
    category: 'general'
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef(null);

  const categories = [
    { value: 'general', label: 'Загальний відгук' },
    { value: 'bug', label: 'Повідомлення про помилку' },
    { value: 'feature', label: 'Пропозиція функції' },
    { value: 'ui', label: 'Інтерфейс користувача' },
    { value: 'performance', label: 'Продуктивність' }
  ];

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.username || '',
        email: user.email || ''
      }));
      setIsLoading(false);
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Ім'я обов'язкове";
    if (!formData.email.trim()) newErrors.email = "Електронна пошта обов'язкова";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Невірний формат email";
    if (formData.rating === 0) newErrors.rating = "Будь ласка, виберіть оцінку";
    if (formData.feedback.length < 10) newErrors.feedback = "Відгук має містити щонайменше 10 символів";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
    setErrors(prev => ({ ...prev, rating: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/feedback`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.status === 'success') {
        setIsSubmitted(true);
        toast.success('Відгук успішно відправлено!');
      } else {
        throw new Error('Помилка відправки');
      }
    } catch (error) {
      console.error('Помилка:', error);
      toast.error(error.response?.data?.message || 'Виникла помилка при відправці відгуку');
      setErrors({ submit: 'Виникла помилка при відправці відгуку. Спробуйте ще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {

      setFormData({
        name: user?.username || '',
        email: user?.email || '',
        rating: 0,
        feedback: '',
        category: 'general'
      });
      setErrors({});
      setHoveredRating(0);
      setIsSubmitted(false);
      formRef.current?.focus();

  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Дуже погано',
      2: 'Погано',
      3: 'Нормально',
      4: 'Добре',
      5: 'Відмінно'
    };
    return texts[rating] || '';
  };

  if (isLoading || !user) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="content-container">
          <div className="loading-container" role="status">
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
        <div className="feedback-container">
          <div className="welcome-section" role="banner">
            <h1>Зворотний зв'язок</h1>
            <p>Поділіться своїми думками про наш застосунок</p>
          </div>
          {isSubmitted ? (
            <SuccessMessage onNewFeedback={handleReset} />
          ) : (
            <div className="feedback-card">
              <form onSubmit={handleSubmit} ref={formRef} aria-label="Форма зворотного зв'язку">
                {errors.submit && (
                  <div className="error-message" role="alert">
                    <p>{errors.submit}</p>
                  </div>
                )}
                <fieldset className="field-row">
                  <legend className="visually-hidden">Особисті дані</legend>
                  <div className="input-row">
                    <InputGroup
                      label="Ім'я"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      placeholder="Введіть ваше ім'я"
                      icon="bx-user"
                      autoFocus
                    />
                    <InputGroup
                      label="Електронна пошта"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      placeholder="your@email.com"
                      icon="bx-envelope"
                    />
                  </div>
                </fieldset>
                <fieldset className="field-row">
                  <legend className="visually-hidden">Деталі відгуку</legend>
                  <div className="input-row">
                    <CategorySelect
                      value={formData.category}
                      onChange={handleInputChange}
                      categories={categories}
                      error={errors.category}
                    />
                    <RatingInput
                      rating={formData.rating}
                      onRatingClick={handleRatingClick}
                      hoveredRating={hoveredRating}
                      setHoveredRating={setHoveredRating}
                      error={errors.rating}
                      getRatingText={getRatingText}
                    />
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="visually-hidden">Відгук</legend>
                  <TextAreaGroup
                    label="Ваш відгук"
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleInputChange}
                    error={errors.feedback}
                    placeholder="Поділіться своїми думками, пропозиціями або повідомте про проблеми..."
                    charCount={formData.feedback.length}
                  />
                </fieldset>
                <div className="button-group">
                  <button
                    type="submit"
                    disabled={isSubmitting || formData.feedback.length < 10 || formData.rating === 0}
                    className="action-btn"
                    aria-label="Відправити відгук"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '8px' }}></i>
                        Відправляється...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-send" style={{ marginRight: '8px' }}></i>
                        Відправити відгук
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="action-btn reset-btn"
                    aria-label="Очистити форму"
                    disabled={isSubmitting}
                  >
                    <i className="bx bx-reset" style={{ marginRight: '8px' }}></i>
                    Очистити
                  </button>
                </div>
              </form>
            </div>
          )}
          <InfoSection />
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;