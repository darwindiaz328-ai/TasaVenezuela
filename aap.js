// =========================================================================
// Configuración del repositorio de GitHub (Sincronizado con tu cuenta real)
// =========================================================================
const GITHUB_USERNAME = "darwindiaz328-ai"; // Tu usuario real de GitHub
const GITHUB_REPO = "TasaVenezuela";         // Nombre de tu repositorio

// Elementos del DOM - Tasas
const elDolar = document.getElementById("val-dolar");
const elEuro = document.getElementById("val-euro");
const elBinance = document.getElementById("val-binance");

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
  USDT_BINANCE: 0
};

// =========================================================================
// Función para formar fechas relativas o legibles
// =========================================================================
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

// =========================================================================
// Función principal para cargar datos - ULTRA RESISTENTE A FALLOS + ROMPE-CACHÉ
// =========================================================================
async function loadRates() {
  setLoading(true);
  
  const cacheBuster = new Date().getTime();
  
  let urls = [
    `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/Datos/rates.json?t=${cacheBuster}`,
    `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@Principal/Datos/rates.json?t=${cacheBuster}`,
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/Datos/rates.json?t=${cacheBuster}`,
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/Principal/Datos/rates.json?t=${cacheBuster}`,
    `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/Datos/rates.json?t=${cacheBuster}`,
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/data/rates.json?t=${cacheBuster}`,
    `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/Principal/data/rates.json?t=${cacheBuster}`,
    `https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO}/data/rates.json?t=${cacheBuster}`,
    "./Datos/rates.json",
    "./data/rates.json"
  ];

  let fetchedData = null;
  let success = false;

  for (const url of urls) {
    try {
      console.log(`⏳ Intentando conectar con: ${url}`);
      const response = await fetch(url, { cache: "no-store" });
      
      if (response.ok) {
        const text = await response.text();
        
        // Verificar que no sea HTML (error 404 de GitHub Pages)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.warn(`⚠️ Respuesta HTML en lugar de JSON desde: ${url}`);
          continue;
        }
        
        fetchedData = JSON.parse(text);
        
        if (fetchedData && (fetchedData.rates || fetchedData.tasas)) {
          if (!fetchedData.rates && fetchedData.tasas) fetchedData.rates = fetchedData.tasas;
          if (!fetchedData.metadata && fetchedData.metadatos) fetchedData.metadata = fetchedData.metadatos;
          
          success = true;
          console.log(`✅ ¡Conexión exitosa desde: ${url}!`);
          console.log('📊 Datos recibidos:', fetchedData);
          break; 
        }
      } else {
        console.warn(`❌ Error HTTP ${response.status} desde: ${url}`);
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo conectar a: ${url}`, error.message);
    }
  }

  if (success && fetchedData && fetchedData.rates) {
    updateUI(fetchedData);
  } else {
    console.error('🔴 Todas las URLs fallaron. Mostrando estado de error.');
    showErrorState();
  }
  
  setTimeout(() => setLoading(false), 300); 
}

// =========================================================================
// Actualizar elementos visuales
// =========================================================================
function updateUI(data) {
  if (!data || !data.rates) {
    console.error('updateUI: Datos inválidos', data);
    return;
  }
  
  rates = data.rates;
  
  // Actualizar valores de tasas
  if (elDolar) elDolar.textContent = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro) elEuro.textContent = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  // Actualizar fecha BCV
  if (elBcvDate) {
    if (data.metadata && data.metadata.bcv_date) {
      elBcvDate.textContent = data.metadata.bcv_date;
    } else if (data.metadata && data.metadata.fecha) {
      elBcvDate.textContent = data.metadata.fecha;
    } else {
      elBcvDate.textContent = "No disponible";
    }
  }
  
  // Actualizar hora de última actualización
  if (data.metadata && data.metadata.last_updated) {
    if (elLastUpdate) {
      elLastUpdate.textContent = formatRelativeTime(data.metadata.last_updated);
      elLastUpdate.title = new Date(data.metadata.last_updated).toLocaleString();
      console.log('🕐 Última actualización:', new Date(data.metadata.last_updated).toLocaleString());
    }
  } else {
    if (elLastUpdate) elLastUpdate.textContent = "Ahora";
  }
  
  // Recalcular calculadora si hay algún input activo
  recalculateFromActiveInput();
  
  console.log('✅ UI actualizada:', {
    USD: rates.USD_BCV,
    EUR: rates.EUR_BCV,
    USDT: rates.USDT_BINANCE,
    fecha: elBcvDate ? elBcvDate.textContent : 'N/A',
    actualizado: elLastUpdate ? elLastUpdate.textContent : 'N/A'
  });
}

