import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3001")
        await asyncio.sleep(2)

        await page.click("button.demo-btn")
        await asyncio.sleep(3)

        # List all IDs to debug
        ids = await page.evaluate("Array.from(document.querySelectorAll('[id]')).map(el => el.id)")
        print(f"Found IDs: {ids}")

        if 'settingsModal' in ids:
            print("settingsModal found in DOM")
            await page.evaluate("document.getElementById('settingsModal').style.display = 'flex'")
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/settings_modal_v6.png")
        else:
            print("settingsModal NOT found in DOM")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
