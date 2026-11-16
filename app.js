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

const CACHE_KEY_HISTORIAL = "tasavzla_historial_cache";
const CACHE_KEY_UPDATE_INFO = "tasavzla_last_update_info";
let isOfflineMode = false;
let lastReceivedUpdateInfo = null;

function getHoyVenezuelaISO() {
  const ahora = new Date();
  const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
  const venezuela = new Date(utc - (4 * 3600000));
  const year = venezuela.getFullYear();
  const month = String(venezuela.getMonth() + 1).padStart(2, '0');
  const day = String(venezuela.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function obtenerFechaLocalFormateada(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function recuperarInfoUltimaActualizacion() {
  try {
    const guardado = localStorage.getItem(CACHE_KEY_UPDATE_INFO);
    if (guardado) {
      return JSON.parse(guardado);
    }
  } catch (e) {
    console.warn("Error leyendo última actualización de localStorage:", e);
  }
  return null;
}

function formatearHoraCorta(dateObj) {
  let horas = dateObj.getHours();
  const minutos = String(dateObj.getMinutes()).padStart(2, '0');
  const periodo = horas >= 12 ? 'p.m.' : 'a.m.';
  horas = horas % 12 || 12;
  return `${horas}:${minutos} ${periodo}`;
}

function guardarActualizacionExitosa(data) {
  const ahora = new Date();
  const fechas = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const fechaMasReciente = fechas.length > 0 ? fechas[0] : getHoyVenezuelaISO();

  lastReceivedUpdateInfo = {
    timestamp: ahora.getTime(),
    fechaRegistroISO: fechaMasReciente,
    fechaTexto: ahora.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    horaTexto: formatearHoraCorta(ahora),
    origen: "red"
  };

  try {
    localStorage.setItem(CACHE_KEY_HISTORIAL, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_UPDATE_INFO, JSON.stringify(lastReceivedUpdateInfo));
  } catch (e) {
    console.warn("No se pudo guardar la caché offline en localStorage:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarSplashScreen();
  cargarDatosYArrancar();

  const inputFecha = document.getElementById("input-fecha");
  const dateControlTrigger = document.getElementById("date-control-trigger");
  if (dateControlTrigger && inputFecha) {
    dateControlTrigger.addEventListener("click", (e) => {
      if (e.target !== inputFecha && typeof inputFecha.showPicker === "function") {
        try {
          inputFecha.showPicker();
        } catch (_) {
          // Algunos navegadores móviles manejan el toque directo sobre el input overlay
        }
      }
    });
  }

  if (inputFecha) {
    inputFecha.addEventListener("change", (e) => {
      const fechaSeleccionada = e.target.value;
      if (!fechaSeleccionada) return;

      // 1. Bloqueo estricto: solo se permite consultar fechas anteriores o la fecha actual
      if (maxFechaPermitida && fechaSeleccionada > maxFechaPermitida) {
        mostrarAvisoAlmanaque("⚠️ Solo es posible consultar fechas anteriores o la fecha actual.", true);
        inputFecha.value = fechaActualActiva;
        return;
      }

      // 2. Validar límite inferior del historial
      if (minFechaPermitida && fechaSeleccionada < minFechaPermitida) {
        mostrarAvisoAlmanaque(`⚠️ El historial cuenta con registros desde el ${formatearFechaBarras(minFechaPermitida)}.`, true);
        inputFecha.value = minFechaPermitida;
        consultarFechaAlmanaque(minFechaPermitida);
        return;
      }

      // 3. Consultar fecha
      consultarFechaAlmanaque(fechaSeleccionada);
    });
  }

  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      const icon = btnRefresh.querySelector(".refresh-icon");
      if (icon) icon.classList.add("spin");
      cargarDatosYArrancar().then(() => {
        if (!isOfflineMode) {
          mostrarToast("Tasas actualizadas correctamente");
        }
      }).finally(() => {
        setTimeout(() => { if (icon) icon.classList.remove("spin"); }, 600);
      });
    });
  }

  const btnRetryOffline = document.getElementById("btn-retry-offline");
  if (btnRetryOffline) {
    btnRetryOffline.addEventListener("click", () => {
      const icon = btnRetryOffline.querySelector("i");
      if (icon) icon.classList.add("spin");
      cargarDatosYArrancar().finally(() => {
        setTimeout(() => { if (icon) icon.classList.remove("spin"); }, 600);
      });
    });
  }

  // Detección reactiva de eventos de red
  window.addEventListener("online", () => {
    console.log("Conexión restablecida en el dispositivo. Actualizando datos...");
    cargarDatosYArrancar();
  });

  window.addEventListener("offline", () => {
    console.log("El dispositivo se ha quedado sin conexión. Cambiando a modo offline.");
    isOfflineMode = true;
    actualizarEstadoOfflineUI();
  });

  configurarCalculadora();
  configurarCopiarPortapapeles();
  configurarCompartir();
  configurarGraficoHistorico();
  configurarTema();
  configurarPWA();
});

async function cargarDatosYArrancar() {
  let redExitosa = false;
  const hayRedAparente = typeof navigator.onLine === "boolean" ? navigator.onLine : true;

  // 1. Intentar obtener datos frescos de internet si hay conexión
  if (hayRedAparente) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const resHistorial = await fetch("./historial.json?t=" + new Date().getTime(), {
        cache: "no-store",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resHistorial.ok) {
        const data = await resHistorial.json();
        if (data && Object.keys(data).length > 0) {
          historialCompleto = data;
          redExitosa = true;
          guardarActualizacionExitosa(data);
        }
      }
    } catch (error) {
      console.warn("Fallo al conectar con la red o timeout:", error);
      redExitosa = false;
    }
  }

  // 2. Si no hubo conexión o la petición falló, restaurar la última actualización recibida
  if (!redExitosa) {
    isOfflineMode = true;
    lastReceivedUpdateInfo = recuperarInfoUltimaActualizacion();

    let datosLocales = null;
    try {
      const guardado = localStorage.getItem(CACHE_KEY_HISTORIAL);
      if (guardado) {
        datosLocales = JSON.parse(guardado);
      }
    } catch (e) {
      console.warn("Error leyendo historial de localStorage:", e);
    }

    if (datosLocales && Object.keys(datosLocales).length > 0) {
      historialCompleto = datosLocales;
    } else if (Object.keys(historialCompleto).length === 0) {
      // Fallback estático de seguridad para primera apertura sin red
      try {
        const resFallback = await fetch("./historial.json");
        if (resFallback.ok) {
          historialCompleto = await resFallback.json();
          guardarActualizacionExitosa(historialCompleto);
        }
      } catch (e) {
        console.warn("Fallback estático no disponible:", e);
      }
    }
  } else {
    isOfflineMode = false;
  }

  const fechas = Object.keys(historialCompleto).sort((a, b) => b.localeCompare(a));
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
  actualizarEstadoOfflineUI();
}

