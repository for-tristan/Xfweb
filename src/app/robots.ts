export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: 'https://x-foundry.com/sitemap.xml',
  };
}
