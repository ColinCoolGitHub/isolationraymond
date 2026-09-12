// Resend tells us here when a message it accepted never reached anybody: a hard
// bounce, a send failure, a delay, or a spam complaint. Without this the site
// answers 200 to the visitor and the lead disappears with nobody informed.
//
// Alerts go to the developer, not to the contractor: a bounce is a plumbing
// problem, and Jonathan can act on none of it. Keep this address separate from
// RECIPIENT in soumission.js when that one moves over to him.
const ALERT_RECIPIENT = 'colingoulethardy@gmail.com';
const SENDER = 'Alertes Site J. Raymond <soumissions@isolationsjraymond.com>';

// Anything else (delivered, opened, clicked) is noise for a contact form.
const ALERTING = {
    'email.bounced': 'Courriel rejete definitivement (bounce)',
    'email.failed': "Echec d'envoi",
    'email.delivery_delayed': 'Livraison retardee',
    'email.complained': 'Marque comme pourriel'
};

const TOLERANCE_SECONDS = 300;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = value => String(value).replace(/[&<>"]/g, c => ESCAPES[c]);

const decodeBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));

// Timing-safe: bail on length first, then OR every byte difference together so
// the loop always runs the same number of comparisons.
function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

// Svix scheme, implemented by hand rather than pulling the library into a Pages
// Function: HMAC-SHA256 over "id.timestamp.rawBody", keyed with the secret after
// its whsec_ prefix is stripped and the rest base64 decoded.
async function isSignatureValid(secret, id, timestamp, rawBody, header) {
    const key = await crypto.subtle.importKey(
        'raw',
        decodeBase64(secret.replace(/^whsec_/, '')),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`));
    const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));

    // The header carries space separated "v1,<signature>" entries; during a
    // secret rotation more than one is present and any of them may match.
    return header.split(' ').some(entry => {
        const [version, signature] = entry.split(',');
        return version === 'v1' && signature && safeEqual(signature, expected);
    });
}

export async function onRequestPost({ request, env }) {
    if (!env.RESEND_WEBHOOK_SECRET || !env.RESEND_API_KEY) {
        return new Response('not configured', { status: 500 });
    }

    const id = request.headers.get('svix-id');
    const timestamp = request.headers.get('svix-timestamp');
    const signature = request.headers.get('svix-signature');

    if (!id || !timestamp || !signature) {
        return new Response('missing signature headers', { status: 400 });
    }

    // Without this window a captured request could be replayed indefinitely.
    if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > TOLERANCE_SECONDS) {
        return new Response('timestamp outside tolerance', { status: 400 });
    }

    // The signature covers the bytes as sent, so the raw text has to be read
    // before any parsing; re-serialising the JSON would change it.
    const rawBody = await request.text();

    if (!await isSignatureValid(env.RESEND_WEBHOOK_SECRET, id, timestamp, rawBody, signature)) {
        return new Response('invalid signature', { status: 401 });
    }

    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return new Response('invalid body', { status: 400 });
    }

    const label = ALERTING[event.type];

    // Acknowledge everything: a non 200 makes Resend retry an event we simply
    // do not care about.
    if (!label) return new Response('ignored', { status: 200 });

    const data = event.data || {};
    const rows = [
        ['Evenement', event.type],
        ['Destinataire', Array.isArray(data.to) ? data.to.join(', ') : data.to || '(inconnu)'],
        ['Sujet', data.subject || '(aucun)'],
        ['Survenu le', event.created_at || new Date().toISOString()],
        ['Detail', data.bounce?.message || data.failed?.reason || '(aucun detail fourni)']
    ];

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: SENDER,
            to: [ALERT_RECIPIENT],
            subject: `[Alerte] ${label} - isolationsjraymond.ca`,
            text: rows.map(([k, v]) => `${k} : ${v}`).join('\n'),
            html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#10161c">
<h2 style="font-size:17px">${escapeHtml(label)}</h2>
<table cellpadding="0" cellspacing="0">
${rows.map(([k, v]) => `<tr><td style="padding:5px 14px 5px 0;color:#5c6a75;vertical-align:top">${escapeHtml(k)}</td><td style="padding:5px 0">${escapeHtml(v)}</td></tr>`).join('')}
</table>
<p style="font-size:13px;color:#5c6a75">Une demande de soumission n'a peut-etre pas ete recue. Verifier le tableau de bord Resend.</p>
</body></html>`
        })
    }).catch(() => { /* the alert itself failing must not trigger a retry storm */ });

    return new Response('ok', { status: 200 });
}
