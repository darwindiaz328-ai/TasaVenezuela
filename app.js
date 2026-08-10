let rates = {
  USD_BCV: 0,
  EUR_BCV: 0,
  USDT_BINANCE: 0
};
let historialCompleto = {};

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosYArrancar();

  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    // Bloquear fechas futuras en el calendario usando la zona horaria de Venezuela
    const hoyVenezuela = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
    inputFecha.max = hoyVenezuela;

    inputFecha.addEventListener("change", (e) => {
      const fechaSeleccionada = e.target.value;
      if (historialCompleto[fechaSeleccionada]) {
        rates = {
          USD_BCV: Number(historialCompleto[fechaSeleccionada].USD || historialCompleto[fechaSeleccionada].USD_BCV || 0),
          EUR_BCV: Number(historialCompleto[fechaSeleccionada].EUR || historialCompleto[fechaSeleccionada].EUR_BCV || 0),
          USDT_BINANCE: Number(historialCompleto[fechaSeleccionada].USDT || historialCompleto[fechaSeleccionada].USDT_BINANCE || 0)
        };
        updateUI(fechaSeleccionada);
      }
    });
  }

  const btnHoy = document.getElementById("btn-hoy");
  if (btnHoy) {
    btnHoy.addEventListener("click", () => {
      const fechas = Object.keys(historialCompleto).sort((a, b) => new Date(b) - new Date(a));
      if (fechas.length > 0) {
        const hoyStr = fechas[0];
        if (inputFecha) inputFecha.value = hoyStr;
        rates = {
          USD_BCV: Number(historialCompleto[hoyStr].USD || historialCompleto[hoyStr].USD_BCV || 0),
          EUR_BCV: Number(historialCompleto[hoyStr].EUR || historialCompleto[hoyStr].EUR_BCV || 0),
          USDT_BINANCE: Number(historialCompleto[hoyStr].USDT || historialCompleto[hoyStr].USDT_BINANCE || 0)
        };
        updateUI(hoyStr);
      }
    });
  }

  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      const icon = btnRefresh.querySelector(".refresh-icon");
      if (icon) icon.classList.add("spin");
      cargarDatosYArrancar().finally(() => {
        setTimeout(() => { if (icon) icon.classList.remove("spin"); }, 600);
      });
    });
  }

  configurarCalculadora();
});

async function cargarDatosYArrancar() {
  try {
    const resHistorial = await fetch("./historial.json?t=" + new Date().getTime());
    if (resHistorial.ok) {
      historialCompleto = await resHistorial.json();
    }
  } catch (error) {
    console.warn("Error cargando historial:", error);
  }

  const fechas = Object.keys(historialCompleto).sort((a, b) => new Date(b) - new Date(a));
  const hoyStr = fechas.length > 0 ? fechas[0] : obtenerFechaLocalFormateada(new Date());

  if (historialCompleto[hoyStr]) {
    rates = {
      USD_BCV: Number(historialCompleto[hoyStr].USD || historialCompleto[hoyStr].USD_BCV || 0),
      EUR_BCV: Number(historialCompleto[hoyStr].EUR || historialCompleto[hoyStr].EUR_BCV || 0),
      USDT_BINANCE: Number(historialCompleto[hoyStr].USDT || historialCompleto[hoyStr].USDT_BINANCE || 0)
    };
  }

  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    const hoyVenezuela = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
    inputFecha.max = hoyVenezuela;
    inputFecha.value = hoyStr;
  }

  updateUI(hoyStr);
}

