/* ============================================
   WHERE DO I PARK — App Logic
   ============================================ */

// ==========================================
// DATA (loaded async)
// ==========================================

let AIRPORTS = {};

// ==========================================
// DOM REFS
// ==========================================

const dom = {
  airportGrid: document.getElementById("airportGrid"),
  airportSearchInput: document.getElementById("airportSearchInput"),
  searchSection: document.getElementById("searchSection"),
  airportsSection: document.getElementById("airports"),
  airportInfoHeader: document.getElementById("airportInfoHeader"),
  airlineInput: document.getElementById("airlineInput"),
  autocompleteDropdown: document.getElementById("autocompleteDropdown"),
  searchBtn: document.getElementById("searchBtn"),
  backBtn: document.getElementById("backBtn"),
  quickAirlines: document.getElementById("quickAirlines"),
  mapWrapper: document.getElementById("mapWrapper"),
  mapHint: document.getElementById("mapHint"),
  mapViewToggle: document.getElementById("mapViewToggle"),
  infoPlaceholder: document.getElementById("infoPlaceholder"),
  infoContent: document.getElementById("infoContent"),
  fboList: document.getElementById("fboList"),
  contributeBtn: document.getElementById("contributeBtn"),
  modalOverlay: document.getElementById("modalOverlay"),
  modal: document.getElementById("modal"),
  modalClose: document.getElementById("modalClose"),
  modalIcon: document.getElementById("modalIcon"),
  modalTitle: document.getElementById("modalTitle"),
  modalDesc: document.getElementById("modalDesc"),
  modalBtn: document.getElementById("modalBtn"),
};

// ==========================================
// STATE
// ==========================================

let currentAirport = null;
let selectedTerminal = null;
let autocompleteIndex = -1;

// Leaflet state
let leafletMap = null;
let satelliteTileLayer = null;
let terminalRectangles = {};
let fboRectangles = {};

// Rectangle styles
const RECT_STYLE_DEFAULT = {
  color: "#00d4ff",
  weight: 2,
  opacity: 0.5,
  fillColor: "#00d4ff",
  fillOpacity: 0.08,
};

const RECT_STYLE_HOVER = {
  color: "#00d4ff",
  weight: 2,
  opacity: 0.7,
  fillColor: "#00d4ff",
  fillOpacity: 0.15,
};

const RECT_STYLE_HIGHLIGHTED = {
  color: "#00d4ff",
  weight: 3,
  opacity: 1,
  fillColor: "#00d4ff",
  fillOpacity: 0.25,
};

const RECT_STYLE_RENOVATION = {
  color: "#fbbf24",
  weight: 2,
  opacity: 0.4,
  fillColor: "#fbbf24",
  fillOpacity: 0.05,
  dashArray: "6 4",
};

const RECT_STYLE_RENOVATION_HIGHLIGHTED = {
  color: "#fbbf24",
  weight: 3,
  opacity: 0.8,
  fillColor: "#fbbf24",
  fillOpacity: 0.15,
  dashArray: "6 4",
};

const RECT_STYLE_FBO = {
  color: "#00e87b",
  weight: 2,
  opacity: 0.4,
  fillColor: "#00e87b",
  fillOpacity: 0.06,
};

const RECT_STYLE_FBO_HOVER = {
  color: "#00e87b",
  weight: 2,
  opacity: 0.7,
  fillColor: "#00e87b",
  fillOpacity: 0.15,
};

const RECT_STYLE_FBO_HIGHLIGHTED = {
  color: "#00e87b",
  weight: 3,
  opacity: 1,
  fillColor: "#00e87b",
  fillOpacity: 0.25,
};

// ==========================================
// INITIALIZATION
// ==========================================

async function init() {
  try {
    const resp = await fetch("data/airports-index.json?v=" + Date.now());
    const index = await resp.json();
    AIRPORTS = index.airports;
  } catch (e) {
    console.error("WDIP: Failed to load airports index", e);
    return;
  }

  renderAirportCards();
  bindEvents();
}

// ==========================================
// AIRPORT CARDS
// ==========================================

