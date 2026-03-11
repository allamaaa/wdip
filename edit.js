/* ============================================
   WHERE DO I PARK — Edit Page Logic
   ============================================ */

// ==========================================
// STATE
// ==========================================

let airportData = null;
let icao = null;
let editMap = null;
let satelliteTileLayer = null;
let termRects = {};
let fboRects = {};
let dragHandles = {};
let selectedRectId = null;
let hasUnsavedChanges = false;
let nextTermId = 100;
let nextFboId = 100;

// Save API — set this to your Cloudflare Worker URL for public saves
// When set, anyone can save without needing a GitHub token.
// Example: "https://wdip-save.yourname.workers.dev"
const SAVE_API_URL = "";

// Fallback GitHub config (only used when SAVE_API_URL is empty)
const GITHUB_REPO = "allamaaa/wdip";

// ==========================================
// INIT
// ==========================================

async function init() {
  const params = new URLSearchParams(window.location.search);
  icao = params.get("icao");

  if (!icao) {
    document.getElementById("editorHeader").innerHTML =
      '<p style="color: var(--red);">No airport specified. Go back and select an airport.</p>';
    return;
  }

  // Load airport data from GitHub (or fallback to local JSON)
  airportData = await loadAirportData(icao);

  if (!airportData) {
    document.getElementById("editorHeader").innerHTML =
      `<p style="color: var(--red);">Airport "${icao}" not found.</p>`;
    return;
  }

  document.getElementById("backLink").href = `index.html#airports`;

  renderHeader();
  initMap();
  renderTerminalCards();
  renderFBOCards();
  bindEvents();
}

async function loadAirportData(code) {
  // Try loading from GitHub first
  try {
    const resp = await fetch(`data/${code.toLowerCase()}.json?v=${Date.now()}`);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (e) {
    console.warn("Failed to load airport JSON", e);
  }
  return null;
}

// ==========================================
// RENDER
// ==========================================

function renderHeader() {
  document.getElementById("editorHeader").innerHTML = `
    <span class="editor-icao">${airportData.icao}</span>
    <span class="editor-name">${airportData.name}</span>`;
}

// ==========================================
// MAP
// ==========================================

function initMap() {
  if (!airportData.map) return;

  const mapConfig = airportData.map;

  editMap = L.map("editMap", {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    zoomControl: true,
    editable: true,
  });

  satelliteTileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles &copy; Esri", maxZoom: 19 }
  );
  satelliteTileLayer.addTo(editMap);

  drawTerminalRects();
  drawFBORects();
}

function createDragHandle(rect, type, id) {
  const center = rect.getCenter();
  const icon = L.divIcon({
    className: "drag-handle-icon",
    html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2l3 3h-2v4h4v-2l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9l3-3z"/></svg>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const marker = L.marker(center, {
    icon,
    draggable: true,
    zIndexOffset: 1000,
  });
  marker.addTo(editMap);

  let startLatLng = null;

  marker.on("dragstart", () => {
    editMap.dragging.disable();
    startLatLng = marker.getLatLng();
  });

  marker.on("drag", (e) => {
    const newLatLng = e.target.getLatLng();
    const dlat = newLatLng.lat - startLatLng.lat;
    const dlng = newLatLng.lng - startLatLng.lng;

    const bounds = rect.getBounds();
    const newBounds = L.latLngBounds(
      [bounds.getSouth() + dlat, bounds.getWest() + dlng],
      [bounds.getNorth() + dlat, bounds.getEast() + dlng]
    );

    rect.setBounds(newBounds);

    // Disable edit temporarily to avoid glitches, re-enable after
    rect.disableEdit();

    startLatLng = newLatLng;
  });

  marker.on("dragend", () => {
    editMap.dragging.enable();
    rect.enableEdit();
    // Update data bounds
    if (type === "term") {
      updateTermBounds(id, rect);
    } else {
      updateFBOBounds(id, rect);
    }
    // Sync handle position
    marker.setLatLng(rect.getCenter());
  });

  return marker;
}

