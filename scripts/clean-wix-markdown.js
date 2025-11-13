#!/usr/bin/env node
/**
 * clean-wix-markdown.js
 * ------------------------------------------
 * Cleans imported Wix markdown files by removing
 * <script>, <style>, and inline HTML junk.
 *
 * Usage:
 *   node scripts/clean-wix-markdown.js
 *   OR (if executable):
 *   ./scripts/clean-wix-markdown.js
 *
 * Requirements:
 *   - Run from project root
 *   - Node 18+
 */

import fs from "fs";
import path from "path";

// --- CONFIG ---
const BLOG_DIR = path.resolve("src/content/blog");
const ALLOWED_INLINE_TAGS = ["em", "strong", "a", "img", "br"];

// --- CLEANUP FUNCTION ---
function removeWixArtifacts(content) {
  let cleaned = content;

  // Remove <script>…</script> blocks
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove <style>…</style> blocks
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove Wix comments or metadata
  cleaned = cleaned.replace(/<!--.*?Wix.*?-->/gi, "");

  // Strip inline HTML except for allowed tags
  cleaned = cleaned.replace(
    /<\/?([a-zA-Z0-9-]+)(\s[^>]*)?>/g,
    (match, tagName) => {
      return ALLOWED_INLINE_TAGS.includes(tagName.toLowerCase())
        ? match
        : "";
    }
  );

  // Normalize image paths (e.g. "images/blog/foo.jpg" → "/images/blog/foo.jpg")
  cleaned = cleaned.replace(
    /!\[(.*?)\]\((?:\.{0,2}\/)?(images\/blog\/[^)]+)\)/g,
    "![$1](/$2)"
  );

  // Trim trailing spaces and excessive blank lines
  cleaned = cleaned.replace(/[ \t]+$/gm, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim() + "\n";
}

// --- PROCESS SINGLE FILE ---
function processMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const cleaned = removeWixArtifacts(raw);

  if (cleaned !== raw) {
    fs.writeFileSync(filePath, cleaned, "utf-8");
    console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
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
    if (entry.isDirectory()) {
      files = files.concat(getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }
  return files;
}

// --- MAIN ---
function cleanAllMarkdown() {
  console.log(`\n🧹 Cleaning Wix artifacts in ${BLOG_DIR}\n`);

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

  console.log("\n✨ Cleanup complete!\n");
}

cleanAllMarkdown();
