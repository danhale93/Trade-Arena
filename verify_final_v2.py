import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to the app
        await page.goto("http://localhost:3001")
        await asyncio.sleep(2)

        # Take screenshot of login screen
        await page.screenshot(path="/home/jules/verification/login_screen.png")

        # Login via Demo to see the dashboard
        await page.click("button.demo-btn")
        await asyncio.sleep(3)

        # Check balance in header
        balance_text = await page.inner_text("#balanceDisplay")
        print(f"Balance after login: {balance_text}")

        # Take screenshot of dashboard
        await page.screenshot(path="/home/jules/verification/dashboard.png")

        # Open Settings
        # Since it's a global function, let's try clicking the settings button if it exists or use evaluate
        # In the app, the settings button is usually in the header or a specific icon.
        # Let's try to find a button that looks like settings.
        try:
            # Try to trigger settings modal
            await page.evaluate("toggleSettingsModal()")
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/settings_modal.png")
        except Exception as e:
            print(f"Could not open settings modal: {e}")

        # Open Task Center to see if it works
        try:
            await page.evaluate("togglePanel('ghTaskPanel', document.getElementById('ghTaskBtn'))")
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/task_center.png")
        except Exception as e:
            print(f"Could not open Task Center: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
