import React, { useState, useEffect, useCallback  } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/CategoriesPage.css';
import { API_URL } from '../config';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', type: '' });
  const [formErrors, setFormErrors] = useState({});

  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Помилка API');
      }

      return data;
    } catch (err) {
      throw new Error(err.message || 'Помилка мережі');
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall(`${API_URL}/api/categories/`);
      setCategories(response.data || []);
      setFilteredCategories(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (categoryData) => {
    const response = await apiCall(`${API_URL}/api/categories/`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return response.data;
  };

  const updateCategory = async (id, categoryData) => {
    const response = await apiCall(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return response.data;
  };

  const deleteCategory = async (id) => {
    await apiCall(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
    });
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredCategories(categories);
    } else {
      setFilteredCategories(categories.filter((cat) => cat.type === filterType));
    }
  }, [filterType, categories]);

  const validateForm = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'Назва має містити мінімум 3 символи';
    } else if (data.name.trim().length > 20) {
      errors.name = 'Назва має містити максимум 20 символів';
    }

    if (data.description && (data.description.trim().length < 3 || data.description.trim().length > 200)) {
      errors.description = 'Опис має містити від 3 до 200 символів';
    }

    if (!editingCategory && (!data.type || !['incomes', 'expenses'].includes(data.type))) {
      errors.type = 'Оберіть тип категорії (Доходи або Витрати)';
    }

    return errors;
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category?.name || '',
      description: category?.description || '',
      type: category?.type || '',
    });
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', type: '' });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingCategory) {
      setEditingCategory((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewCategory((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const data = editingCategory || newCategory;
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const cleanData = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        type: editingCategory ? editingCategory.type : data.type,
      };

      if (editingCategory) {
        const updatedCategory = await updateCategory(editingCategory.id, cleanData);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingCategory.id ? updatedCategory : cat))
        );
      } else {
        const newCategoryData = await createCategory(cleanData);
        setCategories((prev) => [...prev, newCategoryData]);
      }

      handleCancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
//    if (!window.confirm('Ви впевнені, що хочете видалити цю категорію?')) {
//      return;
//    }

    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-container">
        <div className="categories-container">
          <h1>КАТЕГОРІЇ</h1>
          {error && <div className="error-message">{error}</div>}
          <div className="filter-buttons">
            <button
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Усі
            </button>
            <button
              className={`filter-button ${filterType === 'incomes' ? 'active' : ''}`}
              onClick={() => setFilterType('incomes')}
            >
              Доходи
            </button>
            <button
              className={`filter-button ${filterType === 'expenses' ? 'active' : ''}`}
              onClick={() => setFilterType('expenses')}
            >
              Витрати
            </button>
          </div>
          <div className="categories-layout">
            <div className="categories-table">
              <table>
                <thead>
                  <tr>
                    <th>НАЗВА</th>
                    <th>ТИП</th>
                    <th>ОПИС</th>
                    <th>ДІЇ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>{cat.type === 'incomes' ? 'Доходи' : 'Витрати'}</td>
                      <td>{cat.description}</td>
                      <td>
                        <i
                          className="bx bx-edit edit-icon"
                          onClick={() => handleEditCategory(cat)}
                        ></i>
                        <i
                          className="bx bx-trash delete-icon"
                          onClick={() => handleDeleteCategory(cat.id)}
                        ></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="new-category-form">
          <h2>{editingCategory ? 'РЕДАГУВАТИ КАТЕГОРІЮ' : 'НОВА КАТЕГОРІЯ'}</h2>
          <form onSubmit={handleAddCategory}>
            <label>НАЗВА</label>
            <input
              type="text"
              name="name"
              value={editingCategory ? editingCategory.name : newCategory.name}
              onChange={handleInputChange}
              placeholder=""
            />
            {formErrors.name && <div className="error-text">{formErrors.name}</div>}

            {!editingCategory && (
              <>
                <label>ТИП</label>
                <select
                  name="type"
                  value={newCategory.type}
                  onChange={handleInputChange}
                >
                  <option value="">Оберіть тип</option>
                  <option value="incomes">Доходи</option>
                  <option value="expenses">Витрати</option>
                </select>
                {formErrors.type && <div className="error-text">{formErrors.type}</div>}
              </>
            )}

            <label>ОПИС</label>
            <input
              type="text"
              name="description"
              value={editingCategory ? editingCategory.description || '' : newCategory.description}
              onChange={handleInputChange}
              placeholder=""
            />
            {formErrors.description && <div className="error-text">{formErrors.description}</div>}

            <div className="form-buttons">
              <button type="submit">{editingCategory ? 'Оновити' : 'ДОДАТИ'}</button>
              {editingCategory && (
                <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                  Скасувати
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;