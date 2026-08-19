const { createNexusClient, toBiconomySponsoredPaymasterContext: createBiconomyPaymasterContext } = require("@biconomy/abstractjs");
const { http, encodeFunctionData } = require("viem");
const { base } = require("viem/chains");

/**
 * BiconomyNexus handles the Account Abstraction layer.
 * It computes the user's smart account and prepares sponsored UserOperations.
 */
class BiconomyNexus {
    constructor(config) {
        this.config = config;
    }

    /**
     * Sentinel: Strict input validation on payout payload to prevent Type Confusion, crashes, and DoS.
     */
    validatePayoutData(data) {
        if (!data || typeof data !== 'object') throw new Error("Invalid or missing payoutData");
        const { user, taskId, amount, nonce, signature } = data;
        if (!user || typeof user !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(user)) throw new Error("Invalid user address");
        if (!taskId || typeof taskId !== 'string' || taskId.length > 100) throw new Error("Invalid taskId");
        if (amount === undefined || amount === null || !/^\d+$/.test(String(amount)) || BigInt(String(amount)) <= 0n) throw new Error("Invalid amount");
        if (nonce === undefined || nonce === null || !/^\d+$/.test(String(nonce))) throw new Error("Invalid nonce");
        if (!signature || typeof signature !== 'string' || !/^0x[a-fA-F0-9]+$/.test(signature)) throw new Error("Invalid signature format");
    }

    /**
     * Prepares and sends a sponsored payout transaction.
     */
    async executeSponsoredPayout(userSigner, payoutData) {
        try {
            this.validatePayoutData(payoutData);
            const nexusClient = await createNexusClient({
                signer: userSigner,
                chain: base,
                transport: http(this.config.rpcUrl),
                bundlerTransport: http(this.config.bundlerUrl),
                paymaster: {
                    paymasterUrl: this.config.paymasterUrl,
                    paymasterContext: createBiconomyPaymasterContext({
                        mode: "SPONSORED"
                    })
                }
            });

            const smartAccountAddress = await nexusClient.getAccount().getAddress();
            console.log(`[Biconomy] Smart Account Address: ${smartAccountAddress}`);

            const callData = this.encodeClaimReward(payoutData);

            const hash = await nexusClient.sendTransaction({
                calls: [
                    {
                        to: this.config.payoutManagerAddress,
                        data: callData
                    }
                ]
            });

            return { hash, smartAccountAddress };
        } catch (error) {
            console.error("[Biconomy] Nexus Execution Error:", error.message);
            throw error;
        }
    }

    /**
     * Encodes the claimReward call using viem.
     */
    encodeClaimReward(data) {
        this.validatePayoutData(data);
        const abi = [{
            name: 'claimReward',
            type: 'function',
            stateMutability: 'external',
            inputs: [
                { name: 'user', type: 'address' },
                { name: 'taskId', type: 'string' },
                { name: 'amount', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'signature', type: 'bytes' }
            ],
            outputs: []
        }];

        return encodeFunctionData({
            abi,
            functionName: 'claimReward',
            args: [
                data.user,
                data.taskId,
                BigInt(data.amount),
                BigInt(data.nonce),
                data.signature
            ]
        });
    }
}

module.exports = BiconomyNexus;
