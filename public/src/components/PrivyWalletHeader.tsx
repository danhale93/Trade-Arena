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
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="think-spinner" style={{ width: '8px', height: '8px', border: '1px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
          <span>Initializing arena wallet...</span>
        </div>
      </div>
    );
  }

  /**
   * Handle copying the full wallet address with rich visual and audio delight
   */
  const handleCopy = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (!arenaWallet?.address) return;

    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }

    e.preventDefault();

    navigator.clipboard.writeText(arenaWallet.address).then(() => {
      // 1. Subtle auditory feedback
      if (typeof window !== 'undefined' && (window as any).SFX && (window as any).SFX.tick) {
        try { (window as any).SFX.tick(); } catch (err) {}
      }

      // 2. Localized visual delight (confetti burst right at user action point)
      if (typeof window !== 'undefined' && (window as any).FX && (window as any).FX.confetti) {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if ('clientX' in e && e.clientX && e.clientY) {
          x = e.clientX;
          y = e.clientY;
        } else {
          // For keyboard, emit at the element's center
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }

        try { (window as any).FX.confetti(x, y, 10); } catch (err) {}
      }

      // 3. System confirmation toast
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Wallet address copied!', 'success');
      }
    }).catch(err => {
      console.error('Copy wallet address failed:', err);
    });
  };

  /**
   * REQUIREMENT 3 (UI): Truncated Address Display with Click-to-Copy UX and Accessibility
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 4px' }}>
      <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {userLabel}
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCopy}
        onKeyDown={handleCopy}
        title="Copy wallet address to clipboard"
        aria-label={`Copy wallet address ${displayAddress} to clipboard`}
        style={{
          fontSize: '9px',
          color: 'var(--dim)',
          fontFamily: 'Share Tech Mono',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: '4px',
          outline: 'none',
          userSelect: 'none',
          transition: 'color 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--cyan)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--dim)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.color = 'var(--cyan)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--cyan)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.color = 'var(--dim)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ color: 'var(--gold)', marginRight: '4px' }} role="img" aria-label="wallet">💳</span>
        <span>{displayAddress}</span>
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