function renderAirportCards() {
  const html = Object.values(AIRPORTS)
    .map((apt) => {
      const isActive = apt.status === "active";
      const cardClass = isActive ? "airport-card" : "airport-card coming-soon";

      let meta = "";
      if (isActive && (apt.terminals || apt.terminalCount)) {
        const termCount = apt.terminals
          ? apt.terminals.filter((t) => !t.renovation).length
          : apt.terminalCount || 0;
        const airlineCount = apt.airlines
          ? Object.keys(apt.airlines).length
          : apt.airlineCount || 0;
        const fboCount = apt.fbos
          ? apt.fbos.length
          : apt.fboCount || 0;
        meta = `
          <div class="airport-card-meta">
            <div class="airport-meta-item"><span class="meta-dot"></span>${termCount} Terminals</div>
            <div class="airport-meta-item"><span class="meta-dot"></span>${airlineCount}+ Airlines</div>
            <div class="airport-meta-item"><span class="meta-dot"></span>${fboCount} FBOs</div>
          </div>`;
      } else if (isActive) {
        // Active but no metadata yet
        meta = `
          <div class="airport-card-meta">
            <div class="airport-meta-item"><span class="meta-dot"></span>Click to explore</div>
          </div>`;
      } else {
        meta = `
          <div class="airport-card-meta">
            <div class="airport-meta-item"><span class="meta-dot amber"></span>Data pending</div>
          </div>`;
      }

      return `
        <div class="${cardClass}" data-icao="${apt.icao}">
          ${!isActive ? '<span class="coming-soon-badge">Coming Soon</span>' : ""}
          <div class="airport-card-icao">${apt.icao}</div>
          <div class="airport-card-name">${apt.name}</div>
          <div class="airport-card-city">${apt.city}</div>
          ${meta}
        </div>`;
    })
    .join("");

  dom.airportGrid.innerHTML = html;
}

// ==========================================
// AIRPORT SEARCH / FILTER
// ==========================================

function filterAirports(query) {
  const q = query.trim().toUpperCase();
  const cards = dom.airportGrid.querySelectorAll(".airport-card");

  cards.forEach((card) => {
    const icao = card.dataset.icao;
    const apt = AIRPORTS[icao];
    if (!q) {
      card.style.display = "";
      return;
    }
    const match =
      apt.icao.toUpperCase().includes(q) ||
      (apt.iata && apt.iata.toUpperCase().includes(q)) ||
      apt.name.toUpperCase().includes(q) ||
      apt.city.toUpperCase().includes(q);
    card.style.display = match ? "" : "none";
  });
}

// ==========================================
// EVENT BINDING
// ==========================================

function bindEvents() {
  // Airport search filter
  dom.airportSearchInput.addEventListener("input", () => {
    filterAirports(dom.airportSearchInput.value);
  });

  // Airport card clicks
  dom.airportGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".airport-card");
    if (!card) return;
    const icao = card.dataset.icao;
    const apt = AIRPORTS[icao];

    if (apt.status === "coming_soon") {
      showModal(
        "🛬",
        `${apt.icao} — ${apt.name}`,
        `Terminal and gate data for ${apt.name} is coming soon. Want to help? Use the Contribute section to submit data for this airport!`
      );
      return;
    }

    openAirport(icao);
  });

  // Back button
  dom.backBtn.addEventListener("click", () => {
    closeAirport();
  });

  // Search
  dom.searchBtn.addEventListener("click", performSearch);
  dom.airlineInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const items = dom.autocompleteDropdown.querySelectorAll(".autocomplete-item");
      if (autocompleteIndex >= 0 && items[autocompleteIndex]) {
        const key = items[autocompleteIndex].dataset.key;
        dom.airlineInput.value = key;
        hideAutocomplete();
        performSearch();
      } else {
        performSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateAutocomplete(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateAutocomplete(-1);
    } else if (e.key === "Escape") {
      hideAutocomplete();
    }
  });

  dom.airlineInput.addEventListener("input", () => {
    updateAutocomplete();
  });

  dom.airlineInput.addEventListener("focus", () => {
    updateAutocomplete();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-input-group")) {
      hideAutocomplete();
    }
  });

  // Contribute button
  dom.contributeBtn.addEventListener("click", () => {
    showModal(
      "🚀",
      "Coming Soon",
      "The community contribution system is under development. Soon you'll be able to add terminal data for any airport in the world!"
    );
  });

  // Modal
  dom.modalClose.addEventListener("click", closeModal);
  dom.modalBtn.addEventListener("click", closeModal);
  dom.modalOverlay.addEventListener("click", (e) => {
    if (e.target === dom.modalOverlay) closeModal();
  });

  // Smooth scroll for nav
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (window.scrollY > 20) {
      nav.style.borderBottomColor = "var(--border-light)";
    } else {
      nav.style.borderBottomColor = "var(--border)";
    }
  });
}

