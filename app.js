// ============================================================
//  TasaVenezuela — app.js (Con Historial JSON Local)
// ============================================================

const elDolar   = document.getElementById("val-dolar");
const elEuro    = document.getElementById("val-euro");
const elBinance = document.getElementById("val-binance");

const elTrendDolar   = document.getElementById("trend-dolar");
const elTrendEuro    = document.getElementById("trend-euro");
const elTrendBinance = document.getElementById("trend-binance");

const elBcvDate    = document.getElementById("bcv-date-display");
const elLastUpdate = document.getElementById("last-update-display");
const btnRefresh    = document.getElementById("btn-refresh");
const refreshIconSvg = document.getElementById("refresh-icon-svg");

const inputFecha = document.getElementById("input-fecha");
const btnHoy     = document.getElementById("btn-hoy");

const inputVes  = document.getElementById("input-ves");
const inputUsd  = document.getElementById("input-usd");
const inputEur  = document.getElementById("input-eur");
const inputUsdt = document.getElementById("input-usdt");

let rates = { USD_BCV: 0, EUR_BCV: 0, USDT_BINANCE: 0 };
let hoyRates = { USD_BCV: 0, EUR_BCV: 0, USDT_BINANCE: 0 };
let historialCompleto = {};

function setLoading(on) {
  if (on) { 
    refreshIconSvg?.classList.add("spin"); 
    if (btnRefresh) btnRefresh.disabled = true; 
  } else { 
    refreshIconSvg?.classList.remove("spin"); 
    if (btnRefresh) btnRefresh.disabled = false; 
  }
}

// ============================================================
// Cargar Archivo JSON Local y Tasas de Hoy
// ============================================================

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return await res.json();
}

async function loadRates() {
  setLoading(true);
  try {
    // 1. Cargamos el archivo JSON local de historial
    try {
      historialCompleto = await fetchJSON("./historial.json");
    } catch (e) {
      console.warn("No se pudo cargar el historial.json, usando respaldo interno.");
    }

    // 2. Obtenemos tasas actuales del día
    const dolaresPromise = fetchJSON("https://ve.dolarapi.com/v1/dolares").catch(() => []);
    const eurosPromise   = fetchJSON("https://ve.dolarapi.com/v1/euros").catch(() => []);
    const binancePromise = fetchJSON("https://criptoya.com/api/binancep2p/sell/usdt/ves/1").catch(() => null);

    const [dolares, euros, binanceData] = await Promise.all([dolaresPromise, eurosPromise, binancePromise]);

    const bcvUsd = Array.isArray(dolares) ? dolares.find(d => d.fuente === "oficial") || dolares[0] : null;
    const bcvEur = Array.isArray(euros) ? euros.find(d => d.fuente === "oficial") || euros[0] : null;

    let precioBinanceReal = 0;
    if (binanceData) {
      if (binanceData.ask) precioBinanceReal = parseFloat(binanceData.ask);
      else if (binanceData.bid) precioBinanceReal = parseFloat(binanceData.bid);
      else if (binanceData.price) precioBinanceReal = parseFloat(binanceData.price);
    }

    const usdPromedio = bcvUsd ? bcvUsd.promedio : 742.23;
    const eurPromedio = bcvEur ? bcvEur.promedio : 844.22;
    const paraleloUsd = Array.isArray(dolares) ? (dolares.find(d => d.fuente === "paralelo")?.promedio || 838.93) : 838.93;

    hoyRates = {
      USD_BCV: usdPromedio,
      EUR_BCV: eurPromedio,
      USDT_BINANCE: precioBinanceReal > 0 ? precioBinanceReal : paraleloUsd
    };

    rates = { ...hoyRates };

    const fechaHoyStr = new Date().toISOString().split("T")[0];

    // Inyectamos el día de hoy en el objeto del historial en memoria por si se consulta
    historialCompleto[fechaHoyStr] = {
      USD: hoyRates.USD_BCV,
      EUR: hoyRates.EUR_BCV,
      USDT: hoyRates.USDT_BINANCE
    };

    if (inputFecha) {
      inputFecha.max = fechaHoyStr;
      inputFecha.value = fechaHoyStr;
    }

    updateUI(fechaHoyStr);

  } catch (e) {
    console.error("Error cargando tasas:", e);
  }
  setLoading(false);
}

// ============================================================
// Lógica de Búsqueda y Días Hábiles
// ============================================================

