import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click start button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const startBtn = buttons.find(b => b.textContent.includes('Start'));
    if (startBtn) startBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
