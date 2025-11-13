import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = "./src/content/blog";

function getSlugFromFolder(folderPath) {
  return path.basename(folderPath);
}

function processMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  // split into frontmatter & content
  const parts = raw.split("---").map(p => p.trim());

  if (parts.length < 3) {
    console.log("⚠️ Skipping — not enough frontmatter:", filePath);
    return;
  }

  // ❌ parts[1] = incorrect first frontmatter
  // ✅ parts[last-1] = real frontmatter
  const realFMIndex = parts.length - 2;
  const realFMRaw = parts[realFMIndex];

  const fm = matter(`---\n${realFMRaw}\n---`);
  const data = fm.data;
  let content = parts.slice(realFMIndex + 1).join("\n---\n");

  const folder = path.dirname(filePath);
  const slug = getSlugFromFolder(folder);

  // FIX COVER
  const coverPath = `/images/blog/${slug}/image-1.jpg`;
  data.cover = coverPath;

  // FIX CONTENT
  content = content
    .replace(/!\[.*?\]\(.*?\.webp\)/g, "")      // remove .webp images
    .replace(/!\[\]\(.*?cover\.png\)/g, "")      // remove leftover cover.png
    .trim();

  // rebuild clean markdown
  const cleaned = matter.stringify(content, data);

  // backup
  fs.writeFileSync(filePath + ".bak2", raw);

  // write cleaned
  fs.writeFileSync(filePath, cleaned, "utf8");

  console.log("✔ Fixed:", slug);
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(full);
    } else if (entry.name === "index.md") {
      processMarkdownFile(full);
    }
  }
}

console.log("🔧 Repairing markdown frontmatter…");
walkDir(BLOG_DIR);
console.log("🎉 Done!");
