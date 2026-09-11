// Pages _redirects cannot do domain-level redirects, so the alternate domains are
// consolidated onto the canonical one here, to keep search ranking on one host.
const CANONICAL_HOST = 'isolationsjraymond.ca';
const ALIASES = ['isolationsjraymond.com', 'www.isolationsjraymond.com', 'www.isolationsjraymond.ca'];

export async function onRequest(context) {
    const url = new URL(context.request.url);

    if (ALIASES.includes(url.hostname)) {
        url.hostname = CANONICAL_HOST;
        return Response.redirect(url.toString(), 301);
    }

    // The Pages output directory is the repo root, so functions/ would otherwise
    // be uploaded and served as static assets alongside the site.
    if (url.pathname.startsWith('/functions/')) {
        return new Response('Not found', { status: 404 });
    }

    return context.next();
}
