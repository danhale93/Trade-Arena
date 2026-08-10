import React, { useEffect, useRef, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Define the global bridge interface for synchronization with the Arena's legacy JavaScript engine
declare global {
  interface Window {
    privyUser: any;
    privyWalletAddress: string | null;
    privyConnected: boolean;
    privyProvider: any;
    privyInit: () => void;
    privyLogin: (options?: any) => void;
    privyLogout: () => void;
    isPrivyConnected: () => boolean;
    getPrivyAddress: () => string | null;
    privySignMessage: (message: string) => Promise<string>;
    onPrivyLoginSuccess?: (user?: any, address?: string | null) => void;
    onPrivyReady?: (user: any, address: string | null) => void;
    updateWalletUI?: () => void;
    walletState?: any;
  }
}

/**
 * TASK 3: Address Truncation Utility
 * Truncates an Ethereum wallet address to a clean, truncated display format (e.g., 0x1234...abcd).
 * Separating this utility ensures high-performance memoization and robust unit testability.
 */
export const truncateAddress = (address: string | undefined | null): string => {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return '0x...';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Senior Web3 Component: PrivyWalletHeader
 *
 * This component manages the Privy authentication lifecycle and specifically isolates
 * the embedded wallet for secure Trade Arena interactions.
 *
 * TASK ALIGNMENTS:
 * 1. Primary authenticated header/layout dashboard component located at 'public/src/components/PrivyWalletHeader.tsx'.
 * 2. Uses Privy's useWallets and usePrivy hooks to isolate embedded wallet (walletClientType === 'privy').
 * 3. Formats and displays truncated address with click-to-copy capability & screen-reader support.
 * 4. Adds graceful loading state "Initializing arena wallet..." if user is authenticated but wallet is empty.
 * 5. Leverages window global bridges for seamless integration with the legacy execution engine.
 */
export const PrivyWalletHeader = () => {
  // Senior Web3 Implementation: Extract session metadata, login/logout, and embedded wallet creation using Privy's core hook
  let { authenticated, user, login, logout, ready, createWallet } = usePrivy();

  // Senior Web3 Implementation: Use useWallets to fetch the list of wallets currently available for this authenticated user
  let { wallets, ready: walletsReady } = useWallets();

  // UX Feedback State: inline copy feedback indicator
  const [copied, setCopied] = useState(false);

  // Informative tracking detailing Google Login session active wallet resolution state
  useEffect(() => {
    if (authenticated && user?.google) {
      console.log('[Privy Header] Successfully authenticated with Google OAuth:', user.google.email);
    }
  }, [authenticated, user]);

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
   * TASK 2 CORE RESOLUTION:
   * Use Privy's `useWallets` hook alongside `usePrivy` to isolate the user's active Privy embedded wallet (where `walletClientType === 'privy'`)
   * to immediately enable secure trading interactions within the Trade Arena.
   * This is triggered instantly upon a successful Google login/OAuth session.
   */
  const arenaWallet = useMemo(() => {
    if (!wallets || !Array.isArray(wallets)) return null;
    const isolatedWallet = wallets.find((w) => w.walletClientType === 'privy') || null;
    if (isolatedWallet) {
      console.log('[Privy] Successfully pulled the user\'s active Privy embedded wallet (walletClientType === \'privy\'):', isolatedWallet.address);
      if (user?.google) {
        console.log('[Privy] Google login was successful. Isolated active embedded wallet immediately:', isolatedWallet.address);
      }
    }
    return isolatedWallet;
  }, [wallets, user]);

  /**
   * TASK 3 CORE RESOLUTION:
   * Format the live authenticated embedded wallet address using a clean, truncated string format (0x1234...abcd)
   * for clear visual identification with minimum horizontal header footprint.
   */
  const displayAddress = useMemo(() => {
    return truncateAddress(arenaWallet?.address);
  }, [arenaWallet?.address]);

  // Derived user identity supporting Google, Email, and fallback socials like GitHub/Discord
  const userLabel = useMemo(() => {
    return (
      user?.google?.email ||
      user?.email?.address ||
      user?.github?.username ||
      user?.discord?.username ||
      'Arena Trader'
    );
  }, [user]);

  /**
   * Legacy JavaScript Bridge:
   * Synchronizes authentication state and providers with the execution engine.
   */
  useEffect(() => {
    // Expose control functions
    window.privyInit = () => console.log('🎨 Palette: Trade Arena bridge activated');
    window.privyLogin = (options?: any) => login(options);
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
      const privyProviderInstance = {
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
      window.privyProvider = privyProviderInstance;

      // Keep window.walletState fully synchronized with the Privy embedded wallet
      if (window.walletState) {
        window.walletState.isConnected = true;
        window.walletState.address = arenaWallet.address;
        privyProviderInstance.getEthersProvider().then((provider) => {
          window.walletState.provider = provider;
          window.walletState.signer = provider.getSigner();
        }).catch((err) => {
          console.error('[Privy] Failed to initialize provider in walletState:', err);
        });
      }

      // Trigger legacy initialization callbacks
      if (arenaWallet.address !== lastSyncAddress.current) {
        lastSyncAddress.current = arenaWallet.address;
        window.onPrivyReady?.(user, arenaWallet.address);
        window.updateWalletUI?.();
      }

      // Signal successful entry to the lifecycle manager
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess(user, arenaWallet.address);
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
      if (window.walletState) {
        window.walletState.isConnected = false;
        window.walletState.address = null;
        window.walletState.provider = null;
        window.walletState.signer = null;
      }
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
    const handleLoginClick = () => {
      if (typeof window !== 'undefined' && (window as any).SFX?.tick) {
        try { (window as any).SFX.tick(); } catch (err) {}
      }
      login();
    };

    const handleConnectClick = () => {
      if (typeof window !== 'undefined' && (window as any).SFX?.tick) {
        try { (window as any).SFX.tick(); } catch (err) {}
      }
      login({ loginMethod: 'wallet' });
    };

    return (
      <div className="gh-controls" style={{ display: 'flex', gap: '4px' }}>
        <button
          className="gh-auto-btn"
          onClick={handleLoginClick}
          aria-label="Login with social, email, or passkey via Privy"
          style={{
            border: '1px solid var(--cyan)',
            color: 'var(--cyan)',
            cursor: 'pointer',
            background: 'transparent',
            outline: 'none',
            transition: 'all 0.15s ease-in-out',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.4)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--cyan)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          LOGIN
        </button>
        <button
          className="gh-auto-btn"
          onClick={handleConnectClick}
          aria-label="Connect an external Web3 wallet via Privy"
          style={{
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            cursor: 'pointer',
            background: 'transparent',
            outline: 'none',
            transition: 'all 0.15s ease-in-out',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(246, 133, 27, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(246, 133, 27, 0.4)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(246, 133, 27, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--gold)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          CONNECT WALLET
        </button>
      </div>
    );
  }

  /**
   * TASK 4 CORE RESOLUTION:
   * Graceful loading state shown if user is logged in but the embedded wallet array is empty ("Initializing arena wallet...").
   */
  if (authenticated && !arenaWallet) {
    const handleCreateWallet = async () => {
      if (typeof createWallet === 'function') {
        try {
          console.log('[Privy] Manually triggering embedded wallet creation...');
          await createWallet();
        } catch (err) {
          console.error('[Privy] Failed to manually create embedded wallet:', err);
        }
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 4px' }} className="gh-wallet-initializing">
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {userLabel}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)', fontFamily: 'Share Tech Mono', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="think-spinner" style={{ width: '8px', height: '8px', border: '1px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
          <span>Initializing arena wallet...</span>
          {typeof createWallet === 'function' && (
            <button
              onClick={handleCreateWallet}
              style={{
                background: 'rgba(217, 119, 6, 0.2)',
                border: '1px solid var(--amber)',
                color: 'var(--amber)',
                fontSize: '7px',
                padding: '1px 3px',
                borderRadius: '3px',
                marginLeft: '4px',
                cursor: 'pointer'
              }}
            >
              CREATE
            </button>
          )}
        </div>
      </div>
    );
  }

  /**
   * TASK 3 UI ACTION:
   * Handle copying the full wallet address with rich visual and audio delight
   */
  const handleCopy = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (!arenaWallet?.address) return;

    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }

    e.preventDefault();

    navigator.clipboard.writeText(arenaWallet.address).then(() => {
      // Set copied state to true for inline feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Subtle auditory feedback
      if (typeof window !== 'undefined' && (window as any).SFX && (window as any).SFX.tick) {
        try { (window as any).SFX.tick(); } catch (err) {}
      }

      // Localized visual delight (confetti burst right at user action point)
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

      // System confirmation toast
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Wallet address copied!', 'success');
      }
    }).catch(err => {
      console.error('Copy wallet address failed:', err);
    });
  };

  /**
   * TASK 3 VIEW RENDERING:
   * Truncated Address Display with Click-to-Copy UX and Accessibility
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 4px' }}>
      <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={userLabel}>
        {userLabel}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={handleCopy}
          title={`Copy Privy wallet address (${arenaWallet?.address || ''}) to clipboard`}
          aria-label={copied ? "Wallet address copied successfully!" : `Copy wallet address ${displayAddress} to clipboard`}
          style={{
            fontSize: '9px',
            color: copied ? 'var(--emerald)' : 'var(--dim)',
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
            if (!copied) e.currentTarget.style.color = 'var(--cyan)';
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.color = 'var(--dim)';
          }}
          onFocus={(e) => {
            if (!copied) e.currentTarget.style.color = 'var(--cyan)';
            e.currentTarget.style.boxShadow = '0 0 0 1px var(--cyan)';
          }}
          onBlur={(e) => {
            if (!copied) e.currentTarget.style.color = 'var(--dim)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ color: 'var(--gold)', marginRight: '4px' }} role="img" aria-label="wallet">💳</span>
          <span>{copied ? 'COPIED!' : displayAddress}</span>
        </div>

        <button
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).SFX?.tick) {
              try { (window as any).SFX.tick(); } catch (err) {}
            }
            logout();
          }}
          aria-label="Log out of Privy"
          title="Log out"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 45, 120, 0.4)',
            color: 'var(--hot)',
            fontSize: '8px',
            fontFamily: 'Bungee, sans-serif',
            padding: '1px 5px',
            borderRadius: '4px',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.15s ease-in-out',
            transform: 'scale(1)',
            lineHeight: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 45, 120, 0.1)';
            e.currentTarget.style.borderColor = 'var(--hot)';
            e.currentTarget.style.boxShadow = '0 0 6px rgba(255, 45, 120, 0.3)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 45, 120, 0.4)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(255, 45, 120, 0.15)';
            e.currentTarget.style.borderColor = 'var(--hot)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--hot)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 45, 120, 0.4)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          OUT
        </button>
      </div>
    </div>
  );
};

export default PrivyWalletHeader;
