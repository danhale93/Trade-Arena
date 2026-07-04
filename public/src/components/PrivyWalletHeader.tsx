import React from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export const PrivyWalletHeader = () => {
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();

  // Isolate the embedded wallet (where walletClientType === 'privy')
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

  if (!authenticated) {
    return (
      <div className="gh-controls">
        <button
          className="gh-auto-btn"
          onClick={() => login()}
          style={{ border: '1px solid var(--cyan)', color: 'var(--cyan)', cursor: 'pointer' }}
        >
          LOGIN
        </button>
      </div>
    );
  }

  // Graceful loading state if logged in but wallet array is empty
  if (!embeddedWallet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="gh-name" style={{ fontSize: '10px', color: 'var(--cyan)' }}>
          {user?.google?.email || user?.email?.address || 'Authenticated'}
        </div>
        <div style={{ fontSize: '8px', color: 'var(--amber)' }}>
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
