// Envío de correos vía Microsoft Graph API (OAuth2 client credentials),
// en vez de SMTP básico: el tenant de Microsoft 365 del usuario tiene la
// autenticación básica SMTP bloqueada a nivel organización.

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.value;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Faltan las variables de entorno AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET.');
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const data = await res.json();
  if (!res.ok) throw new Error(`Error obteniendo token de Microsoft: ${data.error_description || data.error || res.statusText}`);

  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

function renderTemplate(texto, vars) {
  let out = texto || '';
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{${key}}`, 'g'), value || '');
  }
  return out;
}

function textoAHtml(texto) {
  const esc = (texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc.replace(/\n/g, '<br>');
}

async function sendEmail({ to, subject, cuerpo }) {
  const sender = process.env.EMAIL_SENDER;
  if (!sender) throw new Error('Falta la variable de entorno EMAIL_SENDER.');

  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: textoAHtml(cuerpo) },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Error enviando el correo: ${(data.error && data.error.message) || res.statusText}`);
  }
}

module.exports = { sendEmail, renderTemplate };
