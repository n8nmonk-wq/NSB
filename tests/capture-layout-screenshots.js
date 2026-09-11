const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outputDir = path.resolve(
  "C:/Users/pranj/.codex/visualizations/2026/09/10/01a08bad-7cfb-7641-a572-3fcaddade3c4/nsb",
);

const pages = ["index.html", "clinical.html", "research-hub.html", "industry.html", "academic-policy.html"];
const sizes = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    for (const pageName of pages) {
      const url = pathToFileURL(path.join(root, pageName)).href;
      await page.goto(url);
      await page.evaluate(async () => {
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
        const step = Math.max(240, Math.floor(window.innerHeight * 0.7));
        for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 120));
      });
      await page.screenshot({
        path: path.join(outputDir, `${path.basename(pageName, ".html")}-${size.name}.png`),
        fullPage: true,
      });
    }
  }

  await browser.close();
  console.log(outputDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
