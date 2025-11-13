import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE = "https://chienpien.wixsite.com/fakeland";
const BLOG_INDEX = BASE + "/blog";

async function fetchHTML(url) {
  const r = await fetch(url);
  return await r.text();
}

// Extract all blog post URLs from all pagination pages
async function getAllPostUrls() {
  const urls = new Set();

  for (let page = 0; page < 20; page++) {
    const url = `${BLOG_INDEX}?page=${page}`;
    console.log(`🔎 Crawling: ${url}`);

    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const links = $('a[href*="/post/"]');

    if (links.length === 0) {
      console.log(`   ⛔ No more posts found (page ${page})`);
      break;
    }

    links.each((i, el) => {
      let href = $(el).attr("href");
      if (!href) return;

      // FIX: Wix href are relative (/post/x)
      if (!href.startsWith("http")) {
        href = BASE + href;
      }
      urls.add(href);
    });
  }

  return [...urls];
}

function slugFromUrl(url) {
  return url.split("/post/")[1].replace(/\/$/, "");
}

async function scrapeImages(postUrl) {
  const html = await fetchHTML(postUrl);
  const $ = cheerio.load(html);

  // Wix images follow static.wixstatic.com
  const imgs = $('img[src*="static.wixstatic.com"]');

  const urls = imgs
    .map((i, el) => $(el).attr("src"))
    .get()
    .filter(Boolean);

  return urls;
}

async function downloadImage(url, outPath) {
  try {
    const r = await fetch(url);
    const buffer = await r.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(buffer));
  } catch (err) {
    console.log("    ❌ Failed:", url);
  }
}

async function run() {
  console.log("\n🚀 FULL Wix Blog Import Starting...\n");

  const posts = await getAllPostUrls();

  console.log(`\n📌 FOUND ${posts.length} POSTS\n`);

  for (const postUrl of posts) {
    const slug = slugFromUrl(postUrl);

    console.log(`\n📄 POST: ${slug}`);
    console.log(`    URL: ${postUrl}`);

    const folder = path.join("public/images/blog", slug);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const images = await scrapeImages(postUrl);
    console.log(`    🖼  Found ${images.length} images`);

    let index = 0;
    for (const url of images) {
      index++;
      const filename = `image-${index}.jpg`;
      const out = path.join(folder, filename);
      console.log(`      [${index}/${images.length}] ${url}`);
      await downloadImage(url, out);
    }

    console.log("    ✅ Done");
  }

  console.log("\n🎉 COMPLETE — All posts processed.\n");
}

run();
