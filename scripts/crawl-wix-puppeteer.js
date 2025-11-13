import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import slugify from "slugify";

/* ---------------------------------------------------
   Helper: sleep()
--------------------------------------------------- */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/* ---------------------------------------------------
   Extract all post URLs
--------------------------------------------------- */
async function getAllPostUrls(page) {
  console.log("🌐 Opening blog index…");
  await page.goto("https://chienpien.wixsite.com/fakeland/blog", {
    waitUntil: "networkidle2",
  });

  console.log("⬇️ Scrolling to load all posts…");

  let previousHeight = 0;
  let tries = 0;

  while (tries < 20) {
    const height = await page.evaluate("document.body.scrollHeight");
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await sleep(1500); // <<< FIXED

    if (height === previousHeight) {
      tries++;
    } else {
      tries = 0;
      previousHeight = height;
    }
  }

  console.log("🔍 Extracting URLs…");

  const urls = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a"));
    return anchors
      .map((a) => a.href)
      .filter((u) => u.includes("/post/"));
  });

  const unique = [...new Set(urls)];
  return unique;
}

/* ---------------------------------------------------
   Extract images + body text for a single post
--------------------------------------------------- */
async function processPost(page, url) {
  console.log(`\n📄 POST: ${url}`);

  await page.goto(url, { waitUntil: "networkidle2" });
  await sleep(1200); // <<< FIXED

  const slug = url.split("/post/")[1];
  const folder = `public/images/blog/${slug}`;

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  // Extract image URLs
  const images = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .map((img) => img.src)
      .filter((src) => src.includes("static.wixstatic.com"))
  );

  console.log(`    🖼 Found ${images.length} images`);

  // Download images
  let index = 1;
  for (const src of images) {
    const filename = `image-${index}.jpg`;
    const filepath = path.join(folder, filename);

    try {
      const response = await fetch(src);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      console.log(`      ✔ Saved ${filename}`);
    } catch (e) {
      console.log(`      ✖ Failed ${src}`);
    }

    index++;
  }

  return { slug, images };
}

/* ---------------------------------------------------
   MAIN
--------------------------------------------------- */
(async () => {
  console.log("🚀 FULL Wix Blog Import Starting...\n");

  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  const urls = await getAllPostUrls(page);

  console.log(`\n📌 FOUND ${urls.length} POSTS`);

  for (const url of urls) {
    await processPost(page, url);
  }

  await browser.close();
  console.log("\n🎉 COMPLETE — All posts processed.");
})();
