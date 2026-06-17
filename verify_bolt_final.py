import asyncio
from playwright.async_api import async_playwright
import os

async def run_verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Mock window.ethereum and fetch
        await page.add_init_script("""
            window.ethereum = {
                isMetaMask: true,
                request: async (request) => {
                    if (request.method === 'eth_requestAccounts') return ['0x1234567890123456789012345678901234567890'];
                    return null;
                },
                on: () => {}
            };

            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                if (args[0].includes('coingecko')) {
                    return { json: async () => ({ ethereum: { usd: 3000 } }) };
                }
                return { json: async () => ([]) };
            };

            window.ethers = {
                providers: {
                    Web3Provider: function() {
                        return {
                            getNetwork: async () => ({ chainId: 8453 }),
                            getBalance: async () => ({ toString: () => "0", _isBigNumber: true }),
                            getFeeData: async () => ({
                                maxFeePerGas: { mul: () => ({ toString: () => "0", mul: () => ({ toString: () => "0" }) }) }
                            })
                        };
                    }
                },
                utils: {
                    formatEther: (val) => "0",
                    formatUnits: (val, unit) => "0",
                    parseEther: (val) => ({ toString: () => "0" })
                }
            };
        """)

        path = os.path.abspath("index.html")
        await page.goto(f"file://{path}")

        # 1. Check Bolt Map
        has_dedup = await page.evaluate("typeof window.inFlightRequests !== 'undefined'")

        # 2. Login
        await page.evaluate("loginMetaMask()")
        await page.wait_for_timeout(500)

        # 3. Faucet
        await page.evaluate("window.claimFaucet()")
        balance = await page.evaluate("window.balance")

        # 4. Audit
        audit_logs = await page.evaluate("window.auditHistory")
        has_faucet_log = any("Faucet claimed" in log['msg'] for log in audit_logs)

        # 5. Target Display
        target_text = await page.locator("#ghTargetBal").text_content()

        print(f"Deduplication Map: {has_dedup}")
        print(f"Balance after Faucet: ${balance}")
        print(f"Audit Log present: {has_faucet_log}")
        print(f"Target Text: {target_text}")

        success = has_dedup and balance == 50 and has_faucet_log and "Ready" in target_text
        print(f"TEST SUCCESS: {success}")

        await browser.close()
        if not success:
            exit(1)

if __name__ == "__main__":
    asyncio.run(run_verify())
