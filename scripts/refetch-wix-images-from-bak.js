#!/usr/bin/env node
/**
 * refetch-wix-images-from-bak.js
 * ------------------------------------------
 * For each blog post:
 *  - read src/content/blog/<slug>/index.md.bak (or index.md if no .bak)
 *  - extract Wix image URLs (https://static.wixstatic.com/media/...)
 *  - delete old image-*. files in public/images/blog/<slug>/
 *  - download fresh images as image-1.ext, image-2.ext, ...
 *  - DO NOT touch cover.* (frontpage thumbnail)
 *
 * Usage:
 *   node scripts/refetch-wix-images-from-bak.js
 */

import fs from "fs";
import path from "path";
import https from "https";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "src/content/blog");
const OUT_ROOT = path.join(ROOT, "public/images/blog");

// match all Wix media URLs inside text
const WIX_IMG_RE =
  /https:\/\/static\.wixstatic\.com\/media\/[^\s"'()<>]+/g;

function getPostDirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(
            new Error(`HTTP ${res.statusCode} for ${url}`)
          );
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

async function processPost(slug) {
  const postDir = path.join(BLOG_DIR, slug);
  const bakPath = path.join(postDir, "index.md.bak");
  const mdPath = path.join(postDir, "index.md");

  let sourcePath = null;

  if (fs.existsSync(bakPath)) sourcePath = bakPath;
  else if (fs.existsSync(mdPath)) sourcePath = mdPath;
  else return;

  const raw = fs.readFileSync(sourcePath, "utf8");
  const matches = Array.from(raw.matchAll(WIX_IMG_RE), (m) => m[0]);

  const uniqueUrls = [...new Set(matches)];

  console.log(`\n📄 ${slug}`);
  if (uniqueUrls.length === 0) {
    console.log("  ⚠️  No Wix image URLs found, skipping.");
    return;
  }

  const outDir = path.join(OUT_ROOT, slug);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // delete only old image-*. files, keep cover.*
  for (const file of fs.readdirSync(outDir)) {
    if (/^image-\d+\./i.test(file)) {
      fs.unlinkSync(path.join(outDir, file));
    }
  }

  let i = 1;
  for (const url of uniqueUrls) {
    const tail = url.split("/").pop() || "";
    const extMatch = tail.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const ext = extMatch ? extMatch[1] : "jpg";
    const filename = `image-${i}.${ext}`;
    const dest = path.join(outDir, filename);

    console.log(`  ⬇️  [${i}/${uniqueUrls.length}] ${url}`);
    try {
      await download(url, dest);
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}`);
    }
    i++;
  }

  console.log("  ✅ Done");
}

async function run() {
  console.log("🚀 Refetching Wix images from .bak files...");
  if (!fs.existsSync(BLOG_DIR)) {
    console.error("❌ Blog dir not found:", BLOG_DIR);
    process.exit(1);
  }

  const slugs = getPostDirs(BLOG_DIR);
  for (const slug of slugs) {
    await processPost(slug);
  }
  console.log("\n✨ All posts processed.");
}

run().catch((err) => {
  console.error("💥 Script error:", err);
  process.exit(1);
});
