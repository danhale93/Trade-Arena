import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000")
        await asyncio.sleep(2)

        # Open Settings modal
        await page.evaluate("toggleSettingsModal()")
        await asyncio.sleep(1)

        await page.screenshot(path="/home/jules/verification/settings_keys.png")
        print("Screenshot saved to /home/jules/verification/settings_keys.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
