import type { Transporter } from 'nodemailer';

export type MailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: Transporter | null = null;

async function getTransport(): Promise<Transporter> {
  if (transporter) return transporter;

  let nodemailer: any;
  try {
    nodemailer = await import('nodemailer');
  } catch {
    nodemailer = null;
  }

  if (!nodemailer) {
    transporter = {
      sendMail: async (opts: any) => {
        console.log('[mailer] dev payload', opts);
        return { messageId: 'dev' };
      },
    } as Transporter;
    console.warn('[mailer] nodemailer not installed; using console transport');
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    console.warn('[mailer] Using JSON transport (DEV). Set SMTP_* env to send real emails.');
  } else {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter!;
}

export async function sendMail(mail: MailInput) {
  const from = process.env.MAIL_FROM || 'no-reply@salonmanager.app';
  try {
    const t = await getTransport();
    const info = await t.sendMail({ from, ...mail });
    if ('messageId' in info) {
      console.log('[mailer] sent', info.messageId);
    } else {
      console.log('[mailer] dev payload', info);
    }
  } catch (err) {
    console.warn('[mailer] send failed', err);
  }
}

const baseStyle = `
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
`;
const brand = { gold: '#FFD700', black: '#000000' };

function layoutHtml(title: string, body: string) {
  return `
  <div style="${baseStyle};background:#0b0b0b;color:#eee;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#111;border:1px solid #222;border-radius:12px;overflow:hidden">
      <div style="background:${brand.black};color:${brand.gold};padding:16px 20px;font-weight:600;font-size:16px">SalonManager</div>
      <div style="padding:20px">
        <h1 style="font-size:20px;margin:0 0 12px 0;color:${brand.gold}">${title}</h1>
        <div style="line-height:1.6;color:#ddd">${body}</div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #222;color:#888;font-size:12px">
        Diese Nachricht wurde automatisch versendet. Bitte nicht direkt antworten.
      </div>
    </div>
  </div>`;
}

function kv(label: string, value: string) {
  return `<div style="margin:4px 0"><span style="color:#aaa">${label}:</span> <strong style="color:#fff">${value}</strong></div>`;
}

export function tplNewBookingToSalon(params: {
  salonName: string;
  serviceTitle: string;
  priceEUR: string;
  date: string;
  time: string;
  stylist?: string | null;
  note?: string | null;
  manageUrl?: string | null;
}) {
  const html = layoutHtml(
    `Neue Buchung · ${params.salonName}`,
    `
      <p>Es liegt eine <strong>neue Buchungsanfrage</strong> vor.</p>
      ${kv('Leistung', `${params.serviceTitle} (${params.priceEUR})`)}
      ${kv('Datum', params.date)}
      ${kv('Zeit', params.time)}
      ${params.stylist ? kv('Stylist', params.stylist) : ''}
      ${params.note ? kv('Notiz', params.note) : ''}
      <div style="margin-top:12px">
        ${params.manageUrl ? `<a href="${params.manageUrl}" style="background:${brand.gold};color:${brand.black};text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block;font-weight:600">Heute-Board öffnen</a>` : ''}
      </div>
    `
  );
  const text =
`Neue Buchung · ${params.salonName}
Leistung: ${params.serviceTitle} (${params.priceEUR})
Datum: ${params.date}
Zeit: ${params.time}
${params.stylist ? `Stylist: ${params.stylist}\n` : ''}${params.note ? `Notiz: ${params.note}\n` : ''}${params.manageUrl ? `Verwalten: ${params.manageUrl}\n` : ''}`;
  return { html, text };
}

export function tplBookingStatusToCustomer(params: {
  status: 'confirmed' | 'declined' | 'cancelled';
  serviceTitle: string;
  date: string;
  time: string;
  salonName: string;
}) {
  const titleMap = {
    confirmed: 'Termin bestätigt',
    declined: 'Termin abgelehnt',
    cancelled: 'Termin storniert',
  } as const;
  const html = layoutHtml(
    `${titleMap[params.status]} · ${params.salonName}`,
    `
      ${kv('Status', titleMap[params.status])}
      ${kv('Leistung', params.serviceTitle)}
      ${kv('Datum', params.date)}
      ${kv('Zeit', params.time)}
      <p style="margin-top:12px">Vielen Dank!</p>
    `
  );
  const text =
`${titleMap[params.status]} · ${params.salonName}
Leistung: ${params.serviceTitle}
Datum: ${params.date}
Zeit: ${params.time}`;
  return { html, text };
}