// ==========================================
// AIRPORT OPEN/CLOSE
// ==========================================

async function openAirport(icao) {
  // Load full data if not already loaded
  if (!AIRPORTS[icao].terminals && AIRPORTS[icao].file) {
    try {
      const resp = await fetch(AIRPORTS[icao].file + "?v=" + Date.now());
      const data = await resp.json();
      Object.assign(AIRPORTS[icao], data);
    } catch (e) {
      console.error(`Failed to load airport data for ${icao}`, e);
      showModal("❌", "Load Error", `Could not load data for ${icao}. Please try again.`);
      return;
    }
  }

  currentAirport = AIRPORTS[icao];
  selectedTerminal = null;

  // Update header
  dom.airportInfoHeader.innerHTML = `
    <span class="icao">${currentAirport.icao}</span>
    <span class="name">${currentAirport.name} — ${currentAirport.city}</span>`;

  // Render map
  renderAirportMap();

  // Render quick airlines
  renderQuickAirlines();

  // Render FBOs
  renderFBOs();

  // Reset search state
  dom.airlineInput.value = "";
  resetInfoPanel();

  // Show edit button
  const editBtn = document.getElementById("editAirportBtn");
  if (editBtn) {
    editBtn.href = `edit.html?icao=${currentAirport.icao}`;
    editBtn.style.display = "inline-flex";
  }

  // Show search section, hide airport grid section
  dom.searchSection.style.display = "block";
  dom.airportsSection.style.display = "none";

  // Scroll to search
  dom.searchSection.scrollIntoView({ behavior: "smooth" });

  // Small delay to let layout settle before focusing
  setTimeout(() => {
    dom.airlineInput.focus();
    if (leafletMap) leafletMap.invalidateSize();
  }, 300);
}

function closeAirport() {
  currentAirport = null;
  selectedTerminal = null;
  destroyMap();

  dom.searchSection.style.display = "none";
  dom.airportsSection.style.display = "block";
  dom.airportsSection.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// LEAFLET AIRPORT MAP
// ==========================================

function renderAirportMap() {
  if (!currentAirport || !currentAirport.map) return;

  destroyMap();

  const mapConfig = currentAirport.map;

  leafletMap = L.map("leafletMap", {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    zoomControl: true,
    attributionControl: true,
  });

  satelliteTileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
      maxZoom: 19,
    }
  );
  satelliteTileLayer.addTo(leafletMap);

  // Terminal rectangles
  terminalRectangles = {};
  currentAirport.terminals.forEach((term) => {
    const isRenovation = !!term.renovation;
    const style = isRenovation ? RECT_STYLE_RENOVATION : RECT_STYLE_DEFAULT;

    const rect = L.rectangle(term.bounds, style);
    rect.addTo(leafletMap);

    let tooltipContent = `<strong>${term.name}</strong>`;
    if (isRenovation) {
      tooltipContent += `<span class="tooltip-renovation">Under Renovation</span>`;
    } else {
      tooltipContent += `<span class="tooltip-gates">Gates ${term.gates}</span>`;
    }
    rect.bindTooltip(tooltipContent, {
      className: "terminal-tooltip",
      direction: "top",
      offset: [0, -5],
    });

    rect.on("mouseover", () => {
      if (selectedTerminal !== term.id) {
        rect.setStyle(isRenovation ? RECT_STYLE_RENOVATION : RECT_STYLE_HOVER);
      }
    });
    rect.on("mouseout", () => {
      if (selectedTerminal !== term.id) {
        rect.setStyle(isRenovation ? RECT_STYLE_RENOVATION : RECT_STYLE_DEFAULT);
      }
    });

    rect.on("click", () => {
      selectTerminal(term.id);
    });

    terminalRectangles[term.id] = rect;
  });

  // FBO rectangles
  fboRectangles = {};
  if (currentAirport.fbos) {
    currentAirport.fbos.forEach((fbo) => {
      if (!fbo.bounds) return;
      const rect = L.rectangle(fbo.bounds, RECT_STYLE_FBO);
      rect.addTo(leafletMap);

      rect.bindTooltip(`<strong>${fbo.name}</strong><span class="tooltip-gates">FBO — General Aviation</span>`, {
        className: "terminal-tooltip fbo-tooltip",
        direction: "top",
        offset: [0, -5],
      });

      rect.on("mouseover", () => {
        rect.setStyle(RECT_STYLE_FBO_HOVER);
      });
      rect.on("mouseout", () => {
        rect.setStyle(RECT_STYLE_FBO);
      });
      rect.on("click", () => {
        highlightFBO(fbo.id);
      });

      fboRectangles[fbo.id] = rect;
    });
  }
}

