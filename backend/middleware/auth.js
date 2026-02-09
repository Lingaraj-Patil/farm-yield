// ===================================
// FILE: backend/middleware/auth.js
// Wallet Authentication Middleware
// ===================================

const nacl = require('tweetnacl');
const bs58 = require('bs58');
const jwt = require('jsonwebtoken');

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.replace('Bearer ', '').trim();
};

// JWT or wallet header authentication
const verifyWallet = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.walletAddress = decoded.walletAddress;
        return next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }

    const walletAddress = req.headers['x-wallet-address'];

    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        message: 'Authorization required'
      });
    }

    req.walletAddress = walletAddress;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Verify signature for sensitive operations
const verifySignature = async (req, res, next) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for signature verification'
      });
    }

    // Decode signature and message
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);
    const publicKeyUint8 = bs58.decode(walletAddress);

    // Verify signature
    const verified = nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKeyUint8
    );

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    req.walletAddress = walletAddress;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Signature verification failed',
      error: error.message
    });
  }
};

module.exports = { verifyWallet, verifySignature };


