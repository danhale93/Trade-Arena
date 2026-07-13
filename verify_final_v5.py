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

        # Login via Demo
        await page.click("button.demo-btn")
        await asyncio.sleep(3)

        # Take screenshot of dashboard
        await page.screenshot(path="/home/jules/verification/dashboard_v5.png")

        # Directly manipulate modal visibility since click might be failing
        await page.evaluate("document.getElementById('settingsModal').style.display = 'flex'")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/settings_modal_v5.png")

        # Open Connection Dashboard panel
        await page.evaluate("togglePanel('ghConnPanel', document.getElementById('ghConnBtn'))")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/connection_dashboard_v5.png")

        # Open Task Center
        await page.evaluate("togglePanel('ghTaskPanel', document.getElementById('ghTaskBtn'))")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/task_center_v5.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
