import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fetches the text content of a clinical guideline page from cr.minzdrav.gov.ru or rosoncoweb.ru
 * by making a real HTTP request to the page.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate that the URL is from an approved domain
    const allowedDomains = ['cr.minzdrav.gov.ru', 'rosoncoweb.ru', 'nccn.org'];
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(d => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d));
    if (!isAllowed) {
      return Response.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OncologyHelper/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return Response.json({ error: `Failed to fetch: ${response.status}`, text: '' }, { status: 200 });
    }

    const html = await response.text();

    // Strip HTML tags to get plain text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s{3,}/g, '\n\n')
      .trim();

    // Limit to ~60000 chars to stay within LLM context limits
    const truncated = text.length > 60000 ? text.slice(0, 60000) + '\n\n[...документ обрезан для обработки...]' : text;

    return Response.json({ text: truncated, url, length: text.length });
  } catch (error) {
    return Response.json({ error: error.message, text: '' }, { status: 200 });
  }
});