function highlightFBO(fboId) {
  Object.values(fboRectangles).forEach((rect) => rect.setStyle(RECT_STYLE_FBO));
  highlightTerminal(null);

  if (!fboId) return;

  const rect = fboRectangles[fboId];
  if (rect) {
    rect.setStyle(RECT_STYLE_FBO_HIGHLIGHTED);
    leafletMap.panTo(rect.getCenter(), { animate: true, duration: 0.5 });
  }

  const fbo = currentAirport.fbos.find((f) => f.id === fboId);
  if (fbo) {
    dom.mapHint.textContent = fbo.name;
  }
}

function destroyMap() {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    satelliteTileLayer = null;
    terminalRectangles = {};
    fboRectangles = {};
  }
}

function highlightTerminal(terminalId) {
  if (currentAirport) {
    currentAirport.terminals.forEach((term) => {
      const rect = terminalRectangles[term.id];
      if (rect) {
        rect.setStyle(term.renovation ? RECT_STYLE_RENOVATION : RECT_STYLE_DEFAULT);
      }
    });
  }

  if (!terminalId) {
    selectedTerminal = null;
    return;
  }

  const rect = terminalRectangles[terminalId];
  const term = currentAirport.terminals.find((t) => t.id === terminalId);
  if (rect && term) {
    rect.setStyle(
      term.renovation ? RECT_STYLE_RENOVATION_HIGHLIGHTED : RECT_STYLE_HIGHLIGHTED
    );
    leafletMap.panTo(rect.getCenter(), { animate: true, duration: 0.5 });
  }

  selectedTerminal = terminalId;
}

function selectTerminal(terminalId) {
  if (!currentAirport) return;

  highlightTerminal(terminalId);

  const term = currentAirport.terminals.find((t) => t.id === terminalId);
  if (!term) return;

  const airlinesAtTerminal = Object.entries(currentAirport.airlines)
    .filter(([, a]) => a.terminal === terminalId)
    .map(([key, a]) => ({ key, ...a }));

  if (term.renovation) {
    showTerminalInfo(term, []);
    return;
  }

  showTerminalInfo(term, airlinesAtTerminal);
  dom.mapHint.textContent = term.name;
}

// ==========================================
// SEARCH
// ==========================================

function performSearch() {
  if (!currentAirport) return;

  const input = dom.airlineInput.value.trim().toUpperCase();
  if (!input) return;

  hideAutocomplete();

  // Try exact key match first
  if (currentAirport.airlines[input]) {
    const airline = currentAirport.airlines[input];
    const dbEntry = AIRLINES_DB[input];
    highlightTerminal(airline.terminal);
    showAirlineInfo(input, airline, dbEntry);
    dom.mapHint.textContent = `${airline.name} → ${airline.terminal}`;
    return;
  }

  // Try matching by ICAO field (for cargo variants etc)
  const byIcao = Object.entries(currentAirport.airlines).find(
    ([, a]) => a.icao === input
  );
  if (byIcao) {
    const [key, airline] = byIcao;
    const dbEntry = AIRLINES_DB[key];
    highlightTerminal(airline.terminal);
    showAirlineInfo(key, airline, dbEntry);
    dom.mapHint.textContent = `${airline.name} → ${airline.terminal}`;
    return;
  }

  // Try fuzzy search via airline DB
  const results = searchAirlines(input, currentAirport.airlines);
  if (results.length > 0) {
    const match = results[0];
    const airline = currentAirport.airlines[match.key];
    const dbEntry = AIRLINES_DB[match.key];
    highlightTerminal(airline.terminal);
    showAirlineInfo(match.key, airline, dbEntry);
    dom.mapHint.textContent = `${airline.name} → ${airline.terminal}`;
    return;
  }

  highlightTerminal(null);
  showNotFound(input);
  dom.mapHint.textContent = "Airline not found";
}

