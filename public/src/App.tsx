import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import PrivyWalletHeader from './components/PrivyWalletHeader';

// RPC configuration with fallback
const ALCHEMY_KEY = ''; // Add your Alchemy Key here if needed for local builds
const RPC_URLS = ALCHEMY_KEY
  ? [`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, 'https://mainnet.base.org']
  : ['https://mainnet.base.org'];

// Define Base Mainnet configuration manually to avoid external dependency issues
const baseMainnet = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: RPC_URLS },
    public: { http: RPC_URLS },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
};

const App = () => {
  // Use the App ID found in privy-client.js
  const appId = 'cmpl1hc0k00ui0djsr3qo8gg8';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['google', 'apple', 'email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ffe7',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Set Base as the default and supported chain
        supportedChains: [baseMainnet],
        defaultChain: baseMainnet,
      }}
    >
      <PrivyWalletHeader />
    </PrivyProvider>
  );
};

export default App;