function actualizarEstadoOfflineUI() {
  const banner = document.getElementById("offline-banner");
  const txtFechaOffline = document.getElementById("offline-last-date");
  const elLastUpdate = document.getElementById("last-update-display");

  if (isOfflineMode) {
    // Mostrar banner exclusivamente cuando no hay conexión
    if (banner) {
      banner.style.display = "flex";
    }

    let detalle = "";
    if (lastReceivedUpdateInfo && lastReceivedUpdateInfo.horaTexto) {
      const fechaTexto = lastReceivedUpdateInfo.fechaTexto || formatearFechaBarras(lastReceivedUpdateInfo.fechaRegistroISO || fechaHoyPorDefecto);
      detalle = `${fechaTexto} a las ${lastReceivedUpdateInfo.horaTexto}`;
    } else if (fechaHoyPorDefecto) {
      detalle = formatearFechaBarras(fechaHoyPorDefecto);
    } else {
      detalle = "Datos almacenados localmente";
    }

    if (txtFechaOffline) {
      txtFechaOffline.textContent = detalle;
    }

    if (elLastUpdate) {
      const hora = (lastReceivedUpdateInfo && lastReceivedUpdateInfo.horaTexto)
        ? lastReceivedUpdateInfo.horaTexto
        : "--";
      elLastUpdate.innerHTML = `<span class="status-offline-pill">Offline</span> ${hora}`;
    }
  } else {
    // Ocultar banner cuando hay conexión normal
    if (banner) {
      banner.style.display = "none";
    }

    if (elLastUpdate) {
      const hora = (lastReceivedUpdateInfo && lastReceivedUpdateInfo.horaTexto)
        ? lastReceivedUpdateInfo.horaTexto
        : formatearHoraCorta(new Date());
      elLastUpdate.textContent = `Actualizado ${hora}`;
    }
  }
}

function volverATasaDeHoy() {
  const inputFecha = document.getElementById("input-fecha");
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
  const fechas = Object.keys(historialCompleto).sort((a, b) => b.localeCompare(a));
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
    mostrarAvisoAlmanaque(`Sin cotización el ${formatearFechaBarras(fechaBuscada)} (fin de semana o feriado). Mostrando: ${formatearFechaBarras(fechaAnteriorCercana)}.`, false, true);
  } else {
    mostrarAvisoAlmanaque(`No se encontraron cotizaciones para la fecha ${formatearFechaBarras(fechaBuscada)}.`, true);
  }
}

