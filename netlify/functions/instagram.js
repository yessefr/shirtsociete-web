/*  netlify/functions/instagram.js
 *  ─────────────────────────────────────────────────────────────────────
 *  Serves the live follower count and the most recent reels for the
 *  website, so no Instagram token ever reaches the browser.
 *
 *  GET /.netlify/functions/instagram
 *    → { username, followersCount, mediaCount, reels: [...], fetchedAt }
 *
 *  ENV — pick ONE of the two routes:
 *
 *    Route A · Facebook Login (recommended, the token does not expire)
 *      IG_USER_ID       the Instagram professional account id (17841...)
 *      IG_ACCESS_TOKEN  a long-lived PAGE token
 *
 *    Route B · Instagram Login
 *      IG_ACCESS_TOKEN  a long-lived Instagram user token
 *      (leave IG_USER_ID empty — the function calls /me instead)
 *      Tokens on this route die after 60 days. The function refreshes
 *      itself if the two DB_* variables below are set.
 *
 *  OPTIONAL
 *    DB_URL, DB_SECRET   already in your Netlify env. If present, the
 *                        refreshed token is stored in the ig_token table
 *                        so route B never expires on you. Without them,
 *                        route B needs a new token by hand every 60 days.
 *    IG_CACHE_SECONDS    default 300. Instagram allows 200 calls an hour
 *                        per account; caching keeps us far below that no
 *                        matter how many people are on the site.
 */

const GRAPH_VERSION = 'v21.0';

// Instagram tokens last 60 days and must be at least 24 hours old to be
// refreshed. Refreshing at 45 days leaves room for a second attempt if the
// first one fails — a token that dies cannot be recovered without logging
// back in by hand.
const REFRESH_AFTER_DAYS = 45;

// Warm invocations reuse this, so a burst of visitors costs one API call.
let cache = { at: 0, body: null };

const json = (statusCode, body, maxAge) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': maxAge
      ? `public, max-age=${maxAge}, stale-while-revalidate=600`
      : 'no-store',
  },
  body: JSON.stringify(body),
});

/* ── token storage (optional, route B only) ────────────────────────── */

