// =========================================================================
// Configuración del repositorio de GitHub (Sincronizado con tu cuenta real)
// =========================================================================
const GITHUB_USERNAME = "darwindiaz328-ai"; // Tu usuario real de GitHub
const GITHUB_REPO = "TasaVenezuela";         // Nombre de tu repositorio

// Elementos del DOM - Tasas
const elDolar = document.getElementById("val-dolar");
const elEuro = document.getElementById("val-euro");
const elBinance = document.getElementById("val-binance");
const elCny = document.getElementById("val-cny");
const elTry = document.getElementById("val-try");
const elRub = document.getElementById("val-rub");

// Elementos del DOM - Metadata
const elBcvDate = document.getElementById("bcv-date-display");
const elLastUpdate = document.getElementById("last-update-display");
const btnRefresh = document.getElementById("btn-refresh");
const refreshIconSvg = document.getElementById("refresh-icon-svg");

// Elementos del DOM - Calculadora
const inputVes = document.getElementById("input-ves");
const inputUsd = document.getElementById("input-usd");
const inputEur = document.getElementById("input-eur");
const inputUsdt = document.getElementById("input-usdt");

// Estado global de las tasas
let rates = {
  USD_BCV: 0,
  EUR_BCV: 0,
  USDT_BINANCE: 0,
  CNY_BCV: 0,
  TRY_BCV: 0,
  RUB_BCV: 0
};

// Función para formar fechas relativas o legibles
function formatRelativeTime(isoString) {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Reciente";
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return "Reciente";
  }
}

// Función principal para cargar datos - ¡EDICIÓN ULTRA RESISTENTE A FALLOS + ROMPE-CACHÉ APKS!
async function loadRates() {
  setLoading(true);
  
  // Creamos una estampa de tiempo única por cada consulta (milisegundos actuales)
  const cacheBuster = new Date().getTime();
  
  // Lista de URLs optimizadas con el parámetro ?v= para destruir la caché de Android
  let urls = [
    // Opción 1: CDN de alto rendimiento (Rama main, carpeta Datos)
    `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/Datos/rates.json?v=${cacheBuster}`,
    // Opción 2: CDN de alto rendimiento (Rama Principal, carpeta Datos)
    `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@Principal/Datos/rates.json?v=${cacheBuster}`,
    // Opción 3: Raw GitHub directo (Rama main, carpeta Datos)
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/Datos/rates.json?v=${cacheBuster}`,
    // Opción 4: Raw GitHub directo (Rama Principal, carpeta Datos)
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/Principal/Datos/rates.json?v=${cacheBuster}`,
    // Opción 5: GitHub Pages estándar (Carpeta Datos)
    `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/Datos/rates.json?v=${cacheBuster}`,
    // Opción 6: Variaciones en minúsculas por si acaso
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/data/rates.json?v=${cacheBuster}`,
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/Principal/data/rates.json?v=${cacheBuster}`,
    `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/data/rates.json?v=${cacheBuster}`,
    // Opción 7: Respaldos locales internos del APK (No requieren parámetro de internet)
    "./Datos/rates.json",
    "./data/rates.json"
  ];

  let fetchedData = null;
  let success = false;

  for (const url of urls) {
    try {
      console.log(`Intentando conectar con: ${url}`);
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        fetchedData = await response.json();
        
        if (fetchedData && (fetchedData.rates || fetchedData.tasas)) {
          // Adaptador inteligente: si el JSON quedó guardado en español o inglés, lo repara en vivo
          if (!fetchedData.rates && fetchedData.tasas) fetchedData.rates = fetchedData.tasas;
          if (!fetchedData.metadata && fetchedData.metadatos) fetchedData.metadata = fetchedData.metadatos;
          
          success = true;
          console.log(`¡Conexión establecida con éxito desde: ${url}!`);
          break; 
        }
      }
    } catch (error) {
      console.warn(`No se pudo conectar a: ${url}`, error);
    }
  }

  if (success && fetchedData && fetchedData.rates) {
    updateUI(fetchedData);
  } else {
    showErrorState();
  }
  
  setTimeout(() => setLoading(false), 500); 
}

