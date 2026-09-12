// Temporaire, le temps des tests. Remettre j.raymond@ijraymond.com avant la livraison au client.
const RECIPIENT = 'colingoulethardy@gmail.com';
const SENDER = 'Site Isolations J. Raymond <soumissions@isolationsjraymond.com>';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
});

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = value => String(value).replace(/[&<>"]/g, c => ESCAPES[c]);

const LABEL = 'font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5c6a75';

export async function onRequestPost({ request, env }) {
    let data;
    try {
        data = await request.json();
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }

    // Honeypot: answer 200 so bots believe they succeeded and stop retrying.
    if (clean(data.site, 200)) return json({ ok: true }, 200);

    const nom = clean(data.nom, 120);
    const courriel = clean(data.courriel, 160);
    const telephone = clean(data.telephone, 60);
    const ville = clean(data.ville, 120);
    const type = clean(data.type, 60);
    const message = clean(data.message, 4000);

    if (!nom || !message || !EMAIL_PATTERN.test(courriel)) {
        return json({ error: 'missing_fields' }, 400);
    }

    if (!env.RESEND_API_KEY) {
        return json({ error: 'not_configured' }, 500);
    }

    const fields = [
        ['Courriel', courriel],
        ['Téléphone', telephone || '(non fourni)'],
        ['Ville', ville || '(non fournie)'],
        ['Type de projet', type || '(non précisé)']
    ];

    const text = [`Nom : ${nom}`, ...fields.map(([k, v]) => `${k} : ${v}`), '', 'Message :', message].join('\n');

    // Sent as HTML with an explicit charset: the plain-text part alone arrives
    // without one, and accented characters come through as replacement glyphs.
    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#10161c">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid rgba(16,22,28,.1);border-radius:8px">
<tr><td style="padding:26px 32px;border-bottom:3px solid #00aeef">
<div style="${LABEL}">Nouvelle demande de soumission</div>
<div style="font-size:20px;font-weight:700;margin-top:6px">${escapeHtml(nom)}</div>
</td></tr>
<tr><td style="padding:24px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${fields.map(([k, v]) => `<tr><td style="${LABEL};padding:7px 0;width:140px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:7px 0;font-size:15px">${escapeHtml(v)}</td></tr>`).join('')}
</table>
<div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(16,22,28,.1)">
<div style="${LABEL};margin-bottom:8px">Message</div>
<div style="font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</div>
</div>
</td></tr>
<tr><td style="padding:16px 32px;background:#f4f7f9;font-size:12px;color:#5c6a75;border-top:1px solid rgba(16,22,28,.1)">
Envoyé depuis le formulaire de isolationsjraymond.ca. Répondre à ce courriel écrit directement à ${escapeHtml(courriel)}.
</td></tr>
</table>
</body></html>`;

    const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: SENDER,
            to: [RECIPIENT],
            reply_to: courriel,
            subject: `Demande de soumission - ${nom}${ville ? ` (${ville})` : ''}`,
            text,
            html
        })
    });

    if (!sent.ok) {
        return json({ error: 'send_failed' }, 502);
    }

    return json({ ok: true }, 200);
}
