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

async function assertMobileGutters(page, label) {
  const boxes = await page.locator(".section-inner, .hero-inner, .footer-grid, .footer-bottom").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: window.innerWidth - rect.right, width: rect.width };
    }),
  );
  for (const item of boxes) {
    assert.ok(item.left >= 23, `${label} has too little left gutter: ${item.left}px`);
    assert.ok(item.right >= 23, `${label} has too little right gutter: ${item.right}px`);
  }
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
  await assertAbsent(page, "#site-cta .social-strip", "social links should not appear as a standalone CTA section");
  await assert.ok((await page.locator("footer .footer-social").count()) >= 1, "social links should live in the footer");
  const quotePanel = await box(page.locator(".quote-panel").last());
  const ctaSection = await box(page.locator("#site-cta"));
  const ctaTitleBox = await box(ctaTitle);
  assert.ok(ctaTitleBox.y - (quotePanel.y + quotePanel.height) <= 140, "CTA should not have a large empty top gap after the quote panel");
  assert.ok(ctaSection.height <= 260, "CTA section should stay compact");

  await page.goto(fileUrl("research-hub.html"));
  await assert.equal(await page.locator("#matrix-mode .field-card").count(), 0, "research merged section should not keep old standalone cards");

  await page.goto(fileUrl("industry.html"));
  await assert.equal(await page.locator("#industry-strategy .field-card").count(), 0, "industry merged section should not keep old standalone cards");

  await page.goto(fileUrl("academic-policy.html"));
  const internationalHeading = await box(page.locator(".international-section .section-title"));
  const firstInternationalItem = await box(page.locator(".international-section .publication-list li").first());
  const policyNote = await box(page.locator(".international-section .sticky-note"));
  assert.ok(firstInternationalItem.y - (internationalHeading.y + internationalHeading.height) >= 28, "policy international list should breathe below its heading");
  assert.ok(policyNote.y >= firstInternationalItem.y - 8, "policy side note should align with the content, not crowd the heading");

  await page.goto(fileUrl("contact.html"));
  await assertAbsent(page, "form", "contact page should not use a local form that triggers insecure browser warnings");
  await assertAbsent(page, "input", "contact page should not expose insecure local input fields");
  await assertAbsent(page, "select", "contact page should not expose insecure local select fields");
  await assertAbsent(page, "textarea", "contact page should not expose insecure local textareas");
  const contactBody = await page.locator("body").innerText();
  assert.ok(!/browser warnings|not secure|autofill/i.test(contactBody), "contact page should not show technical browser-warning language");

  await page.goto(fileUrl("clinical.html"));
  const hero = await box(page.locator(".page-hero"));
  const statStrip = await box(page.locator(".stat-strip"));
  assert.ok(statStrip.y >= hero.y + hero.height + 16, "clinical stat strip should sit below the hero instead of overlapping it");

  for (const name of ["index.html", "research-hub.html", "industry.html", "academic-policy.html", "clinical.html", "contact.html"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(fileUrl(name));
    await assertNoHorizontalOverflow(page, `${name} mobile`);
    await assertMobileGutters(page, `${name} mobile`);
    await assertAbsent(page, 'header a[href="about.html"]', `${name} mobile nav should not expose About`);
    await assertAbsent(page, 'header a[href="clinical.html"]', `${name} mobile nav should not expose separate Physician`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
