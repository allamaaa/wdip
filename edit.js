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
let deleteButtons = {};
let selectedRectId = null;
let hasUnsavedChanges = false;
let nextTermId = 100;
let nextFboId = 100;

// Save API — set this to your Cloudflare Worker URL for public saves
// When set, anyone can save without needing a GitHub token.
const SAVE_API_URL = "";

// DATA_BASE and GITHUB_REPO are defined in github-api.js

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

  initSettings();
  renderHeader();
  initMap();
  renderTerminalCards();
  renderFBOCards();
  bindEvents();
}

async function loadAirportData(code) {
  // Try loading from GitHub first
  try {
    const resp = await fetch(`${DATA_BASE}data/${code.toLowerCase()}.json?v=${Date.now()}`);
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
  const header = document.getElementById("editorHeader");
  header.innerHTML = `
    <div class="editor-meta-grid">
      <div class="editor-meta-field">
        <label>ICAO</label>
        <input class="editor-card-input editor-meta-locked" value="${escapeHtml(airportData.icao)}" disabled title="ICAO is tied to filename and cannot be changed">
      </div>
      <div class="editor-meta-field">
        <label>IATA</label>
        <input class="editor-card-input" id="metaIata" value="${escapeHtml(airportData.iata || '')}" placeholder="JFK" spellcheck="false">
      </div>
      <div class="editor-meta-field editor-meta-wide">
        <label>Airport Name</label>
        <input class="editor-card-input" id="metaName" value="${escapeHtml(airportData.name || '')}" placeholder="John F. Kennedy International Airport" spellcheck="false">
      </div>
      <div class="editor-meta-field editor-meta-wide">
        <label>City / Location</label>
        <input class="editor-card-input" id="metaCity" value="${escapeHtml(airportData.city || '')}" placeholder="New York, NY" spellcheck="false">
      </div>
    </div>`;

  // Bind change events to update airportData
  ["metaIata", "metaName", "metaCity"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => {
        const fieldMap = { metaIata: "iata", metaName: "name", metaCity: "city" };
        airportData[fieldMap[id]] = input.value.trim();
        markChanged();
      });
    }
  });
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
    // Sync delete button position
    const delKey = `${type}_${id}`;
    if (deleteButtons[delKey]) {
      const b = rect.getBounds();
      deleteButtons[delKey].setLatLng(L.latLng(b.getNorth(), b.getEast()));
    }
  });

  return marker;
}

