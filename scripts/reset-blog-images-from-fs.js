#!/usr/bin/env node
/**
 * reset-blog-images-from-fs.js
 *
 * For each blog post:
 *   - detects its slug from folder name
 *   - reads images from public/images/blog/<slug>/
 *   - sets cover: "/images/blog/<slug>/<first-image>"
 *   - removes all existing markdown image lines in body
 *   - injects a fresh image block at the top of the body
 *
 * Text content and other frontmatter fields are preserved.
 */

import fs from "fs";
import path from "path";

const BLOG_MD_ROOT = path.resolve("src/content/blog");
const BLOG_IMG_ROOT = path.resolve("public/images/blog");

function getAllPostMarkdownFiles(rootDir) {
  const dirs = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of dirs) {
    if (entry.isDirectory()) {
      const slug = entry.name;
      const mdPath = path.join(rootDir, slug, "index.md");
      if (fs.existsSync(mdPath)) {
        files.push({ slug, filePath: mdPath });
      }
    }
  }

  return files;
}

function readImagesForSlug(slug) {
  const dir = path.join(BLOG_IMG_ROOT, slug);
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ No image folder for slug "${slug}" at ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir);
  const images = files.filter((f) =>
    /\.(png|jpe?g|webp|gif)$/i.test(f)
  );

  // numeric sort: image-1, image-2, ..., image-10
  images.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

  return images;
}

function splitFrontmatterAndBody(content) {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content };
  }

  const lines = content.split("\n");
  // first line is ---
  let fmEndIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      fmEndIndex = i;
      break;
    }
  }

  if (fmEndIndex === -1) {
    // no closing ---
    return { frontmatter: "", body: content };
  }

  const frontmatterLines = lines.slice(1, fmEndIndex);
  const bodyLines = lines.slice(fmEndIndex + 1);
  return {
    frontmatter: frontmatterLines.join("\n"),
    body: bodyLines.join("\n"),
  };
}

function updateFrontmatter(frontmatter, slug, firstImage) {
  let fm = frontmatter || "";

  const coverLine = `cover: "/images/blog/${slug}/${firstImage}"`;

  if (/^cover\s*:/m.test(fm)) {
    // replace existing cover line
    fm = fm.replace(/^cover\s*:.*/m, coverLine);
  } else {
    // try to insert after title line if present
    const lines = fm.split("\n");
    let inserted = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^title\s*:/m.test(lines[i])) {
        lines.splice(i + 1, 0, coverLine);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      lines.push(coverLine);
    }
    fm = lines.join("\n");
  }

  return fm;
}

function cleanBodyAndInjectImages(body, slug, images) {
  let b = body || "";

  // Remove pure markdown image lines: ![alt](...)
  b = b.replace(/^!\[.*?\]\(.*?\)\s*$/gm, "");

  // Remove patterns like [ ![](…) ](link)
  b = b.replace(/\[\s*!\[.*?\]\(.*?\)\s*\]\(.*?\)/gm, "");

  // Trim leading blank lines
  b = b.replace(/^\s+/, "");

  // Build new image block
  const imageLines = images.map(
    (img) => `![](/images/blog/${slug}/${img})`
  );

  const imageBlock = imageLines.join("\n\n");

  // Put images at very top of body, then a blank line, then rest
  if (b.trim().length > 0) {
    return `${imageBlock}\n\n${b}`;
  } else {
    return `${imageBlock}\n`;
  }
}

function processPost({ slug, filePath }) {
  const images = readImagesForSlug(slug);
  if (images.length === 0) {
    console.warn(`⚠️ No images found for slug "${slug}", skipping.`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatterAndBody(raw);

  // update frontmatter with cover
  const updatedFM = updateFrontmatter(frontmatter, slug, images[0]);

  // rebuild body image block
  const updatedBody = cleanBodyAndInjectImages(body, slug, images);

  // backup original if .bak doesn't exist yet
  const bakPath = filePath + ".bak";
  if (!fs.existsSync(bakPath)) {
    fs.copyFileSync(filePath, bakPath);
  }

  const finalContent = [
    "---",
    updatedFM.trim(),
    "---",
    "",
    updatedBody.trimStart(),
    "",
  ].join("\n");

  fs.writeFileSync(filePath, finalContent, "utf8");
  console.log(`✅ Updated images & cover for: ${slug}`);
}

function run() {
  console.log("🚀 Resetting blog images from filesystem…");

  const posts = getAllPostMarkdownFiles(BLOG_MD_ROOT);
  if (posts.length === 0) {
    console.log("⚠️ No markdown posts found in src/content/blog");
    return;
  }

  for (const post of posts) {
    processPost(post);
  }

  console.log("🎉 Done syncing markdown images with filesystem!");
}

run();
