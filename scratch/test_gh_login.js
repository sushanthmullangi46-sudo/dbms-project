const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));

  await page.goto('https://sushanthmullangi46-sudo.github.io/dbms-project/#/login', { waitUntil: 'networkidle2' });
  
  // Click Officer
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Officer'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click submit
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('After login URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body preview after login:\n', bodyText.substring(0, 500));
  await browser.close();
})();

