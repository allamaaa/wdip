/* ============================================
   WHERE DO I PARK — App Logic
   ============================================ */

// ==========================================
// DATA
// ==========================================

const AIRPORTS = {
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
      // Geographic bounds for the FAA chart overlay [SW, NE]
      chartBounds: [[40.6175, -73.8050], [40.6680, -73.7500]],
    },
    terminals: [
      {
        id: "T1",
        name: "Terminal 1",
        gates: "1 – 11",
        // Leaflet bounds: [[south, west], [north, east]]
        bounds: [[40.6432, -73.7878], [40.6452, -73.7833]],
      },
      {
        id: "T4",
        name: "Terminal 4",
        gates: "A1 – A7, B20 – B47",
        bounds: [[40.6425, -73.7790], [40.6455, -73.7720]],
      },
      {
        id: "T5",
        name: "Terminal 5",
        gates: "1 – 32",
        bounds: [[40.6400, -73.7755], [40.6425, -73.7718]],
      },
      {
        id: "T7",
        name: "Terminal 7",
        gates: "Under Renovation",
        renovation: true,
        bounds: [[40.6383, -73.7820], [40.6400, -73.7775]],
      },
      {
        id: "T8",
        name: "Terminal 8",
        gates: "1 – 50",
        bounds: [[40.6390, -73.7880], [40.6430, -73.7838]],
      },
    ],
    airlines: {
      // Terminal 1
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
      // Terminal 4 (Delta hub)
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
      // Terminal 5 (JetBlue)
      JBU: { name: "JetBlue Airways", icao: "JBU", terminal: "T5" },
      HAL: { name: "Hawaiian Airlines", icao: "HAL", terminal: "T5" },
      KAP: { name: "Cape Air", icao: "KAP", terminal: "T5" },
      // Terminal 8 (American hub)
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
      {
        id: "FBO1",
        name: "Modern Aviation",
        location: "Building 141, North Boundary Road",
        phone: "(718) 751-1200",
        bounds: [[40.6500, -73.7880], [40.6520, -73.7840]],
      },
      {
        id: "FBO2",
        name: "Sheltair",
        location: "Hangar 19, JFK Airport",
        phone: "(718) 244-6600",
        bounds: [[40.6490, -73.7760], [40.6510, -73.7720]],
      },
    ],
  },
  KLGA: {
    icao: "KLGA",
    iata: "LGA",
    name: "LaGuardia Airport",
    city: "New York, NY",
    status: "coming_soon",
  },
  KPHL: {
    icao: "KPHL",
    iata: "PHL",
    name: "Philadelphia International Airport",
    city: "Philadelphia, PA",
    status: "coming_soon",
  },
};

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
let chartOverlay = null;
let terminalRectangles = {}; // keyed by terminal id
let fboRectangles = {}; // keyed by fbo id
let currentMapView = "satellite"; // "satellite" or "chart"

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