// =========================================================================
// Mostrar estado de error en UI
// =========================================================================
function showErrorState() {
  if (elDolar) elDolar.textContent = "Error";
  if (elEuro) elEuro.textContent = "Error";
  if (elBinance) elBinance.textContent = "Error";
  if (elBcvDate) elBcvDate.textContent = "Error de conexión";
  if (elLastUpdate) elLastUpdate.textContent = "No disponible";
}

// =========================================================================
// Controlar estado de carga animado
// =========================================================================
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

// =========================================================================
// Calculadora Multidivisa
// =========================================================================
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

// Eventos de la calculadora
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

// =========================================================================
// ESTRATEGIA COMPLETA DE ACTUALIZACIÓN PARA APK (WebView Android)
// =========================================================================

// Variable para controlar la primera carga
let firstLoad = true;

function iniciarApp() {
  console.log("🚀 TasaVenezuela APK v2.0 - Iniciando sistema de actualización");
  
  // Carga inicial inmediata
  loadRates().then(() => {
    firstLoad = false;
    console.log("✅ Primera carga completada");
  });
  
  // Configurar botón de refresh manual
  if (btnRefresh) {
    btnRefresh.removeEventListener("click", loadRates);
    btnRefresh.addEventListener("click", () => {
      console.log('👆 Refresh manual solicitado');
      loadRates();
    });
  }
  
  // ================================================================
  // Estrategia 1: setInterval - Actualización periódica en primer plano
  // ================================================================
  setInterval(() => {
    console.log("⏰ Actualización programada (cada 5 min)");
    loadRates();
  }, 300000); // 5 minutos
  
  // ================================================================
  // Estrategia 2: Visibility API - Detecta cuando la app vuelve a ser visible
  // ================================================================
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible' && !firstLoad) {
      console.log("👁️ App visible de nuevo - Actualizando tasas...");
      loadRates();
    }
  });
  
  // ================================================================
  // Estrategia 3: Evento 'resume' para WebView de Android
  // ================================================================
  document.addEventListener("resume", () => {
    if (!firstLoad) {
      console.log("📱 Evento resume (Android) detectado - Actualizando...");
      loadRates();
    }
  });
  
  // ================================================================
  // Estrategia 4: Evento 'pageshow' - Captura cuando WebView restaura la página
  // ================================================================
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && !firstLoad) {
      console.log("🔄 Página restaurada desde caché (pageshow) - Actualizando...");
      loadRates();
    }
  });
  
  // ================================================================
  // Estrategia 5: Evento 'focus' en la ventana
  // ================================================================
  window.addEventListener("focus", () => {
    if (!firstLoad) {
      console.log("🎯 Ventana enfocada - Verificando actualización...");
      // Pequeño delay para asegurar que la conexión esté lista
      setTimeout(() => loadRates(), 500);
    }
  });
  
  // ================================================================
  // Estrategia 6: PostMessage para comunicación desde Java/Kotlin
  // ================================================================
  window.addEventListener("message", (event) => {
    if (event.data === 'refresh_rates' || event.data === 'onResume' || event.data === 'updateData') {
      console.log("📲 Mensaje desde WebView nativa recibido - Actualizando tasas...");
      loadRates();
    }
  });
  
  console.log("✅ Sistema de actualización múltiple configurado:");
  console.log("   - setInterval: cada 5 minutos");
  console.log("   - visibilitychange: al volver a la app");
  console.log("   - resume: evento nativo Android");
  console.log("   - pageshow: restauración de caché");
  console.log("   - focus: al enfocar la ventana");
  console.log("   - postMessage: puente con Java/Kotlin");
}

// =========================================================================
// Función global para que Android (Java/Kotlin) pueda llamarla directamente
// =========================================================================
window.refreshRates = function() {
  console.log("📞 refreshRates() llamado externamente");
  loadRates();
};

// =========================================================================
// Inicialización inteligente
// =========================================================================
if (document.readyState === 'loading') {
  // El DOM aún está cargando
  document.addEventListener("DOMContentLoaded", iniciarApp);
} else {
  // El DOM ya está listo
  iniciarApp();
}

// =========================================================================
// Log de estado final
// =========================================================================
console.log("📋 TasaVenezuela app.js v2.0 cargado correctamente");
console.log("🔗 Repositorio:", `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}`);
console.log("⏱️ Intervalo de actualización: 5 minutos (primer plano) + actualización al reanudar");


