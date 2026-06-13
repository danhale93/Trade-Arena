/**
 * Strategy Plugin System
 * Dynamically loads and manages trading strategies
 */

const fs = require('fs');
const path = require('path');

class StrategyLoader {
  constructor() {
    this.strategies = new Map();
    this.corePath = path.join(__dirname, 'strategies', 'core');
    this.customPath = path.join(__dirname, 'strategies', 'custom');
    
    // Ensure directories exist
    this.ensureDirectoryExists(this.corePath);
    this.ensureDirectoryExists(this.customPath);
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Load all strategies from core and custom directories
   * @returns {Promise<Object>} Loaded strategies
   */
  async loadAllStrategies() {
    try {
      // Load core strategies
      await this.loadStrategiesFromDirectory(this.corePath, 'core');
      
      // Load custom strategies
      await this.loadStrategiesFromDirectory(this.customPath, 'custom');
      
      console.log(`[StrategyLoader] Loaded ${this.strategies.size} strategies`);
      return this.getStrategies();
    } catch (error) {
      console.error('[StrategyLoader] Error loading strategies:', error);
      throw error;
    }
  }

  /**
   * Load strategies from a directory
   * @param {string} dirPath - Directory path
   * @param {string} type - Strategy type (core/custom)
   */
  async loadStrategiesFromDirectory(dirPath, type) {
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          try {
            const filePath = path.join(dirPath, file);
            const strategyModule = require(filePath);
            
            // Validate strategy module
            if (this.isValidStrategy(strategyModule)) {
              const strategyId = path.parse(file).name;
              this.strategies.set(strategyId, {
                ...strategyModule,
                id: strategyId,
                type,
                filePath,
                loadedAt: new Date()
              });
              
              console.log(`[StrategyLoader] Loaded ${type} strategy: ${strategyId}`);
            } else {
              console.warn(`[StrategyLoader] Invalid strategy format in ${file}`);
            }
          } catch (error) {
            console.error(`[StrategyLoader] Failed to load strategy ${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`[StrategyLoader] Error reading directory ${dirPath}:`, error);
    }
  }

  /**
   * Validate strategy module format
   * @param {Object} module - Strategy module
   * @returns {boolean} Is valid
   */
  isValidStrategy(module) {
    // Strategy must have an execute function
    if (typeof module.execute !== 'function') {
      return false;
    }
    
    // Strategy should have metadata
    if (!module.info || typeof module.info !== 'object') {
      return false;
    }
    
    // Info should have required fields
    const requiredInfoFields = ['name', 'description', 'version'];
    for (const field of requiredInfoFields) {
      if (!module.info[field]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get a strategy by ID
   * @param {string} strategyId - Strategy identifier
   * @returns {Object|null} Strategy or null if not found
   */
  getStrategy(strategyId) {
    return this.strategies.get(strategyId) || null;
  }

  /**
   * Get all loaded strategies
   * @returns {Object} All strategies
   */
  getStrategies() {
    const strategies = {};
    this.strategies.forEach((strategy, id) => {
      strategies[id] = {
        info: strategy.info,
        type: strategy.type,
        id: strategy.id,
        loadedAt: strategy.loadedAt
      };
    });
    return strategies;
  }

  /**
   * Execute a strategy
   * @param {string} strategyId - Strategy identifier
   * @param {Object} marketData - Market data for strategy
   * @param {Object} params - Strategy parameters
   * @returns {Promise<Object>} Strategy result
   */
  async executeStrategy(strategyId, marketData, params = {}) {
    const strategy = this.getStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    try {
      // Execute the strategy
      const result = await strategy.execute(marketData, params);
      
      // Validate result
      if (!this.isValidStrategyResult(result)) {
        throw new Error(`Strategy ${strategyId} returned invalid result format`);
      }
      
      return result;
    } catch (error) {
      console.error(`[StrategyLoader] Error executing strategy ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Validate strategy result format
   * @param {Object} result - Strategy result
   * @returns {boolean} Is valid
   */
  isValidStrategyResult(result) {
    // Strategy result should have signal and confidence
    if (typeof result !== 'object' || result === null) {
      return false;
    }
    
    if (typeof result.signal !== 'string') {
      return false;
    }
    
    const validSignals = ['BUY', 'SELL', 'HOLD'];
    if (!validSignals.includes(result.signal)) {
      return false;
    }
    
    if (typeof result.confidence !== 'number' || 
        result.confidence < 0 || 
        result.confidence > 1) {
      return false;
    }
    
    // Optional fields
    if (result.size !== undefined && 
        (typeof result.size !== 'number' || 
         result.size < 0 || 
         result.size > 1)) {
      return false;
    }
    
    return true;
  }

  /**
   * Reload strategies (useful in development)
   * @returns {Promise<Object>} Reloaded strategies
   */
  async reloadStrategies() {
    // Clear existing strategies
    this.strategies.clear();
    
    // Require fresh copies
    // Note: In production, you might want to avoid clearing cache
    // For development, we'll bust the require cache
    const coreFiles = fs.readdirSync(this.corePath);
    const customFiles = fs.readdirSync(this.customPath);
    
    const allFiles = [...coreFiles, ...customFiles]
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(
        file.startsWith('.') ? this.customPath : this.corePath, 
        file
      ));
    
    // Clear require cache for strategy files
    for (const file of allFiles) {
      const resolvedPath = require.resolve(file);
      delete require.cache[resolvedPath];
    }
    
    // Reload strategies
    return this.loadAllStrategies();
  }

  /**
   * Add a new custom strategy
   * @param {string} strategyId - Strategy identifier
   * @param {Object} strategyCode - Strategy module code
   * @returns {Promise<boolean>} Success
   */
  async addCustomStrategy(strategyId, strategyCode) {
    try {
      // Validate strategy code
      if (!this.isValidStrategy(strategyCode)) {
        throw new Error('Invalid strategy format');
      }
      
      // Write to file
      const filePath = path.join(this.customPath, `${strategyId}.js`);
      fs.writeFileSync(filePath, `
/**
 * Custom Strategy: ${strategyId}
 * Auto-generated on ${new Date().toISOString()}
 */

${strategyCode.toString()}
      `);
      
      // Clear require cache for this file if it exists
      const resolvedPath = require.resolve(filePath);
      delete require.cache[resolvedPath];
      
      // Load the new strategy
      const strategyModule = require(filePath);
      this.strategies.set(strategyId, {
        ...strategyModule,
        id: strategyId,
        type: 'custom',
        filePath,
        loadedAt: new Date()
      });
      
      console.log(`[StrategyLoader] Added custom strategy: ${strategyId}`);
      return true;
    } catch (error) {
      console.error(`[StrategyLoader] Failed to add custom strategy ${strategyId}:`, error);
      return false;
    }
  }

  /**
   * Remove a custom strategy
   * @param {string} strategyId - Strategy identifier
   * @returns {Promise<boolean>} Success
   */
  async removeCustomStrategy(strategyId) {
    try {
      const strategy = this.getStrategy(strategyId);
      if (!strategy || strategy.type !== 'custom') {
        throw new Error(`Custom strategy not found: ${strategyId}`);
      }
      
      // Remove from map
      this.strategies.delete(strategyId);
      
      // Delete file
      const filePath = path.join(this.customPath, `${strategyId}.js`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Clear require cache
      if (require.cache[filePath]) {
        delete require.cache[filePath];
      }
      
      console.log(`[StrategyLoader] Removed custom strategy: ${strategyId}`);
      return true;
    } catch (error) {
      console.error(`[StrategyLoader] Failed to remove custom strategy ${strategyId}:`, error);
      return false;
    }
  }
}

module.exports = new StrategyLoader();