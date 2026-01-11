import { defineConfig } from 'astro/config';

/**
 * Rewrites rendered HTML from Markdown/Content Collections:
 *   src="/images/..." -> src="/cobi/images/..."
 * Also rewrites <a href="/..."> similarly (optional but handy).
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
    if (!u.startsWith('/')) return u; // rewrite only root-absolute URLs
    return `${normalizedBase}${u.replace(/^\/+/, '')}`;
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'element' && node.properties) {
      // Markdown images
      if (node.tagName === 'img' && node.properties.src) {
        node.properties.src = prefix(node.properties.src);
      }
      // Markdown links (optional)
      if (node.tagName === 'a' && node.properties.href) {
        node.properties.href = prefix(node.properties.href);
      }
      // srcset (optional)
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
  site: 'https://example.com',
  base: '/cobi/',
  markdown: {
    // IMPORTANT: tuple format so options are applied
    rehypePlugins: [[rehypePrefixBase, { base: '/cobi/' }]],
  },
});
