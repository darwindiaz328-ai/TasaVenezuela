// ============================================================
//  TasaVenezuela — app.js (Versión Completa con Histórico API)
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
// Historial LocalStorage
// ============================================================

function guardarEnHistorial(fechaISO, tasasActuales) {
  let historial = JSON.parse(localStorage.getItem("tv_historial")) || {};
  const hoyClave = fechaISO.split("T")[0];

  historial[hoyClave] = {
    USD_BCV: tasasActuales.USD_BCV,
    EUR_BCV: tasasActuales.EUR_BCV,
    USDT_BINANCE: tasasActuales.USDT_BINANCE,
    fechaBCV: fechaISO
  };

  localStorage.setItem("tv_historial", JSON.stringify(historial));
}

function obtenerTasaAnterior(fechaClave, tipo) {
  let historial = JSON.parse(localStorage.getItem("tv_historial")) || {};
  const fechas = Object.keys(historial).sort();
  const indiceActual = fechas.indexOf(fechaClave);

  if (indiceActual > 0) {
    const fechaPrevia = fechas[indiceActual - 1];
    return historial[fechaPrevia][tipo];
  }
  return null;
}

// ============================================================
// Cálculo de Tendencias (%)
// ============================================================

function renderizarTendencia(elemento, valorActual, valorAnterior) {
  if (!elemento) return;
  
  if (!valorAnterior || valorAnterior === 0 || valorActual === valorAnterior) {
    elemento.textContent = "▶ 0.00%";
    elemento.style.background = "rgba(255, 255, 255, 0.1)";
    elemento.style.color = "#aaa";
    return;
  }

  const diferencia = valorActual - valorAnterior;
  const porcentaje = ((diferencia / valorAnterior) * 100).toFixed(2);

  if (diferencia > 0) {
    elemento.textContent = `▲ +${porcentaje}%`;
    elemento.style.background = "rgba(16, 185, 129, 0.2)";
    elemento.style.color = "#10b981";
  } else {
    elemento.textContent = `▼ ${porcentaje}%`;
    elemento.style.background = "rgba(239, 68, 68, 0.2)";
    elemento.style.color = "#ef4444";
  }
}

