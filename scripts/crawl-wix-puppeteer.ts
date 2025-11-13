// scripts/crawl-wix-puppeteer.js

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const BASE = "https://chienpien.wixsite.com/fakeland";

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight - 600) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function getAllPostUrls() {
  console.log("🚀 Launching browser…");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const blogUrl = `${BASE}/blog`;
  console.log("🌐 Opening:", blogUrl);
  await page.goto(blogUrl, { waitUntil: "networkidle0" });

  console.log("⬇️ Scrolling to load all posts…");
  await autoScroll(page);
  await page.waitForTimeout(2000);

  const urls = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href*='/post/']"));
    return [...new Set(anchors.map(a => a.href))];
  });

  console.log(`📌 FOUND ${urls.length} POSTS\n`);
  await browser.close();
  return urls;
}

function slugFromUrl(url) {
  return url.split("/post/")[1].replace(/\/$/, "").trim();
}

async function download(url, filepath) {
  try {
    const res = await fetch(url);
    if (!res.ok) return;

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
  } catch (err) {}
}

async function processPost(url) {
  const slug = slugFromUrl(url);
  console.log(`📄 POST: ${slug}`);
  console.log(`    URL: ${url}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitForTimeout(1500);

  const imgUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .map((img) => img.src)
      .filter((src) => src.includes("static.wixstatic.com"))
      .map((src) =>
        src.replace(/\/v1\/fill.*?\//, "/v1/fill/w_1500,h_1500,al_c,q_90/")
      );
  });

  console.log(`    🖼 Found ${imgUrls.length} images`);

  const outDir = path.join("public/images/blog", slug);
  fs.mkdirSync(outDir, { recursive: true });

  let counter = 1;
  for (const src of imgUrls) {
    const filename = `image-${counter}.jpg`;
    const fullpath = path.join(outDir, filename);
    console.log(`      [${counter}] ${src}`);
    await download(src, fullpath);
    counter++;
  }

  await browser.close();
  console.log("    ✅ Done\n");
}

(async () => {
  console.log("🚀 FULL Wix Blog Import Starting...\n");

  const urls = await getAllPostUrls();
  for (const url of urls) {
    await processPost(url);
  }

  console.log("🎉 COMPLETE — All posts processed.");
})();
