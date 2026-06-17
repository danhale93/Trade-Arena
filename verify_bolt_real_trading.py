import asyncio
from playwright.async_api import async_playwright
import os

async def run_verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Mock window.ethereum for MetaMask
        await page.add_init_script("""
            window._mockBalance = "0";
            window.ethereum = {
                isMetaMask: true,
                request: async (request) => {
                    if (request.method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
                    if (request.method === 'eth_chainId') return '0x2105';
                    if (request.method === 'wallet_switchEthereumChain') return null;
                    return null;
                },
                on: () => {}
            };

            // Ethers mock
            window.ethers = {
                providers: {
                    Web3Provider: function(eth) {
                        return {
                            getNetwork: async () => ({ chainId: 8453 }),
                            getBalance: async (addr) => ({
                                _isBigNumber: true,
                                toString: () => window._mockBalance,
                                mul: (n) => ({ toString: () => "0", _isBigNumber: true }),
                                div: (n) => ({ toString: () => "0", _isBigNumber: true }),
                                add: (n) => ({ toString: () => "0", _isBigNumber: true }),
                                sub: (n) => ({ toString: () => "0", _isBigNumber: true }),
                                eq: (n) => true,
                                lt: (n) => false,
                                gt: (n) => false
                            }),
                            getFeeData: async () => ({
                                gasPrice: { mul: () => ({ toString: () => "0" }) },
                                lastBaseFeePerGas: { mul: () => ({ toString: () => "0" }) },
                                maxPriorityFeePerGas: { mul: () => ({ toString: () => "0" }) },
                                maxFeePerGas: {
                                    mul: (n) => ({
                                        toString: () => "500000000", // 0.5 gwei
                                        mul: (m) => ({ toString: () => "100000000000000" }) // some wei
                                    }),
                                    toString: () => "500000000"
                                }
                            })
                        };
                    }
                },
                utils: {
                    formatEther: (val) => {
                        if (!val) return "0";
                        const s = typeof val === 'string' ? val : val.toString();
                        return (parseFloat(s) / 1e18).toString();
                    },
                    formatUnits: (val, unit) => "0.5",
                    parseEther: (val) => ({ toString: () => (parseFloat(val) * 1e18).toString() })
                }
            };
        """)

        # Go to the local file
        path = os.path.abspath("index.html")
        await page.goto(f"file://{path}")

        print("--- Testing Bolt Optimizations & Earn-to-Trade ---")

        # 1. Verify Deduplication Map exists
        has_dedup = await page.evaluate("typeof window.inFlightRequests !== 'undefined'")
        print(f"Deduplication Map Present: {has_dedup}")

        # 2. Login via MetaMask
        await page.evaluate("loginMetaMask()")
        await page.wait_for_timeout(2000)

        balance = await page.evaluate("window.balance")
        print(f"Post-Login Balance: ${balance}")

        # 3. Claim Faucet
        await page.evaluate("window.claimFaucet()")
        balance_after = await page.evaluate("window.balance")
        virtual_credits = await page.evaluate("window.walletState.virtualCredits")
        print(f"Post-Faucet Balance: ${balance_after}")
        print(f"Virtual Credits: ${virtual_credits}")

        # 4. Verify Ledger/Audit Entry
        audit_logs = await page.evaluate("window.auditHistory")
        has_faucet_log = any("Faucet claimed" in log['msg'] for log in audit_logs)
        print(f"Audit Ledger has Faucet Entry: {has_faucet_log}")

        # 5. Verify Target Display
        target_text = await page.locator("#ghTargetBal").text_content()
        print(f"Target Display Text: {target_text}")
        is_ready = "Ready to Trade" in target_text
        print(f"Target Display indicates Ready: {is_ready}")

        # 6. Verify Real Trading Enablement
        await page.evaluate("""
            window._mockBalance = (0.01 * 1e18).toString();
            // We need to make sure walletState is updated with the new mock balance
            window.getWalletBalance();
        """)
        await page.wait_for_timeout(500)

        validation = await page.evaluate("window.validateSufficientBalance(10)")
        has_enough = validation.get('hasEnoughBalance') if isinstance(validation, dict) else False
        print(f"Validation for $10 trade: {has_enough}")
        if not has_enough:
            print(f"DEBUG Validation: {validation}")

        # 7. Check if Bot Auto-Earning triggers
        await page.evaluate("""
            window.balance = 0;
            window.updateGlobalBalance();
            window.walletState.virtualCredits = 0;
            window._mockBalance = "0";
            if(window.taskState) window.taskState.faucetClaimed = false;
            const testBot = { id: 99, auto: true, active: true, balance: 0, spinning: false, cooling: false };
            window.bots = [testBot];
            window.spinBot(99);
        """)

        await page.wait_for_timeout(1000)
        balance_auto = await page.evaluate("window.balance")
        print(f"Balance after Auto-Bot Trigger: ${balance_auto}")

        success = has_dedup and balance_after == 50 and has_faucet_log and is_ready and has_enough and balance_auto == 50
        print(f"TEST SUCCESS: {success}")

        await browser.close()
        if not success:
            exit(1)

if __name__ == "__main__":
    asyncio.run(run_verify())
