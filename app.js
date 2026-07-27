// ============================================================
//  TasaVenezuela — app.js (Ajuste por Días Hábiles BCV)
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

// Base de datos de respaldo
const HISTORIAL_RESPALDO = {
  "2026-07-27": { USD_BCV: 742.23, EUR_BCV: 844.22, USDT_BINANCE: 838.93 },
  "2026-07-24": { USD_BCV: 741.80, EUR_BCV: 843.50, USDT_BINANCE: 837.50 },
  "2026-07-23": { USD_BCV: 740.10, EUR_BCV: 841.90, USDT_BINANCE: 835.00 },
  "2026-07-22": { USD_BCV: 735.40, EUR_BCV: 836.10, USDT_BINANCE: 830.20 },
  "2026-07-17": { USD_BCV: 728.00, EUR_BCV: 827.50, USDT_BINANCE: 821.00 },
  "2026-07-01": { USD_BCV: 710.00, EUR_BCV: 805.00, USDT_BINANCE: 800.00 },
  "2026-06-03": { USD_BCV: 685.00, EUR_BCV: 775.00, USDT_BINANCE: 770.00 }
};

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
// LÓGICA DE DÍAS HÁBILES (Ajuste por Fines de Semana)
// ============================================================

function obtenerUltimoDiaHabil(fechaStr) {
  // Se concatena la hora para evitar desfases de zona horaria (UTC vs Local)
  let fecha = new Date(fechaStr + "T12:00:00");
  let diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

  if (diaSemana === 0) { 
    // Si es domingo, retrocede 2 días hasta el viernes
    fecha.setDate(fecha.getDate() - 2);
  } else if (diaSemana === 6) { 
    // Si es sábado, retrocede 1 día hasta el viernes
    fecha.setDate(fecha.getDate() - 1);
  }

  return fecha.toISOString().split("T")[0];
}

// ============================================================
// Buscador de Tasas
// ============================================================

function buscarTasaPorFecha(fechaInput) {
  // 1. Ajustar la fecha si el usuario seleccionó un fin de semana
  const fechaHabil = obtenerUltimoDiaHabil(fechaInput);

  // 2. Revisar si está en LocalStorage
  let historialLocal = JSON.parse(localStorage.getItem("tv_historial")) || {};
  if (historialLocal[fechaHabil]) {
    return { datos: historialLocal[fechaHabil], fechaEfectiva: fechaHabil };
  }

  // 3. Revisar en Historial de Respaldos
  if (HISTORIAL_RESPALDO[fechaHabil]) {
    return { datos: HISTORIAL_RESPALDO[fechaHabil], fechaEfectiva: fechaHabil };
  }

  // 4. Estimación suave si es una fecha muy antigua no registrada
  const fechaHoy = new Date();
  const fechaElegida = new Date(fechaHabil + "T12:00:00");
  const diffDias = Math.floor((fechaHoy - fechaElegida) / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) {
    return { datos: hoyRates, fechaEfectiva: fechaHabil };
  }

  const factor = Math.max(0.1, 1 - (diffDias * 0.003));
  const estimacion = {
    USD_BCV: parseFloat((hoyRates.USD_BCV * factor).toFixed(2)),
    EUR_BCV: parseFloat((hoyRates.EUR_BCV * factor).toFixed(2)),
    USDT_BINANCE: parseFloat((hoyRates.USDT_BINANCE * factor).toFixed(2))
  };

  return { datos: estimacion, fechaEfectiva: fechaHabil };
}

// ============================================================
// Petición de Datos
// ============================================================

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return await res.json();
}

async function loadRates() {
  setLoading(true);
  try {
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

    const fechaBCV = bcvUsd?.fechaActualizacion || new Date().toISOString();
    const fechaHoyStr = new Date().toISOString().split("T")[0];

    // Guardar tasa de hoy en localStorage
    let historialLocal = JSON.parse(localStorage.getItem("tv_historial")) || {};
    historialLocal[fechaHoyStr] = hoyRates;
    localStorage.setItem("tv_historial", JSON.stringify(historialLocal));

    if (inputFecha) {
      inputFecha.max = fechaHoyStr;
      inputFecha.value = fechaHoyStr;
    }

    updateUI(fechaBCV);

  } catch (e) {
    console.error("Error cargando tasas:", e);
  }
  setLoading(false);
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
// Evento del Calendario
// ============================================================

if (inputFecha) {
  inputFecha.addEventListener("change", (e) => {
    const fechaSeleccionada = e.target.value; // YYYY-MM-DD
    if (!fechaSeleccionada) return;

    const resultado = buscarTasaPorFecha(fechaSeleccionada);
    rates = resultado.datos;

    // Si la fecha cambió por ser fin de semana, actualizamos también el valor visible en el input
    inputFecha.value = resultado.fechaEfectiva;

    updateUI(resultado.fechaEfectiva);
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
