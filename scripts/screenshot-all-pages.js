const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  email: 'Sohaib.ali@potomac.com',
  password: 'Potomac1234',
  screenshotDir: './screenshots',
  viewportWidth: 1920,
  viewportHeight: 1080,
  timeout: 30000,
};

// Pages to screenshot
const PAGES = [
  { path: '/login', name: '01-login', requiresAuth: false },
  { path: '/register', name: '02-register', requiresAuth: false },
  { path: '/forgot-password', name: '03-forgot-password', requiresAuth: false },
  { path: '/developer', name: '04-developer', requiresAuth: false },
  { path: '/non-apple-developer', name: '05-non-apple-developer', requiresAuth: false },
  { path: '/dashboard', name: '06-dashboard', requiresAuth: true },
  { path: '/chat', name: '07-chat', requiresAuth: true },
  { path: '/content', name: '08-content', requiresAuth: true },
  { path: '/afl', name: '09-afl', requiresAuth: true },
  { path: '/autopilot', name: '10-autopilot', requiresAuth: true },
  { path: '/backtest', name: '11-backtest', requiresAuth: true },
  { path: '/knowledge', name: '12-knowledge', requiresAuth: true },
  { path: '/researcher', name: '13-researcher', requiresAuth: true },
  { path: '/reverse-engineer', name: '14-reverse-engineer', requiresAuth: true },
  { path: '/settings', name: '15-settings', requiresAuth: true },
  { path: '/skills', name: '16-skills', requiresAuth: true },
  { path: '/delta-ife', name: '17-delta-ife', requiresAuth: true },
  { path: '/deck-generator', name: '18-deck-generator', requiresAuth: true },
];

// Utility functions
function createScreenshotDir() {
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
}

function getScreenshotPath(filename) {
  return path.join(CONFIG.screenshotDir, `${filename}.png`);
}

async function takeScreenshot(page, filename) {
  const filepath = getScreenshotPath(filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✓ Screenshot saved: ${filepath}`);
}

async function login(page) {
  console.log('\n📝 Attempting to log in...');
  try {
    // Navigate to login page
    await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in credentials
    await page.type('input[type="email"]', CONFIG.email);
    await page.type('input[type="password"]', CONFIG.password);

    // Click login button
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
    } else {
      // Try alternative selector
      await page.click('button:has-text("Sign in"):visible');
    }

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.timeout });
    console.log('✓ Successfully logged in');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    return false;
  }
}

async function navigateAndCapture(page, pageConfig) {
  try {
    const url = `${CONFIG.baseUrl}${pageConfig.path}`;
    console.log(`\n📸 Navigating to: ${url}`);

    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });

    if (!response.ok() && response.status() !== 304) {
      console.warn(`⚠ Response status: ${response.status()}`);
    }

    // Wait a bit for any animations or dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    await takeScreenshot(page, pageConfig.name);
    return true;
  } catch (error) {
    console.error(`✗ Failed to capture ${pageConfig.name}:`, error.message);
    return false;
  }
}

async function main() {
  let browser;
  let successCount = 0;
  let failureCount = 0;

  try {
    // Create screenshot directory
    createScreenshotDir();
    console.log(`📁 Screenshots will be saved to: ${path.resolve(CONFIG.screenshotDir)}`);

    // Launch browser
    console.log('\n🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-resources',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: CONFIG.viewportWidth,
      height: CONFIG.viewportHeight,
    });

    // Set user agent to be more realistic
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Enable console messages for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Console Error: ${msg.text()}`);
      }
    });

    page.on('error', (err) => {
      console.log(`🔴 Page Error: ${err.message}`);
    });

    // Take login screenshot
    const loginPage = PAGES.find((p) => !p.requiresAuth);
    if (loginPage) {
      await navigateAndCapture(page, loginPage);
      successCount++;
    }

    // Log in
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.error('❌ Failed to login. Cannot proceed with protected pages.');
    } else {
      // Take screenshots of all protected pages
      for (const pageConfig of PAGES.filter((p) => p.requiresAuth)) {
        const success = await navigateAndCapture(page, pageConfig);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        // Small delay between page captures
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCREENSHOT CAPTURE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failureCount}`);
    console.log(`📁 Location: ${path.resolve(CONFIG.screenshotDir)}`);
    console.log('='.repeat(60));

    await browser.close();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
