const DEFAULT_GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1c3-DSYihGVgSkFYPaWKqBkuYERTmFc8a4m1dF3HjrnQ/export?format=csv&gid=0";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/seminars.csv") {
      return handleSeminarsCsv(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleSeminarsCsv(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const source = env.GOOGLE_SHEET_CSV_URL || DEFAULT_GOOGLE_SHEET_CSV_URL;
  if (!source) {
    return new Response("Missing Google Sheet source URL", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let upstream;
  try {
    upstream = await fetch(source, {
      headers: { accept: "text/csv,*/*;q=0.8" },
      cf: {
        cacheEverything: true,
        cacheTtl: 300,
      },
    });
  } catch {
    return new Response("Failed to fetch Google Sheet CSV", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (!upstream.ok) {
    return new Response(`Google Sheet request failed: HTTP ${upstream.status}`, {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const csvText = await upstream.text();
  if (!csvText.trim()) {
    return new Response("Google Sheet CSV is empty", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(request.method === "HEAD" ? null : csvText, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
