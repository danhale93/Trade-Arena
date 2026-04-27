/**
 * WALLET INTEGRATION - Dynamic + Ramp Network
 * Google OAuth → Embedded Wallet + Osko Fiat On/Off Ramp
 * Trade Arena v4.2 - AU Compliant
 */

class TradeArenaWallet {
  constructor() {
    this.userWallet = null;
    this.rampKey = 'rk_live_XXXXXXXXXXXXXXX'; // Replace with your Ramp key
    this.isReady = false;
  }

  // Initialize after Google login
  async initFromGoogle(userData) {
    try {
      // Dynamic SDK - embedded wallet from Google auth
      const { DynamicContextProvider, DynamicWidget } = await import('https://cdn.jsdelivr.net/npm/@dynamic-labs/sdk@latest/+esm');
      
      // Create wallet linked to Google profile
      this.userWallet = await window.Dynamic.createWallet({
        authProvider: 'google-oauth2',
        userId: userData.email,
        preferredChain: 'base', // Base Mainnet
        strategy: 'create' // Auto-create MPC wallet
      });

      this.isReady = true;
      console.log('✅ Dynamic wallet created:', this.userWallet.address);
      
      // Mount Ramp widget
      this.mountRampWidget();
      
      return this.userWallet;
    } catch (error) {
      console.error('Wallet init failed:', error);
      return null;
    }
  }

  // Mount Ramp fiat on/off ramp widget
  mountRampWidget(containerId = 'ramp-container') {
    if (!this.isReady) return;
    
    const container = document.getElementById(containerId);
    if (!container) {
      // Create container
      const div = document.createElement('div');
      div.id = 'ramp-container';
      div.innerHTML = `
        <div id="ramp-widget" style="height: 600px;"></div>
        <button onclick="wallet.deposit()">💰 Deposit (Osko)</button>
        <button onclick="wallet.withdraw()">💸 Withdraw (Bank)</button>
      `;
      document.getElementById('mainApp').appendChild(div);
    }

    // Ramp Network widget (Osko enabled for AU)
    const rampScript = document.createElement('script');
    rampScript.src = 'https://cdn.jsdelivr.net/npm/@ramp-network/ramp-instant-sdk@1/+esm';
    rampScript.async = true;
    rampScript.onload = () => {
      window.RampInstantSDK.load({
        hostAppName: 'Trade Arena',
        hostLogoUrl: '/icon-192.png',
        swapAsset: 'ETH_BASE',
        fiatCurrency: 'AUD', // Australian Dollar
        fiatValue: '100', // Default amount
        userAddress: this.userWallet.address,
        swapExactAmount: true,
        defaultRail: 'osko', // Osko instant transfers
        containerNode: '#ramp-widget'
      });
    };
    document.head.appendChild(rampScript);
  }

  async deposit(amountAUD = 100) {
    if (!this.isReady) throw new Error('Wallet not initialized');
    
    // Ramp handles Osko → ETH deposit
    window.RampInstantSDK.load({
      ...this.getRampConfig(),
      fiatValue: amountAUD.toString(),
      userAddress: this.userWallet.address
    });
  }

  async withdraw(amountETH = 0.01) {
    if (!this.isReady) throw new Error('Wallet not initialized');
    
    // Send ETH to Ramp for fiat payout (Osko enabled)
    const tx = await this.userWallet.sendTransaction({
      to: 'ramp_withdrawal_address', // Ramp endpoint
      value: ethers.utils.parseEther(amountETH.toString())
    });
    console.log('Withdrawal tx:', tx.hash);
  }

  getRampConfig() {
    return {
      hostAppName: 'Trade Arena',
      hostLogoUrl: '/icon-192.png',
      swapAsset: 'ETH_BASE',
      userAddress: this.userWallet?.address || '',
      defaultRail: 'osko', // Osko for AU
      fiatCurrency: 'AUD'
    };
  }

  // MetaMask fallback
  async connectMetaMask() {
    if (!window.ethereum) throw new Error('MetaMask not found');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    this.userWallet = provider.getSigner();
    this.isReady = true;
    return this.userWallet.getAddress();
  }

  getBalance() {
    return this.userWallet?.balance || '0';
  }

  // Export for global access
  static getInstance() {
    if (!window.TradeArenaWallet) {
      window.TradeArenaWallet = new TradeArenaWallet();
    }
    return window.TradeArenaWallet;
  }
}

// Global instance
const wallet = TradeArenaWallet.getInstance();

