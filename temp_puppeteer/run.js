const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  console.log("Navigating to http://localhost:8080...");
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  
  console.log("Done.");
  await browser.close();
})();
