// Reusable headless-Chromium screenshot tool for the visual feedback loop.
//
// Usage:
//   node tools/screenshot.js <url-or-file> <out.png> [width] [height] [fullPage]
//
// Examples:
//   node tools/screenshot.js tools/test-page.html tools/step0.png
//   node tools/screenshot.js http://localhost:8080 tools/desktop.png 1440 900 true
//   node tools/screenshot.js http://localhost:8080 tools/mobile.png 390 844 true
//
// A file path is served via file://. deviceScaleFactor=2 for crisp output.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [, , target, out, w, h, full] = process.argv;
  if (!target || !out) {
    console.error(
      'Usage: node tools/screenshot.js <url-or-file> <out.png> [width 1440] [height 900] [fullPage true|false]'
    );
    process.exit(1);
  }

  let url = target;
  if (!/^https?:\/\//.test(target)) {
    url = 'file://' + path.resolve(target);
  }

  const width = parseInt(w, 10) || 1440;
  const height = parseInt(h, 10) || 900;
  const fullPage = full !== 'false'; // default true

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 600)); // let fonts/layout settle
    await page.screenshot({ path: out, fullPage });
    console.log('OK screenshot saved:', out, `${width}x${height} fullPage=${fullPage}`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('SCREENSHOT_ERROR:', e.message);
  process.exit(1);
});
