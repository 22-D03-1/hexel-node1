// app/api/contact/route.js
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CORS: erlaubte Origins */
const ALLOWED_ORIGINS = new Set([
  "https://hexel-tech.de",
  "https://www.hexel-tech.de",
  "https://hexel-node1.vercel.app", 

function corsHeaders(origin = "") {
  const allowOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://hexel-tech.de";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** PRE-FLIGHT */
export async function OPTIONS(req) {
  const origin = req.headers.get("origin") || "";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/** kleine Helfer */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(v || "").trim());
const isPhone = (v) => !v || /^[+()0-9\s-]{6,}$/.test(String(v).trim());

/** POST */
export async function POST(req) {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ message: "Ungültige Anfrage (JSON)." }), {
      status: 400,
      headers,
    });
  }

  // Honeypot (Spam trap)
  if (typeof body?.website === "string" && body.website.trim().length > 0) {
    return new Response(JSON.stringify({ message: "Danke! Wir melden uns kurzfristig." }), {
      status: 200,
      headers,
    });
  }

  // Felder wie deine Komponente sie sendet
  let {
    name,
    email,
    company,
    phone,
    subject,
    projectType,
    budget,
    message,
    consent,
  } = body || {};

  // normalize
  name = String(name || "").trim();
  email = String(email || "").trim();
  company = String(company || "").trim();
  phone = String(phone || "").trim();
  subject = String(subject || "").trim();
  projectType = String(projectType || "").trim();
  budget = String(budget || "").trim();
  message = String(message || "").trim();

  // Limits (sicher)
  if (name.length > 80) name = name.slice(0, 80);
  if (email.length > 140) email = email.slice(0, 140);
  if (company.length > 80) company = company.slice(0, 80);
  if (phone.length > 40) phone = phone.slice(0, 40);
  if (subject.length > 120) subject = subject.slice(0, 120);
  if (message.length > 5000) message = message.slice(0, 5000);

  // Validierung passend zu Zod
  const allowedProjectTypes = new Set(["Branding", "Business Website", "Web-App", "Beratung"]);
  const allowedBudgets = new Set(["< 1k", "1k–3k", "3k–7k", "7k–15k", "15k+"]);

  if (!name || name.length < 2) {
    return new Response(JSON.stringify({ message: "Name muss mindestens 2 Zeichen haben." }), {
      status: 400,
      headers,
    });
  }
  if (!email || !isEmail(email)) {
    return new Response(JSON.stringify({ message: "Ungültige E-Mail-Adresse." }), {
      status: 400,
      headers,
    });
  }
  if (!subject || subject.length < 3) {
    return new Response(JSON.stringify({ message: "Betreff ist zu kurz." }), {
      status: 400,
      headers,
    });
  }
  if (!allowedProjectTypes.has(projectType)) {
    return new Response(JSON.stringify({ message: "Bitte Projekt-Typ wählen." }), {
      status: 400,
      headers,
    });
  }
  if (!allowedBudgets.has(budget)) {
    return new Response(JSON.stringify({ message: "Bitte Budget wählen." }), {
      status: 400,
      headers,
    });
  }
  if (!isPhone(phone)) {
    return new Response(JSON.stringify({ message: "Telefonnummer wirkt ungültig." }), {
      status: 400,
      headers,
    });
  }
  if (!message || message.length < 20) {
    return new Response(JSON.stringify({ message: "Nachricht muss mindestens 20 Zeichen haben." }), {
      status: 400,
      headers,
    });
  }
  if (consent !== true) {
    return new Response(JSON.stringify({ message: "Bitte Datenschutz bestätigen." }), {
      status: 400,
      headers,
    });
  }

  // ENV check
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Missing EMAIL_USER / EMAIL_PASS");
    return new Response(JSON.stringify({ message: "Mail-Konfiguration fehlt (Server)." }), {
      status: 500,
      headers,
    });
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

  const mailText = [
    "Neue Kontaktanfrage (HEXEL tech)",
    "",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Firma: ${company || "-"}`,
    `Telefon: ${phone || "-"}`,
    `Betreff: ${subject}`,
    `Projekt-Typ: ${projectType}`,
    `Budget: ${budget}`,
    "",
    "Nachricht:",
    message,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `"HEXEL Kontaktformular" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Kontakt: ${subject} — ${name}`,
      text: mailText,
      replyTo: email,
    });

    return new Response(
      JSON.stringify({ message: "Danke! Ihre Nachricht wurde erfolgreich gesendet." }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("Mailer-Fehler:", err);
    return new Response(JSON.stringify({ message: "Fehler beim Senden der Nachricht." }), {
      status: 500,
      headers,
    });
  }
}
