// sitemap.js — builds the XML sitemap listing every public page: the static
// marketing pages plus one entry per active farm and available listing.
//
// Served at the site root (/sitemap.xml, not /api/sitemap.xml) since that's
// where search engines and robots.txt expect it. In production the client
// domain (cattleandcrop.com) is a separate static site from this API, so a
// Vercel rewrite proxies cattleandcrop.com/sitemap.xml to this endpoint.

const Farm = require('../models/Farm');
const Listing = require('../models/Listing');

// A sitemap describes the public, external-facing site, so this is always
// the real production domain — never derived from CLIENT_URL, which is
// meant to vary per environment (e.g. localhost in local dev) and would
// otherwise leak a non-public URL into search engines
const CLIENT_URL = 'https://cattleandcrop.com';

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/browse', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.1' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.1' },
  { path: '/trademark', changefreq: 'yearly', priority: '0.1' },
];

const escapeXml = (str) =>
  str.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[c]));

const urlEntry = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `
    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `
    <priority>${priority}</priority>` : ''}
  </url>`;

// Both models only track createdAt (no updatedAt) — using it for <lastmod>
// is an approximation that doesn't reflect later edits, but is accurate
// enough for a sitemap and avoids adding timestamps: true to either schema
const isoDate = (date) => date.toISOString().split('T')[0];

const generateSitemap = async () => {
  const entries = STATIC_PAGES.map((page) =>
    urlEntry({ loc: `${CLIENT_URL}${page.path}`, changefreq: page.changefreq, priority: page.priority })
  );

  const [farms, listings] = await Promise.all([
    Farm.find({ isActive: true }).select('_id createdAt'),
    Listing.find({ isAvailable: true }).select('_id createdAt'),
  ]);

  for (const farm of farms) {
    entries.push(urlEntry({
      loc: `${CLIENT_URL}/farms/${farm._id}`,
      lastmod: isoDate(farm.createdAt),
      changefreq: 'weekly',
      priority: '0.7',
    }));
  }

  for (const listing of listings) {
    entries.push(urlEntry({
      loc: `${CLIENT_URL}/listings/${listing._id}`,
      lastmod: isoDate(listing.createdAt),
      changefreq: 'weekly',
      priority: '0.6',
    }));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}\n</urlset>\n`;
};

module.exports = generateSitemap;
