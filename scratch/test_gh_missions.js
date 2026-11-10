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
  await new Promise(r => setTimeout(r, 1500));

  // Navigate to Tactical Missions
  await page.goto('https://sushanthmullangi46-sudo.github.io/dbms-project/#/officer/missions', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  console.log('On Missions page. Looking for Deploy Mission button...');
  const deployClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const deployBtn = btns.find(b => b.textContent.includes('Deploy Mission'));
    if (deployBtn) {
      deployBtn.click();
      return true;
    }
    return false;
  });
  console.log('Deploy button clicked:', deployClicked);
  await new Promise(r => setTimeout(r, 1000));

  // Check if modal or blue screen
  const pageState = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const hasModal = document.body.innerHTML.includes('Deploy Tactical Rescue Mission');
    const hasError = bodyText.includes('Something went wrong') || bodyText.length < 50;
    return { hasModal, hasError, textLen: bodyText.length, preview: bodyText.substring(0, 200) };
  });

  console.log('Page state after Deploy Mission click:', pageState);
  await browser.close();
})();