function mostrarAvisoAlmanaque(mensaje, esError = false, mostrarVolverHoy = false) {
  const elNotice = document.getElementById("historical-notice");
  if (!elNotice) return;
  elNotice.style.display = "flex";
  elNotice.className = esError ? "historical-notice warning" : "historical-notice";
  const btnVolverHtml = mostrarVolverHoy ? '<button type="button" class="btn-back-today-inline" id="btn-volver-hoy-inline">Hoy</button>' : '';
  elNotice.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex:1;"><i class="fa-solid ${esError ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i><span>${mensaje}</span></div>${btnVolverHtml}`;

  const btnVolver = document.getElementById("btn-volver-hoy-inline");
  if (btnVolver) {
    btnVolver.addEventListener("click", volverATasaDeHoy);
  }

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
  elNotice.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex:1;"><i class="fa-solid fa-clock-rotate-left"></i><span>Consultando fecha: <strong>${formatearFechaBarras(fecha)}</strong></span></div><button type="button" class="btn-back-today-inline" id="btn-volver-hoy-inline">Volver a hoy</button>`;
  const btnVolver = document.getElementById("btn-volver-hoy-inline");
  if (btnVolver) {
    btnVolver.addEventListener("click", volverATasaDeHoy);
  }
}

function formatearNumero(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatearNumeroPagoMovil(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "0,00";
  return num.toFixed(2).replace(".", ",");
}

function normalizarTokenNumerico(token) {
  let s = String(token).trim();
  if (!s) return 0;
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function tieneOperadorMatematico(valorStr) {
  if (!valorStr) return false;
  const sinSignoInicial = String(valorStr).trim().replace(/^[+-]/, "");
  return /[+\-*/]/.test(sinSignoInicial);
}

function evaluarExpresionMatematica(valorStr) {
  if (!valorStr) return 0;
  let expr = String(valorStr).replace(/\s+/g, "").replace(/[+\-*/]+$/, "");
  if (!expr) return 0;

  if (!tieneOperadorMatematico(expr)) {
    return normalizarTokenNumerico(expr);
  }

  // Tokenizar números y operadores +, -, *, /
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if ("+-*/".includes(ch)) {
      if ((ch === "+" || ch === "-") && (tokens.length === 0 || typeof tokens[tokens.length - 1] === "string")) {
        let numStr = ch;
        i++;
        while (i < expr.length && !"+-*/".includes(expr[i])) {
          numStr += expr[i++];
        }
        tokens.push(normalizarTokenNumerico(numStr));
      } else {
        tokens.push(ch);
        i++;
      }
    } else {
      let numStr = "";
      while (i < expr.length && !"+-*/".includes(expr[i])) {
        numStr += expr[i++];
      }
      tokens.push(normalizarTokenNumerico(numStr));
    }
  }

  if (tokens.length === 0) return 0;

  // Primera pasada: * y /
  const reducida = [typeof tokens[0] === "number" ? tokens[0] : 0];
  for (let idx = 1; idx < tokens.length; idx += 2) {
    const op = tokens[idx];
    const rhs = typeof tokens[idx + 1] === "number" ? tokens[idx + 1] : null;
    if (rhs === null) break;
    if (op === "*") {
      reducida[reducida.length - 1] *= rhs;
    } else if (op === "/") {
      reducida[reducida.length - 1] = rhs !== 0 ? reducida[reducida.length - 1] / rhs : 0;
    } else {
      reducida.push(op, rhs);
    }
  }

  // Segunda pasada: + y -
  let total = reducida[0];
  for (let idx = 1; idx < reducida.length; idx += 2) {
    const op = reducida[idx];
    const rhs = typeof reducida[idx + 1] === "number" ? reducida[idx + 1] : 0;
    if (op === "+") total += rhs;
    else if (op === "-") total -= rhs;
  }

  return isFinite(total) ? Math.max(0, total) : 0;
}

function parsearNumero(valorStr) {
  return evaluarExpresionMatematica(valorStr);
}

function updateUI(fechaMostrar) {
  const elDolar = document.getElementById("val-dolar");
  const elEuro = document.getElementById("val-euro");
  const elBinance = document.getElementById("val-binance");

  if (elDolar)   elDolar.textContent   = rates.USD_BCV ? formatearNumero(rates.USD_BCV) : "0,00";
  if (elEuro)    elEuro.textContent    = rates.EUR_BCV ? formatearNumero(rates.EUR_BCV) : "0,00";
  if (elBinance) elBinance.textContent = rates.USDT_BINANCE ? formatearNumero(rates.USDT_BINANCE) : "0,00";

  // Buscar la fecha anterior con cotización real disponible en el historial
  let datosAnteriores = null;
  const fechasOrdenadas = Object.keys(historialCompleto).sort((a, b) => b.localeCompare(a));
  const fechaPrevia = fechasOrdenadas.find(f => f < fechaMostrar);
  if (fechaPrevia && historialCompleto[fechaPrevia]) {
    datosAnteriores = historialCompleto[fechaPrevia];
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

  // Cálculo y actualización de la Tarjeta de Brecha Cambiaria (Spread)
  const elBrechaPct = document.getElementById("val-brecha-pct");
  const elBrechaDiff = document.getElementById("val-brecha-diff");
  const elBrechaBar = document.getElementById("spread-bar-fill");
  const elBrechaFooter = document.getElementById("spread-footer-text");
  const cardBrecha = document.getElementById("card-brecha");

  if (rates.USD_BCV > 0 && rates.USDT_BINANCE > 0) {
    const usdBcv = Number(rates.USD_BCV);
    const usdBinance = Number(rates.USDT_BINANCE);
    const diff = usdBinance - usdBcv;
    const pct = (diff / usdBcv) * 100;
    const signo = pct >= 0 ? "+" : "";

    if (elBrechaPct) {
      elBrechaPct.textContent = `${signo}${formatearNumero(pct)}%`;
    }

    const diffSigno = diff >= 0 ? "+" : "-";
    const textoBs = `${diffSigno}Bs. ${formatearNumero(Math.abs(diff))}`;

    const elBrechaDiffInline = document.getElementById("val-brecha-diff-inline");
    if (elBrechaDiffInline) {
      elBrechaDiffInline.textContent = textoBs;
    }

    if (elBrechaDiff) {
      elBrechaDiff.textContent = `Diferencia de ${textoBs} por dólar respecto al oficial`;
    }

    if (elBrechaBar) {
      // Escala visual normalizada a un rango de 25%
      const barWidth = Math.min(Math.max((pct / 25) * 100, 4), 100);
      elBrechaBar.style.width = `${barWidth}%`;
    }

    if (elBrechaFooter) {
      if (pct > 0) {
        elBrechaFooter.textContent = `Mercado P2P cotiza ${formatearNumero(pct)}% por encima del oficial`;
      } else if (pct < 0) {
        elBrechaFooter.textContent = `Mercado P2P cotiza ${formatearNumero(Math.abs(pct))}% por debajo del oficial`;
      } else {
        elBrechaFooter.textContent = `Mercado P2P y BCV cotizan exactamente a la par`;
      }
    }

    if (cardBrecha) cardBrecha.style.display = "";
  } else {
    if (cardBrecha) cardBrecha.style.display = "none";
  }

  // Actualizar fecha mostrada en la barra unificada (DD/MM/YYYY)
  const elSelectedDate = document.getElementById("selected-date-display");
  if (elSelectedDate) {
    elSelectedDate.textContent = formatearFechaBarras(fechaMostrar);
  }

  // Actualizar indicador de última actualización respetando el modo offline
  actualizarEstadoOfflineUI();

  // Mostrar aviso solo si se consulta una fecha anterior
  const elNotice = document.getElementById("historical-notice");
  if (fechaMostrar !== fechaHoyPorDefecto) {
    mostrarIndicadorFechaAnterior(fechaMostrar);
  } else if (elNotice && !elNotice.classList.contains("warning")) {
    elNotice.style.display = "none";
  }

  // Actualizar mini-sparkline de los últimos 7 días en la tarjeta Dólar BCV
  dibujarMiniSparklineDolar(fechaMostrar);

  const inputVes = document.getElementById("input-ves");
  if (inputVes && inputVes.value) {
    inputVes.dispatchEvent(new Event("input"));
  }
}

function dibujarMiniSparklineDolar(fechaLimite) {
  const spark = document.getElementById("spark-dolar");
  if (!spark) return;

  const limite = fechaLimite || fechaHoyPorDefecto || "9999-12-31";
  const fechas = Object.keys(historialCompleto)
    .filter((f) => f <= limite)
    .sort((a, b) => a.localeCompare(b))
    .slice(-7);

  const valores = fechas
    .map((f) => Number(historialCompleto[f]?.USD || historialCompleto[f]?.USD_BCV || 0))
    .filter((v) => v > 0);

  const dpr = window.devicePixelRatio || 1;
  const w = spark.clientWidth || 90;
  const h = spark.clientHeight || 26;
  spark.width = Math.round(w * dpr);
  spark.height = Math.round(h * dpr);

  const ctx = spark.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (valores.length < 2) return;

  const minV = Math.min(...valores);
  const maxV = Math.max(...valores);
  const span = maxV - minV || 1;
  const padX = 4;
  const padY = 4;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const isUp = valores[valores.length - 1] >= valores[0];
  const color = isUp ? "#22c55e" : "#ef4444";

  const pts = valores.map((v, i) => ({
    x: padX + (i / (valores.length - 1)) * plotW,
    y: padY + (1 - (v - minV) / span) * plotH
  }));

  const areaGrad = ctx.createLinearGradient(0, padY, 0, h);
  areaGrad.addColorStop(0, `${color}44`);
  areaGrad.addColorStop(1, `${color}00`);
  ctx.beginPath();
  pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.lineTo(pts[0].x, h);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.beginPath();
  pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function formatearFechaDMA(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return fechaStr;
}

function formatearFechaBarras(fechaStr) {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}

function aplicarEstiloTendencia(elemento, valorActual, valorAnterior) {
  if (!elemento) return;
  if (!valorAnterior || Number(valorAnterior) === 0 || !valorActual || Number(valorActual) === 0) {
    elemento.textContent = "--";
    elemento.style.color = "";
    return;
  }
  const actual = Number(valorActual);
  const anterior = Number(valorAnterior);
  const diferencia = actual - anterior;
  const porcentaje = (diferencia / anterior) * 100;

  if (Math.abs(diferencia) < 0.0001) {
    elemento.innerHTML = `<span>0,00 (0,00%)</span>`;
    elemento.style.color = "var(--text-dim)";
    return;
  }

  const esAumento = diferencia > 0;
  const esBaja = diferencia < 0;
  const signo = esAumento ? "+" : (esBaja ? "-" : "");
  const difAbs = formatearNumero(Math.abs(diferencia));
  const porcAbs = Math.abs(porcentaje).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const iconHtml = esAumento 
    ? '<i class="fa-solid fa-arrow-trend-up"></i> ' 
    : (esBaja ? '<i class="fa-solid fa-arrow-trend-down"></i> ' : '');

  elemento.innerHTML = `${iconHtml}${signo}${difAbs} (${signo}${porcAbs}%)`;
  elemento.style.color = esAumento ? "var(--color-usd)" : (esBaja ? "#ef4444" : "var(--text-dim)");
}

function actualizarBadgeExpresion(inputEl, resultado) {
  if (!inputEl) return;
  const label = document.querySelector(`label[for="${inputEl.id}"]`);
  if (!label) return;

  let badge = label.querySelector(".calc-expr-badge");
  if (tieneOperadorMatematico(inputEl.value)) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "calc-expr-badge";
      label.appendChild(badge);
    }
    badge.textContent = `= ${formatearNumero(resultado)}`;
  } else if (badge) {
    badge.remove();
  }
}

function limpiarBadgesExpresion() {
  document.querySelectorAll(".calc-expr-badge").forEach((b) => b.remove());
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
      limpiarBadgesExpresion();
    });
  }

  const inputs = [inputVes, inputUsd, inputEur, inputUsdt];

  inputs.forEach(input => {
    if (!input) return;
    input.addEventListener("focus", (e) => {
      const limpio = parsearNumero(e.target.value);
      if (limpio === 0 && !tieneOperadorMatematico(e.target.value)) {
        e.target.value = "";
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.target.blur();
      }
    });

    input.addEventListener("blur", (e) => {
      const val = parsearNumero(e.target.value);
      if (e.target.value !== "") {
        e.target.value = formatearNumero(val);
      }
      actualizarBadgeExpresion(e.target, val);
    });
  });

  if (inputVes) {
    inputVes.addEventListener("input", (e) => {
      const val = parsearNumero(e.target.value);
      actualizarBadgeExpresion(e.target, val);
      if (e.target.value === "") {
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        limpiarBadgesExpresion();
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
      actualizarBadgeExpresion(e.target, val);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputEur) inputEur.value = "";
        if (inputUsdt) inputUsdt.value = "";
        limpiarBadgesExpresion();
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
      actualizarBadgeExpresion(e.target, val);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputUsdt) inputUsdt.value = "";
        limpiarBadgesExpresion();
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
      actualizarBadgeExpresion(e.target, val);
      if (e.target.value === "") {
        if (inputVes) inputVes.value = "";
        if (inputUsd) inputUsd.value = "";
        if (inputEur) inputEur.value = "";
        limpiarBadgesExpresion();
        return;
      }
      if (inputVes) inputVes.value = formatearNumero(val * rates.USDT_BINANCE);
      if (inputUsd) inputUsd.value = rates.USD_BCV > 0 ? formatearNumero((val * rates.USDT_BINANCE) / rates.USD_BCV) : "";
      if (inputEur) inputEur.value = rates.EUR_BCV > 0 ? formatearNumero((val * rates.USDT_BINANCE) / rates.EUR_BCV) : "";
    });
  }
}