function updateAutocomplete() {
  const val = dom.airlineInput.value.trim();
  autocompleteIndex = -1;

  if (!val || !currentAirport) {
    hideAutocomplete();
    return;
  }

  const matches = searchAirlines(val, currentAirport.airlines).slice(0, 8);

  if (matches.length === 0) {
    hideAutocomplete();
    return;
  }

  dom.autocompleteDropdown.innerHTML = matches
    .map(
      (a) => `
    <div class="autocomplete-item" data-key="${a.key}">
      <span class="autocomplete-icao">${a.icao}${a.cargo ? ' <span class="autocomplete-cargo">CARGO</span>' : ""}</span>
      <span class="autocomplete-name">${a.name}</span>
      ${a.callsign ? `<span class="autocomplete-callsign">${a.callsign}</span>` : ""}
      <span class="autocomplete-terminal">${a.terminal || ""}</span>
    </div>`
    )
    .join("");

  dom.autocompleteDropdown.classList.add("active");

  dom.autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
    item.addEventListener("click", () => {
      dom.airlineInput.value = item.dataset.key;
      hideAutocomplete();
      performSearch();
    });
  });
}

function navigateAutocomplete(direction) {
  const items = dom.autocompleteDropdown.querySelectorAll(".autocomplete-item");
  if (items.length === 0) return;

  autocompleteIndex += direction;
  if (autocompleteIndex < 0) autocompleteIndex = items.length - 1;
  if (autocompleteIndex >= items.length) autocompleteIndex = 0;

  items.forEach((item, i) => {
    item.classList.toggle("selected", i === autocompleteIndex);
  });
}

function hideAutocomplete() {
  dom.autocompleteDropdown.classList.remove("active");
  autocompleteIndex = -1;
}

// ==========================================
// INFO PANEL
// ==========================================

function resetInfoPanel() {
  dom.infoPlaceholder.style.display = "block";
  dom.infoContent.style.display = "none";
  dom.mapHint.textContent = "Click a terminal or search an airline";
}

