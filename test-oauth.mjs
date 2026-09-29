import puppeteer from 'puppeteer';

const PORT = 8081;
const BASE = `http://127.0.0.1:${PORT}`;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTest(name, fn) {
  console.log(`\n--- ${name} ---`);
  const browser = await puppeteer.launch({ headless: true });
  try {
    await fn(browser);
  } catch (err) {
    console.log(`  ❌ FAIL: ${err.message}`);
    failed++;
  } finally {
    await browser.close();
  }
  // Small delay between tests to avoid port contention
  await new Promise(r => setTimeout(r, 1000));
}

// Helper to reliably navigate without ERR_ABORTED from Vite
async function navigateViaJS(page, targetUrl) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 5000 }).catch(() => {});
  await page.evaluate((url) => { window.location.href = url; }, targetUrl);
  await new Promise(r => setTimeout(r, 4000)); // wait for client-side render and effects
}

// Run all tests
(async () => {
  console.log('========================================');
  console.log('  Deriv OAuth 2.0 Integration Tests');
  console.log('========================================');

  // Test 1: OAuth token extraction with VRTC account
  await runTest('Test 1: OAuth token extraction from URL params', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding?acct1=CR123&token1=real_token&acct2=VRTC456&token2=virtual_test_token`);

    const tokenValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="password"]');
      return input ? input.value : null;
    });
    assert(tokenValue === 'virtual_test_token', `Virtual token extracted correctly (got: "${tokenValue}")`);

    const cleanUrl = page.url();
    assert(!cleanUrl.includes('token'), `URL was cleaned up (url: "${cleanUrl}")`);
  });

  // Test 2: Fallback to token1 when no VRTC account
  await runTest('Test 2: Fallback to token1 when no VRTC account', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding?acct1=CR999&token1=fallback_token`);

    const tokenValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="password"]');
      return input ? input.value : null;
    });
    assert(tokenValue === 'fallback_token', `Falls back to token1 when no VRTC found (got: "${tokenValue}")`);
  });

  // Test 3: Page renders expected UI
  await runTest('Test 3: Onboarding page renders expected UI elements', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding`);

    const body = await page.evaluate(() => document.body.innerText.toLowerCase());
    assert(body.includes('connect deriv'), 'Page shows "Connect Deriv" heading');
    assert(body.includes('oauth'), 'Page shows OAuth button');
    assert(body.includes('connect'), 'Page shows Connect button');
  });

  // Test 4: No token params means empty input
  await runTest('Test 4: No token params means empty input', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding`);

    const tokenValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="password"]');
      return input ? input.value : null;
    });
    assert(tokenValue === '', `No token in input when no URL params (got: "${tokenValue}")`);
  });

  // Test 5: Token extraction from hash params
  await runTest('Test 5: Token extraction from hash params', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding#acct1=CR111&token1=hash_real&acct2=VRTC222&token2=hash_virtual_token`);

    const tokenValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="password"]');
      return input ? input.value : null;
    });
    assert(tokenValue === 'hash_virtual_token', `Virtual token extracted from hash params (got: "${tokenValue}")`);
  });

  // Test 6: Verify the DERIV_APP_ID is numeric 
  await runTest('Test 6: OAuth URL uses numeric app_id', async (browser) => {
    const page = await browser.newPage();
    await navigateViaJS(page, `${BASE}/onboarding`);

    // The app_id should be numeric (1089)
    const pageContent = await page.content();
    assert(!pageContent.includes('34vucP3spIrQL0wb9ur1J'), 'Page does NOT contain invalid non-numeric app_id');
  });

  console.log('\n========================================');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
})();
