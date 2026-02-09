
// ===================================
// FILE: frontend/src/utils/api.js
// API Service
// ===================================

import axios from 'axios';
import { getToken } from './authJWT';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add wallet address or JWT token to requests
export const setWalletHeader = (walletAddress) => {
  if (walletAddress) {
    api.defaults.headers.common['x-wallet-address'] = walletAddress;
  } else {
    delete api.defaults.headers.common['x-wallet-address'];
  }
};

// Attach token if available
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (walletAddress, username, location) => 
    api.post('/auth/login', { walletAddress, username, location }),
  
  getProfile: (walletAddress) => 
    api.get(`/auth/profile/${walletAddress}`),
  
  getLeaderboard: (type = 'reputation', limit = 10) => 
    api.get('/auth/leaderboard', { params: { type, limit } }),
};

// Report endpoints
export const reportAPI = {
  submit: (formData) => 
    api.post('/reports/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getAll: (params) => 
    api.get('/reports', { params }),
  
  getById: (id) => 
    api.get(`/reports/${id}`),
  
  vote: (id, voteType, comment) => 
    api.post(`/reports/${id}/vote`, { voteType, comment }),
  
  getUserReports: (walletAddress) => 
    api.get(`/reports/user/${walletAddress}`),
  
  getMapData: () => 
    api.get('/reports/map/data'),
};

// Transaction endpoints
export const transactionAPI = {
  getHistory: (walletAddress) => 
    api.get(`/transactions/history/${walletAddress}`),
  
  getBySignature: (signature) => 
    api.get(`/transactions/${signature}`),
};

export default api;
