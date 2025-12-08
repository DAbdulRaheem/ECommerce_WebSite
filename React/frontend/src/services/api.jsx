import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api'; 
// const API_URL = 'https://ecommerce-website-40il.onrender.com/api'; 

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const authService = {
    login: (creds) => api.post('/auth/login/', creds),
    register: (data) => api.post('/auth/register/', data),
    adminRegister: (data) => api.post('/auth/admin/register/', data),
    adminLogin: (creds) => api.post('/auth/admin/login/', creds),
};

export const productService = {
    getAll: () => api.get('/products/'),
    getOne: (id) => api.get(`/products/${id}/`),
    getMyProducts: () => api.get('/products/my/'), // To view Admin's Products
    create: (data) => api.post('/products/', data), 
    update: (id, data) => api.put(`/products/${id}/`, data), //  Edit Admin's Products
    delete: (id) => api.delete(`/products/${id}/`), 
};

export const reviewService = {
    add: (data) => api.post('/reviews/add/', data),
    getByProduct: (productId) => api.get(`/products/${productId}/reviews/`),
};

export const cartService = {
    get: () => api.get('/cart/'),
    add: (product_id, quantity) => api.post('/cart/', { product_id, quantity }),
    remove: (item_id) => api.delete('/cart/', { data: { item_id } }),
    clear: () => api.delete('/cart/'),
};

export const wishlistService = {
    get: () => api.get('/wishlist/'),
    add: (product_id) => api.post('/wishlist/add/', { product_id }),
    remove: (product_id) => api.delete(`/wishlist/remove/${product_id}/`),
};

export const orderService = {
    create: (address_id) => api.post('/orders/create/', { address_id }),
    getAll: () => api.get('/orders/'),
};

export default api;