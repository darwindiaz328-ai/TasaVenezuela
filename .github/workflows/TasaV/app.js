// ============================================================
//  TasaVenezuela — app.js (Versión Limpia)
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
    const [dolRes, eurRes] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares", { cache: "no-store" }),
      fetch("https://ve.dolarapi.com/v1/euros",    { cache: "no-store" })
    ]);

    const dolares = await dolRes.json();
    const euros   = await eurRes.json();

    const bcvUsd      = dolares.find(d => d.fuente === "oficial");
    const paraleloUsd = dolares.find(d => d.fuente === "paralelo");
    const bcvEur      = euros.find(d => d.fuente === "oficial");

    rates = {
      USD_BCV: bcvUsd.promedio,
      EUR_BCV: bcvEur.promedio,
      USDT_BINANCE: paraleloUsd ? paraleloUsd.promedio : 0
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

// Calculadora
function clean(v) { return parseFloat(v) || 0; }

inputVes.addEventListener("input", (e) => {
  const ves = clean(e.target.value);
  inputUsd.value  = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(4) : "";
  inputEur.value  = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(4) : "";
  inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(4) : "";
});

btnRefresh.addEventListener("click", loadRates);
window.addEventListener("DOMContentLoaded", loadRates);