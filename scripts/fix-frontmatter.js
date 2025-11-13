import fs from "fs";
import path from "path";

const BLOG_DIR = "src/content/blog";

function extractFrontmatterBlocks(content) {
  const blocks = [];
  const regex = /^---\s*([\s\S]*?)\s*---/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      raw: match[0],
      body: match[1],
      start: match.index,
      end: regex.lastIndex
    });
  }
  return blocks;
}

function parseFrontmatter(raw) {
  const lines = raw.split("\n");
  const data = {};

  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;

    // Remove quotes if present
    data[key.trim()] = val.replace(/^"|"$/g, "").trim();
  }
  return data;
}

function fixFile(filepath) {
  let content = fs.readFileSync(filepath, "utf-8");
  const blocks = extractFrontmatterBlocks(content);

  if (blocks.length === 0) {
    console.log(`⚠️  No frontmatter found in ${filepath}`);
    return;
  }

  // If only one block exists → nothing to fix
  if (blocks.length === 1) {
    console.log(`✔ ${filepath}: already correct`);
    return;
  }

  // Parse blocks
  const parsed = blocks.map(b => ({
    ...b,
    data: parseFrontmatter(b.body)
  }));

  // Find the block containing BOTH title + publishDate
  const valid = parsed.find(b => b.data.title && b.data.publishDate);

  if (!valid) {
    console.log(`❌ ${filepath}: No valid block with title + publishDate`);
    return;
  }

  // Remove ALL frontmatter blocks
  let bodyAfter = content;
  for (const b of blocks) {
    bodyAfter = bodyAfter.replace(b.raw, "");
  }

  // Clean excess whitespace at top
  bodyAfter = bodyAfter.trimStart();

  // Build corrected file
  const finalContent = `---\n${valid.body.trim()}\n---\n\n${bodyAfter}`;

  fs.writeFileSync(filepath, finalContent, "utf-8");

  console.log(`✨ FIXED: ${filepath}`);
}

function run() {
  const folders = fs.readdirSync(BLOG_DIR);

  for (const slug of folders) {
    const file = path.join(BLOG_DIR, slug, "index.md");
    if (fs.existsSync(file)) fixFile(file);
  }

  console.log(`\n🎉 ALL DONE — frontmatter repaired.\n`);
}

run();
