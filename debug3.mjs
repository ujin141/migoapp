import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR]: ${msg.text()}`);
    } else {
      console.log(`[LOG]: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE EXCEPTION]: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:8082/');
    console.log("Navigated to /");
    
    // Wait for the app to initialize
    await new Promise(r => setTimeout(r, 6000));
    
    const html = await page.content();
    console.log("HTML length:", html.length);
  } catch (e) {
    console.log("Navigation error:", e);
  }

  await browser.close();
  process.exit(0);
})();
