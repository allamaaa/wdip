/* ============================================
   WHERE DO I PARK — Edit Page Logic
   ============================================ */

// ==========================================
// DEFAULT DATA (mirror of app.js AIRPORTS)
// ==========================================

const DEFAULT_AIRPORTS = {
  KJFK: {
    icao: "KJFK",
    iata: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York, NY",
    elevation: "13 ft",
    status: "active",
    runways: ["4L/22R", "4R/22L", "13L/31R", "13R/31L"],
    map: {
      center: [40.6413, -73.7781],
      zoom: 15,
      chartImage: "images/kjfk-chart.png",
      chartBounds: [[40.6175, -73.8050], [40.6680, -73.7500]],
    },
    terminals: [
      { id: "T1", name: "Terminal 1", gates: "1 – 11", bounds: [[40.6432, -73.7878], [40.6452, -73.7833]] },
      { id: "T4", name: "Terminal 4", gates: "A1 – A7, B20 – B47", bounds: [[40.6425, -73.7790], [40.6455, -73.7720]] },
      { id: "T5", name: "Terminal 5", gates: "1 – 32", bounds: [[40.6400, -73.7755], [40.6425, -73.7718]] },
      { id: "T7", name: "Terminal 7", gates: "Under Renovation", renovation: true, bounds: [[40.6383, -73.7820], [40.6400, -73.7775]] },
      { id: "T8", name: "Terminal 8", gates: "1 – 50", bounds: [[40.6390, -73.7880], [40.6430, -73.7838]] },
    ],
    airlines: {
      AFR: { name: "Air France", icao: "AFR", terminal: "T1" },
      AUA: { name: "Austrian Airlines", icao: "AUA", terminal: "T1" },
      ITY: { name: "ITA Airways", icao: "ITY", terminal: "T1" },
      KAL: { name: "Korean Air", icao: "KAL", terminal: "T1" },
      DLH: { name: "Lufthansa", icao: "DLH", terminal: "T1" },
      THY: { name: "Turkish Airlines", icao: "THY", terminal: "T1" },
      AZA: { name: "Alitalia", icao: "AZA", terminal: "T1" },
      NAX: { name: "Norwegian", icao: "NAX", terminal: "T1" },
      TAP: { name: "TAP Air Portugal", icao: "TAP", terminal: "T1" },
      PHO: { name: "Philippines AirAsia", icao: "PHO", terminal: "T1" },
      DAL: { name: "Delta Air Lines", icao: "DAL", terminal: "T4" },
      AMX: { name: "Aeromexico", icao: "AMX", terminal: "T4" },
      AIC: { name: "Air India", icao: "AIC", terminal: "T4" },
      AVA: { name: "Avianca", icao: "AVA", terminal: "T4" },
      CAL: { name: "China Airlines", icao: "CAL", terminal: "T4" },
      CES: { name: "China Eastern", icao: "CES", terminal: "T4" },
      CSN: { name: "China Southern", icao: "CSN", terminal: "T4" },
      UAE: { name: "Emirates", icao: "UAE", terminal: "T4" },
      ETD: { name: "Etihad Airways", icao: "ETD", terminal: "T4" },
      ELY: { name: "El Al", icao: "ELY", terminal: "T4" },
      KLM: { name: "KLM", icao: "KLM", terminal: "T4" },
      KQA: { name: "Kenya Airways", icao: "KQA", terminal: "T4" },
      SIA: { name: "Singapore Airlines", icao: "SIA", terminal: "T4" },
      VIR: { name: "Virgin Atlantic", icao: "VIR", terminal: "T4" },
      CXA: { name: "XiamenAir", icao: "CXA", terminal: "T4" },
      SVA: { name: "Saudia", icao: "SVA", terminal: "T4" },
      ARG: { name: "Aerolineas Argentinas", icao: "ARG", terminal: "T4" },
      JBU: { name: "JetBlue Airways", icao: "JBU", terminal: "T5" },
      HAL: { name: "Hawaiian Airlines", icao: "HAL", terminal: "T5" },
      KAP: { name: "Cape Air", icao: "KAP", terminal: "T5" },
      AAL: { name: "American Airlines", icao: "AAL", terminal: "T8" },
      BAW: { name: "British Airways", icao: "BAW", terminal: "T8" },
      CPA: { name: "Cathay Pacific", icao: "CPA", terminal: "T8" },
      FIN: { name: "Finnair", icao: "FIN", terminal: "T8" },
      IBE: { name: "Iberia", icao: "IBE", terminal: "T8" },
      JAL: { name: "Japan Airlines", icao: "JAL", terminal: "T8" },
      QFA: { name: "Qantas", icao: "QFA", terminal: "T8" },
      QTR: { name: "Qatar Airways", icao: "QTR", terminal: "T8" },
      RAM: { name: "Royal Air Maroc", icao: "RAM", terminal: "T8" },
      RJA: { name: "Royal Jordanian", icao: "RJA", terminal: "T8" },
      ICE: { name: "Icelandair", icao: "ICE", terminal: "T8" },
      LOT: { name: "LOT Polish Airlines", icao: "LOT", terminal: "T8" },
      TAM: { name: "LATAM Airlines", icao: "TAM", terminal: "T8" },
    },
    quickAirlines: ["DAL", "AAL", "JBU", "UAE", "BAW", "DLH", "AFR", "SIA"],
    fbos: [
      { id: "FBO1", name: "Modern Aviation", location: "Building 141, North Boundary Road", phone: "(718) 751-1200", bounds: [[40.6500, -73.7880], [40.6520, -73.7840]] },
      { id: "FBO2", name: "Sheltair", location: "Hangar 19, JFK Airport", phone: "(718) 244-6600", bounds: [[40.6490, -73.7760], [40.6510, -73.7720]] },
    ],
  },
};

