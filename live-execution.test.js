const assert = require('assert');
const execution = require('./public/live-execution.js');

const transitions = [];
const machine = new execution.ExecutionStateMachine((state) => transitions.push(state));
machine.move('PREPARING');
machine.move('QUOTING');
machine.move('PREFLIGHT');
machine.move('SIGNING');
machine.move('SUBMITTED');
machine.move('CONFIRMED');
assert.deepStrictEqual(transitions, ['PREPARING', 'QUOTING', 'PREFLIGHT', 'SIGNING', 'SUBMITTED', 'CONFIRMED']);
assert.throws(() => machine.move('FAILED'), /Invalid execution transition/);
assert.strictEqual(execution.isNative('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'), true);
assert.strictEqual(execution.isNative('0x4200000000000000000000000000000000000006'), false);
assert.strictEqual(execution.tokenFor('USDC').decimals, 6);
assert.strictEqual(execution.tokenFor('WETH').decimals, 18);
assert.strictEqual(execution.tokenFor('ETH').address, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
assert.throws(() => execution.tokenFor('DOGE'), /Unsupported token/);
assert.strictEqual(execution.allowanceSpender({ issues: { allowance: { spender: '0xspender' } } }), '0xspender');
assert.strictEqual(execution.allowanceSpender({ allowanceTarget: '0xfallback' }), '0xfallback');
assert.deepStrictEqual(execution.getTransaction({ transaction: { to: '0xto', data: '0xdata', value: '0x0', gas: '0x1' } }), {
  to: '0xto', data: '0xdata', value: '0x0', gasLimit: '0x1'
});
console.log('live-execution tests passed');
