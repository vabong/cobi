import fs from "fs";
import path from "path";

const ROOT = path.resolve("src/content/blog");

function getAllMarkdownFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(full));
    } else if (file.endsWith(".md") || file.endsWith(".mdx")) {
      results.push(full);
    }
  }
  return results;
}

function fixMarkdown(file) {
  let content = fs.readFileSync(file, "utf8");

  // Matches: /images/blog/YYYY/MM/DD/slug/image-X.jpg
  const regex =
    /\/images\/blog\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\/(image-\d+\.(?:jpg|jpeg|png|webp|gif))/gi;

  const replaced = content.replace(regex, (match, slug, img) => {
    return `/images/blog/${slug}/${img}`;
  });

  if (replaced !== content) {
    fs.writeFileSync(file, replaced, "utf8");
    console.log(`✔ Updated: ${file}`);
  }
}

function run() {
  console.log("🔧 Fixing markdown image paths…");
  const files = getAllMarkdownFiles(ROOT);

  for (const file of files) {
    fixMarkdown(file);
  }

  console.log("🎉 Done updating markdown files!");
}

run();