function drawTerminalRects() {
  termRects = {};
  dragHandles = {};
  airportData.terminals.forEach((term) => {
    const isReno = !!term.renovation;
    const color = isReno ? "#fbbf24" : "#00d4ff";
    const style = {
      color,
      weight: 2,
      opacity: 0.6,
      fillColor: color,
      fillOpacity: 0.1,
      dashArray: isReno ? "6 4" : undefined,
    };

    const rect = L.rectangle(term.bounds, style);
    rect.addTo(editMap);
    rect.enableEdit();

    rect.bindTooltip(`<strong>${term.name}</strong>`, {
      className: "terminal-tooltip",
      direction: "top",
      offset: [0, -5],
    });

    // Listen for vertex drag (resize)
    rect.on("editable:vertex:dragend", () => {
      updateTermBounds(term.id, rect);
      // Sync handle position after resize
      if (dragHandles[`term_${term.id}`]) {
        dragHandles[`term_${term.id}`].setLatLng(rect.getCenter());
      }
    });

    rect.on("click", () => selectRect("term", term.id));

    termRects[term.id] = rect;

    // Create drag handle
    const handle = createDragHandle(rect, "term", term.id);
    dragHandles[`term_${term.id}`] = handle;
  });
}

function drawFBORects() {
  fboRects = {};
  if (!airportData.fbos) return;

  airportData.fbos.forEach((fbo) => {
    if (!fbo.bounds) return;

    const rect = L.rectangle(fbo.bounds, {
      color: "#00e87b",
      weight: 2,
      opacity: 0.5,
      fillColor: "#00e87b",
      fillOpacity: 0.08,
    });
    rect.addTo(editMap);
    rect.enableEdit();

    rect.bindTooltip(`<strong>${fbo.name}</strong><span class="tooltip-gates">FBO</span>`, {
      className: "terminal-tooltip fbo-tooltip",
      direction: "top",
      offset: [0, -5],
    });

    rect.on("editable:vertex:dragend", () => {
      updateFBOBounds(fbo.id, rect);
      if (dragHandles[`fbo_${fbo.id}`]) {
        dragHandles[`fbo_${fbo.id}`].setLatLng(rect.getCenter());
      }
    });

    rect.on("click", () => selectRect("fbo", fbo.id));

    fboRects[fbo.id] = rect;

    const handle = createDragHandle(rect, "fbo", fbo.id);
    dragHandles[`fbo_${fbo.id}`] = handle;
  });
}

function updateTermBounds(termId, rect) {
  const b = rect.getBounds();
  const term = airportData.terminals.find((t) => t.id === termId);
  if (term) {
    term.bounds = [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]];
    markChanged();
  }
}

function updateFBOBounds(fboId, rect) {
  const b = rect.getBounds();
  const fbo = airportData.fbos.find((f) => f.id === fboId);
  if (fbo) {
    fbo.bounds = [[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]];
    markChanged();
  }
}

