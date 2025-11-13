#!/usr/bin/env node
/**
 * clean-wix-markdown.js
 * ------------------------------------------
 * Cleans imported Wix markdown files by removing
 * <script>, <style>, inline HTML junk, extra Wix garbage,
 * and fixing image paths.
 *
 * Usage:
 *   node scripts/clean-wix-markdown.js [--dry-run]
 *
 * Safe: keeps .bak backups and checks images.
 */

import fs from "fs";
import path from "path";

// --- CONFIG ---
const BLOG_DIR = path.resolve("src/content/blog");
const PUBLIC_DIR = path.resolve("public");
const ALLOWED_INLINE_TAGS = ["em", "strong", "a", "img", "br"];
const isDryRun = process.argv.includes("--dry-run");

// --- CLEANUP FUNCTION ---
function removeWixArtifacts(content) {
  let cleaned = content;

  // Remove <script>…</script> and <style>…</style>
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove Wix comments or metadata
  cleaned = cleaned.replace(/<!--.*?Wix.*?-->/gi, "");

  // Remove leftover pro-gallery, min read, views, comments, and other junk
  cleaned = cleaned
    // remove entire pro-gallery blocks
    .replace(/#pro-gallery[\s\S]*?(?=\n#|$)/gi, "")
    // remove min read
    .replace(/\*\s*\d+\s*min read/gi, "")
    // remove Updated: lines
    .replace(/Updated:\s?.*/gi, "")
    // remove numeric-only lines (like "33")
    .replace(/^\d+\s*$/gm, "")
    // remove "views" or "comments" lines
    .replace(/\b\d+\s*views?\b.*/gi, "")
    .replace(/\b\d+\s*comments?\b.*/gi, "")
    // remove "Post not marked as liked"
    .replace(/Post not marked as liked.*/gi, "")
    // remove empty bullet lines
    .replace(/^\*\s*$/gm, "");

  // Strip inline HTML except for allowed tags
  cleaned = cleaned.replace(
    /<\/?([a-zA-Z0-9-]+)(\s[^>]*)?>/g,
    (match, tagName) =>
      ALLOWED_INLINE_TAGS.includes(tagName.toLowerCase()) ? match : ""
  );

  // --- FIX IMAGE PATHS (preserve subfolders) ---
  cleaned = cleaned.replace(
    /!\[(.*?)\]\((?:\.{0,2}\/)?(images\/blog\/[^\)]+)\)/g,
    (match, alt, relPath) => {
      const normalized = relPath.replace(/^\/?/, "");
      return `![${alt}](/${normalized})`;
    }
  );

  // Replace HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize line endings and trim blank lines
  cleaned = cleaned.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");

  // Remove orphaned "Tags:" section at the bottom
  cleaned = cleaned.replace(/\n?Tags:\n([\s\S]*?)$/gi, "");

  // Remove empty "#" headers created after stripping content
  cleaned = cleaned.replace(/^#\s*$/gm, "");

  return cleaned.trim() + "\n";
}

// --- CHECK IMAGE FILE EXISTENCE ---
function checkImagesExist(content, filePath) {
  const imagePattern = /!\[.*?\]\(\/(images\/blog\/[^)]+)\)/g;
  const missing = [];
  let match;
  while ((match = imagePattern.exec(content)) !== null) {
    const imageRel = match[1];
    const imageAbs = path.join(PUBLIC_DIR, imageRel);
    if (!fs.existsSync(imageAbs)) missing.push(imageRel);
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing images in ${path.relative(process.cwd(), filePath)}:\n` +
        missing.map((img) => `   - ${img}`).join("\n")
    );
  }
}

// --- PROCESS SINGLE FILE ---
function processMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const cleaned = removeWixArtifacts(raw);
  checkImagesExist(cleaned, filePath);

  if (cleaned !== raw) {
    if (!isDryRun) {
      fs.copyFileSync(filePath, filePath + ".bak");
      fs.writeFileSync(filePath, cleaned, "utf-8");
    }
    console.log(
      `${isDryRun ? "🧪 (dry run)" : "✅ Cleaned"}: ${path.relative(
        process.cwd(),
        filePath
      )}`
    );
  } else {
    console.log(`— No changes: ${path.relative(process.cwd(), filePath)}`);
  }
}

// --- RECURSIVE FILE FINDER ---
function getAllMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(getAllMarkdownFiles(fullPath));
    else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
      files.push(fullPath);
  }
  return files;
}

// --- MAIN ---
function cleanAllMarkdown() {
  console.log(
    `\n🧹 Cleaning Wix artifacts in ${BLOG_DIR} ${
      isDryRun ? "(dry run mode)" : ""
    }\n`
  );

  if (!fs.existsSync(BLOG_DIR)) {
    console.error("❌ Blog directory not found:", BLOG_DIR);
    process.exit(1);
  }

  const files = getAllMarkdownFiles(BLOG_DIR);
  if (files.length === 0) {
    console.warn("⚠️ No markdown files found.");
    return;
  }

  files.forEach(processMarkdownFile);
  console.log(
    `\n✨ Cleanup ${isDryRun ? "preview" : "complete"} for ${files.length} file(s)!\n`
  );
}

cleanAllMarkdown();