function obtenerUltimoDiaHabil(fechaStr) {
  let fecha = new Date(fechaStr + "T12:00:00");
  let diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

  if (diaSemana === 0) { 
    fecha.setDate(fecha.getDate() - 2); // Domingo -> Viernes
  } else if (diaSemana === 6) { 
    fecha.setDate(fecha.getDate() - 1); // Sábado -> Viernes
  }

  return fecha.toISOString().split("T")[0];
}

function buscarTasaPorFecha(fechaSeleccionada) {
  // Ajustar si cae en fin de semana
  const fechaEfectiva = obtenerUltimoDiaHabil(fechaSeleccionada);

  // 1. Buscar coincidencia exacta en el JSON
  if (historialCompleto[fechaEfectiva]) {
    const item = historialCompleto[fechaEfectiva];
    return {
      datos: { USD_BCV: item.USD, EUR_BCV: item.EUR, USDT_BINANCE: item.USDT },
      fechaReal: fechaEfectiva
    };
  }

  // 2. Si no está exacta, buscar la fecha disponible más cercana hacia atrás
  const fechasDisponibles = Object.keys(historialCompleto).sort().reverse();
  const fechaCercana = fechasDisponibles.find(f => f <= fechaEfectiva);

  if (fechaCercana) {
    const item = historialCompleto[fechaCercana];
    return {
      datos: { USD_BCV: item.USD, EUR_BCV: item.EUR, USDT_BINANCE: item.USDT },
      fechaReal: fechaCercana
    };
  }

  // 3. Fallback final si la fecha es muy lejana y no está registrada
  return {
    datos: { ...hoyRates },
    fechaReal: fechaEfectiva
  };
}

// ============================================================
// Actualización de UI
// ============================================================

function updateUI(fechaMostrar) {
  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  if (elBcvDate) {
    const d = new Date(fechaMostrar.includes("T") ? fechaMostrar : fechaMostrar + "T12:00:00");
    elBcvDate.textContent = isNaN(d.getTime()) ? fechaMostrar : d.toLocaleDateString("es-VE");
  }

  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (inputVes && inputVes.value !== "") {
    inputVes.dispatchEvent(new Event("input"));
  }
}

// ============================================================
// Eventos del Calendario
// ============================================================

if (inputFecha) {
  inputFecha.addEventListener("change", (e) => {
    const fechaSeleccionada = e.target.value;
    if (!fechaSeleccionada) return;

    const resultado = buscarTasaPorFecha(fechaSeleccionada);
    rates = resultado.datos;
    inputFecha.value = resultado.fechaReal; // Muestra la fecha efectiva en el input si era fin de semana

    updateUI(resultado.fechaReal);
  });
}

if (btnHoy) {
  btnHoy.addEventListener("click", loadRates);
}

// ============================================================
// Calculadora Multidireccional
// ============================================================

function clean(v) { return parseFloat(v) || 0; }

function clearAllInputs() {
  if (inputVes)  inputVes.value  = "";
  if (inputUsd)  inputUsd.value  = "";
  if (inputEur)  inputEur.value  = "";
  if (inputUsdt) inputUsdt.value = "";
}

if (inputVes) {
  inputVes.addEventListener("input", (e) => {
    if (e.target.value === "") return clearAllInputs();
    const ves = clean(e.target.value);
    
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
  });
}

if (inputUsd) {
  inputUsd.addEventListener("input", (e) => {
    if (e.target.value === "") return clearAllInputs();
    const usd = clean(e.target.value);
    const ves = usd * rates.USD_BCV;
    
    if (inputVes)  inputVes.value  = ves.toFixed(4);
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
  });
}

if (inputEur) {
  inputEur.addEventListener("input", (e) => {
    if (e.target.value === "") return clearAllInputs();
    const eur = clean(e.target.value);
    const ves = eur * rates.EUR_BCV;
    
    if (inputVes)  inputVes.value  = ves.toFixed(4);
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
  });
}

if (inputUsdt) {
  inputUsdt.addEventListener("input", (e) => {
    if (e.target.value === "") return clearAllInputs();
    const usdt = clean(e.target.value);
    const ves = usdt * rates.USDT_BINANCE;
    
    if (inputVes)  inputVes.value  = ves.toFixed(4);
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
  });
}

if (btnRefresh) btnRefresh.addEventListener("click", loadRates);
window.addEventListener("DOMContentLoaded", loadRates);
