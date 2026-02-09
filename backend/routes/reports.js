
// ===================================
// FILE: backend/routes/reports.js
// Report Routes
// ===================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/Report');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Vote = require('../models/Vote');
const { verifyWallet } = require('../middleware/auth');
const { PublicKey } = require('@solana/web3.js');
const { uploadToIPFS } = require('../services/ipfs');
const { mintReportCNFT, sendReward, treasuryKeypair, awardBadge } = require('../services/solana');

const TOP_CONTRIBUTOR_THRESHOLD = 25;

const awardUserBadge = async (user, badgeType) => {
  if (!user) return;
  if (user.badges?.some(badge => badge.type === badgeType)) return;

  const signature = await awardBadge(user.walletAddress, badgeType);

  if (!signature) {
    user.badges.push({
      type: badgeType,
      earnedAt: new Date(),
      cnftMint: null
    });
    await user.save();
  }
};

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Submit new crop report
router.post('/submit', verifyWallet, upload.array('images', 5), async (req, res) => {
  try {
    const {
      cropType,
      quantity,
      unit,
      latitude,
      longitude,
      district,
      province,
      village,
      soilType,
      irrigation,
      harvestDate,
      marketPrice
    } = req.body;

    const farmerWallet = req.walletAddress;

    // Validate required fields
    if (!cropType || !quantity || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Upload images to IPFS (skip if key is invalid)
    const images = [];
    if (req.files && req.files.length > 0 && process.env.NFT_STORAGE_KEY) {
      try {
        for (const file of req.files) {
          const ipfsResult = await uploadToIPFS(file.buffer, file.originalname);
          images.push({
            ipfsHash: ipfsResult.cid,
            url: `https://nftstorage.link/ipfs/${ipfsResult.cid}`,
            uploadedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Image upload failed, continuing without images:', error.message);
        // Continue without images instead of failing
      }
    }

    // Create report
    const report = new Report({
      farmerWallet,
      cropType,
      quantity: {
        value: parseFloat(quantity),
        unit: unit || 'kg'
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: { district, province, village }
      },
      images,
      metadata: {
        soilType,
        irrigation,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        marketPrice: marketPrice ? parseFloat(marketPrice) : null
      }
    });

    await report.save();

    // Update user stats
    const user = await User.findOne({ walletAddress: farmerWallet });
    if (user) {
      user.totalReports += 1;
      await user.save();

      if (user.totalReports === 1) {
        await awardUserBadge(user, 'first_report');
      }
    }

    // Mint cNFT in background (don't wait)
    if (treasuryKeypair && process.env.MERKLE_TREE_ADDRESS) {
      mintReportCNFT(report._id.toString(), farmerWallet, {
        cropType,
        quantity: `${quantity} ${unit}`,
        location: `${district}, ${province}`,
        images: images.map(img => img.url)
      }).catch(err => console.error('cNFT minting error:', err));
    }

    console.log(`✅ Report submitted: ${report.reportId}`);

    res.json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        reportId: report.reportId,
        _id: report._id,
        cropType: report.cropType,
        quantity: report.quantity,
        location: report.location,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    });
  }
});

// Submit new crop report
// router.post('/submit', verifyWallet, upload.array('images', 5), async (req, res) => {
//   try {
//     const {
//       cropType,
//       quantity,
//       unit,
//       latitude,
//       longitude,
//       district,
//       province,
//       village,
//       soilType,
//       irrigation,
//       harvestDate,
//       marketPrice
//     } = req.body;

//     const farmerWallet = req.walletAddress;

//     // Validate required fields
//     if (!cropType || !quantity || !latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields'
//       });
//     }

//     // Upload images to IPFS
//     const images = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const ipfsResult = await uploadToIPFS(file.buffer, file.originalname);
//         images.push({
//           ipfsHash: ipfsResult.cid,
//           url: `https://nftstorage.link/ipfs/${ipfsResult.cid}`,
//           uploadedAt: new Date()
//         });
//       }
//     }

//     // Create report
//     const report = new Report({
//       farmerWallet,
//       cropType,
//       quantity: {
//         value: parseFloat(quantity),
//         unit: unit || 'kg'
//       },
//       location: {
//         type: 'Point',
//         coordinates: [parseFloat(longitude), parseFloat(latitude)],
//         address: { district, province, village }
//       },
//       images,
//       metadata: {
//         soilType,
//         irrigation,
//         harvestDate: harvestDate ? new Date(harvestDate) : null,
//         marketPrice: marketPrice ? parseFloat(marketPrice) : null
//       }
//     });

//     await report.save();

//     // Update user stats
//     const user = await User.findOne({ walletAddress: farmerWallet });
//     if (user) {
//       user.totalReports += 1;
//       await user.save();
//     }

//     // Mint cNFT in background (don't wait)
//     mintReportCNFT(report._id.toString(), farmerWallet, {
//       cropType,
//       quantity: `${quantity} ${unit}`,
//       location: `${district}, ${province}`,
//       images: images.map(img => img.url)
//     }).catch(err => console.error('cNFT minting error:', err));

//     console.log(`✅ Report submitted: ${report.reportId}`);

//     res.json({
//       success: true,
//       message: 'Report submitted successfully',
//       report: {
//         reportId: report.reportId,
//         _id: report._id,
//         cropType: report.cropType,
//         quantity: report.quantity,
//         location: report.location,
//         status: report.status,
//         createdAt: report.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Submit report error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to submit report',
//       error: error.message
//     });
//   }
// });

// Get all reports (with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      cropType, 
      province, 
      district, 
      wallet,
      limit = 50,
      page = 1 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (cropType) query.cropType = cropType;
    if (province) query['location.address.province'] = province;
    if (district) query['location.address.district'] = district;
    if (wallet) query.farmerWallet = wallet;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Get aggregated map data
router.get('/map/data', async (req, res) => {
  try {
    const data = await Report.getAggregatedData();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch map data',
      error: error.message
    });
  }
});