let toastTimer = null;

function mostrarToast(mensaje) {
  let toast = document.getElementById("toast-copiar");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-copiar";
    toast.className = "toast-copiar";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>${mensaje}</span>`;
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function marcarBotonCopiado(botonEl) {
  if (!botonEl) return;
  const icon = botonEl.querySelector("i");
  if (!icon) return;

  const originalClass = icon.className;
  botonEl.classList.add("copied");
  icon.className = "fa-solid fa-check";

  setTimeout(() => {
    botonEl.classList.remove("copied");
    icon.className = originalClass;
  }, 1300);
}

async function copiarAlPortapapeles(texto, mensajeToast, botonEl) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
    } else {
      const tmp = document.createElement("textarea");
      tmp.value = texto;
      tmp.style.position = "fixed";
      tmp.style.opacity = "0";
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
    }
    marcarBotonCopiado(botonEl);
    mostrarToast(mensajeToast);
  } catch (err) {
    console.warn("Error al copiar al portapapeles:", err);
  }
}

function configurarCopiarPortapapeles() {
  const rateGetters = {
    usd: { label: "Dólar BCV", getVal: () => rates.USD_BCV },
    eur: { label: "Euro Oficial", getVal: () => rates.EUR_BCV },
    usdt: { label: "USDT Binance", getVal: () => rates.USDT_BINANCE }
  };

  // Botones de copiar en las tarjetas de divisas
  document.querySelectorAll(".btn-copy-rate[data-copy-rate]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.getAttribute("data-copy-rate");
      const entry = rateGetters[key];
      if (!entry) return;

      const val = entry.getVal();
      if (val > 0) {
        const textoACopiar = formatearNumero(val);
        copiarAlPortapapeles(textoACopiar, `¡${entry.label} copiado: ${textoACopiar}!`, btn);
      }
    });
  });

  // Botones de copiar individuales por fila en la Calculadora Multidivisa
  document.querySelectorAll(".btn-copy-calc[data-copy-input]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const inputId = btn.getAttribute("data-copy-input");
      const currency = btn.getAttribute("data-currency") || "";
      const inputEl = document.getElementById(inputId);
      if (!inputEl) return;

      const num = parsearNumero(inputEl.value);
      if (num > 0) {
        if (currency === "VES") {
          const textoPagoMovil = formatearNumeroPagoMovil(num);
          copiarAlPortapapeles(textoPagoMovil, `¡Monto VES copiado para Pago Móvil: ${textoPagoMovil}!`, btn);
        } else {
          const textoACopiar = formatearNumero(num);
          copiarAlPortapapeles(textoACopiar, `¡Monto en ${currency} copiado: ${textoACopiar}!`, btn);
        }
      } else {
        mostrarToast(`Ingresa un monto en ${currency} para copiar`);
      }
    });
  });
}

function construirResumenCompartir() {
  const fechaTxt = formatearFechaBarras(fechaActualActiva || fechaHoyPorDefecto || getHoyVenezuelaISO());
  const usd = rates.USD_BCV > 0 ? formatearNumero(rates.USD_BCV) : "0,00";
  const eur = rates.EUR_BCV > 0 ? formatearNumero(rates.EUR_BCV) : "0,00";
  const usdt = rates.USDT_BINANCE > 0 ? formatearNumero(rates.USDT_BINANCE) : "0,00";

  let lineaBrecha = "";
  if (rates.USD_BCV > 0 && rates.USDT_BINANCE > 0) {
    const diff = rates.USDT_BINANCE - rates.USD_BCV;
    const pct = (diff / rates.USD_BCV) * 100;
    const signoPct = pct >= 0 ? "+" : "";
    const signoDiff = diff >= 0 ? "+" : "-";
    lineaBrecha = `\n📊 Brecha: ${signoPct}${formatearNumero(pct)}% (${signoDiff}Bs. ${formatearNumero(Math.abs(diff))})`;
  }

  return (
    `🇻🇪 TasaVenezuela (${fechaTxt})\n\n` +
    `💵 Dólar BCV: Bs. ${usd}\n` +
    `💶 Euro Oficial: Bs. ${eur}\n` +
    `🪙 USDT Binance: Bs. ${usdt}` +
    lineaBrecha +
    `\n\n🔗 https://darwindiaz328-ai.github.io/TasaVenezuela/`
  );
}

