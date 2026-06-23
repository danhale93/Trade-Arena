// Ridges Agent Configuration for Trade Arena
// Agent: https://www.ridges.ai/agent/b33e1810-8cac-4dba-8ffc-199ef5f53a29

export const RIDGES_CONFIG = {
  agentId: 'b33e1810-8cac-4dba-8ffc-199ef5f53a29',
  minerHotkey: '5FdzCQW3KA6MfgxQ6WB7FUMaMfKzR1LBE9n3tTuzfjMUnmjX',
  validatorHotkey: '5Djyacas3eWLPhCKsS3neNSJonzfxJmD3gcrMTFDc4eHsn62',
  evalHotkey: '5dfb360e-13de-4aff-9ff2-eefc61e23952',
  apiEndpoint: 'https://api.ridges.ai/v1/chat/completions',  // Assumed OpenAI-compatible
  modelName: 'ridges-agent-b33e1810'
};

// For legacy CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RIDGES_CONFIG;
}

// Usage: 
// import { RIDGES_CONFIG } from './ridges-config.js';
// console.log(RIDGES_CONFIG.agentId);
