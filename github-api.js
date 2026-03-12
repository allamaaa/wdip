/* ============================================
   WDIP — Shared GitHub Contents API Helper
   Used by: edit.js, add-airport.js, add-airline.js
   ============================================ */

const GITHUB_REPO = "allamaaa/wdip";
const DATA_BASE = "https://raw.githubusercontent.com/allamaaa/wdip/main/";

/**
 * Save a file to GitHub via the Contents API.
 * Uses SHA-based atomic updates to prevent race conditions.
 *
 * @param {string} token  - GitHub Personal Access Token
 * @param {string} filePath - Path relative to repo root (e.g., "data/kjfk.json")
 * @param {string} content  - File content as a string
 * @param {string} message  - Commit message
 * @returns {Promise<Object>} GitHub API response
 */
async function saveFileToGitHub(token, filePath, content, message) {
  const encoded = btoa(unescape(encodeURIComponent(content)));

  // Get current file SHA (needed for updates, absent for new files)
  let sha = null;
  try {
    const getResp = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      { headers: { Authorization: `token ${token}` } }
    );
    if (getResp.ok) {
      sha = (await getResp.json()).sha;
    }
  } catch (e) {
    // File might not exist yet — that's fine
  }

  const body = { message, content: encoded };
  if (sha) body.sha = sha;

  const putResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!putResp.ok) {
    const err = await putResp.json();
    throw new Error(err.message || "GitHub API error");
  }

  return await putResp.json();
}

/**
 * Re-fetch airlines-db.js from GitHub with cache-busting,
 * overwriting the in-memory AIRLINES_DB variable.
 */
async function refreshAirlinesDB() {
  try {
    const resp = await fetch(DATA_BASE + "airlines-db.js?v=" + Date.now());
    if (!resp.ok) return;
    const text = await resp.text();
    // Use indirect eval to execute in global scope, overwriting var AIRLINES_DB
    (0, eval)(text);
  } catch (e) {
    console.warn("Could not refresh airlines DB:", e);
  }
}
