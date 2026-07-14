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
   * SENIOR WEB3 PATTERN: Isolated Embedded Wallet Hook
   * We specifically target the 'privy' client type to ensure the Arena interacts
   * only with the secure, non-custodial embedded wallet, bypassing external EOA interference.
   */
  const embeddedWallet = useMemo(() => {
    return wallets.find((w) => w.walletClientType === 'privy') || null;
  }, [wallets]);

  /**
   * REQUIREMENT 3: Standard Web3 Address Truncation (0x1234...abcd)
   */
  const truncatedAddress = useMemo(() => {
    if (!embeddedWallet?.address) return 'Connecting...';
    const addr = embeddedWallet.address;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, [embeddedWallet?.address]);

  // Derived user identity for display
  const userIdentifier = useMemo(() => {
    return user?.google?.email || user?.email?.address || 'Arena Trader';
  }, [user]);

  // Expose bridge functions to the global scope for legacy JavaScript environment synchronization
  useEffect(() => {
    window.privyInit = () => console.log('🎨 Palette: Trade Arena bridge activated');
    window.privyLogin = () => login({ loginMethod: 'google' });
    window.privyLoginGoogle = () => login({ loginMethod: 'google' });
    window.privyLoginApple = () => login({ loginMethod: 'apple' });
    window.privyLogout = logout;
    window.isPrivyConnected = () => authenticated && !!embeddedWallet;
    window.getPrivyAddress = () => embeddedWallet?.address || null;
  }, [login, logout, authenticated, !!embeddedWallet]);

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
   */
  if (authenticated && !embeddedWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {userIdentifier}
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
        {userIdentifier}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--dim)', fontFamily: 'Share Tech Mono', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'var(--gold)', marginRight: '4px' }} role="img" aria-label="wallet">💳</span>
        <span>{truncatedAddress}</span>
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
