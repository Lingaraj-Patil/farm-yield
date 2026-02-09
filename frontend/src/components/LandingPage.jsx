// ===================================
// FILE: frontend/src/components/LandingPage.jsx
// Marketing / Landing Page
// ===================================

import { useMemo, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Sprout, ShieldCheck, Coins, MapPin, Users, ArrowRight, TrendingUp, Zap, Globe, Award, Activity, CheckCircle } from 'lucide-react';
import OfflineQueuePanel from './OfflineQueuePanel';
import { fetchNetworkStats } from '../utils/networkStats';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-green-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h4 className="text-base font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const LandingPage = ({ onGetStarted }) => {
  const { connected } = useWallet();
  const [networkStats, setNetworkStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const stats = await fetchNetworkStats();
      setNetworkStats(stats);
      setLoading(false);
    };
    loadStats();
  }, []);

  const stats = useMemo(() => [
    { label: 'Faster payouts', value: '< 60s' },
    { label: 'Avg reward', value: '0.01 SOL' },
    { label: 'Verification votes', value: '3 approvals' },
  ], []);

  return (
    <div className="space-y-16">
      <OfflineQueuePanel />

      {/* Live Network Stats - New Premium Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Live Network Stats
              </h2>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                Real-time blockchain metrics
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-2xl p-6 h-32"></div>
              ))}
            </div>
          ) : (
            <>
              {/* Primary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-500 opacity-50" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {networkStats?.totalFarmers?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Farmers Onboarded
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Sprout className="w-5 h-5 text-blue-600" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-500 opacity-50" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {networkStats?.totalYield?.toLocaleString() || 0}
                    <span className="text-lg text-gray-500 ml-1">kg</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Total Yield Recorded
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-amber-500 opacity-50" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {networkStats?.totalRewards || '0.00'}
                    <span className="text-lg text-gray-500 ml-1">SOL</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Rewards Distributed
                  </div>
                </div>

                <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <Award className="w-4 h-4 text-purple-500 opacity-50" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {networkStats?.verificationRate || 0}%
                  </div>
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Verified Reports
                  </div>
                </div>
              </div>

              {/* Blockchain Trust Indicators */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Blockchain Trust Indicators</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {networkStats?.cnftsMinted?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      cNFTs Minted
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {networkStats?.onChainTransactions?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3" />
                      On-chain TX
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {networkStats?.verifiedReports?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {networkStats?.pendingReports?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Globe className="w-3 h-3" />
                      Pending
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Hero */}
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sprout className="w-4 h-4" />
              Solana-powered agricultural intelligence
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Reward farmers for real-world crop data — instantly.
            </h2>
            <p className="mt-4 text-gray-600">
              FarmYield turns verified harvest reports into transparent market signals. Farmers earn
              crypto rewards, communities validate data, and policymakers gain real-time insights.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </button>
              {!connected && (
                <div className="inline-flex">
                  <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800" />
                </div>
              )}
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white p-8 lg:p-12 flex flex-col justify-center">
            <h3 className="text-2xl font-semibold mb-4">What farmers unlock</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><Coins className="w-4 h-4 mt-0.5" /> Instant SOL rewards for verified reports</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5" /> Peer verification prevents fraud</li>
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> Public map for transparent pricing</li>
              <li className="flex items-start gap-2"><Users className="w-4 h-4 mt-0.5" /> Community reputation & badges</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">How it works</h3>
          <Step
            number="1"
            title="Submit a crop report"
            description="Add crop type, quantity, location, and photos from a mobile device."
          />
          <Step
            number="2"
            title="Community verification"
            description="Local validators approve reports. Three approvals verify the report."
          />
          <Step
            number="3"
            title="Get rewarded"
            description="Verified reports mint a cNFT and trigger a 0.01 SOL reward."
          />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <FeatureCard
            icon={ShieldCheck}
            title="Tamper-proof records"
            description="Compressed NFTs on Solana ensure harvest records stay immutable."
          />
          <FeatureCard
            icon={Coins}
            title="Micro-incentives"
            description="Automatic rewards with low fees keep farmers engaged."
          />
          <FeatureCard
            icon={MapPin}
            title="Live crop intelligence"
            description="Public dashboard visualizes verified reports across regions."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white rounded-2xl p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-semibold">Ready to publish your first report?</h3>
          <p className="text-sm text-gray-300 mt-2">Connect your wallet and submit a report in minutes.</p>
        </div>
        <button
          onClick={onGetStarted}
          className="px-6 py-3 bg-green-500 text-gray-900 font-semibold rounded-lg hover:bg-green-400"
        >
          Submit a report
        </button>
      </section>
    </div>
  );
};

export default LandingPage;
