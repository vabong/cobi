import fs from "fs";
import path from "path";

const ROOT = path.resolve("public/images/blog");

function getAllSubfolders(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(full);
      results = results.concat(getAllSubfolders(full));
    }
  }
  return results;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isDateFolder(name) {
  return /^\d{4}$/.test(name) || /^\d{2}$/.test(name);
}

function flatten() {
  console.log("🚀 Flattening image folders…");

  const allFolders = getAllSubfolders(ROOT)
    .sort((a, b) => a.length - b.length); // shallow → deep

  for (const folder of allFolders) {
    const parts = folder.split(path.sep);
    const slug = parts[parts.length - 1];

    // if parent contains dates: .../YYYY/MM/DD/<slug>
    const parent1 = parts[parts.length - 2];
    const parent2 = parts[parts.length - 3];
    const parent3 = parts[parts.length - 4];

    const looksNested =
      isDateFolder(parent1) ||
      isDateFolder(parent2) ||
      isDateFolder(parent3);

    if (!looksNested) {
      // already flat - skip
      continue;
    }

    const target = path.join(ROOT, slug);
    ensureDir(target);

    const files = fs.readdirSync(folder);

    const images = files.filter((f) =>
      /\.(png|jpe?g|webp|gif)$/i.test(f)
    );

    if (images.length === 0) continue;

    console.log(`📁 ${folder}`);
    console.log(`   ➜ Moving → ${target}`);

    // Move each image
    for (const file of images) {
      const src = path.join(folder, file);
      const dest = path.join(target, file);

      fs.renameSync(src, dest);
      console.log(`   ✔ moved ${file}`);
    }
  }

  // cleanup pass — delete empty date folders
  const after = getAllSubfolders(ROOT).sort((a, b) => b.length - a.length); // deepest → shallowest

  for (const f of after) {
    const content = fs.readdirSync(f);
    if (content.length === 0) {
      fs.rmdirSync(f);
      console.log(`🗑 Removed empty folder: ${f}`);
    }
  }

  console.log("🎉 Done! All folders flattened.");
}

flatten();
