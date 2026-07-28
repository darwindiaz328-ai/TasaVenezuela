// ============================================================
//   TasaVenezuela — app.js (Calculadora Fluida con Formato Visual)
// ============================================================

const elDolar   = document.getElementById("val-dolar");
const elEuro    = document.getElementById("val-euro");
const elBinance = document.getElementById("val-binance");

const elTrendDolar    = document.getElementById("trend-dolar");
const elTrendEuro     = document.getElementById("trend-euro");
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

function obtenerFechaLocalFormateada(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setLoading(on) {
  if (on) { 
    refreshIconSvg?.classList.add("spin"); 
    if (btnRefresh) btnRefresh.disabled = true; 
  } else { 
    refreshIconSvg?.classList.remove("spin"); 
    if (btnRefresh) btnRefresh.disabled = false; 
  }
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return await res.json();
}

async function loadRates() {
  setLoading(true);
  try {
    try {
      historialCompleto = await fetchJSON("./historial.json");
    } catch (e) {
      console.warn("No se pudo cargar el historial.json, usando respaldo interno.");
    }

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
    const fechaHoyStr = obtenerFechaLocalFormateada();

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

function obtenerUltimoDiaHabil(fechaStr) {
  let fecha = new Date(fechaStr + "T12:00:00");
  let diaSemana = fecha.getDay();

  if (diaSemana === 0) { 
    fecha.setDate(fecha.getDate() - 2); 
  } else if (diaSemana === 6) { 
    fecha.setDate(fecha.getDate() - 1); 
  }

  return obtenerFechaLocalFormateada(fecha);
}

function buscarTasaPorFecha(fechaSeleccionada) {
  const fechaEfectiva = obtenerUltimoDiaHabil(fechaSeleccionada);

  if (historialCompleto[fechaEfectiva]) {
    const item = historialCompleto[fechaEfectiva];
    return {
      datos: { USD_BCV: item.USD, EUR_BCV: item.EUR, USDT_BINANCE: item.USDT },
      fechaReal: fechaEfectiva
    };
  }

  const fechasDisponibles = Object.keys(historialCompleto).sort().reverse();
  const fechaCercana = fechasDisponibles.find(f => f <= fechaEfectiva);

  if (fechaCercana) {
    const item = historialCompleto[fechaCercana];
    return {
      datos: { USD_BCV: item.USD, EUR_BCV: item.EUR, USDT_BINANCE: item.USDT },
      fechaReal: fechaCercana
    };
  }

  return {
    datos: { ...hoyRates },
    fechaReal: fechaEfectiva
  };
}

function aplicarEstiloTendencia(elemento, actual, anterior) {
  if (!elemento) return;
  if (!anterior || anterior === 0 || isNaN(actual) || isNaN(anterior)) {
    elemento.textContent = "--";
    elemento.style.color = "";
    return;
  }

  const difBolivares = actual - anterior;
  const porcentaje = (difBolivares / anterior) * 100;

  let flecha = "";
  let color = "";

  if (difBolivares > 0) {
    flecha = "↑ ";
    color = "#22c55e";
  } else if (difBolivares < 0) {
    flecha = "↓ ";
    color = "#ef4444";
  } else {
    flecha = "• ";
    color = "#eab308";
  }

  const signo = difBolivares > 0 ? "+" : "";
  elemento.textContent = `${flecha}${signo}${difBolivares.toFixed(2)} Bs (${signo}${porcentaje.toFixed(2)}%)`;
  elemento.style.color = color;
}

function updateUI(fechaMostrar) {
  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  const fechaObj = new Date(fechaMostrar + "T12:00:00");
  fechaObj.setDate(fechaObj.getDate() - 1);
  const fechaAnteriorStr = obtenerFechaLocalFormateada(fechaObj);
  const datosAnteriores = historialCompleto[fechaAnteriorStr];

  if (datosAnteriores) {
    aplicarEstiloTendencia(elTrendDolar, rates.USD_BCV, datosAnteriores.USD);
    aplicarEstiloTendencia(elTrendEuro, rates.EUR_BCV, datosAnteriores.EUR);
    aplicarEstiloTendencia(elTrendBinance, rates.USDT_BINANCE, datosAnteriores.USDT);
  } else {
    if (elTrendDolar) { elTrendDolar.textContent = "--"; elTrendDolar.style.color = ""; }
    if (elTrendEuro) { elTrendEuro.textContent = "--"; elTrendEuro.style.color = ""; }
    if (elTrendBinance) { elTrendBinance.textContent = "--"; elTrendBinance.style.color = ""; }
  }

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

if (inputFecha) {
  inputFecha.addEventListener("change", (e) => {
    const fechaSeleccionada = e.target.value;
    if (!fechaSeleccionada) return;

    const resultado = buscarTasaPorFecha(fechaSeleccionada);
    rates = resultado.datos;
    inputFecha.value = resultado.fechaReal;

    updateUI(resultado.fechaReal);
  });
}

if (btnHoy) {
  btnHoy.addEventListener("click", loadRates);
}

// ============================================================
// Calculadora Multidireccional con Formato Legible (es-VE)
// ============================================================

function formatLocale(num) {
  if (isNaN(num)) return "";
  return num.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function clearAllInputs() {
  if (inputVes)  inputVes.value  = "";
  if (inputUsd)  inputUsd.value  = "";
  if (inputEur)  inputEur.value  = "";
  if (inputUsdt) inputUsdt.value = "";
}

if (inputVes) {
  inputVes.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || e.target.value === "") return clearAllInputs();
    
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (val / rates.USD_BCV).toFixed(2) : "";
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (val / rates.EUR_BCV).toFixed(2) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (val / rates.USDT_BINANCE).toFixed(2) : "";
  });

  // Formatea con puntos de miles al salir del campo de texto
  inputVes.addEventListener("blur", (e) => {
    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val)) {
      e.target.value = formatLocale(val);
    }
  });

  // Limpia el formato al volver a hacer clic para editar fácil
  inputVes.addEventListener("focus", (e) => {
    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val)) {
      e.target.value = val.toFixed(2);
    }
  });
}

if (inputUsd) {
  inputUsd.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || e.target.value === "") return clearAllInputs();
    const ves = val * rates.USD_BCV;
    
    if (inputVes)  inputVes.value  = ves.toFixed(2);
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "";
  });
}

if (inputEur) {
  inputEur.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || e.target.value === "") return clearAllInputs();
    const ves = val * rates.EUR_BCV;
    
    if (inputVes)  inputVes.value  = ves.toFixed(2);
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "";
    if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "";
  });
}

if (inputUsdt) {
  inputUsdt.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val) || e.target.value === "") return clearAllInputs();
    const ves = val * rates.USDT_BINANCE;
    
    if (inputVes)  inputVes.value  = ves.toFixed(2);
    if (inputUsd)  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "";
    if (inputEur)  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "";
  });
}

if (btnRefresh) btnRefresh.addEventListener("click", loadRates);
window.addEventListener("DOMContentLoaded", loadRates);
