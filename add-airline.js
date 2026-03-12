/* ============================================
   WHERE DO I PARK — Add Airline Page Logic
   ============================================ */

const AIRLINES_PER_PAGE = 30;

let allAirlineKeys = [];
let filteredKeys = [];
let currentPage = 1;

function init() {
  initSettings();

  allAirlineKeys = Object.keys(AIRLINES_DB).sort((a, b) => {
    return AIRLINES_DB[a].name.localeCompare(AIRLINES_DB[b].name);
  });
  filteredKeys = [...allAirlineKeys];

  renderList();
  renderPagination();
  bindEvents();

  document.getElementById("airlineCount").textContent = `${allAirlineKeys.length} airlines`;
}

function bindEvents() {
  // Search
  document.getElementById("airlineSearchInput").addEventListener("input", (e) => {
    const q = e.target.value.trim().toUpperCase();
    if (!q) {
      filteredKeys = [...allAirlineKeys];
    } else {
      filteredKeys = allAirlineKeys.filter(key => {
        const db = AIRLINES_DB[key];
        return key.toUpperCase().includes(q) ||
               db.icao.toUpperCase().includes(q) ||
               db.name.toUpperCase().includes(q) ||
               (db.callsign && db.callsign.toUpperCase().includes(q));
      });
    }
    currentPage = 1;
    renderList();
    renderPagination();
    document.getElementById("airlineCount").textContent = `${filteredKeys.length} airlines`;
  });

  // Show add form
  document.getElementById("addNewBtn").addEventListener("click", () => {
    document.getElementById("addAirlineForm").style.display = "block";
    document.getElementById("addNewBtn").style.display = "none";
    document.getElementById("newKey").focus();
  });

  // Cancel add/edit form
  document.getElementById("cancelAddBtn").addEventListener("click", () => {
    if (editingKey) {
      closeEditForm();
    } else {
      document.getElementById("addAirlineForm").style.display = "none";
      document.getElementById("addNewBtn").style.display = "";
      clearAddForm();
    }
  });

  // Uppercase key and ICAO inputs
  ["newKey", "newIcao"].forEach(id => {
    document.getElementById(id).addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  });

  // Uppercase callsign
  document.getElementById("newCallsign").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Save
  document.getElementById("saveAirlineBtn").addEventListener("click", saveNewAirline);
}

function renderList() {
  const start = (currentPage - 1) * AIRLINES_PER_PAGE;
  const pageKeys = filteredKeys.slice(start, start + AIRLINES_PER_PAGE);

  const container = document.getElementById("airlineList");

  if (pageKeys.length === 0) {
    container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">No airlines found.</div>';
    return;
  }

  container.innerHTML = pageKeys.map(key => {
    const db = AIRLINES_DB[key];
    return `
      <div class="airline-list-item">
        <span class="icao">${escapeHtml(key)}</span>
        <span>${escapeHtml(db.name)}</span>
        <span style="color: var(--text-muted);">${escapeHtml(db.callsign || "\u2014")}</span>
        <span>${db.cargo ? '<span class="cargo-label">CARGO</span>' : ''}</span>
        <button class="airline-edit-btn" data-key="${escapeHtml(key)}" title="Edit airline">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M14.85 2.85a1.5 1.5 0 012.1 0l.2.2a1.5 1.5 0 010 2.1L7.5 14.8l-3.3.7.7-3.3 9.95-9.32z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`;
  }).join("");

  // Bind edit buttons
  container.querySelectorAll(".airline-edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditForm(btn.dataset.key);
    });
  });
}

