// Runs automatically after `react-scripts build` (see package.json "postbuild").
// Snapshots each public route with a headless browser so crawlers and link-preview
// bots that don't execute JavaScript still see real content and metadata, instead
// of the empty <div id="root"></div> a pure client-rendered SPA serves them.
//
// Flow: serve build/ locally -> visit each route with Puppeteer -> wait for data to
// load -> inject per-route <title>/OG/JSON-LD + a __PRELOADED_STATE__ script tag ->
// save the rendered HTML back into build/<route>/index.html.

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const CLIENT_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(CLIENT_DIR, 'build');
const PORT = 3000;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SITE_URL = 'https://cattleandcrop.com';

// Vercel's build container has no system libraries for a plain downloaded
// Chromium to run against (this is what broke the first deploy — Puppeteer's
// bundled Chromium failed with "error while loading shared libraries").
// @sparticuz/chromium ships a Chromium build compiled specifically for
// serverless/CI containers like Vercel's, so it's used there instead. That
// binary is Linux-only, so local `npm run build` on Windows/Mac falls back to
// a locally-installed Chrome — if none is found, prerendering is skipped
// (with a warning) rather than failing the whole local build.
const isVercel = !!process.env.VERCEL;

async function launchBrowser() {
  if (isVercel) {
    const chromium = require('@sparticuz/chromium');
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  const executablePath = candidates.find((p) => fs.existsSync(p));
  if (!executablePath) {
    throw new Error(
      'No local Chrome/Chromium found. Set PUPPETEER_EXECUTABLE_PATH to a Chrome ' +
      'install to prerender locally — this step always runs for real on Vercel.'
    );
  }
  return puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}

// Mirrors server/utils/sitemap.js's STATIC_PAGES path list — keep in sync if that changes.
// Titles for these are already set client-side by each page's <PageMeta>, captured
// as-is when Puppeteer snapshots the rendered DOM — no need to set them again here.
const STATIC_ROUTES = ['/', '/browse', '/about', '/contact', '/terms', '/privacy', '/trademark'];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const truncate = (str, max) => {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

// Serves build/ statically. Route-like paths (no file extension) fall back to
// 200.html — the pristine pre-prerender shell — for any route not yet snapshotted,
// mirroring vercel.json's catch-all rewrite so the crawl behaves like production.
function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const ext = path.extname(urlPath);

    let filePath;
    if (ext) {
      filePath = path.join(BUILD_DIR, urlPath);
    } else {
      const routeIndex = path.join(BUILD_DIR, urlPath, 'index.html');
      filePath = fs.existsSync(routeIndex) ? routeIndex : path.join(BUILD_DIR, '200.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(PORT, () => resolve(server));
  });
}

async function getDynamicRoutes() {
  const [farmsData, listingsData] = await Promise.all([
    fetchJson(`${API_URL}/farms`),
    fetchJson(`${API_URL}/listings`),
  ]);

  return [
    ...farmsData.farms.map((f) => ({ routePath: `/farms/${f._id}`, kind: 'farm', id: f._id })),
    ...listingsData.listings.map((l) => ({ routePath: `/listings/${l._id}`, kind: 'listing', id: l._id })),
  ];
}

async function buildFarmMeta(id) {
  const [farmData, listingsData, reviewsData] = await Promise.all([
    fetchJson(`${API_URL}/farms/${id}`),
    fetchJson(`${API_URL}/listings/farm/${id}`),
    fetchJson(`${API_URL}/reviews/farm/${id}`),
  ]);

  const farm = farmData.farm;
  const preloadedState = { farmId: id, farm, listings: listingsData.listings, reviews: reviewsData.reviews };
  const image = farm.photos?.[0] || `${SITE_URL}/og-image.jpg`;

  return {
    title: `${farm.farmName} | Cattle & Crop`,
    description: truncate(farm.description, 160),
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: farm.farmName,
      description: farm.description,
      image,
      address: {
        '@type': 'PostalAddress',
        addressLocality: farm.location?.city,
        addressRegion: farm.location?.state,
      },
    },
    preloadedState,
  };
}

// Home and Browse render real data too, so they need __PRELOADED_STATE__ for
// hydration to match — everything else is static markup with no fetch to preload.
// Home's TestimonialCarousel fetches independently of Home itself, so its data
// has to be preloaded too or hydration mismatches on the testimonial cards.
async function buildHomeMeta() {
  const [farmsData, listingsData, testimonialsData] = await Promise.all([
    fetchJson(`${API_URL}/farms`),
    fetchJson(`${API_URL}/listings`),
    fetchJson(`${API_URL}/testimonials`),
  ]);
  return {
    preloadedState: {
      farms: farmsData.farms,
      listings: listingsData.listings,
      testimonials: testimonialsData.testimonials,
    },
  };
}

async function buildBrowseMeta() {
  const farmsData = await fetchJson(`${API_URL}/farms?sort=newest`);
  return { preloadedState: { farms: farmsData.farms } };
}