// Actualizar elementos visuales
function updateUI(data) {
  rates = data.rates;
  
  elDolar.textContent = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  elEuro.textContent = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  elCny.textContent = rates.CNY_BCV ? `${rates.CNY_BCV.toFixed(4)} Bs.` : "0.0000 Bs.";
  elTry.textContent = rates.TRY_BCV ? `${rates.TRY_BCV.toFixed(4)} Bs.` : "0.0000 Bs.";
  elRub.textContent = rates.RUB_BCV ? `${rates.RUB_BCV.toFixed(4)} Bs.` : "0.0000 Bs.";
  
  elBcvDate.textContent = (data.metadata && data.metadata.bcv_date) ? data.metadata.bcv_date : "No disponible";
  
  if (data.metadata && data.metadata.last_updated) {
    elLastUpdate.textContent = formatRelativeTime(data.metadata.last_updated);
    elLastUpdate.title = new Date(data.metadata.last_updated).toLocaleString();
  } else {
    elLastUpdate.textContent = "Reciente";
  }
  
  recalculateFromActiveInput();
}

// Mostrar estado de error en UI
function showErrorState() {
  elDolar.textContent = "Error";
  elEuro.textContent = "Error";
  elBinance.textContent = "Error";
  elCny.textContent = "Error";
  elTry.textContent = "Error";
  elRub.textContent = "Error";
  elBcvDate.textContent = "Error de conexión";
  elLastUpdate.textContent = "No disponible";
}

// Controlar estado de carga animado
function setLoading(isLoading) {
  if (!btnRefresh || !refreshIconSvg) return;
  if (isLoading) {
    refreshIconSvg.classList.add("spin");
    btnRefresh.disabled = true;
  } else {
    refreshIconSvg.classList.remove("spin");
    btnRefresh.disabled = false;
  }
}

// --- Calculadora Multidivisa ---
function cleanValue(val) {
  const parsed = parseFloat(val);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function recalculateFromActiveInput() {
  const activeId = document.activeElement ? document.activeElement.id : null;
  if (!activeId) return;
  
  const activeInput = document.getElementById(activeId);
  if (activeInput && activeInput.value !== "") {
    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);
  }
}

if (inputVes) {
  inputVes.addEventListener("input", (e) => {
    if (document.activeElement !== inputVes) return;
    const ves = cleanValue(e.target.value);
    inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "";
    inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "";
    inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "";
  });
}

if (inputUsd) {
  inputUsd.addEventListener("input", (e) => {
    if (document.activeElement !== inputUsd) return;
    const usd = cleanValue(e.target.value);
    const ves = rates.USD_BCV ? usd * rates.USD_BCV : 0;
    inputVes.value = ves ? ves.toFixed(2) : "";
    inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "";
    inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "";
  });
}

if (inputEur) {
  inputEur.addEventListener("input", (e) => {
    if (document.activeElement !== inputEur) return;
    const eur = cleanValue(e.target.value);
    const ves = rates.EUR_BCV ? eur * rates.EUR_BCV : 0;
    inputVes.value = ves ? ves.toFixed(2) : "";
    inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "";
    inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "";
  });
}

if (inputUsdt) {
  inputUsdt.addEventListener("input", (e) => {
    if (document.activeElement !== inputUsdt) return;
    const usdt = cleanValue(e.target.value);
    const ves = rates.USDT_BINANCE ? usdt * rates.USDT_BINANCE : 0;
    inputVes.value = ves ? ves.toFixed(2) : "";
    inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "";
    inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "";
  });
}

if (btnRefresh) btnRefresh.addEventListener("click", loadRates);

window.addEventListener("DOMContentLoaded", () => {
  loadRates();
  // Se ejecutará en segundo plano automáticamente cada 5 minutos
  setInterval(loadRates, 300000);
});
