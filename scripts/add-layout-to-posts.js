#!/usr/bin/env node
/**
 * add-layout-to-posts.js
 * Adds a layout line to frontmatter in markdown files
 * inside src/content/blog/ if missing.
 */

import fs from "fs";
import path from "path";

const BLOG_DIR = path.resolve("src/content/blog");
const LAYOUT_PATH = "../../layouts/BlogPostLayout.astro";

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

function addLayoutToFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.startsWith("---")) return;

  const parts = raw.split("---");
  if (parts.length < 3) return;

  const frontmatter = parts[1];
  const body = parts.slice(2).join("---");

  // Skip if layout already exists
  if (/^\s*layout\s*:/m.test(frontmatter)) {
    console.log(`— Has layout: ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const newFrontmatter = frontmatter.trimEnd() + `\nlayout: ${LAYOUT_PATH}\n`;
  const updated = `---\n${newFrontmatter}---${body}`;

  fs.copyFileSync(filePath, filePath + ".bak");
  fs.writeFileSync(filePath, updated, "utf-8");

  console.log(`✅ Added layout: ${path.relative(process.cwd(), filePath)}`);
}

function run() {
  console.log(`\n🧱 Adding layout to markdown files in ${BLOG_DIR}\n`);

  if (!fs.existsSync(BLOG_DIR)) {
    console.error("❌ Blog directory not found:", BLOG_DIR);
    process.exit(1);
  }

  const files = getAllMarkdownFiles(BLOG_DIR);
  if (files.length === 0) {
    console.warn("⚠️ No markdown files found.");
    return;
  }

  files.forEach(addLayoutToFrontmatter);

  console.log(`\n✨ Done! Processed ${files.length} file(s).\n`);
}

// ✅ Call the main function
run();
