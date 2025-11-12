
# Cobi van Tonder — Astro Site (Warm Layout, 3-Column Grid)

- Warm beige sidebar (Josefin Slab/Sans), narrow width
- Home page: 3-column grid, image + title only
- Post pages with tags
- Tag routes at `/tags/<tag>`
- **Local images** via build-time script (`npm run build` runs `prebuild` to fetch covers)

## Develop
```bash
npm install
npm run dev
```

## Deploy (Vercel)
Push to GitHub and import. Vercel will:  
1) run `npm run prebuild` to fetch covers into `/public/images/...`  
2) run `npm run build` for the Astro static build.

## Content structure
```
src/content/blog/<slug>/index.md
public/images/blog/<slug>/cover.jpg (auto-fetched)
```