function createDeleteButton(rect, type, id) {
  const bounds = rect.getBounds();
  const pos = L.latLng(bounds.getNorth(), bounds.getEast());

  const icon = L.divIcon({
    className: "rect-delete-btn",
    html: "&times;",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const marker = L.marker(pos, {
    icon,
    interactive: true,
    zIndexOffset: 1100,
  });
  marker.addTo(editMap);

  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    const entityName = type === "term" ? "terminal" : "FBO";
    if (!confirm(`Delete this ${entityName}?`)) return;

    if (type === "term") {
      // Remove airlines assigned to this terminal
      Object.keys(airportData.airlines).forEach(code => {
        if (airportData.airlines[code].terminal === id) delete airportData.airlines[code];
      });
      airportData.terminals = airportData.terminals.filter(t => t.id !== id);
      if (termRects[id]) { editMap.removeLayer(termRects[id]); delete termRects[id]; }
      if (dragHandles[`term_${id}`]) { editMap.removeLayer(dragHandles[`term_${id}`]); delete dragHandles[`term_${id}`]; }
      renderTerminalCards();
    } else {
      airportData.fbos = airportData.fbos.filter(f => f.id !== id);
      if (fboRects[id]) { editMap.removeLayer(fboRects[id]); delete fboRects[id]; }
      if (dragHandles[`fbo_${id}`]) { editMap.removeLayer(dragHandles[`fbo_${id}`]); delete dragHandles[`fbo_${id}`]; }
      renderFBOCards();
    }

    // Remove the delete button itself
    editMap.removeLayer(marker);
    delete deleteButtons[`${type}_${id}`];
    markChanged();
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
      // Sync handle + delete button positions after resize
      if (dragHandles[`term_${term.id}`]) {
        dragHandles[`term_${term.id}`].setLatLng(rect.getCenter());
      }
      if (deleteButtons[`term_${term.id}`]) {
        const b = rect.getBounds();
        deleteButtons[`term_${term.id}`].setLatLng(L.latLng(b.getNorth(), b.getEast()));
      }
    });

    rect.on("click", () => selectRect("term", term.id));

    termRects[term.id] = rect;

    // Create drag handle and delete button
    const handle = createDragHandle(rect, "term", term.id);
    dragHandles[`term_${term.id}`] = handle;

    const delBtn = createDeleteButton(rect, "term", term.id);
    deleteButtons[`term_${term.id}`] = delBtn;
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
      if (deleteButtons[`fbo_${fbo.id}`]) {
        const b = rect.getBounds();
        deleteButtons[`fbo_${fbo.id}`].setLatLng(L.latLng(b.getNorth(), b.getEast()));
      }
    });

    rect.on("click", () => selectRect("fbo", fbo.id));

    fboRects[fbo.id] = rect;

    const handle = createDragHandle(rect, "fbo", fbo.id);
    dragHandles[`fbo_${fbo.id}`] = handle;

    const delBtn = createDeleteButton(rect, "fbo", fbo.id);
    deleteButtons[`fbo_${fbo.id}`] = delBtn;
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
      if (deleteButtons[`term_${termId}`]) {
        editMap.removeLayer(deleteButtons[`term_${termId}`]);
        delete deleteButtons[`term_${termId}`];
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
      if (deleteButtons[`fbo_${fboId}`]) {
        editMap.removeLayer(deleteButtons[`fbo_${fboId}`]);
        delete deleteButtons[`fbo_${fboId}`];
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
    if (deleteButtons[`term_${id}`]) {
      const b = rect.getBounds();
      deleteButtons[`term_${id}`].setLatLng(L.latLng(b.getNorth(), b.getEast()));
    }
  });
  rect.on("click", () => selectRect("term", id));

  termRects[id] = rect;

  const handle = createDragHandle(rect, "term", id);
  dragHandles[`term_${id}`] = handle;

  const delBtn = createDeleteButton(rect, "term", id);
  deleteButtons[`term_${id}`] = delBtn;

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
    if (deleteButtons[`fbo_${id}`]) {
      const b = rect.getBounds();
      deleteButtons[`fbo_${id}`].setLatLng(L.latLng(b.getNorth(), b.getEast()));
    }
  });
  rect.on("click", () => selectRect("fbo", id));

  fboRects[id] = rect;

  const handle = createDragHandle(rect, "fbo", id);
  dragHandles[`fbo_${id}`] = handle;

  const delBtn = createDeleteButton(rect, "fbo", id);
  deleteButtons[`fbo_${id}`] = delBtn;

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
  const filePath = `data/${icao.toLowerCase()}.json`;
  const content = JSON.stringify(airportData, null, 2);
  await saveFileToGitHub(token, filePath, content, `Update ${icao} airport data`);
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

// Settings panel functions are in settings.js (shared)

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

// showToast() and escapeHtml() are in settings.js (shared)

// ==========================================
// EVENTS
// ==========================================

function bindEvents() {
  document.getElementById("saveBtn").addEventListener("click", saveData);
  document.getElementById("exportBtn").addEventListener("click", exportJSON);
  document.getElementById("resetBtn").addEventListener("click", resetToDefaults);
  document.getElementById("addTerminalBtn").addEventListener("click", addTerminal);
  document.getElementById("addFBOBtn").addEventListener("click", addFBO);
  // Settings events are bound by initSettings() in settings.js

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
