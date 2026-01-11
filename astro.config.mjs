import { defineConfig } from 'astro/config';

function prefixBaseInMarkdownImages(base) {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  const prefix = (u) => {
    if (typeof u !== 'string') return u;
    if (/^(https?:)?\/\//.test(u) || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('tel:')) return u;
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
    }

    if (Array.isArray(node.children)) node.children.forEach(walk);
  };

  return () => (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://example.com',
  base: '/cobi/',
  markdown: {
    rehypePlugins: [prefixBaseInMarkdownImages('/cobi/')],
  },
});
