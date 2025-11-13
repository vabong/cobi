#!/usr/bin/env node
/**
 * crawl-wix-images.js
 * ------------------------------------------
 * Crawls your Wix blog:
 *   - Finds all /post/... URLs from /blog (and a few paginated pages)
 *   - For each post, extracts Wix image URLs (static.wixstatic.com)
 *   - Maps each post to a local slug (folder) from the URL
 *   - Deletes old image-*. files in public/images/blog/<slug>/
 *   - Downloads fresh images in order as image-1.ext, image-2.ext, ...
 *   - DOES NOT touch cover.* (front thumbnails)
 *
 * Usage:
 *   node scripts/crawl-wix-images.js
 *
 * Requirements:
 *   - Node 18+
 *   - npm install node-fetch@3 cheerio
 */

import fs from "fs";
import path from "path";
import https from "https";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const SITE_ROOT = "https://chienpien.wixsite.com";
const BLOG_ROOT = `${SITE_ROOT}/fakeland`;
const BLOG_INDEX = `${BLOG_ROOT}/blog`;
const PUBLIC_BLOG = path.join(process.cwd(), "public/images/blog");

// Match only real Wix media URLs
const WIX_IMG_RE = /https:\/\/static\.wixstatic\.com\/media\/[^\s"'()<>]+/g;

// ---- Helpers ----

function slugFromPostUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  const postIndex = parts.indexOf("post");
  let slug = postIndex >= 0 && parts[postIndex + 1] ? parts[postIndex + 1] : parts[parts.length - 1];
  return decodeURIComponent(slug);
}

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

// ---- Crawl index pages for /post/... links ----

async function crawlAllPostUrls() {
  const urls = new Set();

  // Try main index + a few possible pagination patterns
  const indexVariants = [
    BLOG_INDEX,
    `${BLOG_INDEX}?page=1`,
    `${BLOG_INDEX}?page=2`,
    `${BLOG_INDEX}?page=3`,
    `${BLOG_INDEX}?page=4`,
  ];

  for (const url of indexVariants) {
    try {
      console.log(`🔎 Crawling index: ${url}`);
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      $("a[href*='/post/']").each((_, el) => {
        let href = $(el).attr("href");
        if (!href) return;

        if (!href.startsWith("http")) {
          href = BLOG_ROOT + (href.startsWith("/") ? href : `/${href}`);
        }

        if (href.includes("/post/")) {
          urls.add(href.split("?")[0]); // strip query params
        }
      });
    } catch (e) {
      console.warn(`⚠️ Failed to crawl ${url}: ${e.message}`);
    }
  }

  return Array.from(urls);
}

// ---- Process a single post: extract images & download ----

async function processPost(url) {
  const slug = slugFromPostUrl(url);
  console.log(`\n📄 Post: ${slug}`);
  console.log(`   URL: ${url}`);

  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    console.error(`   ❌ Failed to fetch post HTML: ${e.message}`);
    return;
  }

  const $ = cheerio.load(html);
  const text = $.root().text();
  const rawMatches = text.match(WIX_IMG_RE) || [];

  // Also search HTML explicitly
  const htmlMatches = [];
  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src && src.startsWith("https://static.wixstatic.com/media/")) {
      htmlMatches.push(src);
    }
    const dataSrc = $(img).attr("data-src");
    if (dataSrc && dataSrc.startsWith("https://static.wixstatic.com/media/")) {
      htmlMatches.push(dataSrc);
    }
  });

  const allUrls = [...rawMatches, ...htmlMatches];
  const uniqueUrls = [...new Set(allUrls)];

  if (uniqueUrls.length === 0) {
    console.log("   ⚠️ No Wix image URLs found, skipping.");
    return;
  }

  const outDir = path.join(PUBLIC_BLOG, slug);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Delete ONLY old image-*. files. Keep cover.* intact.
  for (const file of fs.readdirSync(outDir)) {
    if (/^image-\d+\./i.test(file)) {
      fs.unlinkSync(path.join(outDir, file));
    }
  }

  console.log(`   ⬇️ Downloading ${uniqueUrls.length} image(s)...`);

  let i = 1;
  for (const imgUrl of uniqueUrls) {
    try {
      const tail = imgUrl.split("/").pop() || "";
      const extMatch = tail.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      const ext = extMatch ? extMatch[1] : "jpg";
      const filename = `image-${i}.${ext}`;
      const dest = path.join(outDir, filename);

      console.log(`     [${i}/${uniqueUrls.length}] ${imgUrl}`);
      await download(imgUrl, dest);
      i++;
    } catch (e) {
      console.error(`     ❌ Failed: ${e.message}`);
    }
  }

  console.log("   ✅ Done");
}

// ---- Main run ----

async function run() {
  console.log("🚀 Crawling Wix blog and refreshing images...");

  if (!fs.existsSync(PUBLIC_BLOG)) {
    fs.mkdirSync(PUBLIC_BLOG, { recursive: true });
  }

  const postUrls = await crawlAllPostUrls();
  console.log(`\nFound ${postUrls.length} post URL(s).`);

  for (const url of postUrls) {
    await processPost(url);
  }

  console.log("\n✨ All posts processed.");
}

run().catch((err) => {
  console.error("💥 Script error:", err);
  process.exit(1);
});
