// Trejdovo Calendar Worker
// Proxies Forex Factory economic calendar JSON with proper CORS headers.
// Deploy to Cloudflare Workers free tier — see README-CALENDAR.md

const UPSTREAM = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      const upstream = await fetch(UPSTREAM, {
        headers: { 'User-Agent': 'Trejdovo/1.0' },
        cf: { cacheTtl: 300 }, // cache 5 minutes in Cloudflare edge
      });

      if (!upstream.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
          { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const data = await upstream.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Worker fetch failed' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  },
};
