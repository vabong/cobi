import { defineConfig } from 'astro/config';

// Prefix absolute URLs in rendered Markdown/MDX HTML (e.g. /images/...) with the base path
function prefixBaseInHtmlAttrs({ base = '/' } = {}) {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  const isAbsoluteHttp = (u) =>
    typeof u === 'string' && (/^(https?:)?\/\//.test(u) || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('tel:'));

  const prefix = (u) => {
    if (typeof u !== 'string') return u;
    if (isAbsoluteHttp(u)) return u;
    if (!u.startsWith('/')) return u;           // only rewrite root-absolute paths
    return `${normalizedBase}${u.replace(/^\/+/, '')}`;
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;

    // Rehype nodes: { type: 'element', tagName, properties, children }
    if (node.type === 'element' && node.properties) {
      // Fix images in markdown: <img src="/images/...">
      if (node.tagName === 'img' && node.properties.src) {
        node.properties.src = prefix(node.properties.src);
      }
      // Optional: also fix root-absolute links in markdown: <a href="/something">
      if (node.tagName === 'a' && node.properties.href) {
        node.properties.href = prefix(node.properties.href);
      }
      // Optional: fix <source srcset="/..."> etc if you ever use it
      if (node.properties.srcset) {
        const srcset = node.properties.srcset;
        if (typeof srcset === 'string') {
          node.properties.srcset = srcset
            .split(',')
            .map((part) => {
              const trimmed = part.trim();
              const [url, ...rest] = trimmed.split(/\s+/);
              return [prefix(url), ...rest].join(' ');
            })
            .join(', ');
        }
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };

  return () => (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://example.com',
  base: '/cobi/',
  markdown: {
    rehypePlugins: [prefixBaseInHtmlAttrs({ base: '/cobi/' })],
  },
});
