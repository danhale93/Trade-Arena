import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import PrivyWalletHeader from './components/PrivyWalletHeader';

// Define Base Mainnet configuration manually to avoid external dependency issues
const baseMainnet = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
};

const App = () => {
  const appId = 'cmpl1hc0k00ui0djsr3qo8gg8';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['wallet', 'google', 'apple', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ffe7',
          showWalletLoginFirst: true,
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
