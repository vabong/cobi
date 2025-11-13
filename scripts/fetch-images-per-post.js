#!/usr/bin/env node

/**
 * fetch-images-per-post.js
 * -------------------------------------------
 * Reads images.json
 * Deletes old folder
 * Downloads ONLY correct images for each post
 * Saves them in public/images/blog/<folder>/
 */

import fs from "fs";
import path from "path";
import https from "https";

const ROOT = process.cwd();
const PUBLIC_BLOG = path.join(ROOT, "public/images/blog");

// Load mapping file
const imagesMapPath = path.join(ROOT, "scripts/images.json");
if (!fs.existsSync(imagesMapPath)) {
  console.error("❌ scripts/images.json not found.");
  process.exit(1);
}

const imagesMap = JSON.parse(fs.readFileSync(imagesMapPath, "utf8"));

/** Download helper */
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Failed to download ${url} — status ${res.statusCode}`)
          );
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

async function processPost(folder, urls) {
  const folderPath = path.join(PUBLIC_BLOG, folder);

  console.log(`\n📂 Processing: ${folder}`);

  // Remove old folder
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`🗑️  Deleted old folder`);
  }

  // Re-create folder
  fs.mkdirSync(folderPath, { recursive: true });

  // Download all images
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const ext = url.split(".").pop().split("?")[0];
    const filename = `image-${i + 1}.${ext}`;
    const filePath = path.join(folderPath, filename);

    console.log(`⬇️  Downloading ${url}`);
    try {
      await download(url, filePath);
    } catch (err) {
      console.error(`❌ Failed: ${url}`);
      console.error(err);
    }
  }

  console.log(`✅ Done: ${folder}`);
}

async function run() {
  console.log("🚀 Starting image sync...\n");

  for (const folder of Object.keys(imagesMap)) {
    await processPost(folder, imagesMap[folder]);
  }

  console.log("\n🎉 Image sync complete!");
}

run();
