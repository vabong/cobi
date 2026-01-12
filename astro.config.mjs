import { defineConfig } from 'astro/config';

/**
 * Rewrites rendered HTML from Markdown/Content Collections:
 *   src="/images/..." -> src="/images/..."
 *   href="/..." stays clean root-relative.
 * This is required for GitHub Pages + custom domain stability.
 */
function rehypePrefixBase(options = {}) {
  const base = options.base || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  const shouldSkip = (u) =>
    typeof u !== 'string' ||
    /^(https?:)?\/\//.test(u) ||
    u.startsWith('data:') ||
    u.startsWith('mailto:') ||
    u.startsWith('tel:') ||
    u.startsWith('#');

  const prefix = (u) => {
    if (shouldSkip(u)) return u;
    if (!u.startsWith('/')) return u;
    return `${normalizedBase}${u.replace(/^\/+/, '')}`;
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'element' && node.properties) {
      if (node.tagName === 'img' && node.properties.src) {
        node.properties.src = prefix(node.properties.src);
      }
      if (node.tagName === 'a' && node.properties.href) {
        node.properties.href = prefix(node.properties.href);
      }
      if (typeof node.properties.srcset === 'string') {
        node.properties.srcset = node.properties.srcset
          .split(',')
          .map((part) => {
            const trimmed = part.trim();
            const [url, ...rest] = trimmed.split(/\s+/);
            return [prefix(url), ...rest].join(' ');
          })
          .join(', ');
      }
    }

    if (Array.isArray(node.children)) node.children.forEach(walk);
  };

  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://otoplasma.com',

  // ROOT DEPLOYMENT (no subfolder)
  base: '/',

  markdown: {
    rehypePlugins: [[rehypePrefixBase, { base: '/' }]],
  },
});
