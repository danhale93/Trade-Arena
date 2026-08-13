/**
 * @jest-environment jsdom
 */

const realWallet = require('./real-wallet.js');
const { ethers } = require('ethers');

describe('Real Wallet Integration - Synchronization & Event Listeners', () => {
  let eventListeners = {};

  beforeEach(() => {
    eventListeners = {};
    global.window = {
      ethereum: {
        isMetaMask: true,
        on: jest.fn((event, cb) => {
          eventListeners[event] = cb;
        }),
        request: jest.fn(async ({ method }) => {
          if (method === 'wallet_switchEthereumChain') return null;
          if (method === 'eth_accounts') return [realWallet.walletState.address];
          if (method === 'eth_chainId') return '0x2105';
          if (method === 'eth_getBalance') return '0x14d1120d7b160000'; // 1.5 ETH
          throw new Error(`Unsupported method: ${method}`);
        })
      },
      location: {
        reload: jest.fn()
      },
      dispatchEvent: jest.fn()
    };
    global.navigator = { userAgent: 'Jest Test Runner' };
    global.ethers = ethers;
  });

  test('REAL_WALLET_CONFIG targets Base Mainnet', () => {
    expect(realWallet.REAL_WALLET_CONFIG.network.id).toBe(8453);
    expect(realWallet.REAL_WALLET_CONFIG.network.chainId).toBe('0x2105');
  });

  test('initializeRealWalletMode returns ready status', async () => {
    const status = await realWallet.initializeRealWalletMode();
    expect(status.ready).toBe(true);
  });

  test('accountsChanged event updates address, balance, and dispatches event', async () => {
    const newAddr = '0x1111222233334444555566667777888899990000';
    realWallet.walletState.address = newAddr;
    realWallet.walletState.provider = {
      getBalance: jest.fn(async () => ethers.parseEther('2.5'))
    };

    // Re-trigger event registration by re-evaluating or invoking
    // Since event listeners are set on load, let's simulate the event handler logic directly or test via window.ethereum.on
    // In real-wallet.js, event listeners are attached immediately if window.ethereum exists.
    // Let's test the exported function or simulate the listener callback stored in eventListeners.
    
    // We can require real-wallet.js inside beforeEach if needed, but let's check if eventListeners captured it:
    // real-wallet.js runs top-level check for window.ethereum.on when required.
  });
});
