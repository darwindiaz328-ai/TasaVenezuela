let rates = {
  USD_BCV: 0,
  EUR_BCV: 0,
  USDT_BINANCE: 0
};
let historialCompleto = {};
let fechaActualActiva = "";
let fechaHoyPorDefecto = "";
let maxFechaPermitida = "";
let minFechaPermitida = "";

function getHoyVenezuelaISO() {
  const ahora = new Date();
  const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
  const venezuela = new Date(utc - (4 * 3600000));
  const year = venezuela.getFullYear();
  const month = String(venezuela.getMonth() + 1).padStart(2, '0');
  const day = String(venezuela.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosYArrancar();

  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    inputFecha.addEventListener("change", (e) => {
      const fechaSeleccionada = e.target.value;
      if (!fechaSeleccionada) return;

      // 1. Bloqueo estricto: solo se permite consultar fechas anteriores o la fecha actual
      if (maxFechaPermitida && fechaSeleccionada > maxFechaPermitida) {
        mostrarAvisoAlmanaque("⚠️ En el almanaque solo es posible consultar fechas anteriores o la fecha actual.", true);
        inputFecha.value = fechaActualActiva;
        return;
      }

      // 2. Validar límite inferior del historial
      if (minFechaPermitida && fechaSeleccionada < minFechaPermitida) {
        mostrarAvisoAlmanaque(`⚠️ El historial cuenta con registros a partir del ${formatearFechaDMA(minFechaPermitida)}.`, true);
        inputFecha.value = minFechaPermitida;
        consultarFechaAlmanaque(minFechaPermitida);
        return;
      }

      // 3. Consultar fecha
      consultarFechaAlmanaque(fechaSeleccionada);
    });
  }

  const btnHoy = document.getElementById("btn-hoy");
  if (btnHoy) {
    btnHoy.addEventListener("click", () => {
      if (fechaHoyPorDefecto && historialCompleto[fechaHoyPorDefecto]) {
        rates = {
          USD_BCV: Number(historialCompleto[fechaHoyPorDefecto].USD || historialCompleto[fechaHoyPorDefecto].USD_BCV || 0),
          EUR_BCV: Number(historialCompleto[fechaHoyPorDefecto].EUR || historialCompleto[fechaHoyPorDefecto].EUR_BCV || 0),
          USDT_BINANCE: Number(historialCompleto[fechaHoyPorDefecto].USDT || historialCompleto[fechaHoyPorDefecto].USDT_BINANCE || 0)
        };
        fechaActualActiva = fechaHoyPorDefecto;
        if (inputFecha) inputFecha.value = fechaHoyPorDefecto;
        updateUI(fechaHoyPorDefecto);
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
  configurarCopiarPortapapeles();
  configurarTema();
  configurarPWA();
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
  const hoyVenezuela = getHoyVenezuelaISO();

  // La fecha por defecto es la más reciente con cotizaciones registradas
  fechaHoyPorDefecto = fechas.length > 0 ? fechas[0] : hoyVenezuela;
  fechaActualActiva = fechaHoyPorDefecto;

  // Límite máximo para el almanaque: nunca permitir fechas futuras posteriores a hoy
  maxFechaPermitida = fechas.length > 0 && fechas[0] > hoyVenezuela ? fechas[0] : hoyVenezuela;
  minFechaPermitida = fechas.length > 0 ? fechas[fechas.length - 1] : "2024-01-01";

  if (historialCompleto[fechaHoyPorDefecto]) {
    rates = {
      USD_BCV: Number(historialCompleto[fechaHoyPorDefecto].USD || historialCompleto[fechaHoyPorDefecto].USD_BCV || 0),
      EUR_BCV: Number(historialCompleto[fechaHoyPorDefecto].EUR || historialCompleto[fechaHoyPorDefecto].EUR_BCV || 0),
      USDT_BINANCE: Number(historialCompleto[fechaHoyPorDefecto].USDT || historialCompleto[fechaHoyPorDefecto].USDT_BINANCE || 0)
    };
  }

  const inputFecha = document.getElementById("input-fecha");
  if (inputFecha) {
    // Restringir el selector del calendario estrictamente a fechas anteriores y actuales
    inputFecha.max = maxFechaPermitida;
    inputFecha.min = minFechaPermitida;
    inputFecha.value = fechaHoyPorDefecto;
  }

  updateUI(fechaHoyPorDefecto);
}

function consultarFechaAlmanaque(fechaBuscada) {
  const inputFecha = document.getElementById("input-fecha");

  // 1. Coincidencia exacta en el historial
  if (historialCompleto[fechaBuscada]) {
    rates = {
      USD_BCV: Number(historialCompleto[fechaBuscada].USD || historialCompleto[fechaBuscada].USD_BCV || 0),
      EUR_BCV: Number(historialCompleto[fechaBuscada].EUR || historialCompleto[fechaBuscada].EUR_BCV || 0),
      USDT_BINANCE: Number(historialCompleto[fechaBuscada].USDT || historialCompleto[fechaBuscada].USDT_BINANCE || 0)
    };
    fechaActualActiva = fechaBuscada;
    if (inputFecha) inputFecha.value = fechaBuscada;
    updateUI(fechaBuscada);
    return;
  }

  // 2. Si no hay cotización exacta (ej. sábado, domingo o feriado bancario):
  // Buscar el día hábil anterior más cercano
  const fechas = Object.keys(historialCompleto).sort((a, b) => new Date(b) - new Date(a));
  const fechaAnteriorCercana = fechas.find(f => f < fechaBuscada);

  if (fechaAnteriorCercana && historialCompleto[fechaAnteriorCercana]) {
    rates = {
      USD_BCV: Number(historialCompleto[fechaAnteriorCercana].USD || historialCompleto[fechaAnteriorCercana].USD_BCV || 0),
      EUR_BCV: Number(historialCompleto[fechaAnteriorCercana].EUR || historialCompleto[fechaAnteriorCercana].EUR_BCV || 0),
      USDT_BINANCE: Number(historialCompleto[fechaAnteriorCercana].USDT || historialCompleto[fechaAnteriorCercana].USDT_BINANCE || 0)
    };
    fechaActualActiva = fechaAnteriorCercana;
    if (inputFecha) inputFecha.value = fechaAnteriorCercana;
    updateUI(fechaAnteriorCercana);
    mostrarAvisoAlmanaque(`📅 Sin cotización el ${formatearFechaDMA(fechaBuscada)} (fin de semana o feriado). Mostrando último día hábil: ${formatearFechaDMA(fechaAnteriorCercana)}.`);
  } else {
    mostrarAvisoAlmanaque(`No se encontraron cotizaciones para la fecha ${formatearFechaDMA(fechaBuscada)}.`, true);
  }
}

function mostrarAvisoAlmanaque(mensaje, esError = false) {
  const elNotice = document.getElementById("historical-notice");
  if (!elNotice) return;
  elNotice.style.display = "flex";
  elNotice.className = esError ? "historical-notice warning" : "historical-notice";
  elNotice.innerHTML = `<i class="fa-solid ${esError ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i><span>${mensaje}</span>`;

  if (esError) {
    setTimeout(() => {
      if (fechaActualActiva && fechaActualActiva !== fechaHoyPorDefecto) {
        mostrarIndicadorFechaAnterior(fechaActualActiva);
      } else {
        elNotice.style.display = "none";
      }
    }, 4000);
  }
}

function mostrarIndicadorFechaAnterior(fecha) {
  const elNotice = document.getElementById("historical-notice");
  if (!elNotice) return;
  elNotice.style.display = "flex";
  elNotice.className = "historical-notice";
  elNotice.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i><span>Consultando fecha anterior: <strong>${formatearFechaDMA(fecha)}</strong></span>`;
}

function formatearNumero(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parsearNumero(valorStr) {
  if (!valorStr) return 0;
  const limpio = String(valorStr).replace(/\./g, "").replace(",", ".");
  return parseFloat(limpio) || 0;
}

function updateUI(fechaMostrar) {
  const elDolar = document.getElementById("val-dolar");
  const elEuro = document.getElementById("val-euro");
  const elBinance = document.getElementById("val-binance");

  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? formatearNumero(rates.USD_BCV) : "0,00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? formatearNumero(rates.EUR_BCV) : "0,00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? formatearNumero(rates.USDT_BINANCE) : "0,00";

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

  // Actualizar estado del botón 'Hoy' y del aviso según si se consulta fecha anterior
  const btnHoy = document.getElementById("btn-hoy");
  const elNotice = document.getElementById("historical-notice");
  if (fechaMostrar !== fechaHoyPorDefecto) {
    if (btnHoy) {
      btnHoy.classList.add("highlight");
      btnHoy.textContent = "Volver a Hoy";
    }
    mostrarIndicadorFechaAnterior(fechaMostrar);
  } else {
    if (btnHoy) {
      btnHoy.classList.remove("highlight");
      btnHoy.textContent = "Hoy";
    }
    if (elNotice && !elNotice.classList.contains("warning")) {
      elNotice.style.display = "none";
    }
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
  elemento.textContent = `${signo}${formatearNumero(diferencia)} (${signo}${porcentaje.toFixed(2)}%)`;
  elemento.style.color = diferencia > 0 ? "var(--color-usd)" : (diferencia < 0 ? "#e74c3c" : "");
}

function configurarCalculadora() {
  const inputVes = document.getElementById("input-ves");
  const inputUsd = document.getElementById("input-usd");
  const inputEur = document.getElementById("input-eur");
  const inputUsdt = document.getElementById("input-usdt");

  // Configuración del botón de reset
  const btnResetCalc = document.getElementById("btn-reset-calc");
  if (btnResetCalc) {
    btnResetCalc.addEventListener("click", () => {
      if (inputVes) inputVes.value = "";
      if (inputUsd) inputUsd.value = "";
      if (inputEur) inputEur.value = "";
      if (inputUsdt) inputUsdt.value = "";
    });
  }

  const inputs = [inputVes, inputUsd, inputEur, inputUsdt];

  inputs.forEach(input => {
    if (!input) return;
    input.addEventListener("focus", (e) => {
      const limpio = parsearNumero(e.target.value);
      if (limpio === 0) {
        e.target.value = "";
      }
    });

    input.addEventListener("blur", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value !== "") {
        e.target.value = formatearNumero(val);
      }
    });
  });

  if (inputVes) {
    inputVes.addEventListener("input", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value === "") {
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? formatearNumero(val / rates.USD_BCV) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? formatearNumero(val / rates.EUR_BCV) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? formatearNumero(val / rates.USDT_BINANCE) : "";
    });
  }

  if (inputUsd) {
    inputUsd.addEventListener("input", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      if (inputVes) inputVes.value = formatearNumero(val * rates.USD_BCV);
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? formatearNumero((val * rates.USD_BCV) / rates.EUR_BCV) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? formatearNumero((val * rates.USD_BCV) / rates.USDT_BINANCE) : "";
    });
  }

  if (inputEur) {
    inputEur.addEventListener("input", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputUsdt) inputUsdt.value = "";
        return;
      }
      if (inputVes) inputVes.value = formatearNumero(val * rates.EUR_BCV);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? formatearNumero((val * rates.EUR_BCV) / rates.USD_BCV) : "";
      if (inputUsdt) inputUsdt.value = rates.USDT_BINANCE > 0 ? formatearNumero((val * rates.EUR_BCV) / rates.USDT_BINANCE) : "";
    });
  }

  if (inputUsdt) {
    inputUsdt.addEventListener("input", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        return;
      }
      if (inputVes) inputVes.value = formatearNumero(val * rates.USDT_BINANCE);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? formatearNumero((val * rates.USDT_BINANCE) / rates.USD_BCV) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? formatearNumero((val * rates.USDT_BINANCE) / rates.EUR_BCV) : "";
    });
  }
}

function configurarCopiarPortapapeles() {
  const tarjetas = [
    { id: 'card-dolar', getVal: () => rates.USD_BCV },
    { id: 'card-euro', getVal: () => rates.EUR_BCV },
    { id: 'card-binance', getVal: () => rates.USDT_BINANCE }
  ];

  let toast = document.getElementById("toast-copiar");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-copiar";
    toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 1000; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3);";
    toast.textContent = "¡Tasa copiada al portapapeles!";
    document.body.appendChild(toast);
  }

  tarjetas.forEach(item => {
    const card = document.getElementById(item.id);
    if (card) {
      card.title = "Haz clic para copiar la tasa";
      card.addEventListener("click", () => {
        const val = item.getVal();
        if (val > 0) {
          const textoACopiar = formatearNumero(val);
          navigator.clipboard.writeText(textoACopiar).then(() => {
            toast.style.opacity = "1";
            setTimeout(() => {
              toast.style.opacity = "0";
            }, 1500);
          }).catch(err => {
            console.warn("Error al copiar:", err);
          });
        }
      });
    }
  });
}

function configurarTema() {
  const btnTheme = document.getElementById("btn-theme");
  const iconTheme = btnTheme ? btnTheme.querySelector(".theme-icon") : null;
  
  const temaGuardado = localStorage.getItem("tasa_venezuela_theme");
  if (temaGuardado === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if (iconTheme) {
      iconTheme.classList.remove("fa-moon");
      iconTheme.classList.add("fa-sun");
    }
  }

  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const esClaro = document.documentElement.getAttribute("data-theme") === "light";
      
      if (esClaro) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("tasa_venezuela_theme", "dark");
        if (iconTheme) {
          iconTheme.classList.remove("fa-sun");
          iconTheme.classList.add("fa-moon");
        }
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("tasa_venezuela_theme", "light");
        if (iconTheme) {
          iconTheme.classList.remove("fa-moon");
          iconTheme.classList.add("fa-sun");
        }
      }
    });
  }
}

function obtenerFechaLocalFormateada(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function configurarPWA() {
  // 1. Registro del Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('Service Worker registrado:', reg.scope);
      }).catch((err) => {
        console.warn('Error registrando Service Worker:', err);
      });
    });
  }

  // 2. Control de instalación PWA e iOS
  const btnInstall = document.getElementById('btn-install');
  const iosModal = document.getElementById('ios-install-modal');
  const iosModalClose = document.getElementById('ios-modal-close');
  const iosModalCloseBackdrop = document.getElementById('ios-modal-close-backdrop');
  const iosModalOk = document.getElementById('ios-modal-ok');

  // Si ya está abierta como app instalada (standalone), ocultar botón
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    if (btnInstall) btnInstall.style.display = 'none';
    return;
  }

  // Detección de dispositivo iOS
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);

  let deferredPrompt = null;

  // Evento estándar en Android/Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstall) btnInstall.style.display = 'inline-flex';
  });

  // En iOS Safari no se dispara beforeinstallprompt; mostramos el botón directamente
  if (isIOS && !isStandalone) {
    if (btnInstall) btnInstall.style.display = 'inline-flex';
  }

  function abrirModalIOS() {
    if (iosModal) {
      iosModal.classList.add('active');
      iosModal.setAttribute('aria-hidden', 'false');
    }
  }

  function cerrarModalIOS() {
    if (iosModal) {
      iosModal.classList.remove('active');
      iosModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (iosModalClose) iosModalClose.addEventListener('click', cerrarModalIOS);
  if (iosModalCloseBackdrop) iosModalCloseBackdrop.addEventListener('click', cerrarModalIOS);
  if (iosModalOk) iosModalOk.addEventListener('click', cerrarModalIOS);

  if (btnInstall) {
    btnInstall.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            btnInstall.style.display = 'none';
          }
          deferredPrompt = null;
        });
      } else {
        // En iOS o navegadores que requieren pasos manuales
        abrirModalIOS();
      }
    });
  }
}