// Get single report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    try {
      const reportOwner = new PublicKey(report.farmerWallet.trim());
      const voter = new PublicKey(voterWallet.trim());
      if (reportOwner.equals(voter)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot vote on your own report'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// Vote on report (mock verification)
router.post('/:id/vote', verifyWallet, async (req, res) => {
  try {
    const { voteType, comment, txSignature } = req.body; // voteType: 'approve' or 'reject'
    const voterWallet = req.walletAddress;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Report already processed'
      });
    }

    // Check if already voted
    const alreadyVoted = report.verification.voters.some(
      v => v.wallet === voterWallet
    );

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: 'Already voted on this report'
      });
    }

    // Add vote to report
    report.verification.voters.push({
      wallet: voterWallet,
      vote: voteType,
      votedAt: new Date()
    });

    // Persist vote record
    try {
      await Vote.create({
        reportId: report._id,
        voterWallet,
        voteType,
        comment,
        txSignature: txSignature || null
      });
    } catch (voteError) {
      if (voteError.code !== 11000) {
        console.warn('Vote persistence warning:', voteError.message);
      }
    }

    // Store vote transaction if signature provided
    if (txSignature) {
      await Transaction.findOneAndUpdate(
        { txSignature },
        {
          txSignature,
          type: 'vote',
          fromWallet: voterWallet,
          toWallet: report.farmerWallet,
          reportId: report._id,
          metadata: {
            cropType: report.cropType,
            description: `Vote ${voteType} for report ${report.reportId}`
          },
          status: 'confirmed',
          blockTime: new Date()
        },
        { upsert: true, new: true }
      );
    }

    if (voteType === 'approve') {
      report.verification.votes.approve += 1;
    } else {
      report.verification.votes.reject += 1;
    }

    // Auto-verify if 3+ approvals (mock threshold)
    const APPROVAL_THRESHOLD = 3;
    if (report.verification.votes.approve >= APPROVAL_THRESHOLD) {
      await report.verify(voterWallet);

      // Update user stats
      const user = await User.findOne({ walletAddress: report.farmerWallet });
      if (user) {
        user.verifiedReports += 1;
        user.calculateReputation();
        await user.save();

        if (user.verifiedReports === 10) {
          await awardUserBadge(user, 'verified_10');
        }

        if (user.totalReports >= TOP_CONTRIBUTOR_THRESHOLD) {
          await awardUserBadge(user, 'top_contributor');
        }
      }

      // Send reward in background
      sendReward(report.farmerWallet, 0.01, report._id.toString())
        .then(signature => {
          report.blockchain.rewardTxSignature = signature;
          report.blockchain.rewardAmount = 0.01;
          return report.save();
        })
        .catch(err => console.error('Reward error:', err));

      console.log(`✅ Report verified: ${report.reportId}`);
    }

    // Auto-reject if 3+ rejections
    const REJECTION_THRESHOLD = 3;
    if (report.verification.votes.reject >= REJECTION_THRESHOLD) {
      await report.reject('Community rejected');
      console.log(`❌ Report rejected: ${report.reportId}`);
    }

    await report.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      report: {
        reportId: report.reportId,
        status: report.status,
        votes: report.verification.votes
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to vote',
      error: error.message
    });
  }
});

// Get map data (aggregated reports)
router.get('/map/data', async (req, res) => {
  try {
    const aggregatedData = await Report.getAggregatedData();

    res.json({
      success: true,
      data: aggregatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch map data',
      error: error.message
    });
  }
});

// Get user's reports
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const reports = await Report.find({ 
      farmerWallet: req.params.walletAddress 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports',
      error: error.message
    });
  }
});

module.exports = router;

