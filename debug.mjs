import { chromium } from 'playwright';

(async () => {
  console.log("Starting server...");
  const { exec } = await import('child_process');
  
  const server = exec('npm run dev', { cwd: 'c:/Users/ujin1/Desktop/MIGO/MigoApp' });
  
  // Wait a bit for Vite to start
  await new Promise(r => setTimeout(r, 4000));

  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`PAGE EXCEPTION: ${err.message}`);
  });

  try {
    await page.goto('http://localhost:5173/');
    console.log("Navigated to /");
    
    await new Promise(r => setTimeout(r, 3000));
    
    // We can also print out the HTML to see what's rendered
    const html = await page.content();
    console.log("HTML length:", html.length);
    if (html.length < 1000) {
      console.log("HTML looks suspiciously empty.");
    }
  } catch (e) {
    console.log("Navigation failed:", e);
  }

  await browser.close();
  server.kill();
  process.exit(0);
})();
