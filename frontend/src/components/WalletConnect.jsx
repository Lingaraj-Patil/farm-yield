// ===================================
// FILE: frontend/src/components/WalletConnect.jsx
// Wallet Connection Component
// ===================================

import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, TrendingUp, Lock } from 'lucide-react';
import { getBalance } from '../utils/solana';
import { authAPI, setWalletHeader } from '../utils/api';
import { requestChallenge, verifyAndLogin, signMessage, clearToken, getToken } from '../utils/authJWT';

const WalletConnect = () => {
  const wallet = useWallet();
  const { publicKey, connected, signMessage: walletSignMessage } = wallet;
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);

  const performSignatureAuth = async (walletAddress) => {
    if (!walletSignMessage || !publicKey) {
      console.warn('Wallet does not support signing; skipping JWT auth');
      return false;
    }

    try {
      setAuthenticating(true);

      const challengeData = await requestChallenge(walletAddress);
      const { message } = challengeData;

      const signature = await signMessage(wallet, message);

      const result = await verifyAndLogin(walletAddress, signature, message);

      if (result.success) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signature auth failed:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();

      setWalletHeader(walletAddress);

      const token = getToken();
      if (token) {
        authAPI.getProfile(walletAddress)
          .then(res => setUser(res.data.user))
          .catch(() => {
            clearToken();
            performSignatureAuth(walletAddress);
          });
      } else {
        performSignatureAuth(walletAddress).catch(() => {
          authAPI.login(walletAddress)
            .then(res => setUser(res.data.user))
            .catch(err => console.error('Login failed:', err));
        });
      }

      getBalance(walletAddress)
        .then(bal => setBalance(bal))
        .catch(err => console.error('Balance fetch failed:', err));
    } else {
      setWalletHeader(null);
      clearToken();
      setUser(null);
      setBalance(0);
    }
  }, [connected, publicKey]);

  return (
    <div className="flex items-center gap-4">
      {authenticating && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4 animate-pulse" />
          Authenticating...
        </div>
      )}

      {connected && user && !authenticating && (
        <div className="hidden md:flex items-center gap-4 bg-white rounded-lg px-4 py-2 shadow">
          <div className="text-right">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="text-sm font-semibold">{balance.toFixed(4)} SOL</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Reports</p>
            <p className="text-sm font-semibold">{user.totalReports}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Reputation</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              {user.reputationScore}
              <TrendingUp className="w-3 h-3 text-green-600" />
            </p>
          </div>
        </div>
      )}
      
      <WalletMultiButton className="!bg-green-600 hover:!bg-green-700" />
    </div>
  );
};

export default WalletConnect;