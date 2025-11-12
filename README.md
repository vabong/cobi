
# Cobi van Tonder — Astro Portfolio + Blog

Layout:
- Left sidebar with name + navigation (Josefin Slab / Josefin Sans)
- Home page: grid of post thumbnails (newest first)
- Post page: hero image, content, tags
- Tag pages: /tags/<tag>

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel
- Create a new Vercel project from this repo.
- Framework preset: **Astro**.
- Default build command is fine.

## Content
Add posts under `src/content/blog/YYYY-MM-DD-slug/index.md` with frontmatter:
```md
---
title: "My Post"
publishDate: "2025-01-01"
cover: "/images/blog/my-post/cover.jpg"
tags: ["tag1", "tag2"]
---
Post body here...
```