// ============================================================
// Carga de Tasas Actuales
// ============================================================

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP Error ${res.status} al consultar ${url}`);
  return await res.json();
}

async function loadRates() {
  setLoading(true);
  try {
    const dolaresPromise = fetchJSON("https://ve.dolarapi.com/v1/dolares").catch(e => {
      console.error("Error DolarApi USD:", e);
      return [];
    });

    const eurosPromise = fetchJSON("https://ve.dolarapi.com/v1/euros").catch(e => {
      console.error("Error DolarApi EUR:", e);
      return [];
    });

    const binancePromise = fetchJSON("https://criptoya.com/api/binancep2p/sell/usdt/ves/1").catch(e => {
      console.error("Error CriptoYa Binance:", e);
      return null;
    });

    const [dolares, euros, binanceData] = await Promise.all([dolaresPromise, eurosPromise, binancePromise]);

    const bcvUsd = Array.isArray(dolares) ? dolares.find(d => d.fuente === "oficial") : null;
    const bcvEur = Array.isArray(euros) ? euros.find(d => d.fuente === "oficial") : null;

    let precioBinanceReal = 0;
    if (binanceData) {
      if (binanceData.ask) precioBinanceReal = parseFloat(binanceData.ask);
      else if (binanceData.bid) precioBinanceReal = parseFloat(binanceData.bid);
      else if (binanceData.price) precioBinanceReal = parseFloat(binanceData.price);
    }

    const usdPromedio = bcvUsd ? bcvUsd.promedio : 0;
    const eurPromedio = bcvEur ? bcvEur.promedio : 0;
    const paraleloUsd = Array.isArray(dolares) ? (dolares.find(d => d.fuente === "paralelo")?.promedio || 0) : 0;

    rates = {
      USD_BCV: usdPromedio,
      EUR_BCV: eurPromedio,
      USDT_BINANCE: precioBinanceReal > 0 ? precioBinanceReal : paraleloUsd
    };

    const fechaBCV = bcvUsd?.fechaActualizacion || new Date().toISOString();
    const fechaHoyStr = new Date().toISOString().split("T")[0];
    
    guardarEnHistorial(fechaBCV, rates);

    if (inputFecha) {
      inputFecha.max = fechaHoyStr;
      inputFecha.value = fechaHoyStr;
    }

    updateUI(fechaBCV, fechaHoyStr);

  } catch (e) {
    console.error("Error general cargando tasas:", e);
  }
  setLoading(false);
}

// ============================================================
// Actualización de UI
// ============================================================

function updateUI(fechaBCV, fechaClave) {
  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  if (elBcvDate) {
    const d = new Date(fechaBCV);
    elBcvDate.textContent = isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("es-VE");
  }

  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const usdAnt = obtenerTasaAnterior(fechaClave, "USD_BCV");
  const eurAnt = obtenerTasaAnterior(fechaClave, "EUR_BCV");
  const usdtAnt = obtenerTasaAnterior(fechaClave, "USDT_BINANCE");

  renderizarTendencia(elTrendDolar, rates.USD_BCV, usdAnt);
  renderizarTendencia(elTrendEuro, rates.EUR_BCV, eurAnt);
  renderizarTendencia(elTrendBinance, rates.USDT_BINANCE, usdtAnt);

  if (inputVes && inputVes.value !== "") {
    inputVes.dispatchEvent(new Event("input"));
  }
}

// ============================================================
// Eventos del Calendario (Consulta Histórica a API)
// ============================================================

if (inputFecha) {
  inputFecha.addEventListener("change", async (e) => {
    const fechaSeleccionada = e.target.value; // Formato YYYY-MM-DD
    if (!fechaSeleccionada) return;

    let historial = JSON.parse(localStorage.getItem("tv_historial")) || {};

    // 1. Verificamos si ya consultamos esta fecha antes
    if (historial[fechaSeleccionada]) {
      const registro = historial[fechaSeleccionada];
      rates = {
        USD_BCV: registro.USD_BCV,
        EUR_BCV: registro.EUR_BCV,
        USDT_BINANCE: registro.USDT_BINANCE
      };
      updateUI(registro.fechaBCV, fechaSeleccionada);
      return;
    }

    // 2. Si no está localmente, consultamos la fecha en vivo a la API
    setLoading(true);
    try {
      const fechaFormateada = fechaSeleccionada.replace(/-/g, "/");

      const [dolRes, eurRes] = await Promise.all([
        fetch(`https://ve.dolarapi.com/v1/dolares/oficial?fecha=${fechaFormateada}`).catch(() => null),
        fetch(`https://ve.dolarapi.com/v1/euros/oficial?fecha=${fechaFormateada}`).catch(() => null)
      ]);

      let usdValor = 0;
      let eurValor = 0;

      if (dolRes && dolRes.ok) {
        const dolData = await dolRes.json();
        usdValor = dolData.promedio || 0;
      }

      if (eurRes && eurRes.ok) {
        const eurData = await eurRes.json();
        eurValor = eurData.promedio || 0;
      }

      if (usdValor > 0) {
        rates = {
          USD_BCV: usdValor,
          EUR_BCV: eurValor > 0 ? eurValor : (usdValor * 1.08),
          USDT_BINANCE: usdValor
        };

        guardarEnHistorial(fechaSeleccionada, rates);
        updateUI(fechaSeleccionada, fechaSeleccionada);
      } else {
        alert("No se encontraron registros de tasas oficiales para la fecha seleccionada.");
      }
    } catch (err) {
      console.error("Error al consultar el historial:", err);
      alert("Hubo un problema al consultar la fecha en la red.");
    }
    setLoading(false);
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