function renderPagination() {
  const totalPages = Math.ceil(filteredKeys.length / AIRLINES_PER_PAGE);
  const container = document.getElementById("pagination");

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button id="prevPage" ${currentPage <= 1 ? 'disabled' : ''}>Previous</button>
    <span class="page-info">Page ${currentPage} of ${totalPages}</span>
    <button id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>`;

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderList(); renderPagination(); }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) { currentPage++; renderList(); renderPagination(); }
  });
}

async function saveNewAirline() {
  let key = document.getElementById("newKey").value.trim().toUpperCase();
  const name = document.getElementById("newName").value.trim();
  const icao = document.getElementById("newIcao").value.trim().toUpperCase();
  const callsign = document.getElementById("newCallsign").value.trim().toUpperCase();
  const isCargo = document.getElementById("newCargo").checked;

  // Append _C for cargo
  if (isCargo && !key.endsWith("_C")) {
    key = key + "_C";
  }

  if (!key || !name || !icao) {
    showToast("Key, Name, and ICAO Code are required", true);
    return;
  }

  if (AIRLINES_DB[key]) {
    showError("keyError", `Key "${key}" already exists in the database.`);
    return;
  }

  hideError("keyError");

  // Need a token to save
  const token = localStorage.getItem("wdip_gh_token");
  if (!token) {
    showSettingsPanel();
    showToast("GitHub token required to save airlines", true);
    return;
  }

  const saveBtn = document.getElementById("saveAirlineBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  // Add to in-memory DB
  const entry = { name, icao };
  if (callsign) entry.callsign = callsign;
  if (isCargo) entry.cargo = true;
  AIRLINES_DB[key] = entry;

  try {
    const fileContent = buildAirlinesDbFile();
    await saveFileToGitHub(token, "airlines-db.js", fileContent, `Add airline: ${name} (${key})`);

    showToast(`Added ${name} (${key})! Changes may take a few minutes to appear.`);

    // Refresh list
    allAirlineKeys = Object.keys(AIRLINES_DB).sort((a, b) => AIRLINES_DB[a].name.localeCompare(AIRLINES_DB[b].name));
    filteredKeys = [...allAirlineKeys];
    currentPage = 1;
    renderList();
    renderPagination();
    document.getElementById("airlineCount").textContent = `${allAirlineKeys.length} airlines`;

    // Hide form
    document.getElementById("addAirlineForm").style.display = "none";
    document.getElementById("addNewBtn").style.display = "";
    clearAddForm();

  } catch (e) {
    delete AIRLINES_DB[key]; // rollback
    console.error("Save failed", e);
    showToast(`Save failed: ${e.message}`, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Airline";
  }
}

function buildAirlinesDbFile() {
  let content = `/* ============================================\n`;
  content += `   AIRLINES DATABASE \u2014 ICAO codes, names, callsigns\n`;
  content += `   ============================================ */\n\n`;
  content += `const AIRLINES_DB = {\n`;

  const keys = Object.keys(AIRLINES_DB);
  keys.forEach((key, i) => {
    const entry = AIRLINES_DB[key];
    let fields = `name: "${escapejs(entry.name)}", icao: "${escapejs(entry.icao)}"`;
    if (entry.callsign) fields += `, callsign: "${escapejs(entry.callsign)}"`;
    if (entry.cargo) fields += `, cargo: true`;
    content += `  ${key}: { ${fields} }`;
    if (i < keys.length - 1) content += `,`;
    content += `\n`;
  });

  content += `};\n\n`;

  // Append the searchAirlines function verbatim
  content += SEARCH_AIRLINES_FUNCTION;

  return content;
}

function escapejs(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function clearAddForm() {
  ["newKey", "newName", "newIcao", "newCallsign"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("newCargo").checked = false;
  hideError("keyError");
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

// ==========================================
// EDIT AIRLINE
// ==========================================

let editingKey = null;

function openEditForm(key) {
  const db = AIRLINES_DB[key];
  if (!db) return;

  editingKey = key;

  // Show the add form repurposed for editing
  document.getElementById("addAirlineForm").style.display = "block";
  document.getElementById("addNewBtn").style.display = "none";

  // Update form title
  const formTitle = document.querySelector("#addAirlineForm h3");
  formTitle.textContent = `Edit Airline: ${key}`;

  // Populate fields
  document.getElementById("newKey").value = key.replace(/_C$/, "");
  document.getElementById("newKey").disabled = true; // Can't change key
  document.getElementById("newName").value = db.name;
  document.getElementById("newIcao").value = db.icao;
  document.getElementById("newCallsign").value = db.callsign || "";
  document.getElementById("newCargo").checked = !!db.cargo;

  // Switch save button to edit mode
  const saveBtn = document.getElementById("saveAirlineBtn");
  saveBtn.textContent = "Update Airline";
  saveBtn.removeEventListener("click", saveNewAirline);
  saveBtn.addEventListener("click", saveEditAirline);

  document.getElementById("newName").focus();
}

async function saveEditAirline() {
  const oldKey = editingKey;
  if (!oldKey) return;

  const name = document.getElementById("newName").value.trim();
  const icao = document.getElementById("newIcao").value.trim().toUpperCase();
  const callsign = document.getElementById("newCallsign").value.trim().toUpperCase();
  const isCargo = document.getElementById("newCargo").checked;

  if (!name || !icao) {
    showToast("Name and ICAO Code are required", true);
    return;
  }

  // Determine new key based on cargo status
  const baseKey = oldKey.replace(/_C$/, "");
  const newKey = isCargo ? (baseKey.endsWith("_C") ? baseKey : baseKey + "_C") : baseKey;

  // Check if new key conflicts with existing (when key changes)
  if (newKey !== oldKey && AIRLINES_DB[newKey]) {
    showToast(`Key "${newKey}" already exists in the database.`, true);
    return;
  }

  const token = localStorage.getItem("wdip_gh_token");
  if (!token) {
    showSettingsPanel();
    showToast("GitHub token required to save airlines", true);
    return;
  }

  const saveBtn = document.getElementById("saveAirlineBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  // Build updated entry
  const entry = { name, icao };
  if (callsign) entry.callsign = callsign;
  if (isCargo) entry.cargo = true;

  // Update in-memory DB (handle key rename)
  if (newKey !== oldKey) {
    delete AIRLINES_DB[oldKey];
  }
  AIRLINES_DB[newKey] = entry;

  try {
    const fileContent = buildAirlinesDbFile();
    await saveFileToGitHub(token, "airlines-db.js", fileContent, `Update airline: ${name} (${newKey})`);

    showToast(`Updated ${name} (${newKey})! Changes may take a few minutes to appear.`);

    // Refresh list
    allAirlineKeys = Object.keys(AIRLINES_DB).sort((a, b) => AIRLINES_DB[a].name.localeCompare(AIRLINES_DB[b].name));
    filteredKeys = [...allAirlineKeys];
    currentPage = 1;
    renderList();
    renderPagination();

    // Hide form and reset
    closeEditForm();

  } catch (e) {
    console.error("Save failed", e);
    showToast(`Save failed: ${e.message}`, true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Update Airline";
  }
}

function closeEditForm() {
  editingKey = null;
  document.getElementById("addAirlineForm").style.display = "none";
  document.getElementById("addNewBtn").style.display = "";

  // Reset form title
  const formTitle = document.querySelector("#addAirlineForm h3");
  formTitle.textContent = "New Airline";

  // Re-enable fields
  document.getElementById("newKey").disabled = false;
  document.getElementById("newCargo").disabled = false;

  // Reset save button
  const saveBtn = document.getElementById("saveAirlineBtn");
  saveBtn.textContent = "Save Airline";
  saveBtn.removeEventListener("click", saveEditAirline);
  saveBtn.addEventListener("click", saveNewAirline);

  clearAddForm();
}

// Store the searchAirlines function text as a constant for file reconstruction
const SEARCH_AIRLINES_FUNCTION = `/**
 * Search the airlines database.
 * Matches against ICAO code, airline name, and callsign.
 * @param {string} query - Search string
 * @param {Object} [airportAirlines] - If provided, only return airlines present at this airport
 * @returns {Array} Matching airline entries with their key
 */
function searchAirlines(query, airportAirlines) {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const source = airportAirlines || AIRLINES_DB;
  const results = [];

  Object.keys(source).forEach((key) => {
    const dbEntry = AIRLINES_DB[key];
    if (!dbEntry) return;

    const icaoMatch = dbEntry.icao.toUpperCase().startsWith(q) || key.toUpperCase().startsWith(q);
    const nameMatch = dbEntry.name.toUpperCase().includes(q);
    const callsignMatch = dbEntry.callsign && dbEntry.callsign.toUpperCase().includes(q);

    if (icaoMatch || nameMatch || callsignMatch) {
      results.push({
        key,
        ...dbEntry,
        // Include terminal if from airport data
        terminal: airportAirlines && airportAirlines[key] ? airportAirlines[key].terminal : undefined,
      });
    }
  });

  // Sort: exact ICAO matches first, then by name
  results.sort((a, b) => {
    const aExact = a.icao.toUpperCase() === q || a.key === q;
    const bExact = b.icao.toUpperCase() === q || b.key === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.name.localeCompare(b.name);
  });

  return results;
}
`;

document.addEventListener("DOMContentLoaded", init);
