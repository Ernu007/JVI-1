/* =========================================================
   JVI Carga & Serviços — Netlify Function: envio do pedido
   ------------------------------------------------------------
   Recebe o Airwaybill do site e distribui por:
     1. E-mail          -> RESEND_API_KEY (ou SMTP se configurado)
     2. Google Sheets   -> SHEET_ID + GOOGLE_SERVICE_ACCOUNT_JSON
   Nenhum dos dois é obrigatório: se faltarem chaves, responde 200
   com os canais que conseguiu usar, e o front-end segue para o
   WhatsApp/email do cliente — nunca se perde um lead.

   Variáveis de ambiente (Netlify > Site settings > Environment):
     RESEND_API_KEY=re_xxxxxxxx
     EMAIL_DE=Orcamentos <orcamentos@seudominio.com>   (opcional)
     SHEET_ID=1AbCdEf...
     GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ========================================================= */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DESTINO = process.env.EMAIL_PARA || 'jvicargaservicos@gmail.com';

const CAMPOS = [
  ['emissor_nome', 'Emissor'],
  ['emissor_endereco', 'Endereço do emissor'],
  ['emissor_contacto', 'Contactos do emissor'],
  ['emissor_email', 'Email do emissor'],
  ['volumes', 'N.º de volumes'],
  ['peso', 'Peso bruto (kg)'],
  ['dimensao_cx', 'Comprimento (cm)'],
  ['dimensao_cy', 'Largura (cm)'],
  ['dimensao_cz', 'Altura (cm)'],
  ['tipo_carga', 'Tipo de carga'],
  ['descricao', 'Descrição das mercadorias'],
  ['receptor_nome', 'Receptor'],
  ['receptor_endereco', 'Endereço de destino'],
  ['receptor_contacto', 'Contactos do receptor'],
  ['receptor_telefone', 'Telefone do destinatário'],
  ['valor_cobrar', 'Valor a cobrar (MZN)'],
  ['iva', 'IVA 16% (MZN)'],
  ['valor_extenso', 'Valor por extenso'],
  ['pagamento', 'Forma de pagamento'],
  ['cheque_num', 'N.º do cheque'],
  ['banco', 'Banco'],
  ['observacoes', 'Observações'],
];

function textoWA(d) {
  return [
    '*Pedido de orçamento — JVI Carga & Serviços*',
    '',
    `*Emissor:* ${d.emissor_nome || '—'}`,
    `*Contacto:* ${d.emissor_contacto || '—'}`,
    `*Carga:* ${d.volumes || '—'} vol · ${d.peso || '—'} kg`,
    `*Descrição:* ${d.descricao || '—'}`,
    `*Destino:* ${d.receptor_nome || '—'}`,
    `*Morada:* ${d.receptor_endereco || '—'}`,
    d.valor_cobrar ? `*Valor estimado:* ${d.valor_cobrar} MZN` : '',
  ].filter(Boolean).join('\n');
}

function textoEmail(d) {
  const linhas = CAMPOS.filter(([k]) => d[k]).map(([k, label]) => `${label}: ${d[k]}`);
  return {
    subject: `Novo pedido de orçamento — ${d.emissor_nome || 'Site'}`,
    text: `Pedido de orçamento recebido pelo site.\n\n${linhas.join('\n')}\n\n---\nCanal pedido: ${d.canal || 'ambos'}`,
    html: `<h2>Novo pedido de orçamento</h2>
      <p>Recebido pelo site da JVI Carga &amp; Serviços.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif">
      ${CAMPOS.filter(([k]) => d[k])
        .map(([k, label]) => `<tr><td style="border:1px solid #ddd;background:#f4f4f4"><b>${label}</b></td><td style="border:1px solid #ddd">${String(d[k])}</td></tr>`)
        .join('')}
      </table>
      <p style="color:#666;font-size:12px">Canal pedido: ${d.canal || 'ambos'}</p>`,
  };
}

/* ---------- E-mail via Resend ---------- */
async function enviarEmail(d) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, motivo: 'RESEND_API_KEY ausente' };
  const { subject, text, html } = textoEmail(d);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_DE || 'JVI Orcamentos <onboarding@resend.dev>',
      to: [DESTINO],
      reply_to: d.emissor_email || undefined,
      subject,
      text,
      html,
    }),
  });
  if (!r.ok) return { ok: false, motivo: `Resend ${r.status}: ${(await r.text()).slice(0, 200)}` };
  return { ok: true };
}

/* ---------- Google Sheets via REST + JWT (sem dependencias) ---------- */
import crypto from 'node:crypto';

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

async function tokenSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return { err: 'GOOGLE_SERVICE_ACCOUNT_JSON ausente' };
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    return { err: 'GOOGLE_SERVICE_ACCOUNT_JSON invalido (JSON)' };
  }

  const agora = Math.floor(Date.now() / 1000);
  const cab = { alg: 'RS256', typ: 'JWT' };
  const corpo = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: agora,
    exp: agora + 3600,
  };
  const assinar = (msg) => crypto.createSign('RSA-SHA256').update(msg).sign(sa.private_key, 'base64url');
  const jwt = `${b64url(JSON.stringify(cab))}.${b64url(JSON.stringify(corpo))}.${assinar(
    `${b64url(JSON.stringify(cab))}.${b64url(JSON.stringify(corpo))}`
  )}`;

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!r.ok) return { err: `token ${r.status}: ${(await r.text()).slice(0, 200)}` };
  return { token: (await r.json()).access_token };
}

async function gravarSheet(d) {
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) return { ok: false, motivo: 'SHEET_ID ausente' };
  const auth = await tokenSheets();
  if (auth.err) return { ok: false, motivo: auth.err };

  const linha = [
    new Date().toISOString(),
    ...CAMPOS.map(([k]) => d[k] ?? ''),
    d.canal || 'ambos',
  ];

  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent('Pedidos!A:AZ')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [linha] }),
    }
  );
  if (!r.ok) return { ok: false, motivo: `sheets ${r.status}: ${(await r.text()).slice(0, 200)}` };
  return { ok: true };
}

/* ---------- Handler ---------- */
export default async (req) => {
  if (req.method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (req.method !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ erro: 'Método não permitido' }) };
  }

  let d;
  try {
    d = JSON.parse(req.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ erro: 'JSON invalido' }) };
  }

  if (!d.emissor_nome || !d.receptor_nome || !d.peso) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ erro: 'Campos obrigatorios em falta' }),
    };
  }

  const [email, sheet] = await Promise.all([
    enviarEmail(d).catch((e) => ({ ok: false, motivo: String(e) })),
    gravarSheet(d).catch((e) => ({ ok: false, motivo: String(e) })),
  ]);

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: email.ok || sheet.ok,
      email: email.ok,
      sheet: sheet.ok,
      diagnostico: { email: email.motivo, sheet: sheet.motivo },
    }),
  };
};

export { textoWA };
