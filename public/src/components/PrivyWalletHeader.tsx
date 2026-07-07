import React, { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    privyUser: any;
    privyWalletAddress: string | null;
    privyConnected: boolean; privyProvider: any;
    onPrivyLoginSuccess: () => void;
    onPrivyReady: (user: any, address: string | null) => void;
    updateWalletUI: () => void;
    privyLoginGoogle: () => void;
    privyLogout: () => void;
  }
}

export const PrivyWalletHeader = () => {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const hasTriggeredSuccess = useRef(false);
  const lastKnownAddress = useRef<string | null>(null);

  // Isolate the embedded wallet (where walletClientType === 'privy')
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

  // Expose login/logout to global scope for legacy HTML bridge
  useEffect(() => {
    window.privyLoginGoogle = () => login({ loginMethod: 'google' });
    window.privyLogout = logout;
  }, [login, logout]);

  // Reset trigger state upon logout
  useEffect(() => {
    if (!authenticated) {
      hasTriggeredSuccess.current = false;
      lastKnownAddress.current = null;
      window.privyUser = null;
      window.privyWalletAddress = null;
      window.privyConnected = false;
      window.privyProvider = null;
    }
  }, [authenticated]);

  // Synchronize React state with legacy global state for Trade Arena integration
  useEffect(() => {
    if (authenticated) {
      // Sync global variables used by the legacy vanilla JS engine
      window.privyUser = user;
      window.privyWalletAddress = embeddedWallet?.address || null;
      window.privyConnected = true;
      window.privyProvider = embeddedWallet;

      // Trigger the legacy transition logic (hides connect screen, shows main app)
      // We trigger this immediately upon authentication so the user enters the Arena
      // while the wallet continues to initialize in the background.
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess();
        hasTriggeredSuccess.current = true;
      }

      // If the wallet address becomes available or changes, notify the legacy environment
      if (embeddedWallet?.address && embeddedWallet.address !== lastKnownAddress.current) {
        lastKnownAddress.current = embeddedWallet.address;

        if (typeof window.onPrivyReady === 'function') {
          window.onPrivyReady(user, embeddedWallet.address);
        }

        if (typeof window.updateWalletUI === 'function') {
          window.updateWalletUI();
        }
      }
    }
  }, [authenticated, embeddedWallet, user]);

  if (!authenticated) {
    return (
      <div className="gh-controls">
        <button
          className="gh-auto-btn"
          onClick={() => login({ loginMethod: 'google' })}
          style={{ border: '1px solid var(--cyan)', color: 'var(--cyan)', cursor: 'pointer' }}
        >
          LOGIN
        </button>
      </div>
    );
  }

  // Graceful loading state if logged in but wallet is still being provisioned
  if (!embeddedWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)' }}>
          {user?.google?.email || user?.email?.address || 'Authenticated'}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono' }}>
          Initializing arena wallet...
        </div>
      </div>
    );
  }

  // Clean, truncated string format: 0x1234...abcd
  const address = embeddedWallet.address;
  const truncatedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {user?.google?.email || user?.email?.address || 'Arena Trader'}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--dim)', fontFamily: 'Share Tech Mono' }}>
        <span style={{ color: 'var(--gold)', marginRight: '4px' }}>💳</span>
        {truncatedAddress}
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
