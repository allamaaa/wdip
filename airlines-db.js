/* ============================================
   AIRLINES DATABASE — ICAO codes, names, callsigns
   ============================================ */

const AIRLINES_DB = {
  AAL: { name: "American Airlines", icao: "AAL", callsign: "AMERICAN" },
  DAL: { name: "Delta Air Lines", icao: "DAL", callsign: "DELTA" },
  UAL: { name: "United Airlines", icao: "UAL", callsign: "UNITED" },
  SWA: { name: "Southwest Airlines", icao: "SWA", callsign: "SOUTHWEST" },
  JBU: { name: "JetBlue Airways", icao: "JBU", callsign: "JETBLUE" },
  NKS: { name: "Spirit Airlines", icao: "NKS", callsign: "SPIRIT WINGS" },
  FFT: { name: "Frontier Airlines", icao: "FFT", callsign: "FRONTIER" },
  AAY: { name: "Allegiant Air", icao: "AAY", callsign: "ALLEGIANT" },
  ASA: { name: "Alaska Airlines", icao: "ASA", callsign: "ALASKA" },
  HAL: { name: "Hawaiian Airlines", icao: "HAL", callsign: "HAWAIIAN" },
  KAP: { name: "Cape Air", icao: "KAP", callsign: "CAIR" },
  SKW_A: { name: "SkyWest Airlines (American Eagle)", icao: "SKW", callsign: "SKYWEST" },
  SKW_U: { name: "SkyWest Airlines (United Express)", icao: "SKW", callsign: "SKYWEST" },
  SKW_D: { name: "SkyWest Airlines (Delta", icao: "SKW", callsign: "SKYWEST" },
  SKW_AS: { name: "SkyWest Airlines (Alaska Airlines)", icao: "SKW", callsign: "SKYWEST" },
  RPA_A: { name: "Republic Airways (American Eagle)", icao: "RPA", callsign: "BRICKYARD" },
  RPA_U: { name: "Republic Airways (United Express)", icao: "RPA", callsign: "BRICKYARD" },
  RPA_D: { name: "Republic Airways (Delta Connection)", icao: "RPA", callsign: "BRICKYARD" },
  ENY: { name: "Envoy Air (American Eagle)", icao: "ENY", callsign: "ENVOY" },
  PDT: { name: "Piedmont Airlines (American Eagle)", icao: "PDT", callsign: "PIEDMONT" },
  ACA: { name: "Air Canada", icao: "ACA", callsign: "AIR CANADA" },
  WJA: { name: "WestJet", icao: "WJA", callsign: "WESTJET" },
  TSC: { name: "Air Transat", icao: "TSC", callsign: "AIR TRANSAT" },
  POE: { name: "Porter Airlines", icao: "POE", callsign: "PORTER" },
  AMX: { name: "Aeromexico", icao: "AMX", callsign: "AEROMEXICO" },
  VIV: { name: "Viva Aerobus", icao: "VIV", callsign: "VIVA" },
  VOI: { name: "Volaris", icao: "VOI", callsign: "VOLARIS" },
  FDX: { name: "FedEx Express", icao: "FDX", callsign: "FEDEX", cargo: true },
  UPS: { name: "UPS Airlines", icao: "UPS", callsign: "UPS", cargo: true },
  ATN: { name: "Air Transport International", icao: "ATN", callsign: "AIR TRANSPORT", cargo: true },
  ABX: { name: "ABX Air", icao: "ABX", callsign: "ABEX", cargo: true },
  GTI: { name: "Atlas Air", icao: "GTI", callsign: "GIANT", cargo: true },
  PAC: { name: "Polar Air Cargo", icao: "PAC", callsign: "POLAR", cargo: true },
  KFS: { name: "Kalitta Air", icao: "CKS", callsign: "CONNIE", cargo: true },
  BAW: { name: "British Airways", icao: "BAW", callsign: "SPEEDBIRD" },
  AFR: { name: "Air France", icao: "AFR", callsign: "AIRFRANS" },
  DLH: { name: "Lufthansa", icao: "DLH", callsign: "LUFTHANSA" },
  KLM: { name: "KLM", icao: "KLM", callsign: "KLM" },
  IBE: { name: "Iberia", icao: "IBE", callsign: "IBERIA" },
  AUA: { name: "Austrian Airlines", icao: "AUA", callsign: "AUSTRIAN" },
  SAS: { name: "Scandinavian Airlines", icao: "SAS", callsign: "SCANDINAVIAN" },
  FIN: { name: "Finnair", icao: "FIN", callsign: "FINNAIR" },
  TAP: { name: "TAP Air Portugal", icao: "TAP", callsign: "AIR PORTUGAL" },
  SWR: { name: "Swiss International Air Lines", icao: "SWR", callsign: "SWISS" },
  BEL: { name: "Brussels Airlines", icao: "BEL", callsign: "BEE-LINE" },
  LOT: { name: "LOT Polish Airlines", icao: "LOT", callsign: "LOT" },
  THY: { name: "Turkish Airlines", icao: "THY", callsign: "TURKISH" },
  ITY: { name: "ITA Airways", icao: "ITY", callsign: "ITARROW" },
  AZA: { name: "Alitalia", icao: "AZA", callsign: "ALITALIA" },
  NAX: { name: "Norwegian", icao: "NAX", callsign: "NOR SHUTTLE" },
  ICE: { name: "Icelandair", icao: "ICE", callsign: "ICEAIR" },
  AEE: { name: "Aegean Airlines", icao: "AEE", callsign: "AEGEAN" },
  RYR: { name: "Ryanair", icao: "RYR", callsign: "RYANAIR" },
  EZY: { name: "easyJet", icao: "EZY", callsign: "EASY" },
  WZZ: { name: "Wizz Air", icao: "WZZ", callsign: "WIZZAIR" },
  VLG: { name: "Vueling", icao: "VLG", callsign: "VUELING" },
  EWG: { name: "Eurowings", icao: "EWG", callsign: "EUROWINGS" },
  VIR: { name: "Virgin Atlantic", icao: "VIR", callsign: "VIRGIN" },
  EIN: { name: "Aer Lingus", icao: "EIN", callsign: "SHAMROCK" },
  TVS: { name: "Smartwings", icao: "TVS", callsign: "SKYTRAVEL" },
  BCS: { name: "European Air Transport (DHL)", icao: "BCS", callsign: "POSTMAN", cargo: true },
  TUI: { name: "TUI fly", icao: "TUI", callsign: "TULIP" },
  CFG: { name: "Condor", icao: "CFG", callsign: "CONDOR" },
  AFL: { name: "Aeroflot", icao: "AFL", callsign: "AEROFLOT" },
  CLX: { name: "Cargolux", icao: "CLX", callsign: "CARGOLUX", cargo: true },
  BOX: { name: "AeroLogic", icao: "BOX", callsign: "GERMAN CARGO", cargo: true },
  TAY: { name: "ASL Airlines Belgium", icao: "TAY", callsign: "QUALITY", cargo: true },
  DHK: { name: "DHL Air UK", icao: "DHK", callsign: "WORLD EXPRESS", cargo: true },
  GEC: { name: "Lufthansa Cargo", icao: "GEC", callsign: "LUFTHANSA CARGO", cargo: true },
  UAE: { name: "Emirates", icao: "UAE", callsign: "EMIRATES" },
  ETD: { name: "Etihad Airways", icao: "ETD", callsign: "ETIHAD" },
  QTR: { name: "Qatar Airways", icao: "QTR", callsign: "QATARI" },
  SVA: { name: "Saudia", icao: "SVA", callsign: "SAUDIA" },
  GFA: { name: "Gulf Air", icao: "GFA", callsign: "GULF AIR" },
  RJA: { name: "Royal Jordanian", icao: "RJA", callsign: "JORDANIAN" },
  RAM: { name: "Royal Air Maroc", icao: "RAM", callsign: "ROYAL AIR MAROC" },
  MEA: { name: "Middle East Airlines", icao: "MEA", callsign: "CEDAR JET" },
  OMA: { name: "Oman Air", icao: "OMA", callsign: "OMAN AIR" },
  KAC: { name: "Kuwait Airways", icao: "KAC", callsign: "KUWAITI" },
  ELY: { name: "El Al", icao: "ELY", callsign: "EL AL" },
  FDB: { name: "flydubai", icao: "FDB", callsign: "SKY DUBAI" },
  ABY: { name: "Air Arabia", icao: "ABY", callsign: "ARABIA" },
  UAE_C: { name: "Emirates SkyCargo", icao: "UAE", callsign: "EMIRATES", cargo: true },
  QTR_C: { name: "Qatar Airways Cargo", icao: "QTR", callsign: "QATARI", cargo: true },
  ETD_C: { name: "Etihad Cargo", icao: "ETD", callsign: "ETIHAD", cargo: true },
  CPA: { name: "Cathay Pacific", icao: "CPA", callsign: "CATHAY" },
  CPA_C: { name: "Cathay Pacific (Cargo)", icao: "CPA", callsign: "CATHAY", cargo: true },
  SIA: { name: "Singapore Airlines", icao: "SIA", callsign: "SINGAPORE" },
  SIA_C: { name: "Singapore Airlines Cargo", icao: "SIA", callsign: "SINGAPORE", cargo: true },
  JAL: { name: "Japan Airlines", icao: "JAL", callsign: "JAPAN AIR" },
  ANA: { name: "All Nippon Airways", icao: "ANA", callsign: "ALL NIPPON" },
  KAL: { name: "Korean Air", icao: "KAL", callsign: "KOREANAIR" },
  KAL_C: { name: "Korean Air Cargo", icao: "KAL", callsign: "KOREANAIR", cargo: true },
  AAR: { name: "Asiana Airlines", icao: "AAR", callsign: "ASIANA" },
  CCA: { name: "Air China", icao: "CCA", callsign: "AIR CHINA" },
  CCA_C: { name: "Air China Cargo", icao: "CCA", callsign: "AIR CHINA", cargo: true },
  CES: { name: "China Eastern", icao: "CES", callsign: "CHINA EASTERN" },
  CSN: { name: "China Southern", icao: "CSN", callsign: "CHINA SOUTHERN" },
  CAL: { name: "China Airlines", icao: "CAL", callsign: "DYNASTY" },
  CAL_C: { name: "China Airlines Cargo", icao: "CAL", callsign: "DYNASTY", cargo: true },
  EVA: { name: "EVA Air", icao: "EVA", callsign: "EVA" },
  EVA_C: { name: "EVA Air Cargo", icao: "EVA", callsign: "EVA" },
  THA: { name: "Thai Airways", icao: "THA", callsign: "THAI" },
  MAS: { name: "Malaysia Airlines", icao: "MAS", callsign: "MALAYSIAN" },
  GIA: { name: "Garuda Indonesia", icao: "GIA", callsign: "INDONESIA" },
  PAL: { name: "Philippine Airlines", icao: "PAL", callsign: "PHILIPPINE" },
  PHO: { name: "Philippines AirAsia", icao: "PHO", callsign: "COOL RED" },
  VNA: { name: "Vietnam Airlines", icao: "VNA", callsign: "VIETNAM AIRLINES" },
  QFA: { name: "Qantas", icao: "QFA", callsign: "QANTAS" },
  ANZ: { name: "Air New Zealand", icao: "ANZ", callsign: "NEW ZEALAND" },
  AXM: { name: "AirAsia", icao: "AXM", callsign: "RED CAP" },
  CXA: { name: "XiamenAir", icao: "CXA", callsign: "XIAMEN AIR" },
  HDA: { name: "Hainan Airlines", icao: "HDA", callsign: "HAINAN" },
  SJX: { name: "Sriwijaya Air", icao: "SJX", callsign: "SRIWIJAYA" },
  VJC: { name: "VietJet Air", icao: "VJC", callsign: "VIETJET" },
  JST: { name: "Jetstar Airways", icao: "JST", callsign: "JETSTAR" },
  APJ: { name: "Peach Aviation", icao: "APJ", callsign: "AIR PEACH" },
  TWB: { name: "Starlux Airlines", icao: "TWB", callsign: "STARWALKER" },
  NCA: { name: "Nippon Cargo Airlines", icao: "NCA", callsign: "NIPPON CARGO", cargo: true },
  CSS: { name: "S.F Airlines Cargo", icao: "CSS", callsign: "SHUN FENG", cargo: true },
  AVA: { name: "Avianca", icao: "AVA", callsign: "AVIANCA" },
  TAM: { name: "LATAM Airlines", icao: "TAM", callsign: "TAM" },
  GLO: { name: "GOL Linhas Aereas", icao: "GLO", callsign: "GOL TRANSPORTE" },
  ARG: { name: "Aerolineas Argentinas", icao: "ARG", callsign: "ARGENTINA" },
  CMP: { name: "Copa Airlines", icao: "CMP", callsign: "COPA" },
  AZU: { name: "Azul Brazilian Airlines", icao: "AZU", callsign: "AZUL" },
  KQA: { name: "Kenya Airways", icao: "KQA", callsign: "KENYA" },
  SAA: { name: "South African Airways", icao: "SAA", callsign: "SPRINGBOK" },
  ETH: { name: "Ethiopian Airlines", icao: "ETH", callsign: "ETHIOPIAN" },
  ETH_C: { name: "Ethiopian Airlines Cargo", icao: "ETH", callsign: "ETHIOPIAN", cargo: true },
  MSR: { name: "EgyptAir", icao: "MSR", callsign: "EGYPTAIR" },
  NIG: { name: "Arik Air", icao: "NIG", callsign: "ARIK AIR" },
  RWD: { name: "RwandAir", icao: "RWD", callsign: "RWANDAIR" },
  AIC: { name: "Air India", icao: "AIC", callsign: "AIRINDIA" },
  IGO: { name: "IndiGo", icao: "IGO", callsign: "IFLY" },
  SEJ: { name: "SpiceJet", icao: "SEJ", callsign: "SPICEJET" },
  AKJ: { name: "Air India Express", icao: "AKJ", callsign: "EXPRESS INDIA" },
  MXY: { name: "Breeze Airways", icao: "MXY", callsign: "MOXY" },
  EDV: { name: "Endeavor Air (Delta Connection)", icao: "EDV", callsign: "ENDEAVOR" },
  EJA: { name: "NetJets", icao: "EJA", callsign: "EXECJET" },
  LXJ: { name: "FlexJet", icao: "LXJ", callsign: "FLEXJET" },
  JIA: { name: "PSA Airlines (American Eagle)", icao: "JIA", callsign: "BLUE STREAK" },
  GJS: { name: "GoJet Airlines (United Express)", icao: "GJS", callsign: "LINDBERGH" },
  AHY: { name: "Azerbaijan Airways", icao: "AHY", callsign: "AZAL" },
  UCA: { name: "Commute Air (United Express)", icao: "UCA", callsign: "COMMUTEAIR" }
};

/**
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
