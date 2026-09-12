// Probe for an external uptime monitor. Pinging the homepage only proves the CDN
// is up, which it almost always is; what actually breaks is the Function layer,
// a rotated Resend key or a missing Turnstile secret. Those fail silently today:
// the visitor sees "L'envoi a echoue" and nobody is told. This answers 503 in
// that case so the monitor raises an alert before a lead is lost.
const REQUIRED = ['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY'];

export async function onRequestGet({ env }) {
    const missing = REQUIRED.filter(name => !env[name]);

    // Names only, never values: this endpoint is public.
    return new Response(JSON.stringify({
        ok: missing.length === 0,
        missing,
        checked: new Date().toISOString()
    }), {
        status: missing.length === 0 ? 200 : 503,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        }
    });
}
