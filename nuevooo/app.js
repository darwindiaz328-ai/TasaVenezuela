// ============================================================
//  TasaVenezuela — app.js (Versión Multidireccional con Binance Real)
// ============================================================

const elDolar   = document.getElementById("val-dolar");
const elEuro    = document.getElementById("val-euro");
const elBinance = document.getElementById("val-binance");

const elBcvDate    = document.getElementById("bcv-date-display");
const elLastUpdate = document.getElementById("last-update-display");
const btnRefresh   = document.getElementById("btn-refresh");
const refreshIconSvg = document.getElementById("refresh-icon-svg");

const inputVes  = document.getElementById("input-ves");
const inputUsd  = document.getElementById("input-usd");
const inputEur  = document.getElementById("input-eur");
const inputUsdt = document.getElementById("input-usdt");

let rates = { USD_BCV: 0, EUR_BCV: 0, USDT_BINANCE: 0 };

function setLoading(on) {
  if (on) { refreshIconSvg?.classList.add("spin"); btnRefresh.disabled = true; }
  else    { refreshIconSvg?.classList.remove("spin"); btnRefresh.disabled = false; }
}

async function loadRates() {
  setLoading(true);
  try {
    // Realizamos las tres peticiones en paralelo para máxima velocidad
    // CriptoYa nos traerá el P2P de Binance filtrado para Venezuela (VES)
    const [dolRes, eurRes, binanceRes] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" }),
      fetch("https://ve.dolarapi.com/v1/euros",    { cache: "no-store" }),
      fetch("https://criptoya.com/api/binancep2p/usdt/ves/5", { cache: "no-store" })
    ]);

    const dolares = await dolRes.json();
    const euros   = await eurRes.json();
    const binanceData = await binanceRes.json();

    const bcvUsd      = dolares.find(d => d.fuente === "oficial");
    const bcvEur      = euros.find(d => d.fuente === "oficial");

    // Procesamos el precio real de Binance P2P
    // La API nos devuelve una lista de comerciantes. Buscamos el precio 'p' (price) de la primera orden estable.
    let precioBinanceReal = 0;
    if (binanceData && binanceData.data && binanceData.data.length > 0) {
      precioBinanceReal = parseFloat(binanceData.data[0].p);
    }

    rates = {
      USD_BCV: bcvUsd.promedio,
      EUR_BCV: bcvEur.promedio,
      USDT_BINANCE: precioBinanceReal || (dolares.find(d => d.fuente === "paralelo")?.promedio || 0) // Respaldo por si falla
    };

    updateUI(bcvUsd.fechaActualizacion);
  } catch (e) {
    console.error("Error cargando tasas:", e);
  }
  setLoading(false);
}

function updateUI(fecha) {
  elDolar.textContent   = rates.USD_BCV.toFixed(2);
  elEuro.textContent    = rates.EUR_BCV.toFixed(2);
  elBinance.textContent = rates.USDT_BINANCE.toFixed(2);
  elBcvDate.textContent = new Date(fecha).toLocaleDateString("es-VE");
  elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// Sección de la Calculadora Multidireccional
// ============================================================

function clean(v) { return parseFloat(v) || 0; }

// Función auxiliar para vaciar todos los campos si el usuario borra el texto
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
  const ves = usd * rates.USD_BCV; // Convertimos a la moneda base (VES)
  
  inputVes.value  = ves.toFixed(4);
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

// Escuchador cuando se escribe en Euros (EUR)
inputEur.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const eur = clean(e.target.value);
  const ves = eur * rates.EUR_BCV; // Convertimos a la moneda base (VES)
  
  inputVes.value  = ves.toFixed(4);
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

// Escuchador cuando se escribe en Binance (USDT)
inputUsdt.addEventListener("input", (e) => {
  if (e.target.value === "") return clearAllInputs();
  const usdt = clean(e.target.value);
  const ves = usdt * rates.USDT_BINANCE; // Convertimos a la moneda base (VES)
  
  inputVes.value  = ves.toFixed(4);
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
});

// Inicializadores
btnRefresh.addEventListener("click", loadRates);
window.addEventListener("DOMContentLoaded", loadRates);
