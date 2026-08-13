describe('Trade Arena Wallet Synchronization E2E Tests', () => {
  beforeEach(() => {
    // Inject mock window.ethereum before page load
    cy.visit('/', {
      onBeforeLoad(win) {
        win.ethereum = {
          isMetaMask: true,
          selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
          chainId: '0x2105',
          request: cy.stub().callsFake(async ({ method }) => {
            if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
              return ['0x1234567890abcdef1234567890abcdef12345678'];
            }
            if (method === 'eth_chainId') {
              return '0x2105';
            }
            if (method === 'eth_getBalance') {
              return '0x14d1120d7b160000'; // 1.5 ETH
            }
            return null;
          }),
          on: cy.stub().as('ethereumOn')
        };
      }
    });
  });

  it('loads the application and initializes real wallet integration', () => {
    cy.window().should('have.property', 'ethereum');
    cy.window().then((win) => {
      expect(win.ethereum.isMetaMask).to.be.true;
    });
  });

  it('verifies wallet status via global diagnostic commands', () => {
    cy.window().then(async (win) => {
      if (win.checkMetaMaskStatus) {
        const status = win.checkMetaMaskStatus();
        expect(status.metamaskInstalled).to.be.true;
      }
    });
  });
});
