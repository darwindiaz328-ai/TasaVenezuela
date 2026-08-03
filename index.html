// Variables globales de respaldo
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
    inputFecha.addEventListener("change", (e) => {
      const fechaSeleccionada = e.target.value;
      if (historialCompleto[fechaSeleccionada]) {
        rates = {
          USD_BCV: historialCompleto[fechaSeleccionada].USD || historialCompleto[fechaSeleccionada].USD_BCV,
          EUR_BCV: historialCompleto[fechaSeleccionada].EUR || historialCompleto[fechaSeleccionada].EUR_BCV,
          USDT_BINANCE: historialCompleto[fechaSeleccionada].USDT || historialCompleto[fechaSeleccionada].USDT_BINANCE
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
          USD_BCV: historialCompleto[hoyStr].USD || historialCompleto[hoyStr].USD_BCV,
          EUR_BCV: historialCompleto[hoyStr].EUR || historialCompleto[hoyStr].EUR_BCV,
          USDT_BINANCE: historialCompleto[hoyStr].USDT || historialCompleto[hoyStr].USDT_BINANCE
        };
        updateUI(hoyStr);
      }
    });
  }

  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      cargarDatosYArrancar();
    });
  }

  // Lógica de la Calculadora Multidivisa
  configurarCalculadora();
});

async function cargarDatosYArrancar() {
  try {
    const [resHistorial, resRates] = await Promise.all([
      fetch("./historial.json?t=" + new Date().getTime()),
      fetch("./Datos/rates.json?t=" + new Date().getTime()).catch(() => fetch("./datos/rates.json?t=" + new Date().getTime()))
    ]);

    if (resHistorial.ok) {
      historialCompleto = await resHistorial.json();
    }
    
    if (resRates && resRates.ok) {
      const ratesData = await resRates.json();
      if (ratesData) {
        const r = ratesData.rates || ratesData;
        rates = {
          USD_BCV: Number(r.USD_BCV || r.USD || 0),
          EUR_BCV: Number(r.EUR_BCV || r.EUR || 0),
          USDT_BINANCE: Number(r.USDT_BINANCE || r.USDT || 0)
        };
      }
    }
  } catch (error) {
    console.warn("Error cargando archivos remotos:", error);
  }

  const fechas = Object.keys(historialCompleto).sort((a, b) => new Date(b) - new Date(a));
  const hoyStr = fechas.length > 0 ? fechas[0] : obtenerFechaLocalFormateada(new Date());

  // Si rates vino en 0, intentamos sacarlo del historial de hoy
  if (rates.USD_BCV === 0 && historialCompleto[hoyStr]) {
    rates = {
      USD_BCV: Number(historialCompleto[hoyStr].USD || historialCompleto[hoyStr].USD_BCV || 0),
      EUR_BCV: Number(historialCompleto[hoyStr].EUR || historialCompleto[hoyStr].EUR_BCV || 0),
      USDT_BINANCE: Number(historialCompleto[hoyStr].USDT || historialCompleto[hoyStr].USDT_BINANCE || 0)
    };
  }

  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    inputFecha.value = hoyStr;
  }

  updateUI(hoyStr);
}

function updateUI(fechaMostrar) {
  // IDs exactos según tu archivo HTML
  const elDolar = document.getElementById("val-dolar");
  const elEuro = document.getElementById("val-euro");
  const elBinance = document.getElementById("val-binance");

  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";

  // Actualizar número pequeño en el icono del calendario si existe
  const diaNum = document.getElementById("dia-calendario-num");
  if (diaNum && fechaMostrar) {
    diaNum.textContent = fechaMostrar.split("-")[2] || "--";
  }
  
  let datosAnteriores = null;
  let fechaObj = new Date(fechaMostrar + "T12:00:00");
  
  for (let i = 1; i <= 5; i++) {
    fechaObj.setDate(fechaObj.getDate() - 1);
    let intentoStr = obtenerFechaLocalFormateada(fechaObj);
    if (historialCompleto[intentoStr]) {
      datosAnteriores = historialCompleto[intentoStr];
      break;
    }
    fechaObj = new Date(fechaMostrar + "T12:00:00");
  }

  const elTrendDolar = document.getElementById("trend-dolar");
  const elTrendEuro = document.getElementById("trend-euro");
  const elTrendBinance = document.getElementById("trend-binance");

  if (datosAnteriores) {
    aplicarEstiloTendencia(elTrendDolar, rates.USD_BCV, datosAnteriores.USD || datosAnteriores.USD_BCV);
    aplicarEstiloTendencia(elTrendEuro, rates.EUR_BCV, datosAnteriores.EUR || datosAnteriores.EUR_BCV);
    aplicarEstiloTendencia(elTrendBinance, rates.USDT_BINANCE, datosAnteriores.USDT || datosAnteriores.USDT_BINANCE);
  }

  const elBcvDate = document.getElementById("bcv-date-display");
  if (elBcvDate) {
    elBcvDate.textContent = fechaMostrar;
  }

  const elLastUpdate = document.getElementById("last-update-display");
  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Disparar la calculadora para recalcular con las nuevas tasas
  const inputVes = document.getElementById("input-ves");
  if (inputVes && inputVes.value) {
    inputVes.dispatchEvent(new Event("input"));
  }
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
  elemento.style.color = diferencia > 0 ? "#2ecc71" : (diferencia < 0 ? "#e74c3c" : "");
}

function configurarCalculadora() {
  const inputVes = document.getElementById("input-ves");
  const inputUsd = document.getElementById("input-usd");
  const inputEur = document.getElementById("input-eur");
  const inputUsdt = document.getElementById("input-usdt");

  if (inputVes) {
    inputVes.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value) || 0;
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? (val / rates.USD_BCV).toFixed(2) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? (val / rates.EUR_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? (val / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputUsd) {
    inputUsd.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value) || 0;
      if (inputVes) inputVes.value = (val * rates.USD_BCV).toFixed(2);
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? ((val * rates.USD_BCV) / rates.EUR_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? ((val * rates.USD_BCV) / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputEur) {
    inputEur.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value) || 0;
      if (inputVes) inputVes.value = (val * rates.EUR_BCV).toFixed(2);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? ((val * rates.EUR_BCV) / rates.USD_BCV).toFixed(2) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? ((val * rates.EUR_BCV) / rates.USDT_BINANCE).toFixed(2) : "";
    });
  }

  if (inputUsdt) {
    inputUsdt.addEventListener("input", (e) => {
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
