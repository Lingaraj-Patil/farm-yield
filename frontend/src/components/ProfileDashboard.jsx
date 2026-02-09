// ===================================
// FILE: frontend/src/components/ProfileDashboard.jsx
// User Profile + Earnings Dashboard
// ===================================

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TrendingUp, Coins, FileText, Award, RefreshCw, ExternalLink } from 'lucide-react';
import { authAPI, transactionAPI } from '../utils/api';
import { getExplorerUrl, shortenAddress } from '../utils/solana';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
    </div>
    <Icon className={`w-6 h-6 ${accent}`} />
  </div>
);

const ProfileDashboard = () => {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const walletAddress = publicKey?.toString();

  const fetchData = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([
        authAPI.getProfile(walletAddress),
        transactionAPI.getHistory(walletAddress)
      ]);
      setProfile(profileRes.data.user);
      setTransactions(txRes.data.transactions || []);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Farmer Profile</h2>
          <p className="text-sm text-gray-500">{profile?.username || 'Farmer'} • {shortenAddress(walletAddress)}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Reports" value={profile?.totalReports ?? 0} accent="text-green-600" />
        <StatCard icon={TrendingUp} label="Verified Reports" value={profile?.verifiedReports ?? 0} accent="text-blue-600" />
        <StatCard icon={Coins} label="Total Earned" value={`${profile?.totalEarned ?? 0} SOL`} accent="text-amber-600" />
        <StatCard icon={Award} label="Reputation" value={`${profile?.reputationScore ?? 0}%`} accent="text-purple-600" />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Badges</h3>
        {profile?.badges?.length ? (
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((badge, index) => (
              <div key={`${badge.type}-${index}`} className="px-3 py-2 rounded-lg bg-gray-50 text-sm">
                <span className="font-medium">{badge.type.replace('_', ' ')}</span>
                <p className="text-xs text-gray-500">{new Date(badge.earnedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No badges yet. Keep reporting!</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx._id} className="border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">{tx.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-sm text-gray-600">
                  {tx.amount ? `${tx.amount} SOL` : '—'}
                </div>
                {tx.txSignature && (
                  <a
                    href={getExplorerUrl(tx.txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;
