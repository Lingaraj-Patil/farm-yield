// ===================================
// FILE: frontend/src/components/ReportCard.jsx
// Individual Report Card Component
// ===================================

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MapPin, Package, Calendar, ThumbsUp, ThumbsDown, ExternalLink, Shield, AlertTriangle, Award, TrendingUp, Image as ImageIcon, Coins, CheckCircle } from 'lucide-react';
import { reportAPI, authAPI } from '../utils/api';
import { getExplorerUrl, shortenAddress } from '../utils/solana';
import { calculateFraudRisk } from '../utils/networkStats';

const ReportCard = ({ report, onVote }) => {
  const { connected, publicKey } = useWallet();
  const [voting, setVoting] = useState(false);
  const [farmerReputation, setFarmerReputation] = useState(null);
  const isOwner = connected && publicKey && report.farmerWallet && publicKey.toString().trim() === report.farmerWallet.trim();

  const fraudRisk = calculateFraudRisk(report);
  const totalVotes = (report.verification?.votes?.approve || 0) + (report.verification?.votes?.reject || 0);
  const approvalProgress = totalVotes > 0 ? ((report.verification?.votes?.approve || 0) / 3) * 100 : 0;

  useEffect(() => {
    if (report.farmerWallet) {
      authAPI.getProfile(report.farmerWallet)
        .then(res => setFarmerReputation(res.data.user.reputationScore))
        .catch(() => setFarmerReputation(0));
    }
  }, [report.farmerWallet]);

  const handleVote = async (voteType) => {
    if (!connected) {
      alert('⚠️ Wallet Not Connected\n\nPlease connect your Solana wallet to vote on reports. Click the "Select Wallet" button in the top right.');
      return;
    }

    if (isOwner) {
      alert('❌ Cannot Vote on Own Report\n\nYou cannot vote on your own submissions.');
      return;
    }

    setVoting(true);
    try {
      await reportAPI.vote(report._id, voteType, '');
      alert(`✅ Vote Submitted\n\nYour ${voteType} vote has been recorded on-chain. Thank you for helping verify agricultural data!`);
      if (onVote) onVote();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit vote';
      alert(`❌ Vote Failed\n\n${errorMsg}\n\nPlease try again or check your wallet connection.`);
    } finally {
      setVoting(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/90 text-white border-yellow-300',
    verified: 'bg-green-500/90 text-white border-green-300',
    rejected: 'bg-red-500/90 text-white border-red-300',
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      {/* Images */}
      {report.images && report.images.length > 0 ? (
        <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
          <img
            src={report.images[0].url}
            alt={report.cropType}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute top-3 right-3 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${statusColors[report.status]}`}>
              {report.status.toUpperCase()}
            </span>
            {report.images.length > 1 && (
              <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white rounded-full text-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                +{report.images.length - 1}
              </span>
            )}
          </div>
          {/* Fraud Risk Badge */}
          <div className="absolute bottom-3 left-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border flex items-center gap-1 ${
              fraudRisk.level === 'Low' 
                ? 'bg-green-500/90 text-white border-green-300'
                : fraudRisk.level === 'Medium'
                  ? 'bg-yellow-500/90 text-white border-yellow-300'
                  : 'bg-red-500/90 text-white border-red-300'
            }`}>
              {fraudRisk.level === 'Low' ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {fraudRisk.level} Risk
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center">
          <ImageIcon className="w-16 h-16 text-gray-300" />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${statusColors[report.status]}`}>
              {report.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header with Farmer Reputation */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              {report.cropType.toUpperCase()}
              {report.blockchain?.mintTxSignature && (
                <div className="p-1 bg-blue-100 rounded-full" title="cNFT Minted">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600">by {shortenAddress(report.farmerWallet)}</span>
              {farmerReputation !== null && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-full border border-purple-200">
                  <Award className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">{farmerReputation}% Rep</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 font-bold text-xl">
              <Package className="w-5 h-5" />
              {report.quantity.value}
            </div>
            <span className="text-xs text-gray-500 uppercase">{report.quantity.unit}</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>
              {report.location.address.district}, {report.location.address.province}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>

          {report.metadata.marketPrice && (
            <div className="text-sm text-gray-600">
              <strong>Market Price:</strong> PKR {report.metadata.marketPrice}/{report.quantity.unit}
            </div>
          )}
        </div>

        {/* Verification Progress Bar */}
        {report.status === 'pending' && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Verification Progress
              </p>
              <span className="text-xs font-bold text-blue-600">
                {report.verification.votes.approve}/3 approvals
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-200">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(approvalProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-green-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-bold">{report.verification.votes.approve}</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm font-bold">{report.verification.votes.reject}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{totalVotes} total votes</span>
            </div>
          </div>
        )}

        {/* Reward Preview for Verified Reports */}
        {report.status === 'verified' && report.blockchain.rewardAmount && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 mb-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Coins className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Reward Earned</p>
                  <p className="text-lg font-bold text-amber-600">{report.blockchain.rewardAmount} SOL</p>
                </div>
              </div>
              <Award className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        )}

        {/* Blockchain Info with Explorer Links */}
        {report.blockchain.mintTxSignature && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Blockchain Verified</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={getExplorerUrl(report.blockchain.mintTxSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View cNFT
              </a>
              {report.blockchain.rewardTxSignature && (
                <a
                  href={getExplorerUrl(report.blockchain.rewardTxSignature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Coins className="w-3 h-3" />
                  Reward TX
                </a>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {report.status === 'pending' && connected && !isOwner && (
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('approve')}
              disabled={voting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2 font-semibold transition-all hover:shadow-lg disabled:hover:shadow-none"
            >
              <ThumbsUp className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => handleVote('reject')}
              disabled={voting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2 font-semibold transition-all hover:shadow-lg disabled:hover:shadow-none"
            >
              <ThumbsDown className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {report.status === 'pending' && connected && isOwner && (
          <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-3 px-4">
            You cannot vote on your own report.
          </div>
        )}

        {report.status === 'verified' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Verified by Community</span>
            </div>
          </div>
        )}

        {report.status === 'rejected' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full border border-red-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">Rejected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;