function showAirlineInfo(key, airline, dbEntry) {
  const term = currentAirport.terminals.find((t) => t.id === airline.terminal);
  const otherAirlines = Object.entries(currentAirport.airlines)
    .filter(([k, a]) => a.terminal === airline.terminal && k !== key)
    .map(([k, a]) => ({ key: k, ...a }));

  const callsign = dbEntry ? dbEntry.callsign : null;
  const isCargo = dbEntry ? dbEntry.cargo : false;

  dom.infoPlaceholder.style.display = "none";
  dom.infoContent.style.display = "block";

  dom.infoContent.innerHTML = `
    <div class="info-airline-header">
      <div class="airline-icon">${airline.icao}${isCargo ? '<span class="cargo-badge-sm">C</span>' : ""}</div>
      <div class="airline-details">
        <h3>${airline.name}</h3>
        <span class="airline-icao-label">ICAO: ${airline.icao}${callsign ? ` — Callsign: ${callsign}` : ""}</span>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-grid-item">
        <div class="info-grid-label">Terminal</div>
        <div class="info-grid-value terminal-highlight">${term ? term.name : airline.terminal}</div>
      </div>
      <div class="info-grid-item">
        <div class="info-grid-label">Gates</div>
        <div class="info-grid-value mono">${term ? term.gates : "—"}</div>
      </div>
      <div class="info-grid-item">
        <div class="info-grid-label">Airport</div>
        <div class="info-grid-value">${currentAirport.icao} / ${currentAirport.iata}</div>
      </div>
      <div class="info-grid-item">
        <div class="info-grid-label">Elevation</div>
        <div class="info-grid-value mono">${currentAirport.elevation}</div>
      </div>
    </div>
    ${
      otherAirlines.length > 0
        ? `<div class="info-other-airlines">
        <h4>Also at ${term ? term.name : airline.terminal}</h4>
        <div class="other-airline-tags">
          ${otherAirlines
            .map(
              (a) =>
                `<span class="airline-tag" data-key="${a.key}" title="${a.name}">${a.icao}${a.cargo || (AIRLINES_DB[a.key] && AIRLINES_DB[a.key].cargo) ? " (C)" : ""}</span>`
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`;

  dom.infoContent.querySelectorAll(".airline-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const k = tag.dataset.key;
      dom.airlineInput.value = k;
      performSearch();
    });
  });
}

function showTerminalInfo(term, airlines) {
  dom.infoPlaceholder.style.display = "none";
  dom.infoContent.style.display = "block";

  if (term.renovation) {
    dom.infoContent.innerHTML = `
      <div class="info-airline-header">
        <div class="airline-icon" style="background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.2); color: var(--amber);">🚧</div>
        <div class="airline-details">
          <h3>${term.name}</h3>
          <span class="airline-icao-label">Under Renovation</span>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-grid-item" style="grid-column: 1 / -1;">
          <div class="info-grid-label">Status</div>
          <div class="info-grid-value" style="color: var(--amber);">Under active renovation — no airline operations</div>
        </div>
      </div>`;
    return;
  }

  dom.infoContent.innerHTML = `
    <div class="info-airline-header">
      <div class="airline-icon">${term.id}</div>
      <div class="airline-details">
        <h3>${term.name}</h3>
        <span class="airline-icao-label">${airlines.length} airline${airlines.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-grid-item">
        <div class="info-grid-label">Gates</div>
        <div class="info-grid-value mono">${term.gates}</div>
      </div>
      <div class="info-grid-item">
        <div class="info-grid-label">Airport</div>
        <div class="info-grid-value">${currentAirport.icao}</div>
      </div>
    </div>
    ${
      airlines.length > 0
        ? `<div class="info-other-airlines">
        <h4>Airlines at ${term.name}</h4>
        <div class="other-airline-tags">
          ${airlines
            .map(
              (a) =>
                `<span class="airline-tag" data-key="${a.key}" title="${a.name}">${a.icao}${a.cargo || (AIRLINES_DB[a.key] && AIRLINES_DB[a.key].cargo) ? " (C)" : ""}</span>`
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`;

  dom.infoContent.querySelectorAll(".airline-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const k = tag.dataset.key;
      dom.airlineInput.value = k;
      performSearch();
    });
  });
}

function showNotFound(code) {
  dom.infoPlaceholder.style.display = "none";
  dom.infoContent.style.display = "block";

  dom.infoContent.innerHTML = `
    <div class="info-not-found">
      <div class="nf-icon">🔍</div>
      <h3>Airline Not Found</h3>
      <p>"${code}" was not found at ${currentAirport.icao}. Try searching by airline name or callsign.</p>
    </div>`;
}

// ==========================================
// QUICK AIRLINES
// ==========================================

function renderQuickAirlines() {
  if (!currentAirport || !currentAirport.quickAirlines) {
    dom.quickAirlines.innerHTML = "";
    return;
  }

  const html =
    '<span class="quick-label">Popular:</span>' +
    currentAirport.quickAirlines
      .map(
        (icao) =>
          `<button class="quick-btn" data-key="${icao}">${icao}</button>`
      )
      .join("");

  dom.quickAirlines.innerHTML = html;

  dom.quickAirlines.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      dom.airlineInput.value = btn.dataset.key;
      performSearch();
    });
  });
}

// ==========================================
// FBOs
// ==========================================

function renderFBOs() {
  if (!currentAirport || !currentAirport.fbos) {
    dom.fboList.innerHTML =
      '<div class="fbo-item"><div class="fbo-name">No FBO data available</div></div>';
    return;
  }

  dom.fboList.innerHTML = currentAirport.fbos
    .map(
      (fbo) => `
    <div class="fbo-item" data-fbo-id="${fbo.id || ""}">
      <div class="fbo-name">${fbo.name}</div>
      <div class="fbo-location">${fbo.location}</div>
      <div class="fbo-phone">${fbo.phone}</div>
    </div>`
    )
    .join("");

  dom.fboList.querySelectorAll(".fbo-item").forEach((item) => {
    const fboId = item.dataset.fboId;
    if (!fboId || !fboRectangles[fboId]) return;

    item.addEventListener("mouseenter", () => {
      fboRectangles[fboId].setStyle(RECT_STYLE_FBO_HIGHLIGHTED);
      item.classList.add("fbo-hover-active");
    });
    item.addEventListener("mouseleave", () => {
      fboRectangles[fboId].setStyle(RECT_STYLE_FBO);
      item.classList.remove("fbo-hover-active");
    });
    item.addEventListener("click", () => {
      highlightFBO(fboId);
    });
    item.style.cursor = "pointer";
  });
}

// ==========================================
// MODAL
// ==========================================

function showModal(icon, title, desc) {
  dom.modalIcon.textContent = icon;
  dom.modalTitle.textContent = title;
  dom.modalDesc.textContent = desc;
  dom.modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  dom.modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", init);
