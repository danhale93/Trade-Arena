import React, { useEffect, useRef, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Define the global bridge interface for synchronization with the Arena's legacy JavaScript engine
declare global {
  interface Window {
    privyUser: any;
    privyWalletAddress: string | null;
    privyConnected: boolean;
    privyProvider: any;
    privyInit: () => void;
    privyLogin: () => void;
    privyLogout: () => void;
    isPrivyConnected: () => boolean;
    getPrivyAddress: () => string | null;
    privySignMessage: (message: string) => Promise<string>;
    onPrivyLoginSuccess?: () => void;
    onPrivyReady?: (user: any, address: string | null) => void;
    updateWalletUI?: () => void;
  }
}

/**
 * Senior Web3 Component: PrivyWalletHeader
 *
 * This component manages the Privy authentication lifecycle and specifically isolates
 * the embedded wallet for secure Trade Arena interactions.
 */
export const PrivyWalletHeader = () => {
  let { authenticated, user, login, logout, ready } = usePrivy();
  let { wallets, ready: walletsReady } = useWallets();

  // Support frontend verification mocking
  if (typeof window !== 'undefined' && (window as any).__mockPrivy) {
    const mock = (window as any).__mockPrivy;
    if (mock.authenticated !== undefined) authenticated = mock.authenticated;
    if (mock.user !== undefined) user = mock.user;
    if (mock.ready !== undefined) ready = mock.ready;
    if (mock.wallets !== undefined) wallets = mock.wallets;
    if (mock.walletsReady !== undefined) walletsReady = mock.walletsReady;
  }

  const hasTriggeredSuccess = useRef(false);
  const lastSyncAddress = useRef<string | null>(null);

  /**
   * REQUIREMENT 2: Isolated Embedded Wallet
   * We specifically target the 'privy' client type to ensure the Arena interacts
   * only with the secure, non-custodial embedded wallet.
   */
  const arenaWallet = useMemo(() => {
    return wallets.find((w) => w.walletClientType === 'privy') || null;
  }, [wallets]);

  /**
   * REQUIREMENT 3: Truncated Address Format
   * Clean string formatting (0x1234...abcd) for UI display.
   */
  const displayAddress = useMemo(() => {
    const addr = arenaWallet?.address;
    if (!addr) return '0x...';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [arenaWallet?.address]);

  // Derived user identity
  const userLabel = useMemo(() => {
    return user?.google?.email || user?.email?.address || 'Arena Trader';
  }, [user]);

  /**
   * REQUIREMENT 5: Legacy JavaScript Bridge
   * Synchronizes authentication state and providers with the execution engine.
   */
  useEffect(() => {
    // Expose control functions
    window.privyInit = () => console.log('🎨 Palette: Trade Arena bridge activated');
    window.privyLogin = () => login({ loginMethod: 'google' });
    window.privyLogout = logout;
    window.isPrivyConnected = () => authenticated && !!arenaWallet;
    window.getPrivyAddress = () => arenaWallet?.address || null;

    // Implementation of signing bridge for execution-engine.js
    window.privySignMessage = async (message: string) => {
      if (!arenaWallet) throw new Error('No arena wallet available for signing');
      return arenaWallet.signMessage(message);
    };
  }, [login, logout, authenticated, arenaWallet]);

  // Bridge state synchronization
  useEffect(() => {
    if (authenticated && user && arenaWallet) {
      window.privyUser = user;
      window.privyWalletAddress = arenaWallet.address;
      window.privyConnected = true;

      // Inject Ethers-compatible provider for legacy execution
      window.privyProvider = {
        ...arenaWallet,
        getEthersProvider: async () => {
          const provider = await arenaWallet.getEthereumProvider();
          const ethersLib = (window as any).ethers;
          // Support for both Ethers v5 and v6 environments used in the Arena
          return ethersLib.BrowserProvider
            ? new ethersLib.BrowserProvider(provider)
            : new ethersLib.providers.Web3Provider(provider);
        }
      };

      // Trigger legacy initialization callbacks
      if (arenaWallet.address !== lastSyncAddress.current) {
        lastSyncAddress.current = arenaWallet.address;
        window.onPrivyReady?.(user, arenaWallet.address);
        window.updateWalletUI?.();
      }

      // Signal successful entry to the lifecycle manager
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess();
        hasTriggeredSuccess.current = true;
      }
    } else if (!authenticated && ready) {
      // Cleanup on logout
      hasTriggeredSuccess.current = false;
      lastSyncAddress.current = null;
      window.privyUser = null;
      window.privyWalletAddress = null;
      window.privyConnected = false;
      window.privyProvider = null;
    }
  }, [authenticated, user, arenaWallet, ready]);

  // Loading state: SDK Initialization
  if (!ready || !walletsReady) {
    return (
      <div className="gh-controls">
        <div style={{ fontSize: '10px', color: 'var(--dim)', fontFamily: 'Share Tech Mono' }}>
          BOOTING...
        </div>
      </div>
    );
  }

  // Unauthenticated: Login Trigger
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
   * REQUIREMENT 4: Graceful provisioning state
   */
  if (authenticated && !arenaWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {userLabel}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono', letterSpacing: '0.5px' }}>
          Initializing arena wallet...
        </div>
      </div>
    );
  }

  /**
   * REQUIREMENT 3 (UI): Truncated Address Display
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 4px' }}>
      <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {userLabel}
      </div>
      <div style={{ fontSize: '9px', color: 'var(--dim)', fontFamily: 'Share Tech Mono', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'var(--gold)', marginRight: '4px' }} role="img" aria-label="wallet">💳</span>
        <span>{displayAddress}</span>
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