// ==========================================
// STATE
// ==========================================

let airportData = null; // The airport object being edited
let icao = null;
let editMap = null;
let satelliteTileLayer = null;
let chartOverlay = null;
let currentMapView = "satellite";
let termRects = {}; // terminal id -> L.rectangle
let fboRects = {};  // fbo id -> L.rectangle
let selectedRectId = null;
let hasUnsavedChanges = false;
let nextTermId = 100;
let nextFboId = 100;

// ==========================================
// INIT
// ==========================================

function init() {
  // Get ICAO from URL params
  const params = new URLSearchParams(window.location.search);
  icao = params.get("icao");

  if (!icao) {
    document.getElementById("editorHeader").innerHTML =
      '<p style="color: var(--red);">No airport specified. Go back and select an airport.</p>';
    return;
  }

  // Load data: localStorage first, then defaults
  airportData = loadAirportData(icao);

  if (!airportData) {
    document.getElementById("editorHeader").innerHTML =
      `<p style="color: var(--red);">Airport "${icao}" not found.</p>`;
    return;
  }

  // Set back link
  document.getElementById("backLink").href = `index.html#airports`;

  // Render header
  renderHeader();

  // Init map
  initMap();

  // Render panels
  renderTerminalCards();
  renderFBOCards();

  // Bind events
  bindEvents();
}

