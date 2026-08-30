/**
 * Cloudflare Worker — inknironapps.com contact form backend
 *
 * Receives POST from https://inknironapps.com/contact.html, validates,
 * routes by topic, sends via Resend API, redirects user back with status.
 *
 * Required Worker secret: RESEND_API_KEY (Resend dashboard -> API Keys)
 *
 * Optional Worker variable: ALLOWED_ORIGIN (defaults to https://inknironapps.com)
 */

const SITE_ORIGIN_DEFAULT = "https://inknironapps.com";
const FROM_ADDRESS = "noreply@inknironapps.com";

// topic -> destination alias (all forward to info@ inbox; routing is for filtering)
const ROUTES = {
  "general":         "info@inknironapps.com",
  "libraryiq":       "support@inknironapps.com",
  // Legacy key, kept so links indexed before LibraryIQ moved to the web still route.
  "alpha-libraryiq": "support@inknironapps.com",
  "alpha-matcalc":   "support@inknironapps.com",
  "alpha-simmer":    "support@inknironapps.com",
  "author":          "riley@inknironapps.com",
  "privacy":         "privacy@inknironapps.com",
  "security":        "security@inknironapps.com",
};

const TOPIC_LABELS = {
  "general":         "General inquiry",
  "libraryiq":       "LibraryIQ support",
  "alpha-libraryiq": "LibraryIQ support",
  "alpha-matcalc":   "Alpha tester — MatCalc",
  "alpha-simmer":    "Alpha tester — Simmer",
  "author":          "Author / book inquiry",
  "privacy":         "Privacy / data request",
  "security":        "Security report",
};

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || SITE_ORIGIN_DEFAULT;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Origin check (don't accept submissions from random sites)
    const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
    if (!origin.startsWith(allowedOrigin)) {
      return redirectBack(allowedOrigin, "error=origin");
    }

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return redirectBack(allowedOrigin, "error=parse");
    }

    // Honeypot — bots fill, humans don't
    if ((form.get("_honey") || "").trim() !== "") {
      // Pretend success so bots don't retry
      return redirectBack(allowedOrigin, "sent=1");
    }

    const topic   = String(form.get("topic")   || "general").trim().toLowerCase();
    const name    = String(form.get("name")    || "").trim().slice(0, 120);
    const email   = String(form.get("email")   || "").trim().slice(0, 200);
    const message = String(form.get("message") || "").trim().slice(0, 5000);

    if (!name || !email || !message) {
      return redirectBack(allowedOrigin, "error=missing");
    }

    if (!isValidEmail(email)) {
      return redirectBack(allowedOrigin, "error=email");
    }

    const to = ROUTES[topic] || ROUTES["general"];
    const topicLabel = TOPIC_LABELS[topic] || "General inquiry";
    const subject = `[${topicLabel}] ${truncate(message, 60)}`;

    const textBody = [
      `Topic:   ${topicLabel}  (${topic})`,
      `From:    ${name} <${email}>`,
      `Routed:  ${to}`,
      `IP:      ${request.headers.get("CF-Connecting-IP") || "unknown"}`,
      `UA:      ${request.headers.get("User-Agent") || "unknown"}`,
      ``,
      `--- Message ---`,
      ``,
      message,
    ].join("\n");

    const resendBody = {
      from: `Ink & Iron Apps Contact Form <${FROM_ADDRESS}>`,
      to: [to],
      reply_to: email,
      subject,
      text: textBody,
    };

    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendBody),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Resend error:", resp.status, errText);
        return redirectBack(allowedOrigin, "error=send");
      }
    } catch (e) {
      console.error("Fetch to Resend failed:", e);
      return redirectBack(allowedOrigin, "error=network");
    }

    return redirectBack(allowedOrigin, "sent=1");
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function redirectBack(origin, query) {
  return Response.redirect(`${origin}/contact.html?${query}`, 303);
}

function isValidEmail(value) {
  // Pragmatic check, not RFC-perfect
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 200;
}

function truncate(s, n) {
  s = s.replace(/\s+/g, " ");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
