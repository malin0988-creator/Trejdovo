// Trejdovo Calendar Worker
// Proxies Forex Factory economic calendar JSON with proper CORS headers.
// Deploy to Cloudflare Workers free tier — see README-CALENDAR.md
//
// Supports ?week=next to fetch next week's calendar.
// Default (no param or ?week=this) fetches current week.

const UPSTREAM_THIS = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const UPSTREAM_NEXT = 'https://nfs.faireconomy.media/ff_calendar_nextweek.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const upstream_url = week === 'next' ? UPSTREAM_NEXT : UPSTREAM_THIS;

    try {
      const upstream = await fetch(upstream_url, {
        headers: { 'User-Agent': 'Trejdovo/1.0' },
        cf: { cacheTtl: 300 },
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
