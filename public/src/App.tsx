import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import PrivyWalletHeader from './components/PrivyWalletHeader';

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
      }}
    >
      <PrivyWalletHeader />
    </PrivyProvider>
  );
};

export default App;