function calcularTendenciaTexto(valorActual, valorAnterior) {
  if (!valorActual || !valorAnterior || Number(valorAnterior) === 0) {
    return { texto: "--", color: "#94a3b8" };
  }
  const actual = Number(valorActual);
  const anterior = Number(valorAnterior);
  const diff = actual - anterior;
  const pct = (diff / anterior) * 100;
  if (Math.abs(diff) < 0.0001) {
    return { texto: "0,00 (0,00%)", color: "#94a3b8" };
  }
  const esAumento = diff > 0;
  const signo = esAumento ? "+" : "-";
  const arrow = esAumento ? "↗ " : "↘ ";
  const difAbs = formatearNumero(Math.abs(diff));
  const porcAbs = Math.abs(pct).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    texto: `${arrow}${signo}${difAbs} (${signo}${porcAbs}%)`,
    color: esAumento ? "#22c55e" : "#ef4444"
  };
}

function dibujarTarjetaCanvas(ctx, x, y, w, h, radius) {
  ctx.save();
  dibujarRoundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = "rgba(22, 31, 52, 0.88)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(130, 160, 210, 0.16)";
  ctx.stroke();
  ctx.restore();
}

function dibujarEmblemaDivisa(ctx, tipo, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  if (tipo === "usd") {
    ctx.fillStyle = "#B31942";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#FFFFFF";
    const stripeH = (r * 2) / 13;
    for (let s = 1; s < 13; s += 2) {
      ctx.fillRect(cx - r, cy - r + s * stripeH, r * 2, stripeH);
    }
    ctx.fillStyle = "#0A3161";
    ctx.fillRect(cx - r, cy - r, r * 1.05, r * 1.08);
    ctx.fillStyle = "#FFFFFF";
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.beginPath();
        ctx.arc(cx - r * 0.72 + col * r * 0.28, cy - r * 0.72 + row * r * 0.28, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (tipo === "eur") {
    ctx.fillStyle = "#002776";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#FFCC00";
    for (let k = 0; k < 12; k++) {
      const ang = (k * Math.PI * 2) / 12;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * r * 0.62, cy + Math.sin(ang) * r * 0.62, r * 0.085, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tipo === "usdt") {
    ctx.fillStyle = "#26A17B";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(r * 1.25)}px 'Outfit', sans-serif`;
    ctx.fillText("₮", cx, cy + 2);
  } else if (tipo === "brecha") {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#f59e0b");
    g.addColorStop(1, "#d97706");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(r * 1.15)}px 'Outfit', sans-serif`;
    ctx.fillText("%", cx, cy + 1);
  }

  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.stroke();
  ctx.restore();
}

function generarImagenResumenCanvas() {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Fondo oscuro degradado con glows sutiles
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#090f1d");
  bgGrad.addColorStop(1, "#0c1324");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const glow1 = ctx.createRadialGradient(W - 80, 60, 10, W - 80, 60, 420);
  glow1.addColorStop(0, "rgba(124, 58, 237, 0.18)");
  glow1.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(90, H - 180, 10, 90, H - 180, 420);
  glow2.addColorStop(0, "rgba(20, 184, 166, 0.13)");
  glow2.addColorStop(1, "rgba(20, 184, 166, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Header: Logo Tricolor + Subtítulo
  ctx.textAlign = "center";
  ctx.font = `800 58px ${FONT}`;
  const titleText = "TasaVenezuela";
  const titleWidth = ctx.measureText(titleText).width;
  const titleGrad = ctx.createLinearGradient((W - titleWidth) / 2, 0, (W + titleWidth) / 2, 0);
  titleGrad.addColorStop(0, "#F59E0B");
  titleGrad.addColorStop(0.28, "#FBBF24");
  titleGrad.addColorStop(0.48, "#3B82F6");
  titleGrad.addColorStop(0.65, "#2563EB");
  titleGrad.addColorStop(0.82, "#EF4444");
  titleGrad.addColorStop(1, "#DC2626");
  ctx.fillStyle = titleGrad;
  ctx.fillText(titleText, W / 2, 118);

  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Monitoreo oficial de divisas y cripto", W / 2, 162);

  // Píldora de fecha y hora
  const fechaMostrar = fechaActualActiva || fechaHoyPorDefecto || getHoyVenezuelaISO();
  const fechaTxt = formatearFechaBarras(fechaMostrar);
  const horaTxt = (lastReceivedUpdateInfo && lastReceivedUpdateInfo.horaTexto)
    ? lastReceivedUpdateInfo.horaTexto
    : formatearHoraCorta(new Date());
  const pillText = `${fechaTxt}   •   Actualizado ${horaTxt}`;
  dibujarTarjetaCanvas(ctx, 220, 196, 640, 56, 28);
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(pillText, W / 2, 232);

  // Calcular tendencia previa
  const fechasOrdenadas = Object.keys(historialCompleto).sort((a, b) => b.localeCompare(a));
  const fechaPrevia = fechasOrdenadas.find(f => f < fechaMostrar);
  const prev = fechaPrevia ? historialCompleto[fechaPrevia] : null;
  const trendUsd = calcularTendenciaTexto(rates.USD_BCV, prev && (prev.USD || prev.USD_BCV));
  const trendEur = calcularTendenciaTexto(rates.EUR_BCV, prev && (prev.EUR || prev.EUR_BCV));
  const trendUsdt = calcularTendenciaTexto(rates.USDT_BINANCE, prev && (prev.USDT || prev.USDT_BINANCE));

  // Tarjeta 1: Dólar Oficial BCV
  const padX = 72;
  const cardW = W - padX * 2;
  dibujarTarjetaCanvas(ctx, padX, 292, cardW, 255, 28);

  // Watermark $
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = `700 185px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.04)";
  ctx.fillText("$", padX + cardW - 42, 480);
  ctx.restore();

  dibujarEmblemaDivisa(ctx, "usd", padX + 64, 345, 22);
  ctx.textAlign = "left";
  ctx.font = `600 32px ${FONT}`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Dólar Oficial BCV", padX + 104, 356);

  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.72)";
  ctx.fillText("Bs.", padX + 42, 448);
  ctx.font = `700 76px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(formatearNumero(rates.USD_BCV), padX + 112, 450);

  ctx.font = `600 27px ${FONT}`;
  ctx.fillStyle = trendUsd.color;
  ctx.fillText(trendUsd.texto, padX + 42, 505);

  // Tarjetas Duo: Euro Oficial y USDT Binance
  const duoGap = 28;
  const duoW = (cardW - duoGap) / 2;
  const duoY = 576;
  const duoH = 248;

  // Euro Oficial
  dibujarTarjetaCanvas(ctx, padX, duoY, duoW, duoH, 28);
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = `700 130px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.04)";
  ctx.fillText("€", padX + duoW - 28, duoY + 185);
  ctx.restore();

  dibujarEmblemaDivisa(ctx, "eur", padX + 52, duoY + 51, 18);
  ctx.textAlign = "left";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Euro Oficial", padX + 84, duoY + 60);

  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.72)";
  ctx.fillText("Bs.", padX + 34, duoY + 138);
  ctx.font = `700 56px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(formatearNumero(rates.EUR_BCV), padX + 86, duoY + 140);

  ctx.font = `400 21px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("Valor actual", padX + 34, duoY + 176);

  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = trendEur.color;
  ctx.fillText(trendEur.texto, padX + 34, duoY + 214);

  // USDT Binance
  const usdtX = padX + duoW + duoGap;
  dibujarTarjetaCanvas(ctx, usdtX, duoY, duoW, duoH, 28);
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = `700 130px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.04)";
  ctx.fillText("₮", usdtX + duoW - 28, duoY + 185);
  ctx.restore();

  dibujarEmblemaDivisa(ctx, "usdt", usdtX + 52, duoY + 51, 18);
  ctx.textAlign = "left";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("USDT Binance", usdtX + 84, duoY + 60);

  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.72)";
  ctx.fillText("Bs.", usdtX + 34, duoY + 138);
  ctx.font = `700 56px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(formatearNumero(rates.USDT_BINANCE), usdtX + 86, duoY + 140);

  ctx.font = `400 21px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("Promedio mercado P2P", usdtX + 34, duoY + 176);

  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = trendUsdt.color;
  ctx.fillText(trendUsdt.texto, usdtX + 34, duoY + 214);

  // Tarjeta Brecha Cambiaria
  const brechaY = 854;
  const brechaH = 310;
  dibujarTarjetaCanvas(ctx, padX, brechaY, cardW, brechaH, 28);

  ctx.save();
  ctx.textAlign = "right";
  ctx.font = `700 180px ${FONT}`;
  ctx.fillStyle = "rgba(241, 245, 249, 0.04)";
  ctx.fillText("%", padX + cardW - 38, brechaY + 215);
  ctx.restore();

  dibujarEmblemaDivisa(ctx, "brecha", padX + 64, brechaY + 64, 22);
  ctx.textAlign = "left";
  ctx.font = `600 32px ${FONT}`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Brecha Cambiaria", padX + 104, brechaY + 60);
  ctx.font = `400 22px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("BCV Oficial vs. Binance P2P", padX + 104, brechaY + 92);

  const usdVal = Number(rates.USD_BCV) || 0;
  const usdtVal = Number(rates.USDT_BINANCE) || 0;
  const diff = usdtVal - usdVal;
  const pct = usdVal > 0 ? (diff / usdVal) * 100 : 0;
  const pctTxt = `${pct >= 0 ? "+" : ""}${formatearNumero(pct)}%`;
  const diffTxt = `${diff >= 0 ? "+" : "-"}Bs. ${formatearNumero(Math.abs(diff))}`;

  ctx.font = `700 64px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(pctTxt, padX + 42, brechaY + 172);
  const pctWidth = ctx.measureText(pctTxt).width;

  // Píldora monto brecha
  const pillX = padX + 42 + pctWidth + 24;
  ctx.font = `600 32px ${FONT}`;
  const diffBadgeW = ctx.measureText(diffTxt).width + 44;
  ctx.save();
  dibujarRoundRect(ctx, pillX, brechaY + 124, diffBadgeW, 56, 28);
  ctx.fillStyle = "rgba(38, 52, 82, 0.85)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(130, 160, 210, 0.25)";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(diffTxt, pillX + 22, brechaY + 162);
  ctx.restore();

  ctx.font = `400 23px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Diferencia de ${diffTxt} por dólar respecto al oficial`, padX + 42, brechaY + 216);

  // Barra degradada verde-amarillo-rojo
  const barX = padX + 42;
  const barY = brechaY + 236;
  const barW = cardW - 84;
  const barH = 12;
  dibujarRoundRect(ctx, barX, barY, barW, barH, 6);
  ctx.fillStyle = "rgba(71, 85, 105, 0.35)";
  ctx.fill();

  const fillRatio = Math.min(Math.max(pct / 25, 0.04), 1);
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barGrad.addColorStop(0, "#10b981");
  barGrad.addColorStop(0.5, "#f59e0b");
  barGrad.addColorStop(1, "#ef4444");
  dibujarRoundRect(ctx, barX, barY, barW * fillRatio, barH, 6);
  ctx.fillStyle = barGrad;
  ctx.fill();

  const descPie = pct > 0
    ? `Mercado P2P cotiza ${formatearNumero(pct)}% por encima del oficial`
    : (pct < 0 ? `Mercado P2P cotiza ${formatearNumero(Math.abs(pct))}% por debajo del oficial` : "Mercado P2P y BCV cotizan exactamente a la par");
  ctx.font = `400 23px ${FONT}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(descPie, padX + 42, brechaY + 282);

  // Footer
  ctx.textAlign = "center";
  ctx.font = `500 23px ${FONT}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("TasaVenezuela  •  darwindiaz328-ai.github.io/TasaVenezuela", W / 2, 1265);

  return canvas;
}

function canvasABlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

function configurarCompartir() {
  const btnShare = document.getElementById("btn-share");
  if (!btnShare) return;

  btnShare.addEventListener("click", async () => {
    const resumen = construirResumenCompartir();
    const fechaTxt = formatearFechaDMA(fechaActualActiva || fechaHoyPorDefecto || getHoyVenezuelaISO());
    const nombreArchivo = `TasaVenezuela-${fechaTxt}.png`;

    try {
      const canvas = generarImagenResumenCanvas();
      const blob = await canvasABlob(canvas);

      if (blob && navigator.canShare) {
        const file = new File([blob], nombreArchivo, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "TasaVenezuela",
              text: resumen,
              files: [file]
            });
            return;
          } catch (err) {
            if (err && err.name === "AbortError") return;
          }
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: "TasaVenezuela",
            text: resumen
          });
          return;
        } catch (err) {
          if (err && err.name === "AbortError") return;
        }
      }

      // Fallback escritorio: descargar PNG + copiar resumen en texto
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
      copiarAlPortapapeles(resumen, "¡Imagen descargada y resumen copiado!", btnShare);
    } catch (err) {
      console.warn("Error generando imagen para compartir:", err);
      copiarAlPortapapeles(resumen, "¡Resumen de tasas copiado!", btnShare);
    }
  });
}

