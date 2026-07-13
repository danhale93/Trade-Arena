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
    privyLogin: () => void;
    privyLoginGoogle: () => void;
    privyLoginApple: () => void;
    privyLogout: () => void;
    isPrivyConnected: () => boolean;
    getPrivyAddress: () => string | null;
  }
}

/**
 * PrivyWalletHeader Component
 *
 * Handles Privy authentication, isolates the embedded wallet for the Trade Arena,
 * and synchronizes state with the legacy JavaScript environment.
 */
export const PrivyWalletHeader = () => {
  const { authenticated, user, login, logout, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const hasTriggeredSuccess = useRef(false);
  const lastKnownAddress = useRef<string | null>(null);

  /**
   * REQUIREMENT 2: Isolate the Privy embedded wallet.
   * We utilize the useWallets hook to specifically identify the 'privy' wallet client type,
   * ensuring the Trade Arena interacts with the user's secure embedded wallet.
   */
  const embeddedWallet = useMemo(() => {
    if (!walletsReady) return null;
    return wallets.find((w) => w.walletClientType === 'privy');
  }, [wallets, walletsReady]);

  /**
   * REQUIREMENT 3: Format truncated address.
   * Derived from the isolated embedded wallet address using a standard truncated format (0x1234...abcd).
   */
  const truncatedAddress = useMemo(() => {
    if (!embeddedWallet?.address) return '0x0000...0000';
    const addr = embeddedWallet.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [embeddedWallet?.address]);

  // Expose bridge functions to the global scope for legacy JavaScript environment synchronization
  useEffect(() => {
    window.privyInit = () => console.log('[Privy] Trade Arena bridge activated');
    window.privyLogin = () => login({ loginMethod: 'google' }); // Prioritize Google login as requested
    window.privyLoginGoogle = () => login({ loginMethod: 'google' });
    window.privyLoginApple = () => login({ loginMethod: 'apple' });
    window.privyLogout = logout;
    window.isPrivyConnected = () => authenticated && !!embeddedWallet;
    window.getPrivyAddress = () => embeddedWallet?.address || null;
  }, [login, logout, authenticated, embeddedWallet]);

  // Handle session cleanup upon logout
  useEffect(() => {
    if (!authenticated && ready) {
      hasTriggeredSuccess.current = false;
      lastKnownAddress.current = null;
      window.privyUser = null;
      window.privyWalletAddress = null;
      window.privyConnected = false;
      window.privyProvider = null;
    }
  }, [authenticated, ready]);

  /**
   * REQUIREMENT 5: Synchronize authentication state with the legacy Arena engine.
   * This bridge ensures that non-React trading logic can access the Privy wallet and provider.
   */
  useEffect(() => {
    if (authenticated && user && embeddedWallet) {
      window.privyUser = user;
      window.privyWalletAddress = embeddedWallet.address;
      window.privyConnected = true;

      // Inject an ethers-compatible provider bridge for the Arena's execution engine
      window.privyProvider = {
        ...embeddedWallet,
        getEthersProvider: async () => {
          const provider = await embeddedWallet.getEthereumProvider();
          const ethersLib = (window as any).ethers;
          // Support for both Ethers v5 and v6 environments
          return ethersLib.BrowserProvider
            ? new ethersLib.BrowserProvider(provider)
            : new ethersLib.providers.Web3Provider(provider);
        }
      };

      // Trigger legacy initialization callbacks on address change
      if (embeddedWallet.address !== lastKnownAddress.current) {
        lastKnownAddress.current = embeddedWallet.address;

        if (typeof window.onPrivyReady === 'function') {
          window.onPrivyReady(user, embeddedWallet.address);
        }

        if (typeof window.updateWalletUI === 'function') {
          window.updateWalletUI();
        }
      }

      // Signal successful Arena entry to the legacy lifecycle manager
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess();
        hasTriggeredSuccess.current = true;
      }
    }
  }, [authenticated, user, embeddedWallet]);

  // Loading state: Privy SDK initialization
  if (!ready) {
    return (
      <div className="gh-controls">
        <div style={{ fontSize: '10px', color: 'var(--dim)', fontFamily: 'Share Tech Mono' }}>
          BOOTING...
        </div>
      </div>
    );
  }

  // Unauthenticated state: Primary login CTA
  if (!authenticated) {
    return (
      <div className="gh-controls">
        <button
          className="gh-auto-btn"
          onClick={() => login({ loginMethod: 'google' })}
          style={{ border: '1px solid var(--cyan)', color: 'var(--cyan)', cursor: 'pointer', background: 'transparent' }}
        >
          LOGIN
        </button>
      </div>
    );
  }

  /**
   * REQUIREMENT 4: Graceful loading state for wallet provisioning.
   * Displayed when the user is logged in but the embedded wallet is still being initialized.
   */
  if (!embeddedWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {user?.google?.email || user?.email?.address || 'Authenticating...'}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono', letterSpacing: '0.5px' }}>
          Initializing arena wallet...
        </div>
      </div>
    );
  }

  /**
   * REQUIREMENT 3 (UI): Display the active Privy wallet address.
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 4px' }}>
      <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {user?.google?.email || user?.email?.address || 'Arena Trader'}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--dim)', fontFamily: 'Share Tech Mono', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'var(--gold)', marginRight: '4px' }} role="img" aria-label="wallet">💳</span>
        <span>{truncatedAddress}</span>
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