async function dbGetToken() {
  if (!process.env.DB_URL || !process.env.DB_SECRET) return null;
  try {
    const r = await fetch(
      `${process.env.DB_URL}/rest/v1/ig_token?select=access_token,refreshed_at&id=eq.1`,
      {
        headers: {
          apikey: process.env.DB_SECRET,
          Authorization: `Bearer ${process.env.DB_SECRET}`,
        },
      }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

async function dbPutToken(token) {
  if (!process.env.DB_URL || !process.env.DB_SECRET) return;
  try {
    await fetch(`${process.env.DB_URL}/rest/v1/ig_token`, {
      method: 'POST',
      headers: {
        apikey: process.env.DB_SECRET,
        Authorization: `Bearer ${process.env.DB_SECRET}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 1,
        access_token: token,
        refreshed_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    /* storing is best effort — the call itself still works */
  }
}

function daysSince(iso) {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  if (!isFinite(t)) return Infinity;
  return (Date.now() - t) / 86400000;
}

async function resolveToken() {
  const envToken = process.env.IG_ACCESS_TOKEN;
  // Page tokens (route A) do not expire, so there is nothing to refresh.
  if (process.env.IG_USER_ID) return envToken;

  const row = await dbGetToken();
  let token = (row && row.access_token) || envToken;
  if (!token) return null;

  const age = row ? daysSince(row.refreshed_at) : Infinity;
  if (age < REFRESH_AFTER_DAYS) return token;

  try {
    const r = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
    );
    const data = await r.json();
    if (r.ok && data && data.access_token) {
      token = data.access_token;
      await dbPutToken(token);
    }
  } catch (e) {
    /* keep using the current token; it is still valid until day 60 */
  }
  return token;
}

/* ── the Instagram calls ───────────────────────────────────────────── */

// media_product_type is what separates a reel from an ordinary feed video,
// but it is not supported on every route. Asking for a field a route does not
// know rejects the WHOLE request, so we ask for it first and fall back to the
// fields every route supports if that fails.
const MEDIA_FIELDS_FULL  = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
const MEDIA_FIELDS_BASIC = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

function endpoints(token) {
  const igUser = process.env.IG_USER_ID;
  const t = encodeURIComponent(token);
  const base = igUser
    ? `https://graph.facebook.com/${GRAPH_VERSION}/${igUser}`
    : `https://graph.instagram.com/${GRAPH_VERSION}/me`;
  return {
    profile: `${base}?fields=username,followers_count,media_count&access_token=${t}`,
    media: (fields) => `${base}/media?fields=${fields}&limit=25&access_token=${t}`,
  };
}

async function fetchMedia(urls) {
  let res = await fetch(urls.media(MEDIA_FIELDS_FULL));
  if (res.ok) return res.json();
  // Retry without the field that not every route knows.
  res = await fetch(urls.media(MEDIA_FIELDS_BASIC));
  if (res.ok) return res.json();
  return { data: [] };
}

// A reel comes back as media_type VIDEO. media_product_type separates a reel
// from an ordinary feed video, but it is not present on every account, so
// absence is treated as "keep it" rather than "drop it".
//
// media_url is NOT required. Instagram leaves the video file out of the answer
// for reels that use licensed music, so insisting on it made the newest reels
// vanish from the site. Those come back with a null mediaUrl and the website
// shows their thumbnail as a link to the real reel instead. A reel without
// either a file or a thumbnail has nothing to show, so that one is dropped.
function isReel(m) {
  if (!m || String(m.media_type).toUpperCase() !== 'VIDEO') return false;
  if (!m.media_url && !m.thumbnail_url) return false;
  const p = m.media_product_type ? String(m.media_product_type).toUpperCase() : '';
  return p !== 'AD';
}

function shapeReel(m) {
  return {
    id: m.id,
    mediaUrl: m.media_url || null,
    thumbnailUrl: m.thumbnail_url || null,
    permalink: m.permalink || null,
    caption: (m.caption || '').split('\n')[0].slice(0, 180),
    timestamp: m.timestamp || null,
    isReel: String(m.media_product_type || '').toUpperCase() === 'REELS',
  };
}

exports.handler = async function (event) {
  if (event && event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  const cacheSeconds = parseInt(process.env.IG_CACHE_SECONDS || '300', 10);
  if (cache.body && Date.now() - cache.at < cacheSeconds * 1000) {
    return json(200, cache.body, cacheSeconds);
  }

  const token = await resolveToken();
  if (!token) {
    return json(500, { error: 'IG_ACCESS_TOKEN is not set' });
  }

  try {
    const urls = endpoints(token);
    const [pRes, media] = await Promise.all([fetch(urls.profile), fetchMedia(urls)]);
    const profile = await pRes.json();

    if (!pRes.ok) {
      const msg = (profile && profile.error && profile.error.message) || 'profile request failed';
      // Serve the last good answer rather than a blank number if we have one.
      if (cache.body) return json(200, cache.body, 60);
      return json(502, { error: msg });
    }

    const reels = ((media && media.data) || []).filter(isReel).map(shapeReel).slice(0, 8);

    const body = {
      username: profile.username || null,
      followersCount:
        typeof profile.followers_count === 'number' ? profile.followers_count : null,
      mediaCount: typeof profile.media_count === 'number' ? profile.media_count : null,
      reels,
      fetchedAt: new Date().toISOString(),
    };

    cache = { at: Date.now(), body };
    return json(200, body, cacheSeconds);
  } catch (err) {
    if (cache.body) return json(200, cache.body, 60);
    return json(502, { error: String((err && err.message) || err) });
  }
};
