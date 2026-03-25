const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://potomacdeveloper.vercel.app',
  email: 'johnlee2224321@gmail.com',
  password: 'Aa)cm9z:&U8i4#+',
  screenshotDir: './screenshots/rc2-test',
  viewportWidth: 1920,
  viewportHeight: 1080,
  timeout: 30000,
};

// Pages to test and screenshot
const PAGES = [
  { path: '/login', name: '01-login', requiresAuth: false },
  { path: '/dashboard', name: '02-dashboard', requiresAuth: true },
  { path: '/chat', name: '03-chat', requiresAuth: true },
  { path: '/content', name: '04-content', requiresAuth: true },
  { path: '/afl', name: '05-afl', requiresAuth: true },
  { path: '/backtest', name: '06-backtest', requiresAuth: true },
  { path: '/knowledge', name: '07-knowledge', requiresAuth: true },
  { path: '/researcher', name: '08-researcher', requiresAuth: true },
  { path: '/reverse-engineer', name: '09-reverse-engineer', requiresAuth: true },
  { path: '/delta-ife', name: '10-delta-ife', requiresAuth: true },
  { path: '/deck-generator', name: '11-deck-generator', requiresAuth: true },
  { path: '/skills', name: '12-skills', requiresAuth: true },
  { path: '/settings', name: '13-settings', requiresAuth: true },
];

// Test prompts for chat
const TEST_PROMPTS = [
  "What are the key factors driving Apple's stock price in Q1 2026?",
  "Compare Microsoft and Google's AI strategies and their market implications.",
  "Analyze the semiconductor industry outlook for the next 6 months.",
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
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 });

    // Fill in credentials
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[placeholder*="password" i]');
    
    if (emailInput) {
      await emailInput.click();
      await emailInput.type(CONFIG.email, { delay: 50 });
    }
    
    if (passwordInput) {
      await passwordInput.click();
      await passwordInput.type(CONFIG.password, { delay: 50 });
    }

    // Take screenshot of filled login form
    await takeScreenshot(page, '01b-login-filled');

    // Click login button
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
    }

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.timeout });
    console.log('✓ Successfully logged in');
    
    // Take screenshot of post-login state
    await takeScreenshot(page, '01c-post-login');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.message);
    // Take screenshot of error state
    await takeScreenshot(page, '01d-login-error');
    return false;
  }
}

async function testChatFeatures(page) {
  console.log('\n💬 Testing Chat Features...');
  try {
    await page.goto(`${CONFIG.baseUrl}/chat`, { waitUntil: 'networkidle2', timeout: CONFIG.timeout });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(page, '03a-chat-initial');

    // Find chat input
    const chatInput = await page.$('textarea, input[type="text"][placeholder*="message" i], input[type="text"][placeholder*="ask" i]');
    
    if (chatInput) {
      for (let i = 0; i < TEST_PROMPTS.length; i++) {
        console.log(`  Testing prompt ${i + 1}: "${TEST_PROMPTS[i].substring(0, 50)}..."`);
        
        // Clear and type new prompt
        await chatInput.click({ clickCount: 3 });
        await chatInput.type(TEST_PROMPTS[i], { delay: 20 });
        
        // Take screenshot with prompt
        await takeScreenshot(page, `03b-chat-prompt-${i + 1}`);
        
        // Press Enter or click send
        await chatInput.press('Enter');
        
        // Wait for response to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot of response
        await takeScreenshot(page, `03c-chat-response-${i + 1}`);
        
        // Wait for more response
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot of full response
        await takeScreenshot(page, `03d-chat-full-response-${i + 1}`);
      }
    } else {
      console.log('  ⚠ Could not find chat input');
    }
  } catch (error) {
    console.error('✗ Chat testing failed:', error.message);
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

    // Wait for any animations or dynamic content
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
    console.log(`🌐 Testing site: ${CONFIG.baseUrl}`);

    // Launch browser
    console.log('\n🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: CONFIG.viewportWidth,
      height: CONFIG.viewportHeight,
    });

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Enable console messages for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      console.log(`🔴 Page Error: ${err.message}`);
    });

    // Take login page screenshot
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
      // Test chat features with prompts
      await testChatFeatures(page);

      // Take screenshots of all protected pages
      for (const pageConfig of PAGES.filter((p) => p.requiresAuth && p.path !== '/chat')) {
        const success = await navigateAndCapture(page, pageConfig);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        // Small delay between page captures
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 RC2 FEATURE TEST SUMMARY');
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