function init() {
  loadFromLocalStorage();
  renderAirportCards();
  bindEvents();
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("wdip_airports");
    if (!saved) return;
    const data = JSON.parse(saved);
    // Deep-merge saved data into AIRPORTS (only update existing keys + add new ones)
    Object.keys(data).forEach((icao) => {
      if (AIRPORTS[icao]) {
        // Merge into existing airport
        const savedApt = data[icao];
        if (savedApt.terminals) AIRPORTS[icao].terminals = savedApt.terminals;
        if (savedApt.airlines) AIRPORTS[icao].airlines = savedApt.airlines;
        if (savedApt.fbos) AIRPORTS[icao].fbos = savedApt.fbos;
        if (savedApt.quickAirlines) AIRPORTS[icao].quickAirlines = savedApt.quickAirlines;
      } else {
        // Add new airport entirely
        AIRPORTS[icao] = data[icao];
      }
    });
  } catch (e) {
    console.warn("WDIP: Failed to load saved data from localStorage", e);
  }
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
      if (isActive) {
        const termCount = apt.terminals.filter((t) => !t.renovation).length;
        const airlineCount = Object.keys(apt.airlines).length;
        meta = `
          <div class="airport-card-meta">
            <div class="airport-meta-item"><span class="meta-dot"></span>${termCount} Terminals</div>
            <div class="airport-meta-item"><span class="meta-dot"></span>${airlineCount}+ Airlines</div>
            <div class="airport-meta-item"><span class="meta-dot"></span>${apt.fbos.length} FBOs</div>
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
        const icao = items[autocompleteIndex].dataset.icao;
        dom.airlineInput.value = icao;
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

  // Map view toggle
  dom.mapViewToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".map-toggle-btn");
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === currentMapView) return;
    switchMapView(view);
    dom.mapViewToggle.querySelectorAll(".map-toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
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

function openAirport(icao) {
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

  // Reset map toggle to satellite
  currentMapView = "satellite";
  dom.mapViewToggle.querySelectorAll(".map-toggle-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === "satellite");
  });

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

  // Destroy previous map if it exists
  destroyMap();

  const mapConfig = currentAirport.map;

  // Initialize Leaflet map
  leafletMap = L.map("leafletMap", {
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    zoomControl: true,
    attributionControl: true,
  });

  // Satellite tile layer (Esri World Imagery)
  satelliteTileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
      maxZoom: 19,
    }
  );
  satelliteTileLayer.addTo(leafletMap);

  // FAA chart image overlay (hidden by default)
  if (mapConfig.chartImage && mapConfig.chartBounds) {
    chartOverlay = L.imageOverlay(
      mapConfig.chartImage,
      mapConfig.chartBounds,
      { opacity: 0.92, interactive: false }
    );
    // Not added to map yet — toggled via switchMapView
  }

  // Terminal rectangles
  terminalRectangles = {};
  currentAirport.terminals.forEach((term) => {
    const isRenovation = !!term.renovation;
    const style = isRenovation ? RECT_STYLE_RENOVATION : RECT_STYLE_DEFAULT;

    const rect = L.rectangle(term.bounds, style);
    rect.addTo(leafletMap);

    // Tooltip
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

    // Hover effects (only if not currently highlighted)
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

    // Click
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
  // Reset all FBO rectangles
  Object.values(fboRectangles).forEach((rect) => rect.setStyle(RECT_STYLE_FBO));
  // Reset terminal selection too
  highlightTerminal(null);

  if (!fboId) return;

  const rect = fboRectangles[fboId];
  if (rect) {
    rect.setStyle(RECT_STYLE_FBO_HIGHLIGHTED);
    leafletMap.panTo(rect.getCenter(), { animate: true, duration: 0.5 });
  }

  // Show FBO info
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
    chartOverlay = null;
    terminalRectangles = {};
    fboRectangles = {};
  }
}

function switchMapView(view) {
  if (!leafletMap) return;
  currentMapView = view;

  if (view === "satellite") {
    // Show satellite tiles, hide chart
    if (chartOverlay && leafletMap.hasLayer(chartOverlay)) {
      leafletMap.removeLayer(chartOverlay);
    }
    if (!leafletMap.hasLayer(satelliteTileLayer)) {
      satelliteTileLayer.addTo(leafletMap);
    }
  } else if (view === "chart") {
    // Remove satellite tiles, show chart overlay
    if (leafletMap.hasLayer(satelliteTileLayer)) {
      leafletMap.removeLayer(satelliteTileLayer);
    }
    if (chartOverlay && !leafletMap.hasLayer(chartOverlay)) {
      chartOverlay.addTo(leafletMap);
    }
  }
}

function highlightTerminal(terminalId) {
  // Reset all rectangles to default
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

  // Highlight selected
  const rect = terminalRectangles[terminalId];
  const term = currentAirport.terminals.find((t) => t.id === terminalId);
  if (rect && term) {
    rect.setStyle(
      term.renovation ? RECT_STYLE_RENOVATION_HIGHLIGHTED : RECT_STYLE_HIGHLIGHTED
    );
    // Pan to terminal
    leafletMap.panTo(rect.getCenter(), { animate: true, duration: 0.5 });
  }

  selectedTerminal = terminalId;
}

function selectTerminal(terminalId) {
  if (!currentAirport) return;

  highlightTerminal(terminalId);

  const term = currentAirport.terminals.find((t) => t.id === terminalId);
  if (!term) return;

  const airlinesAtTerminal = Object.values(currentAirport.airlines).filter(
    (a) => a.terminal === terminalId
  );

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

  const code = dom.airlineInput.value.trim().toUpperCase();
  if (!code) return;

  hideAutocomplete();

  const airline = currentAirport.airlines[code];

  if (airline) {
    highlightTerminal(airline.terminal);
    showAirlineInfo(airline);
    dom.mapHint.textContent = `${airline.name} → ${airline.terminal}`;
  } else {
    highlightTerminal(null);
    showNotFound(code);
    dom.mapHint.textContent = "Airline not found";
  }
}

function updateAutocomplete() {
  const val = dom.airlineInput.value.trim().toUpperCase();
  autocompleteIndex = -1;

  if (!val || !currentAirport) {
    hideAutocomplete();
    return;
  }

  const matches = Object.values(currentAirport.airlines)
    .filter(
      (a) =>
        a.icao.startsWith(val) ||
        a.name.toUpperCase().includes(val)
    )
    .slice(0, 8);

  if (matches.length === 0) {
    hideAutocomplete();
    return;
  }

  dom.autocompleteDropdown.innerHTML = matches
    .map(
      (a) => `
    <div class="autocomplete-item" data-icao="${a.icao}">
      <span class="autocomplete-icao">${a.icao}</span>
      <span class="autocomplete-name">${a.name}</span>
      <span class="autocomplete-terminal">${a.terminal}</span>
    </div>`
    )
    .join("");

  dom.autocompleteDropdown.classList.add("active");

  dom.autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
    item.addEventListener("click", () => {
      dom.airlineInput.value = item.dataset.icao;
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

function showAirlineInfo(airline) {
  const term = currentAirport.terminals.find((t) => t.id === airline.terminal);
  const otherAirlines = Object.values(currentAirport.airlines).filter(
    (a) => a.terminal === airline.terminal && a.icao !== airline.icao
  );

  dom.infoPlaceholder.style.display = "none";
  dom.infoContent.style.display = "block";

  dom.infoContent.innerHTML = `
    <div class="info-airline-header">
      <div class="airline-icon">${airline.icao}</div>
      <div class="airline-details">
        <h3>${airline.name}</h3>
        <span class="airline-icao-label">ICAO: ${airline.icao}</span>
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
                `<span class="airline-tag" data-icao="${a.icao}" title="${a.name}">${a.icao}</span>`
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`;

  dom.infoContent.querySelectorAll(".airline-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const icao = tag.dataset.icao;
      dom.airlineInput.value = icao;
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
                `<span class="airline-tag" data-icao="${a.icao}" title="${a.name}">${a.icao}</span>`
            )
            .join("")}
        </div>
      </div>`
        : ""
    }`;

  dom.infoContent.querySelectorAll(".airline-tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      const icao = tag.dataset.icao;
      dom.airlineInput.value = icao;
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
      <p>"${code}" was not found at ${currentAirport.icao}. Check the ICAO code or try using the autocomplete suggestions.</p>
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
          `<button class="quick-btn" data-icao="${icao}">${icao}</button>`
      )
      .join("");

  dom.quickAirlines.innerHTML = html;

  dom.quickAirlines.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      dom.airlineInput.value = btn.dataset.icao;
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

  // Add hover/click events for FBO map highlighting
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
