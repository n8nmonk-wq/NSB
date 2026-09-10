const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const fileUrl = (name) => pathToFileURL(path.join(root, name)).href;

async function countTextLines(locator) {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 1 && rect.height > 1);
    const lines = new Set(rects.map((rect) => Math.round(rect.top)));
    return lines.size;
  });
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert.ok(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${label} overflows horizontally: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`,
  );
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(fileUrl("index.html"));
  const ctaTitle = page.locator(".section", { hasText: "Connect" }).last().locator(".section-title");
  await assert.equal(await ctaTitle.count(), 1, "home page should expose one final CTA heading");
  assert.ok(
    (await countTextLines(ctaTitle)) <= 2,
    "home CTA heading should stay balanced at desktop width",
  );
  await assertNoHorizontalOverflow(page, "home desktop");

  for (const name of ["index.html", "research-hub.html", "industry.html", "academic-policy.html"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fileUrl(name));
    await assertNoHorizontalOverflow(page, `${name} mobile`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
