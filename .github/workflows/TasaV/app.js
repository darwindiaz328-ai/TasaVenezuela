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
  if (activeInput && activeInput.value !== "" && activeInput.value > 0) {
    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);
  }
}

// Variable para evitar bucles infinitos entre inputs
let isUpdating = false;

// --- Evento para Bolívares (VES) ---
if (inputVes) {
  inputVes.addEventListener("input", (e) => {
    if (isUpdating) return;
    if (document.activeElement !== inputVes) return;
    
    isUpdating = true;
    const ves = cleanValue(e.target.value);
    
    if (ves > 0) {
      inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "0.00";
      inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "0.00";
      inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "0.00";
    } else {
      inputUsd.value = "";
      inputEur.value = "";
      inputUsdt.value = "";
    }
    
    isUpdating = false;
  });
}

// --- Evento para Dólares (USD) ---
if (inputUsd) {
  inputUsd.addEventListener("input", (e) => {
    if (isUpdating) return;
    if (document.activeElement !== inputUsd) return;
    
    isUpdating = true;
    const usd = cleanValue(e.target.value);
    
    if (usd > 0 && rates.USD_BCV > 0) {
      const ves = usd * rates.USD_BCV;
      inputVes.value = ves.toFixed(2);
      inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "0.00";
      inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "0.00";
    } else {
      inputVes.value = "";
      inputEur.value = "";
      inputUsdt.value = "";
    }
    
    isUpdating = false;
  });
}

// --- Evento para Euros (EUR) ---
if (inputEur) {
  inputEur.addEventListener("input", (e) => {
    if (isUpdating) return;
    if (document.activeElement !== inputEur) return;
    
    isUpdating = true;
    const eur = cleanValue(e.target.value);
    
    if (eur > 0 && rates.EUR_BCV > 0) {
      const ves = eur * rates.EUR_BCV;
      inputVes.value = ves.toFixed(2);
      inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "0.00";
      inputUsdt.value = rates.USDT_BINANCE ? (ves / rates.USDT_BINANCE).toFixed(2) : "0.00";
    } else {
      inputVes.value = "";
      inputUsd.value = "";
      inputUsdt.value = "";
    }
    
    isUpdating = false;
  });
}

// --- Evento para Binance USDT ---
if (inputUsdt) {
  inputUsdt.addEventListener("input", (e) => {
    if (isUpdating) return;
    if (document.activeElement !== inputUsdt) return;
    
    isUpdating = true;
    const usdt = cleanValue(e.target.value);
    
    if (usdt > 0 && rates.USDT_BINANCE > 0) {
      const ves = usdt * rates.USDT_BINANCE;
      inputVes.value = ves.toFixed(2);
      inputUsd.value = rates.USD_BCV ? (ves / rates.USD_BCV).toFixed(2) : "0.00";
      inputEur.value = rates.EUR_BCV ? (ves / rates.EUR_BCV).toFixed(2) : "0.00";
    } else {
      inputVes.value = "";
      inputUsd.value = "";
      inputEur.value = "";
    }
    
    isUpdating = false;
  });
}

// --- Limpiar todos los campos cuando se borra un input ---
const allInputs = [inputVes, inputUsd, inputEur, inputUsdt];
allInputs.forEach(input => {
  if (input) {
    input.addEventListener("focus", () => {
      // Si el input está vacío, limpiar los demás
      if (input.value === "" || input.value === "0") {
        allInputs.forEach(inp => {
          if (inp && inp !== input && document.activeElement !== inp) {
            inp.value = "";
          }
        });
      }
    });
  }
});
