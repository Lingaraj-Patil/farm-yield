// ===================================
// FILE: frontend/src/components/ProfileDashboard.jsx
// User Profile + Earnings Dashboard
// ===================================

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TrendingUp, Coins, FileText, Award, RefreshCw, ExternalLink, Star, Trophy, Target, Zap, Shield, ChevronRight, Activity, Loader } from 'lucide-react';
import { authAPI, transactionAPI } from '../utils/api';
import { getExplorerUrl, shortenAddress } from '../utils/solana';
import { calculateFarmerLevel } from '../utils/networkStats';
import { ProfileSkeleton } from './LoadingSkeleton';

const ProfileDashboard = () => {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);

  const walletAddress = publicKey?.toString();

  const fetchData = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([
        authAPI.getProfile(walletAddress),
        transactionAPI.getHistory(walletAddress)
      ]);
      const userData = profileRes.data.user;
      setProfile(userData);
      setTransactions(txRes.data.transactions || []);
      
      // Calculate level
      const level = calculateFarmerLevel(
        userData.totalReports,
        userData.verifiedReports,
        userData.reputationScore
      );
      setLevelInfo(level);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) fetchData();
  }, [connected, walletAddress]);

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">Connect your wallet to view profile & earnings.</p>
      </div>
    );
  }

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Hero Card with Level System */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl"></div>
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100 p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                  levelInfo?.color === 'purple' ? 'from-purple-500 to-pink-500' :
                  levelInfo?.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                  levelInfo?.color === 'green' ? 'from-green-500 to-emerald-500' :
                  'from-amber-500 to-yellow-500'
                } flex items-center justify-center text-white shadow-lg`}>
                  {levelInfo?.level === 'Oracle' ? <Star className="w-10 h-10" /> :
                   levelInfo?.level === 'Validator' ? <Shield className="w-10 h-10" /> :
                   levelInfo?.level === 'Grower' ? <TrendingUp className="w-10 h-10" /> :
                   <Zap className="w-10 h-10" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-gray-900">{profile?.username || 'Farmer'}</h2>
                    {levelInfo && (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        levelInfo.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        levelInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        levelInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {levelInfo.level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{shortenAddress(walletAddress)}</p>
                  {levelInfo?.nextLevel && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Next: {levelInfo.nextLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Level Progress Bar */}
              {levelInfo && levelInfo.nextLevel && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Level Progress</span>
                    <span className="text-xs font-bold text-green-600">{levelInfo.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${levelInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 font-semibold flex items-center gap-2 transition-all shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{profile?.totalReports ?? 0}</div>
          <div className="text-xs font-medium text-gray-600 uppercase">Total Reports</div>
        </div>

        <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{profile?.verifiedReports ?? 0}</div>
          <div className="text-xs font-medium text-gray-600 uppercase">Verified</div>
          <div className="mt-2 text-xs text-blue-600 font-semibold">
            {profile?.totalReports > 0 
              ? `${((profile.verifiedReports / profile.totalReports) * 100).toFixed(0)}% success`
              : '0% success'}
          </div>
        </div>

        <div className="group bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {profile?.totalEarned ?? 0}
            <span className="text-lg text-gray-500 ml-1">SOL</span>
          </div>
          <div className="text-xs font-medium text-gray-600 uppercase">Total Earned</div>
        </div>

        <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <ChevronRight className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {profile?.reputationScore ?? 0}
            <span className="text-lg text-gray-500 ml-1">%</span>
          </div>
          <div className="text-xs font-medium text-gray-600 uppercase">Reputation</div>
        </div>
      </div>

      {/* NFT Badges Showcase */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Achievement Badges</h3>
          </div>
          {profile?.badges?.length > 0 && (
            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold">
              {profile.badges.length} earned
            </span>
          )}
        </div>
        
        {profile?.badges?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.badges.map((badge, index) => (
              <div key={`${badge.type}-${index}`} className="group relative bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1 capitalize">
                    {badge.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
                {badge.cnftMint && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No badges yet</p>
            <p className="text-sm text-gray-500">Complete more reports to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Earnings Analytics Chart (Simple) */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Performance Analytics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Verification Accuracy */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {profile?.totalReports > 0 
                ? `${((profile.verifiedReports / profile.totalReports) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Verification Accuracy</div>
            <div className="text-xs text-gray-500">
              {profile?.verifiedReports || 0} of {profile?.totalReports || 0} verified
            </div>
          </div>

          {/* Average Earnings */}
          <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <div className="text-4xl font-bold text-amber-600 mb-2">
              {profile?.verifiedReports > 0
                ? ((profile.totalEarned / profile.verifiedReports).toFixed(3))
                : '0.00'}
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Avg. Earnings per Report</div>
            <div className="text-xs text-gray-500">SOL</div>
          </div>

          {/* Activity Streak */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {profile?.totalReports || 0}
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Total Contributions</div>
            <div className="text-xs text-gray-500">All time</div>
          </div>
        </div>
      </div>

      {/* Transaction History - Enhanced */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
          </div>
          {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Your on-chain activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx._id} className="group border-2 border-gray-100 hover:border-green-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'mint_cnft' ? 'bg-blue-100' :
                    tx.type === 'reward' ? 'bg-amber-100' :
                    tx.type === 'vote' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {tx.type === 'mint_cnft' ? <Shield className="w-4 h-4 text-blue-600" /> :
                     tx.type === 'reward' ? <Coins className="w-4 h-4 text-amber-600" /> :
                     tx.type === 'vote' ? <Star className="w-4 h-4 text-purple-600" /> :
                     <FileText className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tx.amount && (
                    <div className="px-3 py-1 bg-green-50 rounded-lg">
                      <span className="text-sm font-bold text-green-600">{tx.amount} SOL</span>
                    </div>
                  )}
                  {tx.txSignature && (
                    <a
                      href={getExplorerUrl(tx.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;