function loadAirportData(icao) {
  // Try localStorage first
  try {
    const saved = localStorage.getItem("wdip_airports");
    if (saved) {
      const data = JSON.parse(saved);
      if (data[icao]) {
        // Deep clone so we don't mutate localStorage directly
        return JSON.parse(JSON.stringify(data[icao]));
      }
    }
  } catch (e) {
    console.warn("Failed to load from localStorage", e);
  }

  // Fallback to defaults
  if (DEFAULT_AIRPORTS[icao]) {
    return JSON.parse(JSON.stringify(DEFAULT_AIRPORTS[icao]));
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

  if (mapConfig.chartImage && mapConfig.chartBounds) {
    chartOverlay = L.imageOverlay(
      mapConfig.chartImage,
      mapConfig.chartBounds,
      { opacity: 0.92, interactive: false }
    );
  }

  // Draw terminal rectangles
  drawTerminalRects();

  // Draw FBO rectangles
  drawFBORects();

  // Map view toggle
  document.getElementById("mapViewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest(".map-toggle-btn");
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === currentMapView) return;
    switchMapView(view);
    document.querySelectorAll(".map-toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
}

function drawTerminalRects() {
  termRects = {};
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

    // Make editable
    rect.enableEdit();

    // Tooltip
    rect.bindTooltip(`<strong>${term.name}</strong>`, {
      className: "terminal-tooltip",
      direction: "top",
      offset: [0, -5],
    });

    // Listen for drag/resize
    rect.on("editable:dragend", () => updateTermBounds(term.id, rect));
    rect.on("editable:vertex:dragend", () => updateTermBounds(term.id, rect));

    // Click to select
    rect.on("click", () => selectRect("term", term.id));

    termRects[term.id] = rect;
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

    rect.on("editable:dragend", () => updateFBOBounds(fbo.id, rect));
    rect.on("editable:vertex:dragend", () => updateFBOBounds(fbo.id, rect));
    rect.on("click", () => selectRect("fbo", fbo.id));

    fboRects[fbo.id] = rect;
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

  // Highlight selected
  if (type === "term" && termRects[id]) {
    const term = airportData.terminals.find((t) => t.id === id);
    const isReno = term && term.renovation;
    const color = isReno ? "#fbbf24" : "#00d4ff";
    termRects[id].setStyle({ color, fillColor: color, weight: 3, opacity: 1, fillOpacity: 0.25 });
    editMap.panTo(termRects[id].getCenter(), { animate: true });
    // Scroll to terminal card
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

function switchMapView(view) {
  if (!editMap) return;
  currentMapView = view;

  if (view === "satellite") {
    if (chartOverlay && editMap.hasLayer(chartOverlay)) editMap.removeLayer(chartOverlay);
    if (!editMap.hasLayer(satelliteTileLayer)) satelliteTileLayer.addTo(editMap);
  } else if (view === "chart") {
    if (editMap.hasLayer(satelliteTileLayer)) editMap.removeLayer(satelliteTileLayer);
    if (chartOverlay && !editMap.hasLayer(chartOverlay)) chartOverlay.addTo(editMap);
  }
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
                <span class="editor-airline-tag" data-icao="${a.icao}" data-term-id="${term.id}">
                  ${a.icao}
                  <button class="editor-airline-remove" data-icao="${a.icao}" data-term-id="${term.id}">&times;</button>
                </span>
              `).join("")}
            </div>
            <div class="editor-add-airline">
              <input class="editor-airline-input" placeholder="Add ICAO..." maxlength="4" data-term-id="${term.id}" spellcheck="false">
            </div>
          </div>
        </div>`;
    })
    .join("");

  // Bind terminal card events
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
        // Update tooltip
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
        // Re-render to update styles
        renderTerminalCards();
        // Update rect style
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
      const icaoCode = btn.dataset.icao;
      const termId = btn.dataset.termId;
      if (airportData.airlines[icaoCode]) {
        delete airportData.airlines[icaoCode];
        markChanged();
        renderTerminalCards();
      }
    });
  });

  // Add airline input
  document.querySelectorAll(".editor-airline-input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const code = input.value.trim().toUpperCase();
        const termId = input.dataset.termId;
        if (!code) return;

        // Check if airline already exists
        if (airportData.airlines[code]) {
          // Move it to this terminal
          airportData.airlines[code].terminal = termId;
        } else {
          // Add new airline
          airportData.airlines[code] = { name: code, icao: code, terminal: termId };
        }
        markChanged();
        renderTerminalCards();
      }
    });
  });

  // Delete terminal
  document.querySelectorAll(".editor-card-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const termId = btn.dataset.termId;
      if (!confirm(`Delete this terminal? Airlines assigned to it will be unassigned.`)) return;

      // Remove airlines assigned to this terminal
      Object.keys(airportData.airlines).forEach((code) => {
        if (airportData.airlines[code].terminal === termId) {
          delete airportData.airlines[code];
        }
      });

      // Remove terminal
      airportData.terminals = airportData.terminals.filter((t) => t.id !== termId);

      // Remove rectangle from map
      if (termRects[termId]) {
        editMap.removeLayer(termRects[termId]);
        delete termRects[termId];
      }

      markChanged();
      renderTerminalCards();
    });
  });

  // Click card to highlight on map
  document.querySelectorAll(".editor-term-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger on input/button clicks
      if (e.target.closest("input, button")) return;
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

  // Bind FBO card events
  bindFBOCardEvents();
}