function selectRect(type, id) {
  // Reset all styles
  Object.entries(termRects).forEach(([tid, rect]) => {
    const term = airportData.terminals.find((t) => t.id === tid);
    const isReno = term && term.renovation;
    const color = isReno ? "#fbbf24" : "#00d4ff";
    rect.setStyle({ color, fillColor: color, weight: 2, opacity: 0.6, fillOpacity: 0.1 });
  });
  Object.values(fboRects).forEach((rect) => {
    rect.setStyle({ color: "#00e87b", fillColor: "#00e87b", weight: 2, opacity: 0.5, fillOpacity: 0.08 });
  });

  if (type === "term" && termRects[id]) {
    const term = airportData.terminals.find((t) => t.id === id);
    const isReno = term && term.renovation;
    const color = isReno ? "#fbbf24" : "#00d4ff";
    termRects[id].setStyle({ color, fillColor: color, weight: 3, opacity: 1, fillOpacity: 0.25 });
    editMap.panTo(termRects[id].getCenter(), { animate: true });
    const card = document.querySelector(`.editor-term-card[data-term-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else if (type === "fbo" && fboRects[id]) {
    fboRects[id].setStyle({ color: "#00e87b", fillColor: "#00e87b", weight: 3, opacity: 1, fillOpacity: 0.25 });
    editMap.panTo(fboRects[id].getCenter(), { animate: true });
    const card = document.querySelector(`.editor-fbo-card[data-fbo-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  selectedRectId = { type, id };
}

// ==========================================
// TERMINAL CARDS
// ==========================================

function renderTerminalCards() {
  const container = document.getElementById("terminalCards");

  container.innerHTML = airportData.terminals
    .map((term) => {
      const airlines = getAirlinesForTerminal(term.id);
      const isReno = !!term.renovation;

      return `
        <div class="editor-term-card${isReno ? " renovation" : ""}" data-term-id="${term.id}">
          <div class="editor-card-header">
            <input class="editor-card-name-input" value="${escapeHtml(term.name)}" data-field="name" data-term-id="${term.id}" spellcheck="false">
            <button class="editor-card-delete" data-term-id="${term.id}" title="Delete terminal">&times;</button>
          </div>
          <div class="editor-card-field">
            <label>Gates</label>
            <input class="editor-card-input" value="${escapeHtml(term.gates)}" data-field="gates" data-term-id="${term.id}" spellcheck="false">
          </div>
          ${isReno ? `
          <div class="editor-card-field">
            <label class="editor-reno-label">
              <input type="checkbox" checked data-field="renovation" data-term-id="${term.id}">
              Under Renovation
            </label>
          </div>` : `
          <div class="editor-card-field">
            <label class="editor-reno-label">
              <input type="checkbox" data-field="renovation" data-term-id="${term.id}">
              Under Renovation
            </label>
          </div>`}
          <div class="editor-card-airlines">
            <label>Airlines (${airlines.length})</label>
            <div class="editor-airline-tags">
              ${airlines.map((a) => `
                <span class="editor-airline-tag" data-key="${a.key}" data-term-id="${term.id}">
                  ${a.icao}${AIRLINES_DB[a.key] && AIRLINES_DB[a.key].cargo ? ' <span class="cargo-badge-tiny">C</span>' : ""}
                  <button class="editor-airline-remove" data-key="${a.key}" data-term-id="${term.id}">&times;</button>
                </span>
              `).join("")}
            </div>
            <div class="editor-add-airline">
              <div class="editor-airline-search-wrap">
                <input class="editor-airline-input" placeholder="Search airlines..." data-term-id="${term.id}" spellcheck="false">
                <div class="editor-airline-dropdown" data-term-id="${term.id}"></div>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");

  bindTerminalCardEvents();
}

function bindTerminalCardEvents() {
  // Name/gate changes
  document.querySelectorAll(".editor-card-name-input, .editor-card-input").forEach((input) => {
    input.addEventListener("change", () => {
      const termId = input.dataset.termId;
      const field = input.dataset.field;
      const term = airportData.terminals.find((t) => t.id === termId);
      if (term) {
        term[field] = input.value;
        markChanged();
        if (field === "name" && termRects[termId]) {
          termRects[termId].unbindTooltip();
          termRects[termId].bindTooltip(`<strong>${term.name}</strong>`, {
            className: "terminal-tooltip",
            direction: "top",
            offset: [0, -5],
          });
        }
      }
    });
  });

  // Renovation checkbox
  document.querySelectorAll('input[data-field="renovation"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const termId = cb.dataset.termId;
      const term = airportData.terminals.find((t) => t.id === termId);
      if (term) {
        term.renovation = cb.checked;
        markChanged();
        renderTerminalCards();
        if (termRects[termId]) {
          const color = cb.checked ? "#fbbf24" : "#00d4ff";
          termRects[termId].setStyle({
            color,
            fillColor: color,
            weight: 2,
            opacity: 0.6,
            fillOpacity: 0.1,
            dashArray: cb.checked ? "6 4" : undefined,
          });
        }
      }
    });
  });

  // Remove airline
  document.querySelectorAll(".editor-airline-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      if (airportData.airlines[key]) {
        delete airportData.airlines[key];
        markChanged();
        renderTerminalCards();
      }
    });
  });

  // Airline search inputs
  document.querySelectorAll(".editor-airline-input").forEach((input) => {
    const termId = input.dataset.termId;
    const dropdown = document.querySelector(`.editor-airline-dropdown[data-term-id="${termId}"]`);

    input.addEventListener("input", () => {
      const val = input.value.trim();
      if (!val) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("active");
        return;
      }

      // Search full airline DB
      const results = searchAirlines(val).slice(0, 8);
      if (results.length === 0) {
        dropdown.innerHTML = '<div class="editor-airline-dd-empty">No airlines found</div>';
        dropdown.classList.add("active");
        return;
      }

      dropdown.innerHTML = results.map((a) => `
        <div class="editor-airline-dd-item" data-key="${a.key}">
          <span class="dd-icao">${a.icao}</span>
          <span class="dd-name">${a.name}</span>
          ${a.callsign ? `<span class="dd-callsign">${a.callsign}</span>` : ""}
          ${a.cargo ? '<span class="dd-cargo">CARGO</span>' : ""}
        </div>
      `).join("");
      dropdown.classList.add("active");

      dropdown.querySelectorAll(".editor-airline-dd-item").forEach((item) => {
        item.addEventListener("click", () => {
          const key = item.dataset.key;
          const dbEntry = AIRLINES_DB[key];
          if (!dbEntry) return;

          // Add to airport airlines
          airportData.airlines[key] = {
            name: dbEntry.name,
            icao: dbEntry.icao,
            terminal: termId,
          };
          markChanged();
          renderTerminalCards();
        });
      });
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdown.innerHTML = "";
        dropdown.classList.remove("active");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".editor-airline-search-wrap")) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("active");
      }
    });
  });

  // Delete terminal
  document.querySelectorAll(".editor-card-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const termId = btn.dataset.termId;
      if (!confirm(`Delete this terminal? Airlines assigned to it will be unassigned.`)) return;

      Object.keys(airportData.airlines).forEach((code) => {
        if (airportData.airlines[code].terminal === termId) {
          delete airportData.airlines[code];
        }
      });

      airportData.terminals = airportData.terminals.filter((t) => t.id !== termId);

      if (termRects[termId]) {
        editMap.removeLayer(termRects[termId]);
        delete termRects[termId];
      }
      if (dragHandles[`term_${termId}`]) {
        editMap.removeLayer(dragHandles[`term_${termId}`]);
        delete dragHandles[`term_${termId}`];
      }

      markChanged();
      renderTerminalCards();
    });
  });

  // Click card to highlight on map
  document.querySelectorAll(".editor-term-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("input, button, .editor-airline-dropdown")) return;
      selectRect("term", card.dataset.termId);
    });
  });
}

// ==========================================
// FBO CARDS
// ==========================================

function renderFBOCards() {
  const container = document.getElementById("fboCards");

  if (!airportData.fbos || airportData.fbos.length === 0) {
    container.innerHTML = '<p class="editor-empty">No FBOs added yet.</p>';
    return;
  }

  container.innerHTML = airportData.fbos
    .map((fbo) => `
      <div class="editor-fbo-card" data-fbo-id="${fbo.id}">
        <div class="editor-card-header">
          <input class="editor-card-name-input fbo-name-input" value="${escapeHtml(fbo.name)}" data-field="name" data-fbo-id="${fbo.id}" spellcheck="false">
          <button class="editor-card-delete fbo-delete" data-fbo-id="${fbo.id}" title="Delete FBO">&times;</button>
        </div>
        <div class="editor-card-field">
          <label>Location</label>
          <input class="editor-card-input" value="${escapeHtml(fbo.location)}" data-field="location" data-fbo-id="${fbo.id}" spellcheck="false">
        </div>
        <div class="editor-card-field">
          <label>Phone</label>
          <input class="editor-card-input" value="${escapeHtml(fbo.phone)}" data-field="phone" data-fbo-id="${fbo.id}" spellcheck="false">
        </div>
      </div>
    `)
    .join("");

  bindFBOCardEvents();
}

function bindFBOCardEvents() {
  document.querySelectorAll(".editor-fbo-card input.editor-card-input, .fbo-name-input").forEach((input) => {
    input.addEventListener("change", () => {
      const fboId = input.dataset.fboId;
      const field = input.dataset.field;
      const fbo = airportData.fbos.find((f) => f.id === fboId);
      if (fbo) {
        fbo[field] = input.value;
        markChanged();
        if (field === "name" && fboRects[fboId]) {
          fboRects[fboId].unbindTooltip();
          fboRects[fboId].bindTooltip(`<strong>${fbo.name}</strong><span class="tooltip-gates">FBO</span>`, {
            className: "terminal-tooltip fbo-tooltip",
            direction: "top",
            offset: [0, -5],
          });
        }
      }
    });
  });

  document.querySelectorAll(".fbo-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fboId = btn.dataset.fboId;
      if (!confirm("Delete this FBO?")) return;

      airportData.fbos = airportData.fbos.filter((f) => f.id !== fboId);

      if (fboRects[fboId]) {
        editMap.removeLayer(fboRects[fboId]);
        delete fboRects[fboId];
      }
      if (dragHandles[`fbo_${fboId}`]) {
        editMap.removeLayer(dragHandles[`fbo_${fboId}`]);
        delete dragHandles[`fbo_${fboId}`];
      }

      markChanged();
      renderFBOCards();
    });
  });

  document.querySelectorAll(".editor-fbo-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("input, button")) return;
      selectRect("fbo", card.dataset.fboId);
    });
  });
}

// ==========================================
// ADD TERMINAL / FBO
// ==========================================

function addTerminal() {
  const id = `T${nextTermId++}`;
  const center = editMap.getCenter();
  const offset = 0.001;
  const bounds = [
    [center.lat - offset, center.lng - offset],
    [center.lat + offset, center.lng + offset],
  ];

  const newTerm = {
    id,
    name: `New Terminal`,
    gates: "TBD",
    bounds,
  };

  airportData.terminals.push(newTerm);

  const rect = L.rectangle(bounds, {
    color: "#00d4ff",
    weight: 2,
    opacity: 0.6,
    fillColor: "#00d4ff",
    fillOpacity: 0.1,
  });
  rect.addTo(editMap);
  rect.enableEdit();

  rect.bindTooltip(`<strong>${newTerm.name}</strong>`, {
    className: "terminal-tooltip",
    direction: "top",
    offset: [0, -5],
  });

  rect.on("editable:vertex:dragend", () => {
    updateTermBounds(id, rect);
    if (dragHandles[`term_${id}`]) {
      dragHandles[`term_${id}`].setLatLng(rect.getCenter());
    }
  });
  rect.on("click", () => selectRect("term", id));

  termRects[id] = rect;

  const handle = createDragHandle(rect, "term", id);
  dragHandles[`term_${id}`] = handle;

  markChanged();
  renderTerminalCards();
  selectRect("term", id);
}

function addFBO() {
  const id = `FBO${nextFboId++}`;
  const center = editMap.getCenter();
  const offset = 0.0008;
  const bounds = [
    [center.lat - offset, center.lng - offset],
    [center.lat + offset, center.lng + offset],
  ];

  const newFbo = {
    id,
    name: "New FBO",
    location: "TBD",
    phone: "TBD",
    bounds,
  };

  if (!airportData.fbos) airportData.fbos = [];
  airportData.fbos.push(newFbo);

  const rect = L.rectangle(bounds, {
    color: "#00e87b",
    weight: 2,
    opacity: 0.5,
    fillColor: "#00e87b",
    fillOpacity: 0.08,
  });
  rect.addTo(editMap);
  rect.enableEdit();

  rect.bindTooltip(`<strong>${newFbo.name}</strong><span class="tooltip-gates">FBO</span>`, {
    className: "terminal-tooltip fbo-tooltip",
    direction: "top",
    offset: [0, -5],
  });

  rect.on("editable:vertex:dragend", () => {
    updateFBOBounds(id, rect);
    if (dragHandles[`fbo_${id}`]) {
      dragHandles[`fbo_${id}`].setLatLng(rect.getCenter());
    }
  });
  rect.on("click", () => selectRect("fbo", id));

  fboRects[id] = rect;

  const handle = createDragHandle(rect, "fbo", id);
  dragHandles[`fbo_${id}`] = handle;

  markChanged();
  renderFBOCards();
  selectRect("fbo", id);
}

// ==========================================
// SAVE (GitHub Contents API)
// ==========================================

async function saveData() {
  const workerUrl = SAVE_API_URL || localStorage.getItem("wdip_save_url");
  const token = localStorage.getItem("wdip_gh_token");

  if (!workerUrl && !token) {
    showSettingsPanel();
    showToast("Configure a Save Worker URL or GitHub token first", true);
    return;
  }

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  try {
    if (workerUrl) {
      await saveViaWorker(workerUrl);
    } else {
      await saveViaGitHub(token);
    }

    hasUnsavedChanges = false;
    updateSaveButtonState();
    showToast("Saved successfully!");
  } catch (e) {
    console.error("Save failed", e);
    showToast(`Save failed: ${e.message}`, true);
  } finally {
    saveBtn.textContent = "Save";
    saveBtn.disabled = false;
  }
}

async function saveViaWorker(url) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icao: icao.toUpperCase(), data: airportData }),
  });

  const result = await resp.json();
  if (!result.ok) {
    throw new Error(result.message || "Save worker error");
  }
}

async function saveViaGitHub(token) {
  const filePath = `where-do-i-park/data/${icao.toLowerCase()}.json`;
  const content = JSON.stringify(airportData, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(content)));

  // Get current file SHA
  let sha = null;
  try {
    const getResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` },
    });
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
    }
  } catch (e) {
    // File might not exist yet
  }

  // PUT to update/create file
  const body = {
    message: `Update ${icao} airport data`,
    content: encoded,
  };
  if (sha) body.sha = sha;

  const putResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!putResp.ok) {
    const err = await putResp.json();
    throw new Error(err.message || "GitHub API error");
  }
}

