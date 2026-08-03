// Variables globales de la aplicación
let rates = {};
let historialCompleto = {};

// Elementos del DOM
const elDolar = document.getElementById("dolar-val");
const elEuro = document.getElementById("euro-val");
const elBinance = document.getElementById("binance-val");

const elTrendDolar = document.getElementById("dolar-trend");
const elTrendEuro = document.getElementById("euro-trend");
const elTrendBinance = document.getElementById("binance-trend");

const elBcvDate = document.getElementById("bcv-date-val");
const elLastUpdate = document.getElementById("last-update-val");
const inputVes = document.getElementById("input-ves");
const selectorFecha = document.getElementById("consultar-fecha");
const btnHoy = document.getElementById("btn-hoy");

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarDatosYArrancar();

  if (selectorFecha) {
    selectorFecha.addEventListener("change", (e) => {
      const fechaSeleccionada = e.target.value;
      if (historialCompleto[fechaSeleccionada]) {
        rates = {
          USD_BCV: historialCompleto[fechaSeleccionada].USD,
          EUR_BCV: historialCompleto[fechaSeleccionada].EUR,
          USDT_BINANCE: historialCompleto[fechaSeleccionada].USDT
        };
        updateUI(fechaSeleccionada);
      }
    });
  }

  if (btnHoy) {
    btnHoy.addEventListener("click", () => {
      cargarDatosYArrancar();
    });
  }
});

async function cargarDatosYArrancar() {
  try {
    // Cargar historial y tasas actuales en paralelo
    const [resHistorial, resRates] = await Promise.all([
      fetch("historial.json?t=" + new Date().getTime()),
      fetch("Datos/rates.json?t=" + new Date().getTime())
    ]);

    historialCompleto = await resHistorial.json();
    const ratesData = await resRates.json();

    rates = {
      USD_BCV: ratesData.rates.USD_BCV,
      EUR_BCV: ratesData.rates.EUR_BCV,
      USDT_BINANCE: ratesData.rates.USDT_BINANCE
    };

    // Obtener la fecha más reciente del historial o la actual local
    const fechas = Object.keys(historialCompleto).sort();
    const hoyStr = fechas.length > 0 ? fechas[fechas.length - 1] : obtenerFechaLocalFormateada(new Date());

    if (selectorFecha) {
      selectorFecha.value = hoyStr;
    }

    updateUI(hoyStr);

  } catch (error) {
    console.error("Error al cargar los datos de la app:", error);
  }
}

function updateUI(fechaMostrar) {
  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? rates.USD_BCV.toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? rates.EUR_BCV.toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? rates.USDT_BINANCE.toFixed(2) : "0.00";
  
  // =========================================================================
  // BÚSQUEDA INTELIGENTE DEL DÍA ANTERIOR VÁLIDO (Omitiendo fines de semana sin datos)
  // =========================================================================
  let fechaAnteriorStr = "";
  let datosAnteriores = null;

  let fechaObj = new Date(fechaMostrar + "T12:00:00");
  
  // Intentamos buscar hacia atrás hasta 5 días para encontrar el último registro real (ej: Viernes)
  for (let i = 1; i <= 5; i++) {
    fechaObj.setDate(fechaObj.getDate() - 1);
    let intentoStr = obtenerFechaLocalFormateada(fechaObj);
    if (historialCompleto[intentoStr]) {
      datosAnteriores = historialCompleto[intentoStr];
      fechaAnteriorStr = intentoStr;
      break;
    }
    fechaObj = new Date(fechaMostrar + "T12:00:00");
  }

  if (datosAnteriores) {
    aplicarEstiloTendencia(elTrendDolar, rates.USD_BCV, datosAnteriores.USD);
    aplicarEstiloTendencia(elTrendEuro, rates.EUR_BCV, datosAnteriores.EUR);
    aplicarEstiloTendencia(elTrendBinance, rates.USDT_BINANCE, datosAnteriores.USDT);
  } else {
    if (elTrendDolar) { elTrendDolar.textContent = "--"; elTrendDolar.style.color = ""; }
    if (elTrendEuro) { elTrendEuro.textContent = "--"; elTrendEuro.style.color = ""; }
    if (elTrendBinance) { elTrendBinance.textContent = "--"; elTrendBinance.style.color = ""; }
  }

  if (elBcvDate) {
    const d = new Date(fechaMostrar.includes("T") ? fechaMostrar : fechaMostrar + "T12:00:00");
    elBcvDate.textContent = isNaN(d.getTime()) ? fechaMostrar : d.toLocaleDateString("es-VE");
  }

  if (elLastUpdate) {
    elLastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (inputVes && inputVes.value !== "") {
    inputVes.dispatchEvent(new Event("input"));
  }
}

function aplicarEstiloTendencia(elemento, valorActual, valorAnterior) {
  if (!elemento) return;
  
  if (valorAnterior === undefined || valorAnterior === null || valorActual === valorAnterior) {
    elemento.textContent = "--";
    elemento.style.color = "";
    return;
  }

  const diferencia = valorActual - valorAnterior;
  const porcentaje = (diferencia / valorAnterior) * 100;
  
  const signo = diferencia > 0 ? "+" : "";
  elemento.textContent = `${signo}${diferencia.toFixed(2)} Bs (${signo}${porcentaje.toFixed(2)}%)`;
  
  if (diferencia > 0) {
    elemento.style.color = "#2ecc71"; // Verde sube
  } else if (diferencia < 0) {
    elemento.style.color = "#e74c3c"; // Rojo baja
  } else {
    elemento.style.color = "";
  }
}

function obtenerFechaLocalFormateada(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
