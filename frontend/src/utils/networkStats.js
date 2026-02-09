// ===================================
// FILE: frontend/src/utils/networkStats.js
// Network Statistics Utilities
// ===================================

import { reportAPI, authAPI } from './api';

export const fetchNetworkStats = async () => {
  try {
    const [reportsRes, leaderboardRes] = await Promise.all([
      reportAPI.getAll({ limit: 1000 }),
      authAPI.getLeaderboard('reputation', 100)
    ]);

    const reports = reportsRes.data.reports || [];
    const farmers = leaderboardRes.data.leaderboard || [];

    const verifiedReports = reports.filter(r => r.status === 'verified');
    const totalYield = reports.reduce((sum, r) => sum + (r.quantity?.value || 0), 0);
    const totalRewards = farmers.reduce((sum, f) => sum + (f.totalEarned || 0), 0);
    const verificationRate = reports.length > 0 
      ? ((verifiedReports.length / reports.length) * 100).toFixed(1)
      : 0;

    // Count unique cNFTs minted
    const cnftsMinted = reports.filter(r => r.blockchain?.mintTxSignature).length;

    // Count on-chain transactions (approximate)
    const onChainTx = verifiedReports.length + cnftsMinted;

    return {
      totalFarmers: farmers.length,
      totalYield: Math.round(totalYield),
      totalRewards: totalRewards.toFixed(2),
      verificationRate,
      cnftsMinted,
      onChainTransactions: onChainTx,
      verifiedReports: verifiedReports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      totalReports: reports.length
    };
  } catch (error) {
    // Silent fail - return defaults for production
    return {
      totalFarmers: 0,
      totalYield: 0,
      totalRewards: 0,
      verificationRate: 0,
      cnftsMinted: 0,
      onChainTransactions: 0,
      verifiedReports: 0,
      pendingReports: 0,
      totalReports: 0
    };
  }
};

export const calculateFarmerLevel = (totalReports, verifiedReports, reputationScore) => {
  if (totalReports === 0) return { level: 'Seed', tier: 1, color: 'gray', nextLevel: 'Grower', progress: 0 };
  
  if (totalReports >= 50 && verifiedReports >= 40 && reputationScore >= 90) {
    return { level: 'Oracle', tier: 4, color: 'purple', nextLevel: null, progress: 100 };
  }
  
  if (totalReports >= 25 && verifiedReports >= 20 && reputationScore >= 80) {
    return { level: 'Validator', tier: 3, color: 'blue', nextLevel: 'Oracle', progress: 75 };
  }
  
  if (totalReports >= 10 && verifiedReports >= 7 && reputationScore >= 70) {
    return { level: 'Grower', tier: 2, color: 'green', nextLevel: 'Validator', progress: 50 };
  }
  
  return { level: 'Seed', tier: 1, color: 'amber', nextLevel: 'Grower', progress: 25 };
};

export const calculateFraudRisk = (report) => {
  let riskScore = 0;
  
  // No images = +30 risk
  if (!report.images || report.images.length === 0) riskScore += 30;
  
  // No metadata = +20 risk
  if (!report.metadata?.soilType && !report.metadata?.irrigation) riskScore += 20;
  
  // Low verification votes = +25 risk
  const totalVotes = report.verification?.votes?.approve + report.verification?.votes?.reject;
  if (totalVotes < 2) riskScore += 25;
  
  // Rejection ratio > 50% = +25 risk
  if (totalVotes > 0 && (report.verification?.votes?.reject / totalVotes) > 0.5) riskScore += 25;
  
  riskScore = Math.min(100, riskScore);
  
  if (riskScore <= 20) return { level: 'Low', color: 'green', score: riskScore };
  if (riskScore <= 50) return { level: 'Medium', color: 'yellow', score: riskScore };
  return { level: 'High', color: 'red', score: riskScore };
};