async function buildListingMeta(id) {
  const listingData = await fetchJson(`${API_URL}/listings/${id}`);
  const listing = listingData.listing;
  const preloadedState = { listingId: id, listing };
  const image = listing.photos?.[0] || `${SITE_URL}/og-image.jpg`;

  return {
    title: `${listing.title} | Cattle & Crop`,
    description: truncate(listing.description, 160),
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      description: listing.description,
      image,
      ...(listing.farm?.farmName ? { brand: { '@type': 'Brand', name: listing.farm.farmName } } : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: listing.pricePerUnit,
        availability: listing.quantityAvailable > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
    preloadedState,
  };
}

// Runs in the browser context: overwrites the static, site-wide meta tags with
// this route's real data and embeds __PRELOADED_STATE__ for the client to hydrate from.
async function injectIntoPage(page, { canonical, meta }) {
  await page.evaluate(({ canonical, meta }) => {
    const upsertMeta = (selector, attrName, attrValue, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);

    if (meta?.title) {
      document.title = meta.title;
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    }
    if (meta?.description) {
      upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
    }
    if (meta?.image) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', meta.image);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', meta.image);
    }
    if (meta?.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(script);
    }
    if (meta?.preloadedState) {
      const stateScript = document.createElement('script');
      stateScript.id = '__PRELOADED_STATE__';
      stateScript.type = 'application/json';
      stateScript.textContent = JSON.stringify(meta.preloadedState);
      document.body.appendChild(stateScript);
    }
  }, { canonical, meta });
}

// React's own server renderer (renderToString) inserts an empty <!-- --> comment
// between two JSX children that both render as adjacent text nodes (e.g.
// `{city}, {state}` — two separate expressions next to each other), specifically
// so the browser's HTML parser can't merge them into one text node — hydration
// needs the same node boundaries React's virtual DOM expects. Puppeteer's
// page.content() has no such protection: it serializes an already-rendered live
// DOM, where the browser's own serializer already concatenates adjacent text
// nodes into one run, invisibly losing that boundary. Replicate React's own
// separator behavior here before saving, or any component with adjacent text/
// expression children hydrates as a mismatch once a fresh browser reparses it.
async function insertTextNodeSeparators(page) {
  await page.evaluate(() => {
    const walk = (node) => {
      const children = Array.from(node.childNodes);
      for (let i = 0; i < children.length - 1; i++) {
        if (children[i].nodeType === Node.TEXT_NODE && children[i + 1].nodeType === Node.TEXT_NODE) {
          node.insertBefore(document.createComment(''), children[i + 1]);
        }
      }
      children.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      });
    };
    walk(document.getElementById('root'));
  });
}

async function snapshotRoute(browser, routePath, meta) {
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${PORT}${routePath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    // Confirm no *__loading element is still showing (naming confirmed consistent
    // across Home/Browse/FarmProfile/ListingDetail)
    await page.waitForFunction(() => !document.querySelector('[class*="__loading"]'), { timeout: 15000 }).catch(() => {});
    // A parent's own loading flag clearing can itself trigger a child to mount and
    // fire its own fetch (e.g. Home's TestimonialCarousel, which only mounts once
    // Home stops loading) — wait for network to settle again so that isn't missed
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => {});

    await injectIntoPage(page, { canonical: `${SITE_URL}${routePath}`, meta });
    await insertTextNodeSeparators(page);

    const html = await page.content();
    const outDir = path.join(BUILD_DIR, routePath === '/' ? '' : routePath);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  } finally {
    await page.close();
  }
}

async function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error('[prerender] build/index.html not found — run `react-scripts build` first.');
    process.exit(1);
  }

  // Snapshot of the pristine shell, used as the SPA fallback for any route that
  // isn't prerendered (protected pages like /dashboard, /cart, /login, etc.)
  fs.copyFileSync(path.join(BUILD_DIR, 'index.html'), path.join(BUILD_DIR, '200.html'));

  const server = await startServer();

  let browser;
  try {
    browser = await launchBrowser();
  } catch (err) {
    server.close();
    if (isVercel) throw err; // must work on Vercel — a real build failure
    console.warn(`[prerender] Skipping prerender locally: ${err.message}`);
    return;
  }

  const results = [];

  try {
    for (const routePath of STATIC_ROUTES) {
      try {
        let meta;
        if (routePath === '/') meta = await buildHomeMeta().catch(() => undefined);
        else if (routePath === '/browse') meta = await buildBrowseMeta().catch(() => undefined);
        await snapshotRoute(browser, routePath, meta);
        results.push({ routePath, status: 'ok' });
      } catch (err) {
        results.push({ routePath, status: 'failed', error: err.message });
      }
    }

    let dynamicRoutes = [];
    try {
      dynamicRoutes = await getDynamicRoutes();
    } catch (err) {
      console.warn(`[prerender] Could not fetch farms/listings from ${API_URL} — skipping dynamic routes: ${err.message}`);
    }

    for (const { routePath, kind, id } of dynamicRoutes) {
      try {
        const meta = kind === 'farm' ? await buildFarmMeta(id) : await buildListingMeta(id);
        await snapshotRoute(browser, routePath, meta);
        results.push({ routePath, status: 'ok' });
      } catch (err) {
        results.push({ routePath, status: 'failed', error: err.message });
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n[prerender] Summary:');
  for (const r of results) {
    console.log(`  ${r.status === 'ok' ? '✓' : '✗'} ${r.routePath}${r.error ? ` — ${r.error}` : ''}`);
  }
  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`[prerender] ${results.length - failed}/${results.length} routes prerendered.`);
}

main().catch((err) => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});
