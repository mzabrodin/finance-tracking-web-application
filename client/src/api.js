import axios from 'axios';
import {API_URL} from '../config';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Для надсилання кук із JWT
});

export const login = async (email, password) => {
    const response = await api.post('/auth/login', {email, password});
    return response.data;
};

export const createCategory = async (categoryData) => {
    const response = await api.post('/categories/', categoryData);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories/');
    return response.data;
};

export const getCategory = async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
};

export const updateCategory = async (categoryId, categoryData) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
};

export const deleteCategory = async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
};