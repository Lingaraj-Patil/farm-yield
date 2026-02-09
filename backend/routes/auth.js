// ===================================
// FILE: backend/routes/auth.js
// Authentication Routes
// ===================================

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const router = express.Router();
const User = require('../models/User');

const NONCE_TTL_MINUTES = 10;

const buildMessage = (walletAddress, nonce, issuedAt) => (
  `FarmYield Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssuedAt: ${issuedAt}`
);

const issueToken = (walletAddress) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { walletAddress },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Create authentication challenge
router.post('/challenge', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = new User({
        walletAddress,
        username: `Farmer_${walletAddress.slice(0, 6)}`
      });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const issuedAt = new Date().toISOString();

    user.authNonce = nonce;
    user.authNonceIssuedAt = new Date(issuedAt);
    await user.save();

    const message = buildMessage(walletAddress, nonce, issuedAt);

    res.json({
      success: true,
      message,
      nonce,
      issuedAt
    });
  } catch (error) {
    console.error('Challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
      error: error.message
    });
  }
});

// Verify signature and issue JWT
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'walletAddress, signature, and message are required'
      });
    }

    const user = await User.findOne({ walletAddress });
    if (!user || !user.authNonce || !user.authNonceIssuedAt) {
      return res.status(400).json({
        success: false,
        message: 'No active challenge for this wallet'
      });
    }

    const expiresAt = new Date(user.authNonceIssuedAt.getTime() + NONCE_TTL_MINUTES * 60000);
    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Challenge expired, request a new one'
      });
    }

    const expectedMessage = buildMessage(walletAddress, user.authNonce, user.authNonceIssuedAt.toISOString());
    if (message !== expectedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Challenge message mismatch'
      });
    }

    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);
    const publicKeyUint8 = bs58.decode(walletAddress);

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

    user.authNonce = null;
    user.authNonceIssuedAt = null;
    await user.updateActivity();

    const token = issueToken(walletAddress);

    res.json({
      success: true,
      token,
      user: {
        walletAddress: user.walletAddress,
        username: user.username,
        totalReports: user.totalReports,
        verifiedReports: user.verifiedReports,
        totalEarned: user.totalEarned,
        reputationScore: user.reputationScore,
        badges: user.badges,
        joinedAt: user.joinedAt
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature verification failed',
      error: error.message
    });
  }
});

// Register or get user by wallet
router.post('/login', async (req, res) => {
  try {
    const { walletAddress, username, location } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Find or create user
    let user = await User.findOne({ walletAddress });

    if (!user) {
      // Create new user
      user = new User({
        walletAddress,
        username: username || `Farmer_${walletAddress.slice(0, 6)}`,
        location: location || {}
      });
      await user.save();
      console.log(`✅ New user registered: ${walletAddress}`);
    } else {
      // Update existing user
      await user.updateActivity();
      console.log(`✅ User logged in: ${walletAddress}`);
    }

    res.json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'User registered successfully' : 'Welcome back!',
      user: {
        walletAddress: user.walletAddress,
        username: user.username,
        totalReports: user.totalReports,
        verifiedReports: user.verifiedReports,
        totalEarned: user.totalEarned,
        reputationScore: user.reputationScore,
        badges: user.badges,
        joinedAt: user.joinedAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// // Register or get user by wallet
// router.post('/login', async (req, res) => {
//   try {
//     const { walletAddress, username, location } = req.body;

//     if (!walletAddress) {
//       return res.status(400).json({
//         success: false,
//         message: 'Wallet address is required'
//       });
//     }

//     // Find or create user
//     let user = await User.findOne({ walletAddress });

//     if (!user) {
//       user = new User({
//         walletAddress,
//         username: username || `Farmer_${walletAddress.slice(0, 6)}`,
//         location: location || {}
//       });
//       await user.save();
//       console.log(`✅ New user registered: ${walletAddress}`);
//     } else {
//       await user.updateActivity();
//     }

//     res.json({
//       success: true,
//       message: user.isNew ? 'User registered successfully' : 'Welcome back!',
//       user: {
//         walletAddress: user.walletAddress,
//         username: user.username,
//         totalReports: user.totalReports,
//         verifiedReports: user.verifiedReports,
//         totalEarned: user.totalEarned,
//         reputationScore: user.reputationScore,
//         badges: user.badges,
//         joinedAt: user.joinedAt
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Login failed',
//       error: error.message
//     });
//   }
// });

// Get user profile
router.get('/profile/:walletAddress', async (req, res) => {
  try {
    const user = await User.findOne({ 
      walletAddress: req.params.walletAddress 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        username: user.username,
        totalReports: user.totalReports,
        verifiedReports: user.verifiedReports,
        totalEarned: user.totalEarned,
        reputationScore: user.reputationScore,
        location: user.location,
        badges: user.badges,
        joinedAt: user.joinedAt,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'reputation', limit = 10 } = req.query;

    let sortField = 'reputationScore';
    if (type === 'reports') sortField = 'totalReports';
    if (type === 'earnings') sortField = 'totalEarned';

    const users = await User.find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('walletAddress username totalReports verifiedReports totalEarned reputationScore badges');

    res.json({
      success: true,
      leaderboard: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;

