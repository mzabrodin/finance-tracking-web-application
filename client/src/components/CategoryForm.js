/**
 * This file contains category form component.
 */

import React from 'react';
import '../styles/CategoriesPage.css';

/**
 * CategoryForm component allows users to add or edit categories.
 */
const CategoryForm = ({
  editingCategory,
  newCategory,
  formErrors,
  handleInputChange,
  handleAddCategory,
  handleCancelEdit,
}) => (
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
      {formErrors.name && <span className="error">{formErrors.name}</span>}
      <label>ОПИС</label>
      <input
        type="text"
        name="description"
        value={editingCategory ? editingCategory.description : newCategory.description}
        onChange={handleInputChange}
        placeholder=""
      />
      {formErrors.description && <span className="error">{formErrors.description}</span>}
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
);

export default CategoryForm;