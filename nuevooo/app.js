// ============================================================
//  TasaVenezuela — app.js (Con Tendencias y Calendario)
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
  if (on) { refreshIconSvg?.classList.add("spin"); if(btnRefresh) btnRefresh.disabled = true; }
  else    { refreshIconSvg?.classList.remove("spin"); if(btnRefresh) btnRefresh.disabled = false; }
}

// ============================================================
// Manejo del Historial en LocalStorage (Para Calendario y Tendencias)
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
// Cálculo y Renderizado de Tendencias (Porcentajes)
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
    elemento.style.color = "#10b981"; // Verde
  } else {
    elemento.textContent = `▼ ${porcentaje}%`;
    elemento.style.background = "rgba(239, 68, 68, 0.2)";
    elemento.style.color = "#ef4444"; // Rojo
  }
}

// ============================================================
// Carga de Tasas en Tiempo Real
// ============================================================

async function loadRates() {
  setLoading(true);
  try {
    const [dolRes, eurRes, binanceRes] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" }),
      fetch("https://ve.dolarapi.com/v1/euros",    { cache: "no-store" }),
      fetch("https://criptoya.com/api/binancep2p/usdt/ves/100000/5", { cache: "no-store" })
    ]);

    const dolares = await dolRes.json();
    const euros   = await eurRes.json();
    const binanceData = await binanceRes.json();

    const bcvUsd = dolares.find(d => d.fuente === "oficial");
    const bcvEur = euros.find(d => d.fuente === "oficial");

    let precioBinanceReal = 0;
    if (binanceData) {
      if (binanceData.bid) precioBinanceReal = parseFloat(binanceData.bid);
      else if (binanceData.ask) precioBinanceReal = parseFloat(binanceData.ask);
      else if (binanceData.data && binanceData.data.length > 0) precioBinanceReal = parseFloat(binanceData.data[0].p);
    }

    rates = {
      USD_BCV: bcvUsd.promedio,
      EUR_BCV: bcvEur.promedio,
      USDT_BINANCE: precioBinanceReal > 0 ? precioBinanceReal : (dolares.find(d => d.fuente === "paralelo")?.promedio || 0)
    };

    const fechaHoyStr = new Date().toISOString().split("T")[0];
    guardarEnHistorial(bcvUsd.fechaActualizacion || new Date().toISOString(), rates);

    // Ajustar input de fecha
    if (inputFecha) {
      inputFecha.max = fechaHoyStr;
      inputFecha.value = fechaHoyStr;
    }

    updateUI(bcvUsd.fechaActualizacion, fechaHoyStr);

  } catch (e) {
    console.error("Error cargando tasas:", e);
  }
  setLoading(false);
}

// ============================================================
// Actualización de Interfaz
// ============================================================

function updateUI(fechaBCV, fechaClave) {
  elDolar.textContent   = rates.USD_BCV.toFixed(2);
  elEuro.textContent    = rates.EUR_BCV.toFixed(2);
  elBinance.textContent = rates.USDT_BINANCE.toFixed(2);
  
  elBcvDate.textContent = new Date(fechaBCV).toLocaleDateString("es-VE");
  elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calcular porcentajes de tendencia vs día anterior
  const usdAnt = obtenerTasaAnterior(fechaClave, "USD_BCV");
  const eurAnt = obtenerTasaAnterior(fechaClave, "EUR_BCV");
  const usdtAnt = obtenerTasaAnterior(fechaClave, "USDT_BINANCE");

  renderizarTendencia(elTrendDolar, rates.USD_BCV, usdAnt);
  renderizarTendencia(elTrendEuro, rates.EUR_BCV, eurAnt);
  renderizarTendencia(elTrendBinance, rates.USDT_BINANCE, usdtAnt);

  // Recalcular inputs de la calculadora si hay un monto ingresado
  if (inputVes.value !== "") {
    inputVes.dispatchEvent(new Event("input"));
  }
}

// ============================================================
// Lógica del Calendario (Fechas Pasadas)
// ============================================================

if (inputFecha) {
  inputFecha.addEventListener("change", (e) => {
    const fechaSeleccionada = e.target.value;
    let historial = JSON.parse(localStorage.getItem("tv_historial")) || {};

    if (historial[fechaSeleccionada]) {
      const registro = historial[fechaSeleccionada];
      rates = {
        USD_BCV: registro.USD_BCV,
        EUR_BCV: registro.EUR_BCV,
        USDT_BINANCE: registro.USDT_BINANCE
      };
      updateUI(registro.fechaBCV, fechaSeleccionada);
    } else {
      alert("No hay registros guardados para esta fecha en este navegador.");
    }
  });
}

if (btnHoy) {
  btnHoy.addEventListener("click", loadRates);
}

// ============================================================
// Sección de la Calculadora Multidireccional
// ============================================================

function clean(v) { return parseFloat(v) || 0; }

function clearAllInputs() {
  inputVes.value  = "";
  inputUsd.value  = "";
  inputEur.value  = "";
  inputUsdt.value = "";
}

// Escuchador cuando se escribe en Bolívares (VES)
inputVes.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const ves = clean(e.target.value);
  
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

// Escuchador cuando se escribe en Dólares (USD)
inputUsd.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const usd = clean(e.target.value);
  const ves = usd * rates.USD_BCV;
  
  inputVes.value  = ves.toFixed(4);
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

// Escuchador cuando se escribe en Euros (EUR)
inputEur.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const eur = clean(e.target.value);
  const ves = eur * rates.EUR_BCV;
  
  inputVes.value  = ves.toFixed(4);
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

// Escuchador cuando se escribe en Binance (USDT)
inputUsdt.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const usdt = clean(e.target.value);
  const ves = usdt * rates.USDT_BINANCE;
  
  inputVes.value  = ves.toFixed(4);
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
});

// Inicializadores
if (btnRefresh) btnRefresh.addEventListener("click", loadRates);
window.addEventListener("DOMContentLoaded", loadRates);
