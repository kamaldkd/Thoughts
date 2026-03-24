import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to http://localhost:8080...");
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  
  console.log("Done.");
  await browser.close();
})();
