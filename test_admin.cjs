const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('requestfailed', request => console.log('FAILED_REQUEST:', request.url(), request.failure()?.errorText));
  
  await page.goto('https://www.migo-go.com/admin', { waitUntil: 'networkidle' });
  await page.fill('input[type="password"]', '2dhfl2');
  await page.keyboard.press('Enter');
  
  // Wait for dashboard to load
  await page.waitForTimeout(2000);
  
  // Click user management
  await page.click('button:has-text("유저 관리")');
  await page.waitForTimeout(3000);
  
  const content = await page.textContent('body');
  console.log('Zero Users Text Exists:', content.includes('유저가 없습') || content.includes('0명 등록'));
  console.log('Any user names found?', content.includes('송우진') || content.includes('박유나'));
  
  await browser.close();
})();
