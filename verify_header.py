import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to app
        await page.goto("http://localhost:8080")

        # Click Google Login (it will trigger fallback in this environment)
        await page.click('button:has-text("Sign in with Google")')

        # Wait for app to load
        await page.wait_for_selector("#mainApp", state="visible")

        # Take screenshot of the header
        header = page.locator(".global-header")
        await header.screenshot(path="header_updated.png")

        # Check text
        name = await page.inner_text("#ghName")
        badge = await page.inner_text("#ghBadge")
        print(f"Header Name: {name}")
        print(f"Header Badge: {badge}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