function bindFBOCardEvents() {
  // Field changes
  document.querySelectorAll(".editor-fbo-card input.editor-card-input, .fbo-name-input").forEach((input) => {
    input.addEventListener("change", () => {
      const fboId = input.dataset.fboId;
      const field = input.dataset.field;
      const fbo = airportData.fbos.find((f) => f.id === fboId);
      if (fbo) {
        fbo[field] = input.value;
        markChanged();
        // Update tooltip if name changed
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

  // Delete FBO
  document.querySelectorAll(".fbo-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fboId = btn.dataset.fboId;
      if (!confirm("Delete this FBO?")) return;

      airportData.fbos = airportData.fbos.filter((f) => f.id !== fboId);

      if (fboRects[fboId]) {
        editMap.removeLayer(fboRects[fboId]);
        delete fboRects[fboId];
      }

      markChanged();
      renderFBOCards();
    });
  });

  // Click card to highlight on map
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

  // Draw rectangle
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

  rect.on("editable:dragend", () => updateTermBounds(id, rect));
  rect.on("editable:vertex:dragend", () => updateTermBounds(id, rect));
  rect.on("click", () => selectRect("term", id));

  termRects[id] = rect;

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

  // Draw rectangle
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

  rect.on("editable:dragend", () => updateFBOBounds(id, rect));
  rect.on("editable:vertex:dragend", () => updateFBOBounds(id, rect));
  rect.on("click", () => selectRect("fbo", id));

  fboRects[id] = rect;

  markChanged();
  renderFBOCards();
  selectRect("fbo", id);
}

// ==========================================
// SAVE / EXPORT / RESET
// ==========================================

function saveData() {
  try {
    let allData = {};
    const existing = localStorage.getItem("wdip_airports");
    if (existing) {
      allData = JSON.parse(existing);
    }
    allData[icao] = airportData;
    localStorage.setItem("wdip_airports", JSON.stringify(allData));
    hasUnsavedChanges = false;
    updateSaveButtonState();
    showToast("Saved successfully!");
  } catch (e) {
    console.error("Save failed", e);
    showToast("Save failed — check console for details", true);
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
  if (!confirm("Reset all changes for this airport to defaults? This cannot be undone.")) return;

  // Clear from localStorage
  try {
    const existing = localStorage.getItem("wdip_airports");
    if (existing) {
      const allData = JSON.parse(existing);
      delete allData[icao];
      if (Object.keys(allData).length === 0) {
        localStorage.removeItem("wdip_airports");
      } else {
        localStorage.setItem("wdip_airports", JSON.stringify(allData));
      }
    }
  } catch (e) {
    console.warn("Error clearing localStorage", e);
  }

  // Reload from defaults
  if (DEFAULT_AIRPORTS[icao]) {
    airportData = JSON.parse(JSON.stringify(DEFAULT_AIRPORTS[icao]));
  }

  // Clear and redraw map
  Object.values(termRects).forEach((r) => editMap.removeLayer(r));
  Object.values(fboRects).forEach((r) => editMap.removeLayer(r));
  termRects = {};
  fboRects = {};
  drawTerminalRects();
  drawFBORects();

  hasUnsavedChanges = false;
  updateSaveButtonState();
  renderTerminalCards();
  renderFBOCards();
  showToast("Reset to defaults!");
}

// ==========================================
// HELPERS
// ==========================================

function getAirlinesForTerminal(termId) {
  return Object.values(airportData.airlines).filter((a) => a.terminal === termId);
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

  // Warn before leaving with unsaved changes
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
