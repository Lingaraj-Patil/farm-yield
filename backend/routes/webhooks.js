// ===================================
// FILE: backend/routes/webhooks.js
// Helius Webhook Routes
// ===================================

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { createWebhook } = require('../services/helius');

const toSol = (lamports) => (lamports ? lamports / 1e9 : undefined);

const mapType = (transactionType, description = '') => {
  const type = (transactionType || '').toUpperCase();
  const desc = description.toLowerCase();

  if (type.includes('COMPRESSED') || type.includes('BUBBLEGUM') || type.includes('NFT_MINT')) {
    return 'mint_cnft';
  }

  if (desc.includes('badge')) return 'badge';
  if (desc.includes('vote')) return 'vote';

  if (type.includes('TRANSFER')) return 'reward';

  return 'unknown';
};

const getTransferInfo = (event) => {
  if (Array.isArray(event.nativeTransfers) && event.nativeTransfers.length > 0) {
    const transfer = event.nativeTransfers[0];
    return {
      fromWallet: transfer.fromUserAccount,
      toWallet: transfer.toUserAccount,
      amount: toSol(transfer.amount)
    };
  }

  return {
    fromWallet: null,
    toWallet: null,
    amount: undefined
  };
};

// Helius webhook receiver
router.post('/helius', async (req, res) => {
  try {
    const expectedAuth = process.env.HELIUS_WEBHOOK_AUTH_TOKEN
      ? `Bearer ${process.env.HELIUS_WEBHOOK_AUTH_TOKEN}`
      : null;

    if (expectedAuth && req.headers.authorization !== expectedAuth) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized webhook'
      });
    }

    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const results = await Promise.all(
      payload.map(async (event) => {
        const txSignature = event.signature || event.transactionSignature || event.txSignature;
        if (!txSignature) return null;

        const { fromWallet, toWallet, amount } = getTransferInfo(event);

        const transactionType = mapType(event.type || event.transactionType, event.description);

        const status = event.transactionError || event.err ? 'failed' : 'confirmed';

        const blockTime = event.timestamp
          ? new Date(event.timestamp * 1000)
          : event.blockTime
            ? new Date(event.blockTime * 1000)
            : new Date();

        return Transaction.findOneAndUpdate(
          { txSignature },
          {
            txSignature,
            type: transactionType,
            fromWallet,
            toWallet,
            amount,
            metadata: {
              description: event.description || event.type || 'Helius webhook'
            },
            status,
            blockTime,
            slot: event.slot
          },
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      success: true,
      processed: results.filter(Boolean).length
    });
  } catch (error) {
    console.error('Helius webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

// Register a webhook via API
router.post('/helius/register', async (req, res) => {
  try {
    const { accountAddresses = [], transactionTypes = ['Any'], webhookURL } = req.body;

    if (!Array.isArray(accountAddresses) || accountAddresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'accountAddresses is required'
      });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5001';
    const resolvedWebhookURL = webhookURL || `${baseUrl}/api/webhooks/helius`;

    const data = await createWebhook(resolvedWebhookURL, accountAddresses, transactionTypes);

    res.json({
      success: true,
      webhook: data
    });
  } catch (error) {
    console.error('Webhook register error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register webhook',
      error: error.message
    });
  }
});

module.exports = router;
