const { createNexusClient, createBiconomyPaymasterContext } = require("@biconomy/abstractjs");
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
     * Prepares and sends a sponsored payout transaction.
     */
    async executeSponsoredPayout(userSigner, payoutData) {
        try {
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
