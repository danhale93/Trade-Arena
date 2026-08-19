const MODEL_PERSONALITY_TRAITS = {
  'PRECISION': {edgeMultiplier:1.0,riskAversion:1.2,decisionSpeed:0.9,creativity:0.7},
  'AGGRESSIVE': {edgeMultiplier:1.3,riskAversion:0.7,decisionSpeed:1.2,creativity:1.0},
  'BALANCED': {edgeMultiplier:1.0,riskAversion:1.0,decisionSpeed:1.0,creativity:0.9},
  'ANALYTICAL': {edgeMultiplier:0.95,riskAversion:1.1,decisionSpeed:0.8,creativity:0.8},
  'COLLABORATIVE': {edgeMultiplier:0.95,riskAversion:1.0,decisionSpeed:0.9,creativity:0.9},
  'THOUGHTFUL': {edgeMultiplier:0.9,riskAversion:1.3,decisionSpeed:0.7,creativity:0.8},
  'STEADY': {edgeMultiplier:0.95,riskAversion:1.0,decisionSpeed:0.95,creativity:0.8},
  'PRAGMATIC': {edgeMultiplier:1.0,riskAversion:0.95,decisionSpeed:1.1,creativity:0.75},
  'CREATIVE': {edgeMultiplier:1.1,riskAversion:0.85,decisionSpeed:1.0,creativity:1.3},
  'CURIOUS': {edgeMultiplier:0.95,riskAversion:1.05,decisionSpeed:0.85,creativity:1.1},
  'SYSTEMATIC': {edgeMultiplier:0.95,riskAversion:1.1,decisionSpeed:0.9,creativity:0.7},
  'DECENTRALIZED': {edgeMultiplier:1.1,riskAversion:0.9,decisionSpeed:1.05,creativity:1.0}
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODEL_PERSONALITY_TRAITS;
}

// Make global for browser
window.MODEL_PERSONALITY_TRAITS = MODEL_PERSONALITY_TRAITS;
