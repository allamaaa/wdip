/**
 * WDIP Save Worker — Cloudflare Worker
 *
 * This worker proxies save requests from the WDIP editor to the GitHub API.
 * It holds the GitHub Personal Access Token as an environment variable,
 * so visitors can save without needing their own token.
 *
 * ENVIRONMENT VARIABLES (set in Cloudflare dashboard):
 *   GITHUB_TOKEN  — GitHub PAT with repo Contents: Read & Write
 *   GITHUB_REPO   — (optional) defaults to "allamaaa/wdip"
 *   ALLOWED_ORIGIN — (optional) defaults to "*", set to your site URL for stricter security
 *
 * DEPLOY INSTRUCTIONS:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create
 *   2. Name it "wdip-save" → click Deploy
 *   3. Click "Edit code" and paste this entire file
 *   4. Go to Settings → Variables → add GITHUB_TOKEN with your PAT
 *   5. Save and deploy
 *   6. Copy the worker URL (e.g. https://wdip-save.yourname.workers.dev)
 *   7. Paste that URL into edit.js as the SAVE_API_URL constant
 */

export default {
  async fetch(request, env) {
    const CORS_HEADERS = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only accept POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, message: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, message: "Invalid JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { icao, data } = body;

    if (!icao || !data) {
      return new Response(JSON.stringify({ ok: false, message: "Missing icao or data field" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Validate ICAO format (4-letter code starting with K, or international codes)
    if (!/^[A-Z]{4}$/i.test(icao)) {
      return new Response(JSON.stringify({ ok: false, message: "Invalid ICAO code" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const token = env.GITHUB_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, message: "Server misconfigured: no GitHub token" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const repo = env.GITHUB_REPO || "allamaaa/wdip";
    const filePath = `data/${icao.toLowerCase()}.json`;
    const content = JSON.stringify(data, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(content)));

    try {
      // Get current file SHA (needed for updates)
      let sha = null;
      const getResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `token ${token}`,
            "User-Agent": "WDIP-Save-Worker/1.0",
          },
        }
      );

      if (getResp.ok) {
        const fileData = await getResp.json();
        sha = fileData.sha;
      }

      // PUT updated content
      const putBody = {
        message: `Update ${icao.toUpperCase()} airport data`,
        content: encoded,
      };
      if (sha) putBody.sha = sha;

      const putResp = await fetch(
        `https://api.github.com/repos/${repo}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "WDIP-Save-Worker/1.0",
          },
          body: JSON.stringify(putBody),
        }
      );

      const result = await putResp.json();

      if (putResp.ok) {
        return new Response(JSON.stringify({ ok: true, message: "Saved successfully!" }), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } else {
        return new Response(
          JSON.stringify({ ok: false, message: result.message || "GitHub API error" }),
          {
            status: 502,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, message: "Server error: " + err.message }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }
  },
};
