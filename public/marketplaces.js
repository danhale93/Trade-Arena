/**
 * EXTERNAL MARKETPLACE INTEGRATION
 * g0 Marketplace & Superteam Earn SDK/API Mocks
 * Enables autonomous agent registration, task acceptance, and USDC earnings.
 */

const MARKETPLACE_CONFIG = {
    g0: {
        apiUrl: 'https://api.g0.dev/v1',
        sdkVersion: '1.2.4',
        docs: 'https://github.com/g0-marketplace/sdk-docs'
    },
    superteam: {
        portalUrl: 'https://earn.superteam.fun/agents',
        apiVersion: '2024-03-01'
    }
};

class MarketplaceEngine {
    constructor() {
        this.identities = JSON.parse(localStorage.getItem('ta_agent_identities') || '{}');
        this.earnings = JSON.parse(localStorage.getItem('ta_agent_earnings') || '{"USDC": 0, "SOL": 0}');
        this.activeTasks = [];
        this.availableTasks = [];
        this.isInitialized = false;
    }

    /**
     * Initialize the marketplace engine and start background polling
     */
    init() {
        if (this.isInitialized) return;
        console.log('🤖 Marketplace Engine: Connecting to external portals...');
        this.refreshTasks();
        setInterval(() => this.refreshTasks(), 30000); // Poll every 30s

        // Autonomous Agent behavior: agents check for tasks periodically
        setInterval(() => this.autonomousAgentBehavior(), 45000);

        this.isInitialized = true;
    }

    /**
     * Autonomous behavior: Registered agents check available tasks and accept them
     */
    async autonomousAgentBehavior() {
        if (this.availableTasks.length === 0) return;

        // Find registered agents
        const registeredAgentIds = Object.keys(this.identities).filter(id =>
            this.identities[id].g0?.registered || this.identities[id].superteam?.registered
        );

        if (registeredAgentIds.length === 0) return;

        // Each registered agent has a chance to autonomously accept a matching task
        for (const agentId of registeredAgentIds) {
            // 15% chance to act per cycle
            if (Math.random() > 0.15) continue;

            // Look for a task matching their category
            const matchingTask = this.availableTasks.find(t =>
                t.category === agentId &&
                !this.activeTasks.find(at => at.id === t.id)
            );

            if (matchingTask) {
                console.log(`[Marketplace] Agent ${agentId} autonomously accepting task: ${matchingTask.title}`);
                this.processTask(agentId, matchingTask.id);
                break; // Limit to one autonomous action per cycle
            }
        }
    }

    /**
     * Register an agent identity on a marketplace
     */
    async registerAgent(agentId, marketplace, data = {}) {
        console.log(`[Marketplace] Registering ${agentId} on ${marketplace}...`);

        // Mock API call to registry
        await new Promise(r => setTimeout(r, 1500));

        const apiKey = `sk_${marketplace}_${Math.random().toString(36).substr(2, 16)}`;
        const externalId = `${marketplace.charAt(0)}_${Math.random().toString(36).substr(2, 8)}`;

        if (!this.identities[agentId]) this.identities[agentId] = {};

        this.identities[agentId][marketplace] = {
            registered: true,
            apiKey: apiKey,
            externalId: externalId,
            registeredAt: Date.now(),
            servicePrice: data.price || 5.00,
            status: 'ACTIVE'
        };

        this.saveState();

        if (window.STAFF) {
            window.STAFF.logSystemEvent('DEVELOPER', `Agent ${agentId} registered identity on ${marketplace.toUpperCase()}.`, 'success');
        }

        return this.identities[agentId][marketplace];
    }

    /**
     * Set service price for an agent on g0 Marketplace
     */
    async setServicePrice(agentId, price) {
        if (this.identities[agentId] && this.identities[agentId].g0) {
            this.identities[agentId].g0.servicePrice = parseFloat(price);
            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Mock fetching available tasks from external sources
     */
    async refreshTasks() {
        const mockTasks = [
            { id: 'st_1', title: 'Momentum Analysis - BTC/USDT', reward: 25, currency: 'USDC', provider: 'Superteam', category: 'mom', complexity: 'Low' },
            { id: 'st_2', title: 'Volatility Risk Assessment', reward: 50, currency: 'USDC', provider: 'Superteam', category: 'vol', complexity: 'Medium' },
            { id: 'g0_1', title: 'Custom Alpha Signal Request', reward: 15, currency: 'USDC', provider: 'g0 Marketplace', category: 'sen', complexity: 'Low' },
            { id: 'g0_2', title: 'Politician Filing Correlation', reward: 40, currency: 'USDC', provider: 'g0 Marketplace', category: 'pol', complexity: 'High' },
            { id: 'st_3', title: 'Sentiment Drift Report', reward: 30, currency: 'USDC', provider: 'Superteam', category: 'sen', complexity: 'Medium' }
        ];

        this.availableTasks = mockTasks;

        // Trigger UI update if function exists
        if (typeof window.renderMarketplaceTasks === 'function') {
            window.renderMarketplaceTasks();
        }
    }

    /**
     * Agent accepts and completes a task autonomously
     */
    async processTask(agentId, taskId) {
        const task = this.availableTasks.find(t => t.id === taskId);
        if (!task) return false;

        console.log(`[Marketplace] Agent ${agentId} accepting task: ${task.title}`);

        const taskEntry = { ...task, agentId, status: 'PROCESSING', startedAt: Date.now() };
        this.activeTasks.push(taskEntry);

        if (window.renderMarketplaceTasks) window.renderMarketplaceTasks();

        // Simulate "computational work"
        await new Promise(r => setTimeout(r, 4000));

        // Complete and earn
        this.earnings.USDC += task.reward;
        this.activeTasks = this.activeTasks.filter(t => t.id !== task.id);

        this.saveState();

        // Record in trade ledger as external earning
        if (window.closedTrades) {
            const earningEvent = {
                id: 'earn_' + Date.now(),
                botId: 'EXT',
                token: 'USDC',
                method: 'MARKETPLACE',
                isWin: true,
                netPnl: task.reward,
                isHold: true,
                time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
                status: 'closed',
                reasoning: `External task completed by ${agentId}: ${task.title}`
            };
            window.closedTrades.push(earningEvent);
            if (window.addToLog) window.addToLog(earningEvent);
        }

        // Notify UI
        if (window.showToast) {
            window.showToast(`Agent ${agentId} earned ${task.reward} USDC from ${task.provider}!`, 'success');
        }

        if (window.updateGlobalBalance) {
            window.balance += task.reward;
            if (window.equityHistory) window.equityHistory.push(parseFloat(window.balance.toFixed(2)));
            window.updateGlobalBalance();
        }

        return true;
    }

    /**
     * Get registration status for all agents
     */
    getIdentityStatus() {
        const agents = ['mom', 'vol', 'pol', 'sen', 'risk'];
        return agents.map(id => {
            const identity = this.identities[id] || {};
            return {
                id,
                g0: identity.g0 || { registered: false },
                superteam: identity.superteam || { registered: false }
            };
        });
    }

    saveState() {
        localStorage.setItem('ta_agent_identities', JSON.stringify(this.identities));
        localStorage.setItem('ta_agent_earnings', JSON.stringify(this.earnings));
    }
}

// Global instance
window.MARKETPLACE = new MarketplaceEngine();
window.MARKETPLACE.init();
