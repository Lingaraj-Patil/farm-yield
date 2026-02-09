// ===================================
// FILE: frontend/src/utils/authJWT.js
// JWT-based Authentication Utilities
// ===================================

import axios from 'axios';
import bs58 from 'bs58';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const STORAGE_KEY = 'farmyield_token';

export const storeToken = (token) => {
  localStorage.setItem(STORAGE_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(STORAGE_KEY);
};

export const clearToken = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const requestChallenge = async (walletAddress) => {
  const response = await axios.post(`${API_URL}/auth/challenge`, {
    walletAddress
  });

  return response.data;
};

export const verifyAndLogin = async (walletAddress, signature, message) => {
  const response = await axios.post(`${API_URL}/auth/verify`, {
    walletAddress,
    signature,
    message
  });

  if (response.data.success && response.data.token) {
    storeToken(response.data.token);
  }

  return response.data;
};

export const signMessage = async (wallet, message) => {
  if (!wallet.signMessage) {
    throw new Error('Wallet does not support message signing');
  }

  const messageUint8 = new TextEncoder().encode(message);
  const signatureUint8 = await wallet.signMessage(messageUint8);
  return bs58.encode(signatureUint8);
};
