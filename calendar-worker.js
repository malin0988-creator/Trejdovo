// Trejdovo Calendar Worker — Finnhub Economic Calendar
// Fetches Finnhub economic calendar and returns a normalised array with CORS headers.
// Supports ?week=next for next-week data (default = current week).

const FINNHUB_TOKEN = 'd7ii32pr01qn2qau4770d7ii32pr01qn2qau477g';
const FINNHUB_BASE  = 'https://finnhub.io/api/v1/calendar/economic';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isoDate(d) {
  return d.toISOString().substring(0, 10);
}

// Returns { from, to } as YYYY-MM-DD strings for Mon–Sun of the target week.
// weekOffset 0 = current week, 1 = next week.
function weekRange(weekOffset) {
  const now = new Date();
  const daysSinceMon = (now.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(now.getTime() - daysSinceMon * 86_400_000 + weekOffset * 7 * 86_400_000);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);
  return { from: isoDate(monday), to: isoDate(sunday) };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = searchParams.get('week') === 'next' ? 1 : 0;
    const { from, to } = weekRange(weekOffset);

    const url = `${FINNHUB_BASE}?from=${from}&to=${to}&token=${FINNHUB_TOKEN}`;

    try {
      const upstream = await fetch(url, {
        headers: { 'User-Agent': 'Trejdovo/1.0' },
        cf: { cacheTtl: 300 },
      });

      if (!upstream.ok) {
        return new Response(
          JSON.stringify({ error: `Finnhub returned ${upstream.status}` }),
          { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
        );
      }

      const data = await upstream.json();
      // Finnhub wraps events in { economicCalendar: [...] }
      const events = data?.economicCalendar ?? [];

      return new Response(JSON.stringify(events), {
        status: 200,
        headers: {
          ...CORS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Worker fetch failed' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }
  },
};
