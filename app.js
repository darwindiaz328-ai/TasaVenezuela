// Variables globales de la aplicación
let rates = {
  USD_BCV: 746.63,
  EUR_BCV: 858.98,
  USDT_BINANCE: 842.78
};
let historialCompleto = {
  "2026-08-02": { "USD": 746.63, "EUR": 858.98, "USDT": 842.78 },
  "2026-08-01": { "USD": 746.63, "EUR": 858.98, "USDT": 842.78 }
};

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
    const [resHistorial, resRates] = await Promise.all([
      fetch("./historial.json?t=" + new Date().getTime()),
      fetch("./Datos/rates.json?t=" + new Date().getTime()).catch(() => fetch("./datos/rates.json?t=" + new Date().getTime()))
    ]);

    if (resHistorial.ok) {
      historialCompleto = await resHistorial.json();
    }
    
    if (resRates && resRates.ok) {
      const ratesData = await resRates.json();
      if (ratesData && ratesData.rates) {
        rates = {
          USD_BCV: ratesData.rates.USD_BCV,
          EUR_BCV: ratesData.rates.EUR_BCV,
          USDT_BINANCE: ratesData.rates.USDT_BINANCE
        };
      }
    }
  } catch (error) {
    console.warn("Usando datos locales por error de red:", error);
  }

  const fechas = Object.keys(historialCompleto).sort((a, b) => new Date(b) - new Date(a));
  const hoyStr = fechas.length > 0 ? fechas[0] : obtenerFechaLocalFormateada(new Date());

  if (selectorFecha) {
    selectorFecha.value = hoyStr;
  }

  updateUI(hoyStr);
}

function updateUI(fechaMostrar) {
  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? Number(rates.USD_BCV).toFixed(2) : "0.00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? Number(rates.EUR_BCV).toFixed(2) : "0.00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? Number(rates.USDT_BINANCE).toFixed(2) : "0.00";
  
  let fechaAnteriorStr = "";
  let datosAnteriores = null;

  let fechaObj = new Date(fechaMostrar + "T12:00:00");
  
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
  
  if (valorAnterior === undefined || valorAnterior === null || Number(valorActual) === Number(valorAnterior)) {
    elemento.textContent = "--";
    elemento.style.color = "";
    return;
  }

  const diferencia = Number(valorActual) - Number(valorAnterior);
  const porcentaje = (diferencia / Number(valorAnterior)) * 100;
  
  const signo = diferencia > 0 ? "+" : "";
  elemento.textContent = `${signo}${diferencia.toFixed(2)} Bs (${signo}${porcentaje.toFixed(2)}%)`;
  
  if (diferencia > 0) {
    elemento.style.color = "#2ecc71";
  } else if (diferencia < 0) {
    elemento.style.color = "#e74c3c";
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
