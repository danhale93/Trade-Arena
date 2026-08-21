import React, { useEffect, useRef, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Global bridge interface for synchronization with the Arena's legacy JavaScript engine
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
 * Truncates an Ethereum wallet address to a clean, truncated display format (e.g., 0x1234...abcd).
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
 * Manages Privy authentication lifecycle and isolates the embedded wallet
 * (walletClientType === 'privy') for Trade Arena interactions.
 */
export const PrivyWalletHeader = () => {
  // Extract session metadata, login/logout, and embedded wallet creation using Privy hooks
  let { authenticated, user, login, logout, ready, createWallet } = usePrivy();
  let { wallets, ready: walletsReady } = useWallets();

  // UX Feedback State
  const [copied, setCopied] = useState(false);

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
   * TASK 2:
   * Isolate the user's active Privy embedded wallet (where `walletClientType === 'privy'`)
   */
  const arenaWallet = useMemo(() => {
    if (!wallets || !Array.isArray(wallets)) return null;
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
    if (embeddedWallet) {
      console.log('[Privy] Active Embedded Wallet Isolated:', embeddedWallet.address);
    }
    return embeddedWallet || null;
  }, [wallets]);

  /**
   * TASK 3:
   * Format the live authenticated embedded wallet address using a clean, truncated string format (0x1234...abcd)
   */
  const displayAddress = useMemo(() => {
    return truncateAddress(arenaWallet?.address);
  }, [arenaWallet?.address]);

  // Derived user identity supporting Google, Email, and fallback socials
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
   * Synchronizes authentication state and providers with execution engine.
   */
  useEffect(() => {
    window.privyInit = () => console.log('🎨 Palette: Trade Arena bridge activated');
    window.privyLogin = (options?: any) => login(options);
    window.privyLogout = logout;
    window.isPrivyConnected = () => authenticated && !!arenaWallet;
    window.getPrivyAddress = () => arenaWallet?.address || null;

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

      const privyProviderInstance = {
        ...arenaWallet,
        getEthersProvider: async () => {
          const provider = await arenaWallet.getEthereumProvider();
          const ethersLib = (window as any).ethers;
          return ethersLib.BrowserProvider
            ? new ethersLib.BrowserProvider(provider)
            : new ethersLib.providers.Web3Provider(provider);
        }
      };
      window.privyProvider = privyProviderInstance;

      if (window.walletState && (window as any).setWalletState) {
        privyProviderInstance.getEthersProvider().then(async (provider) => {
          try {
            const signer = await provider.getSigner();
            (window as any).setWalletState({
                isConnected: true,
                address: arenaWallet.address,
                walletType: arenaWallet.walletClientType || 'privy',
                provider: provider,
                signer: signer
            });
            console.log('[Privy] Signer synchronized to walletState');
            if (typeof window.getWalletBalance === 'function') {
                await window.getWalletBalance();
            }
          } catch (sErr) {
            console.error('[Privy] Failed to get signer or fetch balance:', sErr);
          }
        }).catch((err) => {
          console.error('[Privy] Failed to initialize provider in walletState:', err);
        });
      } else if (window.walletState) {
        window.walletState.isConnected = true;
        window.walletState.address = arenaWallet.address;
      }

      if (arenaWallet.address !== lastSyncAddress.current) {
        lastSyncAddress.current = arenaWallet.address;
        window.onPrivyReady?.(user, arenaWallet.address);
        window.updateWalletUI?.();
      }

      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess(user, arenaWallet.address);
        hasTriggeredSuccess.current = true;
      }
    } else if (!authenticated && ready) {
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
   * TASK 4:
   * Graceful loading state when authenticated but embedded wallet array is empty ("Initializing arena wallet...").
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
   * Copy full wallet address
   */
  const handleCopy = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (!arenaWallet?.address) return;

    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return;
    }

    e.preventDefault();

    navigator.clipboard.writeText(arenaWallet.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if (typeof window !== 'undefined' && (window as any).SFX && (window as any).SFX.tick) {
        try { (window as any).SFX.tick(); } catch (err) {}
      }

      if (typeof window !== 'undefined' && (window as any).FX && (window as any).FX.confetti) {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if ('clientX' in e && e.clientX && e.clientY) {
          x = e.clientX;
          y = e.clientY;
        } else {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }

        try { (window as any).FX.confetti(x, y, 10); } catch (err) {}
      }

      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Wallet address copied!', 'success');
      }
    }).catch(err => {
      console.error('Copy wallet address failed:', err);
    });
  };

  /**
   * TASK 3 UI:
   * Render truncated address display (0x1234...abcd)
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
