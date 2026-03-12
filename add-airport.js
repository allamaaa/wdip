/* ============================================
   WHERE DO I PARK — Add Airport Page Logic
   ============================================ */

let previewMap = null;
let geocodeTimer = null;

function init() {
  initSettings();
  initMap();
  bindEvents();
}

function initMap() {
  previewMap = L.map("previewMap", {
    center: [30, 0],
    zoom: 2,
    zoomControl: true,
  });

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles &copy; Esri", maxZoom: 19 }
  ).addTo(previewMap);
}

function bindEvents() {
  const icaoInput = document.getElementById("icaoInput");

  icaoInput.addEventListener("input", (e) => {
    const val = e.target.value.toUpperCase();
    e.target.value = val;

    hideError("icaoError");

    // Debounced geocode when 4 chars entered
    clearTimeout(geocodeTimer);
    if (val.length === 4) {
      geocodeTimer = setTimeout(() => geocodeICAO(val), 500);
    }

    updateSubmitState();
  });

  // Other inputs
  ["iataInput", "nameInput", "cityInput"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      updateSubmitState();
    });
  });

  // Uppercase IATA
  document.getElementById("iataInput").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  document.getElementById("submitBtn").addEventListener("click", submitAirport);
}

async function geocodeICAO(icao) {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(icao + " airport")}&format=json&limit=1`,
      { headers: { "User-Agent": "WDIP-AddAirport/1.0" } }
    );
    const results = await resp.json();
    if (results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      previewMap.flyTo([lat, lon], 15, { duration: 1.5 });
    }
  } catch (e) {
    console.warn("Geocode failed", e);
  }
}

function updateSubmitState() {
  const icao = document.getElementById("icaoInput").value.trim();
  const name = document.getElementById("nameInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();
  document.getElementById("submitBtn").disabled = !(icao.length === 4 && name && city);
}

async function submitAirport() {
  const icao = document.getElementById("icaoInput").value.trim().toUpperCase();
  const iata = document.getElementById("iataInput").value.trim().toUpperCase();
  const name = document.getElementById("nameInput").value.trim();
  const city = document.getElementById("cityInput").value.trim();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  // Need a token to save
  const token = localStorage.getItem("wdip_gh_token");
  if (!token) {
    showSettingsPanel();
    showToast("Configure a GitHub token first", true);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Airport";
    return;
  }

  try {
    // Check if airport already exists
    const indexResp = await fetch(DATA_BASE + "data/airports-index.json?v=" + Date.now());
    const indexData = await indexResp.json();

    if (indexData.airports[icao]) {
      showError("icaoError", `Airport ${icao} already exists in the database.`);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Airport";
      return;
    }

    // Get map center from current preview map position
    const center = previewMap.getCenter();
    const zoom = previewMap.getZoom();

    // Build airport data
    const airportData = {
      icao,
      iata: iata || "",
      name,
      city,
      elevation: "",
      status: "active",
      runways: [],
      map: { center: [center.lat, center.lng], zoom: Math.max(zoom, 15) },
      terminals: [],
      airlines: {},
      quickAirlines: [],
      fbos: [],
    };

    // Save airport JSON file
    await saveFileToGitHub(
      token,
      `data/${icao.toLowerCase()}.json`,
      JSON.stringify(airportData, null, 2),
      `Add ${icao} airport data`
    );

    // Update airports-index.json
    indexData.airports[icao] = {
      icao,
      iata: iata || "",
      name,
      city,
      status: "active",
      file: `data/${icao.toLowerCase()}.json`,
      terminalCount: 0,
      airlineCount: 0,
      fboCount: 0,
    };

    await saveFileToGitHub(
      token,
      "data/airports-index.json",
      JSON.stringify(indexData, null, 2),
      `Add ${icao} to airports index`
    );

    showToast("Airport created! Changes may take a few minutes to update.");

    // Redirect to edit page
    setTimeout(() => {
      window.location.href = `edit.html?icao=${icao}`;
    }, 1000);

  } catch (e) {
    console.error("Submit failed", e);
    showToast(`Error: ${e.message}`, true);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Airport";
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add("visible");
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("visible");
}

document.addEventListener("DOMContentLoaded", init);
