// ============================================================
//  TasaVenezuela — app.js (API Histórica Real del BCV)
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

// Guardaremos el histórico descargado de la API
let historicoBCV = [];

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
// Helper de Peticiones
// ============================================================

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return await res.json();
}

// ============================================================
// Carga Inicial de Tasas e Histórico Real
// ============================================================

async function loadRates() {
  setLoading(true);
  try {
    // 1. Obtenemos datos actuales y la lista histórica del BCV
    const dolaresPromise = fetchJSON("https://ve.dolarapi.com/v1/dolares").catch(() => []);
    const eurosPromise   = fetchJSON("https://ve.dolarapi.com/v1/euros").catch(() => []);
    const binancePromise = fetchJSON("https://criptoya.com/api/binancep2p/sell/usdt/ves/1").catch(() => null);

    const [dolares, euros, binanceData] = await Promise.all([dolaresPromise, eurosPromise, binancePromise]);

    // Guardamos la lista completa para búsquedas por fecha
    if (Array.isArray(dolares)) {
      historicoBCV = dolares;
    }

    const bcvUsd = Array.isArray(dolares) ? dolares.find(d => d.fuente === "oficial") || dolares[0] : null;
    const bcvEur = Array.isArray(euros) ? euros.find(d => d.fuente === "oficial") || euros[0] : null;

    let precioBinanceReal = 0;
    if (binanceData) {
      if (binanceData.ask) precioBinanceReal = parseFloat(binanceData.ask);
      else if (binanceData.bid) precioBinanceReal = parseFloat(binanceData.bid);
      else if (binanceData.price) precioBinanceReal = parseFloat(binanceData.price);
    }

    const usdPromedio = bcvUsd ? bcvUsd.promedio : 0;
    const eurPromedio = bcvEur ? bcvEur.promedio : 0;
    const paraleloUsd = Array.isArray(dolares) ? (dolares.find(d => d.fuente === "paralelo")?.promedio || usdPromedio) : usdPromedio;

    rates = {
      USD_BCV: usdPromedio,
      EUR_BCV: eurPromedio,
      USDT_BINANCE: precioBinanceReal > 0 ? precioBinanceReal : paraleloUsd
    };

    const fechaBCV = bcvUsd?.fechaActualizacion || new Date().toISOString();
    const fechaHoyStr = new Date().toISOString().split("T")[0];

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
    const d = new Date(fechaMostrar);
    elBcvDate.textContent = isNaN(d.getTime()) ? fechaMostrar : d.toLocaleDateString("es-VE");
  }

  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Recalcula la calculadora si hay un monto ingresado
  if (inputVes && inputVes.value !== "") {
    inputVes.dispatchEvent(new Event("input"));
  }
}

// ============================================================
// Consulta Real por Fecha Seleccionada
// ============================================================

if (inputFecha) {
  inputFecha.addEventListener("change", (e) => {
    const fechaBuscada = e.target.value; // Formato YYYY-MM-DD
    if (!fechaBuscada) return;

    // Buscamos la fecha dentro del arreglo de datos reales de la API
    const registroEncontrado = historicoBCV.find(item => {
      if (!item.fechaActualizacion) return false;
      const fechaItem = item.fechaActualizacion.split("T")[0];
      return fechaItem === fechaBuscada;
    });

    if (registroEncontrado) {
      const valorUsd = registroEncontrado.promedio;
      // Estimación proporcional para Euro y Binance basada en la tasa oficial histórica de ese día
      const proporcionEuro = rates.EUR_BCV && rates.USD_BCV ? (rates.EUR_BCV / rates.USD_BCV) : 1.137;
      const proporcionBinance = rates.USDT_BINANCE && rates.USD_BCV ? (rates.USDT_BINANCE / rates.USD_BCV) : 1.0;

      rates = {
        USD_BCV: valorUsd,
        EUR_BCV: parseFloat((valorUsd * proporcionEuro).toFixed(2)),
        USDT_BINANCE: parseFloat((valorUsd * proporcionBinance).toFixed(2))
      };

      updateUI(registroEncontrado.fechaActualizacion);
    } else {
      // Si la fecha elegida fue un fin de semana o feriado sin cotización oficial,
      // busca la cotización válida más cercana anterior
      const registrosValidos = historicoBCV.filter(item => item.fechaActualizacion.split("T")[0] <= fechaBuscada);
      
      if (registrosValidos.length > 0) {
        const masCercano = registrosValidos[0]; // La API los ordena por fecha reciente
        const valorUsd = masCercano.promedio;

        rates = {
          USD_BCV: valorUsd,
          EUR_BCV: parseFloat((valorUsd * 1.137).toFixed(2)),
          USDT_BINANCE: parseFloat((valorUsd * 1.0).toFixed(2))
        };

        updateUI(masCercano.fechaActualizacion);
      } else {
        alert("No hay registros oficiales para la fecha elegida.");
      }
    }
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
