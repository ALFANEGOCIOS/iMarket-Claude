import nodemailer from "nodemailer";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function sameSecret(received, expected) {
  const a = Buffer.from(String(received || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

function template({ title, body, url }) {
  return `<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:Montserrat,Arial,sans-serif;color:#0B0B0F">
<div style="max-width:520px;margin:0 auto;padding:24px">
  <div style="font-weight:800;font-size:20px;margin-bottom:16px">iMarket</div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px">
    <h1 style="font-size:18px;margin:0 0 12px">${esc(title)}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 20px;white-space:pre-line">${esc(body)}</p>
    <a href="${esc(url)}" style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px">Abrir iMarket</a>
  </div>
  <p style="font-size:12px;color:#64748b;margin-top:16px">Recibes este aviso porque tienes una cuenta en iMarket. Puedes desactivarlo en Editar mis datos.</p>
</div></body></html>`;
}

export async function POST(request) {
  if (!sameSecret(request.headers.get("x-notify-secret"), process.env.NOTIFY_SECRET)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return Response.json({ error: "mail not configured" }, { status: 503 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const to = String(payload.to || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return Response.json({ error: "bad recipient" }, { status: 400 });
  }
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const path = String(payload.path || "/").startsWith("/") ? payload.path : "/";
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  try {
    await transport.sendMail({
      from: `iMarket <${user}>`,
      to,
      subject: String(payload.subject || "Novedades en iMarket").slice(0, 150),
      text: `${payload.title || ""}\n\n${payload.body || ""}\n\n${origin}${path}`,
      html: template({
        title: String(payload.title || "").slice(0, 200),
        body: String(payload.body || "").slice(0, 500),
        url: `${origin}${path}`,
      }),
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "send failed" }, { status: 502 });
  }
}
