/* eslint-disable no-console */

const fs = require('fs');
const puppeteer = require('puppeteer');
const pages = require('./pages.json');

const OUTPUT_JSON = 'src/routes/showcase/generated-pages.json';
async function captureMultipleScreenshots() {
  if (!fs.existsSync('public/showcases')) {
    fs.mkdirSync('public/showcases');
  }

  let browser = null;
  const output = [];
  try {
    // launch headless Chromium browser
    browser = await puppeteer.launch({
      headless: true,
    });
    const incognito = await browser.createIncognitoBrowserContext();

    let existingJson = [];
    try {
      const data = fs.readFileSync(OUTPUT_JSON, 'utf8');
      existingJson = JSON.parse(data);
    } catch (e) {
      // ignore
    }

    for (const pageData of pages) {
      let page;
      try {
        page = await incognito.newPage();

        // set viewport width and height
        await page.setViewport({
          width: 1440,
          height: 980,
        });

        const href = pageData.href;
        const existing = existingJson.find((item) => item.href === href);
        if (existing) {
          console.log('Skipping page', href);

          output.push({
            ...existing,
            ...pageData,
          });
          continue;
        }
        console.log('Opening page', href);
        await page.goto(href);

        const title = await page.title();
        const html = await page.$('html');
        const hasContainer = await html.evaluate((node) => node.hasAttribute('q:container'));
        if (!hasContainer) {
          console.warn('❌ Not Qwik Site', href);
          continue;
        }
        const filename = href
          .replace('https://', '')
          .replace('/', '_')
          .replace('.', '_')
          .replace('.', '_')
          .toLowerCase();

        const path = `public/showcases/${filename}.webp`;
        const [pagespeedOutput, _] = await Promise.all([
          getPagespeedData(href),
          page.screenshot({
            path: path,
            type: 'webp',
            quality: 50,
          }),
        ]);
        const fcpDisplay =
          pagespeedOutput.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue;
        const fcpScore =
          pagespeedOutput?.lighthouseResult?.audits?.['first-contentful-paint']?.score;

        const lcpDisplay =
          pagespeedOutput?.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue;
        const lcpScore =
          pagespeedOutput?.lighthouseResult?.audits?.['largest-contentful-paint']?.score;

        const ttiDisplay = pagespeedOutput?.lighthouseResult?.audits?.interactive?.displayValue;
        const ttiScore = pagespeedOutput?.lighthouseResult?.audits?.interactive?.score;

        const ttiTime = pagespeedOutput?.lighthouseResult?.audits?.interactive?.numericValue;

        const score = pagespeedOutput?.lighthouseResult?.categories?.performance?.score;
        const perf = {
          score,
          fcpDisplay,
          fcpScore,
          lcpDisplay,
          lcpScore,
          ttiDisplay,
          ttiScore,
          ttiTime,
        };
        output.push({
          title,
          imgSrc: `/showcases/${filename}.webp`,
          perf,
          ...pageData,
        });
        console.log(`✅ ${title} - (${href})`);
      } catch (err) {
        console.error(err);
      } finally {
        if (page) {
          await page.close();
        }
      }
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log(`\n🎉 ${pages.length} screenshots captured.`);
  }
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, undefined, 2));
}

async function getPagespeedData(url) {
  const { default: fetch } = await import('node-fetch');
  const requestURL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&key=AIzaSyApBC9gblaCzWrtEBgHnZkd_B37OF49BfM&category=PERFORMANCE&strategy=MOBILE`;
  return await fetch(requestURL, {
    headers: {
      referer: 'https://www.builder.io/',
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res.json();
  });
}
captureMultipleScreenshots();
