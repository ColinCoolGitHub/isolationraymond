const RECIPIENT = 'j.raymond@ijraymond.com';
const SENDER = 'Site Isolations J. Raymond <soumissions@isolationsjraymond.com>';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
});

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

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

    const body = [
        `Nom : ${nom}`,
        `Courriel : ${courriel}`,
        `Téléphone : ${telephone || '(non fourni)'}`,
        `Ville : ${ville || '(non fournie)'}`,
        `Type de projet : ${type || '(non précisé)'}`,
        '',
        'Message :',
        message
    ].join('\n');

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
            text: body
        })
    });

    if (!sent.ok) {
        return json({ error: 'send_failed' }, 502);
    }

    return json({ ok: true }, 200);
}
