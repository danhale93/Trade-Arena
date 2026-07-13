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
  const { wallets } = useWallets();

  const hasTriggeredSuccess = useRef(false);
  const lastKnownAddress = useRef<string | null>(null);

  /**
   * REQUIREMENT 2: Isolate the Privy embedded wallet.
   * We use useMemo to efficiently track the specific 'privy' client type from the wallets array.
   */
  const embeddedWallet = useMemo(() =>
    wallets.find((w) => w.walletClientType === 'privy'),
    [wallets]
  );

  /**
   * REQUIREMENT 3 (Logic): Format truncated address.
   * We derive this from the isolated embedded wallet address.
   */
  const truncatedAddress = useMemo(() => {
    if (!embeddedWallet?.address) return null;
    const addr = embeddedWallet.address;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, [embeddedWallet?.address]);

  // Expose authentication controls to the global scope for legacy JS integration (MetaMask buttons, etc.)
  useEffect(() => {
    window.privyInit = () => console.log('[Privy] Header bridge active');
    window.privyLogin = login;
    window.privyLoginGoogle = () => login({ loginMethod: 'google' });
    window.privyLoginApple = () => login({ loginMethod: 'apple' });
    window.privyLogout = logout;
  }, [login, logout]);

  // Reset global state upon logout to ensure session isolation
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

  /**
   * REQUIREMENT 5: Synchronize state with legacy environment.
   * We wait until the embedded wallet is provisioned before allowing interaction.
   */
  useEffect(() => {
    if (authenticated && user && embeddedWallet) {
      // Sync global bridge variables for the Arena's legacy engine
      window.privyUser = user;
      window.privyWalletAddress = embeddedWallet.address;
      window.privyConnected = true;

      // Provide an ethers-compatible provider for on-chain execution (swaps, etc.)
      window.privyProvider = {
        ...embeddedWallet,
        getEthersProvider: async () => {
          const provider = await embeddedWallet.getEthereumProvider();
          const ethersLib = (window as any).ethers;
          // Support both Ethers v5 (Web3Provider) and v6 (BrowserProvider)
          return ethersLib.BrowserProvider
            ? new ethersLib.BrowserProvider(provider)
            : new ethersLib.providers.Web3Provider(provider);
        }
      };

      // Trigger legacy initialization callbacks if the address is new
      if (embeddedWallet.address !== lastKnownAddress.current) {
        lastKnownAddress.current = embeddedWallet.address;

        if (typeof window.onPrivyReady === 'function') {
          window.onPrivyReady(user, embeddedWallet.address);
        }

        if (typeof window.updateWalletUI === 'function') {
          window.updateWalletUI();
        }
      }

      // Automatically enter the Arena upon full readiness
      if (!hasTriggeredSuccess.current && typeof window.onPrivyLoginSuccess === 'function') {
        window.onPrivyLoginSuccess();
        hasTriggeredSuccess.current = true;
      }
    }
  }, [authenticated, user, embeddedWallet]);

  // Loading state: SDK is still booting
  if (!ready) {
    return (
      <div className="gh-controls">
        <div style={{ fontSize: '10px', color: 'var(--dim)', fontFamily: 'Share Tech Mono' }}>
          BOOTING...
        </div>
      </div>
    );
  }

  // Unauthenticated state: User needs to login
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
   * REQUIREMENT 4: Graceful loading state.
   * If logged in but the embedded wallet isn't in the wallets array yet, show provision status.
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
   * REQUIREMENT 3 (UI): Display user's live wallet address in truncated format.
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