function configurarGraficoHistorico() {
  const modal = document.getElementById("history-chart-modal");
  const backdrop = document.getElementById("chart-modal-backdrop");
  const btnClose = document.getElementById("chart-modal-close");
  const elTitle = document.getElementById("chart-modal-title");
  const elSubtitle = document.getElementById("chart-modal-subtitle");
  const canvas = document.getElementById("history-chart-canvas");
  const elMin = document.getElementById("chart-stat-min");
  const elAvg = document.getElementById("chart-stat-avg");
  const elMax = document.getElementById("chart-stat-max");
  const rangeButtons = document.querySelectorAll(".chart-range-btn[data-range]");

  if (!modal || !canvas) return;

  const seriesConfig = {
    "card-dolar": {
      title: "Evolución Dólar Oficial BCV",
      color: "#22c55e",
      prefix: "Bs. ",
      suffix: "",
      extract: (d) => Number(d.USD || d.USD_BCV || 0)
    },
    "card-euro": {
      title: "Evolución Euro Oficial",
      color: "#3b82f6",
      prefix: "Bs. ",
      suffix: "",
      extract: (d) => Number(d.EUR || d.EUR_BCV || 0)
    },
    "card-binance": {
      title: "Evolución USDT Binance P2P",
      color: "#f59e0b",
      prefix: "Bs. ",
      suffix: "",
      extract: (d) => Number(d.USDT || d.USDT_BINANCE || 0)
    },
    "card-brecha": {
      title: "Evolución Brecha Cambiaria",
      color: "#fbbf24",
      prefix: "",
      suffix: "%",
      extract: (d) => {
        const u = Number(d.USD || d.USD_BCV || 0);
        const p = Number(d.USDT || d.USDT_BINANCE || 0);
        return (u > 0 && p > 0) ? ((p - u) / u) * 100 : null;
      }
    }
  };

  let activeCardId = "card-dolar";
  let activeRange = 7;

  function obtenerSerie(cardId, days) {
    const cfg = seriesConfig[cardId];
    if (!cfg) return [];
    const fechaLimite = fechaActualActiva || fechaHoyPorDefecto || "9999-12-31";
    const fechas = Object.keys(historialCompleto)
      .filter((f) => f <= fechaLimite)
      .sort((a, b) => a.localeCompare(b));

    const slice = fechas.slice(-days);
    return slice
      .map((f) => ({ fecha: f, valor: cfg.extract(historialCompleto[f]) }))
      .filter((item) => item.valor !== null && isFinite(item.valor) && item.valor !== 0);
  }

  function renderizarGrafico() {
    const cfg = seriesConfig[activeCardId];
    if (!cfg) return;

    const puntos = obtenerSerie(activeCardId, activeRange);
    if (elTitle) elTitle.textContent = cfg.title;
    if (elSubtitle) elSubtitle.textContent = `Últimos ${puntos.length} días registrados`;

    const valores = puntos.map((p) => p.valor);
    if (valores.length > 0) {
      const minV = Math.min(...valores);
      const maxV = Math.max(...valores);
      const avgV = valores.reduce((a, b) => a + b, 0) / valores.length;
      if (elMin) elMin.textContent = `${cfg.prefix}${formatearNumero(minV)}${cfg.suffix}`;
      if (elAvg) elAvg.textContent = `${cfg.prefix}${formatearNumero(avgV)}${cfg.suffix}`;
      if (elMax) elMax.textContent = `${cfg.prefix}${formatearNumero(maxV)}${cfg.suffix}`;
    } else {
      if (elMin) elMin.textContent = "--";
      if (elAvg) elAvg.textContent = "--";
      if (elMax) elMax.textContent = "--";
    }

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 360;
    const cssHeight = canvas.clientHeight || 170;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const esClaro = document.documentElement.getAttribute("data-theme") === "light";
    const labelColor = esClaro ? "#475569" : "#94a3b8";
    const gridColor = esClaro ? "rgba(15, 23, 42, 0.1)" : "rgba(148, 163, 184, 0.14)";
    const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

    if (puntos.length < 2) {
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = labelColor;
      ctx.textAlign = "center";
      ctx.fillText("Datos históricos insuficientes para graficar", cssWidth / 2, cssHeight / 2);
      return;
    }

    const padLeft = 58;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 26;
    const plotW = cssWidth - padLeft - padRight;
    const plotH = cssHeight - padTop - padBottom;

    const minV = Math.min(...valores);
    const maxV = Math.max(...valores);
    const span = maxV - minV || Math.max(Math.abs(maxV) * 0.02, 1);
    const yMin = minV - span * 0.12;
    const yMax = maxV + span * 0.12;

    const getX = (idx) => padLeft + (idx / (puntos.length - 1)) * plotW;
    const getY = (val) => padTop + (1 - (val - yMin) / (yMax - yMin)) * plotH;

    // Líneas guía horizontales y etiquetas del eje Y
    ctx.font = `500 10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let step = 0; step <= 2; step++) {
      const ratio = step / 2;
      const yVal = yMin + (yMax - yMin) * (1 - ratio);
      const yPos = padTop + ratio * plotH;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(cssWidth - padRight, yPos);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = labelColor;
      const lbl = cfg.suffix === "%" ? `${formatearNumero(yVal)}%` : formatearNumero(yVal);
      ctx.fillText(lbl, padLeft - 7, yPos);
    }

    // Área bajo la curva
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    areaGrad.addColorStop(0, `${cfg.color}44`);
    areaGrad.addColorStop(1, `${cfg.color}00`);

    ctx.beginPath();
    puntos.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.valor);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(puntos.length - 1), padTop + plotH);
    ctx.lineTo(getX(0), padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Línea principal
    ctx.beginPath();
    puntos.forEach((p, idx) => {
      const x = getX(idx);
      const y = getY(p.valor);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Puntos visibles (todos si <= 10 días, o extremos y último punto si 30 días)
    puntos.forEach((p, idx) => {
      if (puntos.length <= 10 || idx === 0 || idx === puntos.length - 1) {
        const x = getX(idx);
        const y = getY(p.valor);
        ctx.beginPath();
        ctx.arc(x, y, idx === puntos.length - 1 ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === puntos.length - 1 ? "#ffffff" : cfg.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = cfg.color;
        ctx.stroke();
      }
    });

    // Etiquetas de fechas en el eje X (inicio, medio, fin)
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = labelColor;
    ctx.textBaseline = "bottom";
    const fmtCorta = (f) => {
      const partes = f.split("-");
      return partes.length === 3 ? `${partes[2]}/${partes[1]}` : f;
    };

    ctx.textAlign = "left";
    ctx.fillText(fmtCorta(puntos[0].fecha), padLeft, cssHeight - 2);

    if (puntos.length >= 3) {
      const midIdx = Math.floor((puntos.length - 1) / 2);
      ctx.textAlign = "center";
      ctx.fillText(fmtCorta(puntos[midIdx].fecha), getX(midIdx), cssHeight - 2);
    }

    ctx.textAlign = "right";
    ctx.fillText(fmtCorta(puntos[puntos.length - 1].fecha), cssWidth - padRight, cssHeight - 2);
  }

  function abrirModalGrafico(cardId) {
    activeCardId = cardId;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(renderizarGrafico);
  }

  function cerrarModalGrafico() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  Object.keys(seriesConfig).forEach((cardId) => {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-copy-rate")) return;
      abrirModalGrafico(cardId);
    });
  });

  document.querySelectorAll(".btn-chart-pill[data-chart-card]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cardId = btn.getAttribute("data-chart-card");
      if (cardId) abrirModalGrafico(cardId);
    });
  });

  rangeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const rango = parseInt(btn.getAttribute("data-range"), 10);
      if (!rango) return;
      activeRange = rango;
      rangeButtons.forEach((b) => b.classList.toggle("active", b === btn));
      renderizarGrafico();
    });
  });

  if (btnClose) btnClose.addEventListener("click", cerrarModalGrafico);
  if (backdrop) backdrop.addEventListener("click", cerrarModalGrafico);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      cerrarModalGrafico();
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

function configurarPWA() {
  // 1. Registro del Service Worker sin caché HTTP y recarga automática al actualizar versión
  if ('serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
        reg.update();
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

/* ===================================================
   ANIMATED SPLASH SCREEN (Efecto Bandera Ondeante 60FPS)
   =================================================== */
function iniciarSplashScreen() {
  const splashEl = document.getElementById("app-splash-screen");
  if (!splashEl) return;

  const canvas = document.getElementById("splash-canvas");
  const fallbackImg = document.getElementById("splash-fallback-img");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    if (fallbackImg) fallbackImg.style.display = "block";
    cerrarSplashConAnimacion(splashEl, 1450);
    return;
  }

  // Cargar imagen oficial de la bandera en alta resolución
  const img = new Image();
  img.src = "./icons/icon-512x512.png";

  let animFrameId = null;
  let animStartTime = null;
  const DURATION_MS = 1450; // Duración óptima (1.45s) entre 1.2s y 1.8s
  const SLICES = 64; // Tiras verticales para máxima fidelidad
  let cerrada = false;

  function renderWave(now) {
    if (!animStartTime) animStartTime = now;
    const elapsed = (now - animStartTime) / 1000;
    const progress = Math.min(1, (now - animStartTime) / DURATION_MS);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img.complete && img.naturalWidth > 0) {
      const w = canvas.width;
      const h = canvas.height;
      const sliceWidth = w / SLICES;
      const srcSliceWidth = img.naturalWidth / SLICES;

      // Amplitud progresiva: inicia suave y ondula con realismo
      const waveAmplitude = Math.min(1, elapsed * 3.5) * 12.5;
      const waveFreq = 3.6;
      const waveSpeed = 6.2;

      ctx.save();
      // Recorte Squircle idéntico al icono de la aplicación
      dibujarRoundRect(ctx, 0, 0, w, h, 96);
      ctx.clip();

      for (let i = 0; i < SLICES; i++) {
        const u = i / SLICES;
        // Armónicos combinados para simular lienzo de seda al viento
        const wave1 = Math.sin(u * Math.PI * waveFreq - elapsed * waveSpeed);
        const wave2 = Math.cos(u * Math.PI * 2.1 - elapsed * (waveSpeed * 0.65)) * 0.35;
        const totalWave = (wave1 + wave2) * waveAmplitude;

        const sx = i * srcSliceWidth;
        const sy = 0;
        const sw = srcSliceWidth + 0.5; // Solapamiento sutil para evitar líneas invisibles
        const sh = img.naturalHeight;

        const dx = i * sliceWidth;
        const dy = totalWave;
        const dw = sliceWidth + 0.5;
        const dh = h;

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

        // Iluminación tridimensional reactiva al ángulo de la onda
        const slope = Math.cos(u * Math.PI * waveFreq - elapsed * waveSpeed);
        if (slope > 0.12) {
          // Cresta iluminada por el sol
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.22, slope * 0.22)})`;
          ctx.fillRect(dx, 0, dw, h);
        } else if (slope < -0.12) {
          // Valle sombreado del pliegue
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.32, -slope * 0.32)})`;
          ctx.fillRect(dx, 0, dw, h);
        }
      }
      ctx.restore();
    } else {
      // Si la imagen aún no termina de cargar, mostrar fallback
      if (fallbackImg) fallbackImg.style.display = "block";
    }

    if (!cerrada) {
      animFrameId = requestAnimationFrame(renderWave);
    }
  }

  function finalizarSplash() {
    if (cerrada) return;
    cerrada = true;
    splashEl.classList.add("splash-hidden");
    setTimeout(() => {
      splashEl.style.display = "none";
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }, 400);
  }

  // Permitir al usuario saltar la animación con un toque
  splashEl.addEventListener("click", finalizarSplash, { once: true });
  splashEl.addEventListener("touchstart", finalizarSplash, { passive: true, once: true });

  img.onload = () => {
    if (fallbackImg) fallbackImg.style.display = "none";
    if (!animFrameId && !cerrada) {
      animFrameId = requestAnimationFrame(renderWave);
    }
  };

  if (img.complete && img.naturalWidth > 0) {
    animFrameId = requestAnimationFrame(renderWave);
  }

  // Programar desvanecimiento automático suave en el intervalo solicitado (1.45s)
  setTimeout(finalizarSplash, DURATION_MS);
}

function cerrarSplashConAnimacion(splashEl, delayMs) {
  setTimeout(() => {
    splashEl.classList.add("splash-hidden");
    setTimeout(() => {
      splashEl.style.display = "none";
    }, 400);
  }, delayMs);
}

function dibujarRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
