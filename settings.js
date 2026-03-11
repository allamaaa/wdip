/* ============================================
   WDIP — Shared Settings Panel & Toast
   Used by: index.html, edit.html, add-airport.html, add-airline.html
   ============================================ */

const SETTINGS_OVERLAY_HTML = `
<div class="settings-overlay" id="settingsOverlay">
  <div class="settings-panel">
    <div class="settings-header">
      <h3>Save Settings</h3>
      <button class="settings-close-btn" id="settingsClose">&times;</button>
    </div>
    <div class="settings-body">
      <div id="settingsStatus" class="settings-status"></div>

      <div class="settings-field">
        <label>Save Worker URL</label>
        <p class="settings-hint">A Cloudflare Worker that proxies saves to GitHub. When configured, <strong>anyone</strong> can save without a token. See <code>save-worker.js</code> in the repo for the worker code.</p>
        <input type="url" class="settings-input" id="workerUrlInput" placeholder="https://wdip-save.yourname.workers.dev" spellcheck="false">
      </div>

      <div class="settings-divider">
        <span>or</span>
      </div>

      <div class="settings-field">
        <label>GitHub Personal Access Token</label>
        <p class="settings-hint">Direct GitHub API access (saves only for you). Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">github.com/settings/tokens</a>.</p>
        <input type="password" class="settings-input" id="ghTokenInput" placeholder="ghp_xxxxxxxxxxxx" spellcheck="false">
      </div>

      <button class="settings-save-btn" id="settingsSave">Save Settings</button>
    </div>
  </div>
</div>`;

/**
 * Initialize the settings panel on any page.
 * Auto-injects the overlay HTML if not already present.
 * Binds all events (settings button, close, save, overlay click).
 */
function initSettings() {
  // Inject settings overlay if not present
  if (!document.getElementById("settingsOverlay")) {
    document.body.insertAdjacentHTML("beforeend", SETTINGS_OVERLAY_HTML);
  }

  // Inject toast element if not present
  if (!document.getElementById("toast")) {
    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "editor-toast";
    document.body.appendChild(toast);
  }

  // Bind events
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsClose = document.getElementById("settingsClose");
  const settingsSave = document.getElementById("settingsSave");
  const settingsOverlay = document.getElementById("settingsOverlay");

  if (settingsBtn) settingsBtn.addEventListener("click", showSettingsPanel);
  if (settingsClose) settingsClose.addEventListener("click", hideSettingsPanel);
  if (settingsSave) settingsSave.addEventListener("click", saveSettings);
  if (settingsOverlay) {
    settingsOverlay.addEventListener("click", (e) => {
      if (e.target.id === "settingsOverlay") hideSettingsPanel();
    });
  }
}

function showSettingsPanel() {
  const overlay = document.getElementById("settingsOverlay");
  const urlInput = document.getElementById("workerUrlInput");
  const tokenInput = document.getElementById("ghTokenInput");
  if (urlInput) urlInput.value = localStorage.getItem("wdip_save_url") || "";
  if (tokenInput) tokenInput.value = localStorage.getItem("wdip_gh_token") || "";

  updateSettingsStatus();
  overlay.classList.add("active");
}

function hideSettingsPanel() {
  document.getElementById("settingsOverlay").classList.remove("active");
}

function updateSettingsStatus() {
  const statusEl = document.getElementById("settingsStatus");
  if (!statusEl) return;

  const globalWorker = (typeof SAVE_API_URL !== "undefined") ? SAVE_API_URL : "";
  const workerUrl = globalWorker || localStorage.getItem("wdip_save_url");
  const token = localStorage.getItem("wdip_gh_token");

  if (globalWorker) {
    statusEl.innerHTML = '<span class="status-connected">\u2713 Save Worker is configured globally</span>';
  } else if (workerUrl) {
    statusEl.innerHTML = '<span class="status-connected">\u2713 Using custom Worker URL</span>';
  } else if (token) {
    statusEl.innerHTML = '<span class="status-connected">\u2713 Using GitHub token (local only)</span>';
  } else {
    statusEl.innerHTML = '<span class="status-disconnected">\u2717 Not configured \u2014 saves won\'t work</span>';
  }
}

function saveSettings() {
  const urlInput = document.getElementById("workerUrlInput");
  const tokenInput = document.getElementById("ghTokenInput");

  const url = urlInput ? urlInput.value.trim() : "";
  const token = tokenInput ? tokenInput.value.trim() : "";

  if (url) {
    localStorage.setItem("wdip_save_url", url);
  } else {
    localStorage.removeItem("wdip_save_url");
  }

  if (token) {
    localStorage.setItem("wdip_gh_token", token);
  } else {
    localStorage.removeItem("wdip_gh_token");
  }

  if (url || token) {
    showToast("Settings saved!");
  } else {
    showToast("Settings cleared");
  }

  hideSettingsPanel();
}

function showToast(message, isError = false) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "editor-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "editor-toast" + (isError ? " error" : "") + " active";
  setTimeout(() => {
    toast.classList.remove("active");
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
