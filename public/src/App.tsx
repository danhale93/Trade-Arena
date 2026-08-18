import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'viem/chains';
import PrivyWalletHeader from './components/PrivyWalletHeader';

/**
 * Robust Privy Authentication Provider Setup
 * Customizing to avoid initialization errors, RPC rate-limiting, and lack of error visibility.
 *
 * OPERATOR ACTION REQUIRED IN PRIVY DASHBOARD:
 * Ensure both 'localhost' and 'trade-arena-app.onrender.com' are whitelisted in
 * the Allowed Domains section of the Privy developer dashboard.
 */
const App = () => {
  // Read Privy App ID from process.env / environment, or fallback to the provided App ID
  const appId = (typeof process !== 'undefined' && process.env && process.env.PRIVY_APP_ID) || 'cmpl1hc0k00ui0djsr3qo8gg8';

  return (
    <PrivyProvider
      appId={appId}
      onSuccess={(user) => console.log('Login success:', user)}
      onError={(error) => console.error('Privy Auth Error:', error)}
      config={{
        loginMethods: ['google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ffe7',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Use standard viem base mainnet chain for robust compatibility and reliable RPCs
        supportedChains: [base],
        defaultChain: base,
      }}
    >
      <PrivyWalletHeader />
    </PrivyProvider>
  );
};

export default App;
