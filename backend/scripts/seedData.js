// ===================================
// FILE: backend/scripts/seedData.js
// Seed sample users and reports
// ===================================

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Report = require('../models/Report');

const sampleUsers = [
  { walletAddress: 'FARMER1111111111111111111111111111111111', username: 'Farmer A', location: { district: 'Multan', province: 'Punjab' } },
  { walletAddress: 'FARMER2222222222222222222222222222222222', username: 'Farmer B', location: { district: 'Peshawar', province: 'Khyber Pakhtunkhwa' } },
  { walletAddress: 'FARMER3333333333333333333333333333333333', username: 'Farmer C', location: { district: 'Sukkur', province: 'Sindh' } },
];

const sampleReports = [
  {
    cropType: 'wheat',
    quantity: { value: 500, unit: 'kg' },
    location: {
      type: 'Point',
      coordinates: [71.5249, 30.1575],
      address: { district: 'Multan', province: 'Punjab', village: 'Basti A' }
    },
    metadata: { marketPrice: 85 },
    status: 'verified',
    verification: { votes: { approve: 3, reject: 0 } }
  },
  {
    cropType: 'rice',
    quantity: { value: 1200, unit: 'kg' },
    location: {
      type: 'Point',
      coordinates: [71.5793, 34.0151],
      address: { district: 'Peshawar', province: 'Khyber Pakhtunkhwa', village: 'Cantt' }
    },
    metadata: { marketPrice: 110 },
    status: 'pending',
    verification: { votes: { approve: 1, reject: 0 } }
  },
  {
    cropType: 'cotton',
    quantity: { value: 800, unit: 'kg' },
    location: {
      type: 'Point',
      coordinates: [68.8574, 27.7052],
      address: { district: 'Sukkur', province: 'Sindh', village: 'Rohri' }
    },
    metadata: { marketPrice: 140 },
    status: 'verified',
    verification: { votes: { approve: 4, reject: 0 } }
  },
  {
    cropType: 'maize',
    quantity: { value: 300, unit: 'kg' },
    location: {
      type: 'Point',
      coordinates: [73.0479, 33.6844],
      address: { district: 'Rawalpindi', province: 'Punjab', village: 'Murree Road' }
    },
    metadata: { marketPrice: 70 },
    status: 'pending',
    verification: { votes: { approve: 0, reject: 0 } }
  },
  {
    cropType: 'sugarcane',
    quantity: { value: 2000, unit: 'kg' },
    location: {
      type: 'Point',
      coordinates: [74.3587, 31.5204],
      address: { district: 'Lahore', province: 'Punjab', village: 'Raiwind' }
    },
    metadata: { marketPrice: 60 },
    status: 'rejected',
    verification: { votes: { approve: 0, reject: 3 }, rejectionReason: 'Community rejected' }
  }
];

const run = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    await Report.deleteMany({});

    const users = await User.insertMany(sampleUsers);

    const reports = [];
    for (let i = 0; i < sampleReports.length; i += 1) {
      const user = users[i % users.length];
      const report = await Report.create({
        ...sampleReports[i],
        farmerWallet: user.walletAddress,
      });
      reports.push(report);
    }

    for (const user of users) {
      const userReports = reports.filter(r => r.farmerWallet === user.walletAddress);
      user.totalReports = userReports.length;
      user.verifiedReports = userReports.filter(r => r.status === 'verified').length;
      user.calculateReputation();
      await user.save();
    }

    console.log(`✅ Seeded ${users.length} users and ${reports.length} reports.`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
