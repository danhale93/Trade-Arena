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
        await page.screenshot(path="/home/jules/verification/login_screen_final.png")

        # Login via Demo
        await page.click("button.demo-btn")
        await asyncio.sleep(3)

        # Check balance in header
        balance_text = await page.inner_text("#ghBalance")
        print(f"Balance after login: {balance_text}")

        # Take screenshot of dashboard
        await page.screenshot(path="/home/jules/verification/dashboard_final.png")

        # Open Settings by clicking the button
        try:
            await page.click("#ghSettingsBtn")
            await asyncio.sleep(2)
            await page.screenshot(path="/home/jules/verification/settings_modal_final.png")

            # Check for "Get Key" links in settings
            links = await page.query_selector_all("a")
            for link in links:
                text = await link.inner_text()
                href = await link.get_attribute("href")
                if "Get Key" in text:
                    print(f"Found link: {text} -> {href}")

        except Exception as e:
            print(f"Could not open settings modal: {e}")

        # Open Task Center
        try:
            await page.click("#ghTaskBtn")
            await asyncio.sleep(2)
            await page.screenshot(path="/home/jules/verification/task_center_final.png")
        except Exception as e:
            print(f"Could not open Task Center: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
