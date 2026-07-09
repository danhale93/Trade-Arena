import React, { useEffect, useRef, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Extend Window interface for TypeScript bridge with legacy environment
declare global {
  interface Window {
    privyUser: any;
    privyWalletAddress: string | null;
    privyConnected: boolean;
    privyProvider: any;
    onPrivyLoginSuccess: () => void;
    onPrivyReady: (user: any, address: string | null) => void;
    updateWalletUI: () => void;
    privyInit: () => void;
    privyLoginGoogle: () => void;
    privyLoginApple: () => void;
    privyLogout: () => void;
  }
}

/**
 * PrivyWalletHeader Component
 * Handles Privy authentication and isolates the embedded wallet for Trade Arena.
 */
export const PrivyWalletHeader = () => {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const hasTriggeredSuccess = useRef(false);
  const lastKnownAddress = useRef<string | null>(null);

  // 1. Isolate the active Privy embedded wallet using useMemo for efficiency
  // This satisfies the requirement to pull the specific 'privy' client type.
  const embeddedWallet = useMemo(() =>
    wallets.find((w) => w.walletClientType === 'privy'),
    [wallets]
  );

  // Expose authentication controls to the global scope for legacy JS integration
  useEffect(() => {
    window.privyInit = () => console.log('[Privy] Header bridge active');
    window.privyLoginGoogle = () => login({ loginMethod: 'google' });
    window.privyLoginApple = () => login({ loginMethod: 'apple' });
    window.privyLogout = logout;
  }, [login, logout]);

  // Reset global state upon logout
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

  // 2. Synchronize React state with legacy global state for Trade Arena interaction
  useEffect(() => {
    if (authenticated && user) {
      // Update global bridge variables
      window.privyUser = user;
      window.privyWalletAddress = embeddedWallet?.address || null;
      window.privyConnected = true;
      window.privyProvider = embeddedWallet;

      // Immediately enter the Arena upon successful login
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess();
        hasTriggeredSuccess.current = true;
      }

      // Notify the legacy engine when the wallet address becomes available
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

  // Unauthenticated state: Show LOGIN trigger
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

  // 3. Graceful loading state: Authenticated but wallet is still provisioning
  if (!embeddedWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {user?.google?.email || user?.email?.address || 'Authenticated'}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono', letterSpacing: '0.5px' }}>
          Initializing arena wallet...
        </div>
      </div>
    );
  }

  // 4. Truncated address display: 0x1234...abcd
  // isolates the address from the embedded wallet and formats it as requested.
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
