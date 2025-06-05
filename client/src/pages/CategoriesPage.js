import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import '../styles/CategoriesPage.css';

function CategoriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (!user) return;
    const exampleCategories = [
      { id: 1, name: 'Продукти', description: 'Харчові продукти' },
      { id: 2, name: 'Комунальні послуги', description: 'Платежі за світло, воду тощо' },
      { id: 3, name: 'Розваги', description: 'Кіно, ігри, відпочинок' },
    ];
    setCategories(exampleCategories);
  }, [user]);

  const handleInputChange = (e) => {
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, [e.target.name]: e.target.value });
    } else {
      setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (editingCategory) {
      try {
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id ? editingCategory : cat
        );
        setCategories(updatedCategories);
        setEditingCategory(null);
        toast.success('Категорію оновлено');
      } catch (error) {
        toast.error('Помилка при оновленні категорії');
      }
    } else {
      try {
        const newCat = { id: categories.length + 1, ...newCategory };
        setCategories([...categories, newCat]);
        setNewCategory({ name: '', description: '' });
        toast.success('Категорію додано');
      } catch (error) {
        toast.error('Помилка при додаванні категорії');
      }
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ name: '', description: '' }); // Clear the add form when switching to edit
  };

  const handleDeleteCategory = (id) => {
    try {
      const updatedCategories = categories.filter(cat => cat.id !== id);
      setCategories(updatedCategories);
      toast.success('Категорію видалено');
    } catch (error) {
      toast.error('Помилка при видаленні категорії');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' }); // Reset the form
  };

  if (!user) return <div>Завантаження...</div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="content-container">
        <div className="categories-container">
          <h1>КАТЕГОРІЇ</h1>
          <div className="categories-layout">
            <div className="categories-table">
              <table>
                <thead>
                  <tr>
                    <th>НАЗВА</th>
                    <th>ОПИС</th>
                    <th>ДІЇ</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
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
            <label>ОПИС</label>
            <input
              type="text"
              name="description"
              value={editingCategory ? editingCategory.description : newCategory.description}
              onChange={handleInputChange}
              placeholder=""
            />
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
}

export default CategoriesPage;