function exportJSON() {
  const dataStr = JSON.stringify(airportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${icao.toLowerCase()}-airport-data.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("JSON exported!");
}

function resetToDefaults() {
  if (!confirm("Reset all changes for this airport to defaults? This will reload the data from the server.")) return;
  window.location.reload();
}

// ==========================================
// SETTINGS PANEL
// ==========================================

function showSettingsPanel() {
  const overlay = document.getElementById("settingsOverlay");
  const urlInput = document.getElementById("workerUrlInput");
  const tokenInput = document.getElementById("ghTokenInput");
  if (urlInput) urlInput.value = localStorage.getItem("wdip_save_url") || "";
  if (tokenInput) tokenInput.value = localStorage.getItem("wdip_gh_token") || "";

  // Show connection status
  updateSettingsStatus();
  overlay.classList.add("active");
}

function hideSettingsPanel() {
  document.getElementById("settingsOverlay").classList.remove("active");
}

function updateSettingsStatus() {
  const statusEl = document.getElementById("settingsStatus");
  if (!statusEl) return;

  const workerUrl = SAVE_API_URL || localStorage.getItem("wdip_save_url");
  const token = localStorage.getItem("wdip_gh_token");

  if (SAVE_API_URL) {
    statusEl.innerHTML = '<span class="status-connected">✓ Save Worker is configured globally</span>';
  } else if (workerUrl) {
    statusEl.innerHTML = '<span class="status-connected">✓ Using custom Worker URL</span>';
  } else if (token) {
    statusEl.innerHTML = '<span class="status-connected">✓ Using GitHub token (local only)</span>';
  } else {
    statusEl.innerHTML = '<span class="status-disconnected">✗ Not configured — saves won\'t work</span>';
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

// ==========================================
// HELPERS
// ==========================================

function getAirlinesForTerminal(termId) {
  return Object.entries(airportData.airlines)
    .filter(([, a]) => a.terminal === termId)
    .map(([key, a]) => ({ key, ...a }));
}

function markChanged() {
  hasUnsavedChanges = true;
  updateSaveButtonState();
}

function updateSaveButtonState() {
  const btn = document.getElementById("saveBtn");
  if (hasUnsavedChanges) {
    btn.classList.add("has-changes");
  } else {
    btn.classList.remove("has-changes");
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
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

// ==========================================
// EVENTS
// ==========================================

function bindEvents() {
  document.getElementById("saveBtn").addEventListener("click", saveData);
  document.getElementById("exportBtn").addEventListener("click", exportJSON);
  document.getElementById("resetBtn").addEventListener("click", resetToDefaults);
  document.getElementById("addTerminalBtn").addEventListener("click", addTerminal);
  document.getElementById("addFBOBtn").addEventListener("click", addFBO);
  document.getElementById("settingsBtn").addEventListener("click", showSettingsPanel);
  document.getElementById("settingsClose").addEventListener("click", hideSettingsPanel);
  document.getElementById("settingsSave").addEventListener("click", saveSettings);

  // Close settings on overlay click
  document.getElementById("settingsOverlay").addEventListener("click", (e) => {
    if (e.target.id === "settingsOverlay") hideSettingsPanel();
  });

  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

// ==========================================
// BOOT
// ==========================================

document.addEventListener("DOMContentLoaded", init);
