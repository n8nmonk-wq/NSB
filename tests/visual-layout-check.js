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

async function assertAbsent(page, selector, label) {
  await assert.equal(await page.locator(selector).count(), 0, label);
}

async function box(locator) {
  const rect = await locator.boundingBox();
  assert.ok(rect, "expected element to have a layout box");
  return rect;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(fileUrl("index.html"));
  const ctaTitle = page.locator(".section", { hasText: "Connect" }).last().locator(".section-title");
  await assert.equal(await ctaTitle.count(), 1, "home page should expose one final CTA heading");
  assert.ok(
    (await countTextLines(ctaTitle)) <= 1,
    "home CTA heading should be compact at desktop width",
  );
  assert.ok((await box(page.locator(".archive-hero"))).height <= 720, "home hero should not create a large empty vertical band");
  await assertNoHorizontalOverflow(page, "home desktop");
  await assertAbsent(page, 'header a[href="about.html"]', "About should be removed from public navigation");
  await assertAbsent(page, 'footer a[href="about.html"]', "About Biography should be removed from public footer links");
  await assertAbsent(page, 'header a[href="clinical.html"]', "Physician should be clubbed into Home instead of public navigation");

  await page.goto(fileUrl("research-hub.html"));
  await assert.equal(await page.locator("#matrix-mode .field-card").count(), 0, "research merged section should not keep old standalone cards");

  await page.goto(fileUrl("industry.html"));
  await assert.equal(await page.locator("#industry-strategy .field-card").count(), 0, "industry merged section should not keep old standalone cards");

  await page.goto(fileUrl("clinical.html"));
  const hero = await box(page.locator(".page-hero"));
  const statStrip = await box(page.locator(".stat-strip"));
  assert.ok(statStrip.y >= hero.y + hero.height + 16, "clinical stat strip should sit below the hero instead of overlapping it");

  for (const name of ["index.html", "research-hub.html", "industry.html", "academic-policy.html", "clinical.html"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fileUrl(name));
    await assertNoHorizontalOverflow(page, `${name} mobile`);
    await assertAbsent(page, 'header a[href="about.html"]', `${name} mobile nav should not expose About`);
    await assertAbsent(page, 'header a[href="clinical.html"]', `${name} mobile nav should not expose separate Physician`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
