import asyncio
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Using npx serve path usually http://localhost:8080 or file path
        # For simplicity, we assume we are running a server or opening the file
        # But since I can't easily start a server and keep it running for the sub-process,
        # I will use the file:// path
        import os
        path = "file://" + os.path.abspath("index.html")
        page.goto(path)

        # Take screenshot of connect screen
        page.screenshot(path="connect_screen.png")
        print("Screenshot of connect screen saved.")

        # Click demo button
        page.click("button.demo-btn")
        page.wait_for_timeout(2000)

        # Take screenshot of main app
        page.screenshot(path="main_app.png")
        print("Screenshot of main app saved.")

        # Toggle Fleet View
        page.click("#fleetViewBtn")
        page.wait_for_timeout(1000)
        page.screenshot(path="fleet_view.png")
        print("Screenshot of fleet view saved.")

        # Toggle Voice Agent
        page.click("#voiceAgentBtn")
        page.wait_for_timeout(1000)
        page.screenshot(path="voice_agent.png")
        print("Screenshot of voice agent saved.")

        # Open Quant Report
        page.click("#quantHd")
        page.wait_for_timeout(1000)
        page.screenshot(path="quant_report.png")
        print("Screenshot of quant report saved.")

        browser.close()

if __name__ == "__main__":
    run()
