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
    // Restauramos fechaObj para el siguiente ciclo del loop hacia atrás
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