function updateUI(fechaMostrar) {
  const elDolar = document.getElementById("val-dolar");
  const elEuro = document.getElementById("val-euro");
  const elBinance = document.getElementById("val-binance");

  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";

  let datosAnteriores = null;
  
  for (let i = 1; i <= 5; i++) {
    let fechaObj = new Date(fechaMostrar + "T12:00:00");
    fechaObj.setDate(fechaObj.getDate() - i);
    let intentoStr = obtenerFechaLocalFormateada(fechaObj);
    if (historialCompleto[intentoStr]) {
      datosAnteriores = historialCompleto[intentoStr];
      break;
    }
  }

  const elTrendDolar = document.getElementById("trend-dolar");
  const elTrendEuro = document.getElementById("trend-euro");
  const elTrendBinance = document.getElementById("trend-binance");

  if (datosAnteriores) {
    aplicarEstiloTendencia(elTrendDolar, rates.USD_BCV, datosAnteriores.USD || datosAnteriores.USD_BCV);
    aplicarEstiloTendencia(elTrendEuro, rates.EUR_BCV, datosAnteriores.EUR || datosAnteriores.EUR_BCV);
    aplicarEstiloTendencia(elTrendBinance, rates.USDT_BINANCE, datosAnteriores.USDT || datosAnteriores.USDT_BINANCE);
  } else {
    if (elTrendDolar) { elTrendDolar.textContent = "--"; elTrendDolar.style.color = ""; }
    if (elTrendEuro) { elTrendEuro.textContent = "--"; elTrendEuro.style.color = ""; }
    if (elTrendBinance) { elTrendBinance.textContent = "--"; elTrendBinance.style.color = ""; }
  }

  const elBcvDate = document.getElementById("bcv-date-display");
  if (elBcvDate) {
    elBcvDate.textContent = formatearFechaDMA(fechaMostrar);
  }

  const elLastUpdate = document.getElementById("last-update-display");
  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const inputVes = document.getElementById("input-ves");
  if (inputVes && inputVes.value) {
    inputVes.dispatchEvent(new Event("input"));
  }
}

function formatearFechaDMA(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return fechaStr;
}

function aplicarEstiloTendencia(elemento, valorActual, valorAnterior) {
  if (!elemento) return;
  if (!valorAnterior || valorAnterior === 0) {
    elemento.textContent = "--";
    elemento.style.color = "";
    return;
  }
  const diferencia = Number(valorActual) - Number(valorAnterior);
  const porcentaje = (diferencia / Number(valorAnterior)) * 100;
  const signo = diferencia > 0 ? "+" : "";
  elemento.textContent = `${signo}${diferencia.toFixed(2)} (${signo}${porcentaje.toFixed(2)}%)`;
  elemento.style.color = diferencia > 0 ? "var(--color-usd)" : (diferencia < 0 ? "#e74c3c" : "");
}

function configurarCalculadora() {
  const inputVes = document.getElementById("input-ves");
  const inputUsd = document.getElementById("input-usd");
  const inputEur = document.getElementById("input-eur");
  const inputUsdt = document.getElementById("input-usdt");

  const inputs = [inputVes, inputUsd, inputEur, inputUsdt];

  inputs.forEach(input => {
    if (!input) return;
    input.addEventListener("focus", (e) => {
      if (e.target.value === "0.00" || e.target.value === "0" || e.target.value === "0.5" || e.target.value === "0.0") {
        e.target.value = "";
      }
    });
  });

  if (inputVes) {
    inputVes.addEventListener("input", (e) => {
      if (e.target.value === "") {
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      const val = parseFloat(e.target.value) || 0;
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? (val / rates.USD_BCV).toFixed(2) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? (val / rates.EUR_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? (val / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputUsd) {
    inputUsd.addEventListener("input", (e) => {
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      const val = parseFloat(e.target.value) || 0;
      if (inputVes) inputVes.value = (val * rates.USD_BCV).toFixed(2);
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? ((val * rates.USD_BCV) / rates.EUR_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? ((val * rates.USD_BCV) / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputEur) {
    inputEur.addEventListener("input", (e) => {
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      const val = parseFloat(e.target.value) || 0;
      if (inputVes) inputVes.value = (val * rates.EUR_BCV).toFixed(2);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? ((val * rates.EUR_BCV) / rates.USD_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? ((val * rates.EUR_BCV) / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputUsdt) {
    inputUsdt.addEventListener("input", (e) => {
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        return;
      }
      const val = parseFloat(e.target.value) || 0;
      if (inputVes) inputVes.value = (val * rates.USDT_BINANCE).toFixed(2);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? ((val * rates.USDT_BINANCE) / rates.USD_BCV).toFixed(2) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? ((val * rates.USDT_BINANCE) / rates.EUR_BCV).toFixed(2) : "";
    });
  }
}

function obtenerFechaLocalFormateada(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
