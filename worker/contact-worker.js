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
  "web-preview":     "info@inknironapps.com",
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
  "web-preview":     "Free website preview",
  "libraryiq":       "LibraryIQ support",
  "alpha-libraryiq": "LibraryIQ support",
  "alpha-matcalc":   "Alpha tester — MatCalc",
  "alpha-simmer":    "Alpha tester — Simmer",
  "author":          "Author / book inquiry",
  "privacy":         "Privacy / data request",
  "security":        "Security report",
};

// Pages that host their own form and get the result banner back on themselves.
// Anything else returns to the contact page, so a forged field can't redirect.
const RETURN_PATHS = {
  "/web-design/": "/web-design/",
};

// Free website preview form (/web-design/): fields beyond name/email, in the
// order they print in the brief. Required ones are checked before sending.
const PREVIEW_FIELDS = [
  ["business",   "Business",          true,  200],
  ["trade",      "Type of business",  true,  80],
  ["area",       "Town / area",       true,  200],
  ["online",     "Online now",        true,  1000],
  ["services",   "Main services",     false, 1000],
  ["phone",      "Phone to show",     false, 60],
  ["hours",      "Hours",             false, 300],
  ["booking",    "Booking tool",      false, 200],
  ["goals",      "Wants / dislikes",  false, 2000],
  ["branding",   "Colors / logo",     false, 500],
];

export default {
  async fetch(request, env, ctx) {
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

    const returnPath = RETURN_PATHS[String(form.get("_return") || "")] || "/contact.html";
    const back = (query) => redirectBack(allowedOrigin, query, returnPath);

    // Honeypot — bots fill, humans don't
    if ((form.get("_honey") || "").trim() !== "") {
      // Pretend success so bots don't retry
      return back("sent=1");
    }

    const topic   = String(form.get("topic")   || "general").trim().toLowerCase();
    const name    = String(form.get("name")    || "").trim().slice(0, 120);
    const email   = String(form.get("email")   || "").trim().slice(0, 200);
    let message = String(form.get("message") || "").trim().slice(0, 5000);
    let subjectLine = message;

    if (topic === "web-preview" && form.has("business")) {
      const vals = PREVIEW_FIELDS.map(([key, label, required, max]) =>
        [label, required, String(form.get(key) || "").trim().slice(0, max)]);
      if (vals.some(([, required, v]) => required && !v)) {
        return back("error=missing");
      }
      const width = Math.max(...vals.map(([label]) => label.length)) + 2;
      message = vals
        .filter(([, , v]) => v)
        .map(([label, , v]) => `${(label + ":").padEnd(width)}${v.replace(/\n/g, "\n" + " ".repeat(width))}`)
        .join("\n");
      subjectLine = `${vals[0][2]} — ${vals[1][2]}, ${vals[2][2]}`;
    }

    if (!name || !email || !message) {
      return back("error=missing");
    }

    if (!isValidEmail(email)) {
      return back("error=email");
    }

    const to = ROUTES[topic] || ROUTES["general"];
    const topicLabel = TOPIC_LABELS[topic] || "General inquiry";
    const subject = `[${topicLabel}] ${truncate(subjectLine, 60)}`;

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
        return back("error=send");
      }
    } catch (e) {
      console.error("Fetch to Resend failed:", e);
      return back("error=network");
    }

    // Free-preview requests also go straight to the client-sites hub, which records them on its Today view and pushes
    // an alert to Riley's phone (client-sites hub/worker.js previewHook). Best effort: the email above already went.
    if (topic === "web-preview" && form.has("business") && env.PREVIEW_HOOK_SECRET) {
      const fields = Object.fromEntries(PREVIEW_FIELDS.map(([key, , , max]) => [key, String(form.get(key) || "").trim().slice(0, max)]));
      const hook = fetch("https://previews.inknironapps.com/client/_hooks/preview-request", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.PREVIEW_HOOK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, name, email }),
      }).catch((e) => console.error("preview hook failed:", e));
      if (ctx && ctx.waitUntil) ctx.waitUntil(hook); else await hook;
    }

    return back("sent=1");
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

function redirectBack(origin, query, path = "/contact.html") {
  const anchor = path === "/contact.html" ? "" : "#preview";
  return Response.redirect(`${origin}${path}?${query}${anchor}`, 303);
}

function isValidEmail(value) {
  // Pragmatic check, not RFC-perfect
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 200;
}

function truncate(s, n) {
  s = s.replace(/\s+/g, " ");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
