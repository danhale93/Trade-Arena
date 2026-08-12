/**
 * POSITION MANAGER (Backend)
 * Trade Arena • Handles persistence and lifecycle of active trading positions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSITIONS_FILE = path.join(__dirname, '../positions.json');

class PositionManager {
    constructor() {
        this.positions = new Map();
        this.loadPositions();
    }

    /**
     * Loads positions from the persistent JSON file.
     */
    loadPositions() {
        try {
            if (fs.existsSync(POSITIONS_FILE)) {
                const data = fs.readFileSync(POSITIONS_FILE, 'utf8');
                const parsed = JSON.parse(data);
                for (const pos of parsed) {
                    this.positions.set(pos.positionId, pos);
                }
                console.log(`[PositionManager] Loaded ${this.positions.size} positions from storage.`);
            }
        } catch (error) {
            console.error('[PositionManager] Failed to load positions:', error.message);
        }
    }

    /**
     * Saves positions to the persistent JSON file.
     */
    savePositions() {
        try {
            const list = Array.from(this.positions.values());
            fs.writeFileSync(POSITIONS_FILE, JSON.stringify(list, null, 2));
        } catch (error) {
            console.error('[PositionManager] Failed to save positions:', error.message);
        }
    }

    /**
     * Creates and persists a new position.
     */
    createPosition(posDetails) {
        const positionId = posDetails.positionId || 'pos-' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
        const position = {
            positionId,
            botId: posDetails.botId,
            strategyId: posDetails.strategyId,
            token: posDetails.token,
            quantity: posDetails.quantity,
            entryPrice: posDetails.entryPrice,
            entryTxHash: posDetails.entryTxHash || null,
            entryGas: posDetails.entryGas || null,
            entryTimestamp: posDetails.entryTimestamp || Date.now(),
            exitPrice: null,
            exitTxHash: null,
            exitGas: null,
            realisedPnL: 0,
            unrealisedPnL: 0,
            stopLoss: posDetails.stopLoss || null,
            takeProfit: posDetails.takeProfit || null,
            status: 'OPEN' // OPEN, CLOSED, FAILED, REVERTED
        };

        this.positions.set(positionId, position);
        this.savePositions();
        return position;
    }

    /**
     * Retrieves an active position by ID.
     */
    getPosition(positionId) {
        return this.positions.get(positionId) || null;
    }

    /**
     * Retrieves all active/open positions.
     */
    getOpenPositions() {
        return Array.from(this.positions.values()).filter(p => p.status === 'OPEN');
    }

    /**
     * Retrieves all positions for a specific bot.
     */
    getBotPositions(botId) {
        return Array.from(this.positions.values()).filter(p => p.botId === botId);
    }

    /**
     * Closes an open position and records final P&L.
     */
    closePosition(positionId, details) {
        const position = this.getPosition(positionId);
        if (!position) {
            throw new Error(`Position ${positionId} not found`);
        }

        position.exitPrice = details.exitPrice;
        position.exitTxHash = details.exitTxHash || null;
        position.exitGas = details.exitGas || null;
        position.realisedPnL = details.realisedPnL;
        position.unrealisedPnL = 0;
        position.status = 'CLOSED';
        position.closedTimestamp = Date.now();

        this.savePositions();
        return position;
    }

    /**
     * Updates unrealised P&L for all open positions based on live prices.
     */
    updateUnrealisedPnL(prices) {
        let updated = false;
        for (const position of this.getOpenPositions()) {
            const currentPrice = prices[position.token];
            if (currentPrice !== undefined) {
                const priceDiff = currentPrice - position.entryPrice;
                position.unrealisedPnL = priceDiff * position.quantity;
                updated = true;
            }
        }
        if (updated) {
            this.savePositions();
        }
    }
}

module.exports = new PositionManager();
