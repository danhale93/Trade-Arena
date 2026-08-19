const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Navigating to http://localhost:3001...");
    await page.goto('http://localhost:3001');

    // 1. Verify Login Card
    console.log("Verifying Login Card...");
    const mmBtn = await page.locator('button:has-text("METAMASK (RECOMMENDED)")');
    const systemOptionsBtn = await page.locator('button:has-text("System Options")');

    if (await mmBtn.isVisible()) {
      console.log("✅ MetaMask button found.");
    } else {
      console.log("❌ MetaMask button NOT found.");
    }

    if (await systemOptionsBtn.isVisible()) {
      console.log("✅ System Options button found.");
      await systemOptionsBtn.click();
      const cbBtn = await page.locator('button:has-text("COINBASE")');
      if (await cbBtn.isVisible()) {
        console.log("✅ Coinbase button found in System Options.");
      }
    }

    await page.screenshot({ path: 'screenshot_login.png' });

    // 2. Login to access other panels
    console.log("Logging in via Demo...");
    await page.evaluate(() => {
        if (window.loginDemo) window.loginDemo();
    });
    await page.waitForTimeout(2000);

    // 3. Verify Settings Modal
    console.log("Verifying Settings Modal...");
    await page.evaluate(() => {
        if (window.toggleSettingsModal) window.toggleSettingsModal();
    });
    await page.waitForTimeout(1000);

    const getKeyLink = await page.locator('a:has-text("Get Key →")').first();
    const copyBtn = await page.locator('button:has-text("COPY")').first();

    if (await getKeyLink.isVisible()) {
      console.log("✅ Get Key link found in Settings.");
    }
    if (await copyBtn.isVisible()) {
      console.log("✅ COPY button found in Settings.");
    }

    await page.screenshot({ path: 'screenshot_settings.png' });

    await page.evaluate(() => {
        if (window.toggleSettingsModal) window.toggleSettingsModal();
    });
    await page.waitForTimeout(500);

    // 4. Verify Task Center
    console.log("Verifying Task Center...");
    await page.evaluate(() => {
        if (window.togglePanel) window.togglePanel('task');
    });
    await page.waitForTimeout(1000);

    const faucetBtn = await page.locator('button:has-text("CLAIM TRADING CAPITAL")');
    if (await faucetBtn.isVisible()) {
      console.log("✅ Faucet button found in Task Center.");
    } else {
      console.log("❌ Faucet button NOT found in Task Center.");
    }

    await page.screenshot({ path: 'screenshot_tasks.png' });

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await browser.close();
    process.exit();
  }
})();
