const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '../FINAL_PROJECT_REPORT/SCREENSHOTS');
const BASE_URL = 'http://localhost:5000';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting automated screenshot capture using real Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();

  // 1. Login Page
  console.log('Capturing: 01_login_page.png');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_page.png') });

  // 2. Citizen Login & Dashboard
  console.log('Capturing: 02_citizen_dashboard.png');
  // Click Citizen Demo button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const citizenBtn = btns.find(b => b.textContent.includes('Citizen'));
    if (citizenBtn) citizenBtn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_citizen_dashboard.png') });

  // 3. Citizen Report Disaster Page
  console.log('Capturing: 03_citizen_reporting.png');
  await page.goto(`${BASE_URL}/#/citizen/report`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_citizen_reporting.png') });

  // 4. Citizen Tracking Page
  console.log('Capturing: 04_citizen_reports_tracking.png');
  await page.goto(`${BASE_URL}/#/citizen/reports`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_citizen_reports_tracking.png') });

  // 5. Logout & Administrator Login
  console.log('Capturing: 05_admin_dashboard.png');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const officerBtn = btns.find(b => b.textContent.includes('Officer') || b.textContent.includes('Administrator'));
    if (officerBtn) officerBtn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_admin_dashboard.png') });

  // 6. Admin Verification Queue
  console.log('Capturing: 06_admin_verification_queue.png');
  await page.goto(`${BASE_URL}/#/officer/verification`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_admin_verification_queue.png') });

  // 7. Incident Command & Triage
  console.log('Capturing: 07_admin_incidents.png');
  await page.goto(`${BASE_URL}/#/officer/incidents`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_admin_incidents.png') });

  // 8. Interactive Disaster Map
  console.log('Capturing: 08_interactive_disaster_map.png');
  await page.goto(`${BASE_URL}/#/officer/map`, { waitUntil: 'networkidle2' });
  await sleep(2000); // Allow Leaflet tiles and markers to render
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_interactive_disaster_map.png') });

  // 9. Logout & Rescue Team Login
  console.log('Capturing: 09_rescue_team_dashboard.png');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rescueBtn = btns.find(b => b.textContent.includes('Rescue'));
    if (rescueBtn) rescueBtn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_rescue_team_dashboard.png') });

  // 10. Rescue Team Tactical Missions Terminal
  console.log('Capturing: 10_rescue_missions.png');
  await page.goto(`${BASE_URL}/#/responder/missions`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_rescue_missions.png') });

  // 11. Resource & Inventory Management (Officer or Coordinator)
  console.log('Capturing: 11_resource_management.png');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const coordBtn = btns.find(b => b.textContent.includes('Coordinator') || b.textContent.includes('Officer'));
    if (coordBtn) coordBtn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);
  await page.goto(`${BASE_URL}/#/coordinator/inventory`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_resource_management.png') });

  // 12. Officer Audit Logs / Notifications
  console.log('Capturing: 12_notifications_audit.png');
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle2' });
  await sleep(500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const officerBtn = btns.find(b => b.textContent.includes('Officer'));
    if (officerBtn) officerBtn.click();
  });
  await sleep(500);
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);
  await page.goto(`${BASE_URL}/#/officer/audit`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_notifications_audit.png') });

  // 13. Final Operation Status
  console.log('Capturing: 13_final_operation_status.png');
  await page.goto(`${BASE_URL}/#/officer/missions`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_final_operation_status.png') });

  // 14. Command Resources Ledger
  console.log('Capturing: 14_command_resources.png');
  await page.goto(`${BASE_URL}/#/command/resources`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_command_resources.png') });

  // 15. Command Inventory & Logistics Ledger
  console.log('Capturing: 15_command_inventory.png');
  await page.goto(`${BASE_URL}/#/command/inventory`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_command_inventory.png') });

  // 16. Officer Operational Analytics Charts
  console.log('Capturing: 16_officer_analytics.png');
  await page.goto(`${BASE_URL}/#/officer/analytics`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16_officer_analytics.png') });

  await browser.close();
  console.log('All real application screenshots captured successfully!');
}

main().catch(err => {
  console.error('Screenshot capture error:', err);
  process.exit(1);
});

