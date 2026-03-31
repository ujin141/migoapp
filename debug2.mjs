import { chromium } from 'playwright';

(async () => {
  console.log("Starting server...");
  const { exec } = await import('child_process');
  const server = exec('npm run dev', { cwd: 'c:/Users/ujin1/Desktop/MIGO/MigoApp' });
  
  let attempts = 0;
  let browser = null;
  while (attempts < 10) {
    try {
      await new Promise(r => setTimeout(r, 3000));
      console.log("Checking if server is up...");
      const res = await fetch('http://localhost:5173/');
      if (res.ok) break;
    } catch(e) {
      attempts++;
    }
  }

  console.log("Launching browser...");
  browser = await chromium.launch();
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
    await page.goto('http://localhost:5173/');
    console.log("Navigated to /");
    
    // Wait for the app to initialize
    await new Promise(r => setTimeout(r, 5000));
    
    const html = await page.content();
    console.log("HTML length:", html.length);
  } catch (e) {
    console.log("Navigation error:", e);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
