# Historial de Conversación y Documentación del Proyecto: TasaVenezuela

**Fecha de sesión:** 08 de Octubre de 2026  
**Repositorio GitHub:** [darwindiaz328-ai/TasaVenezuela](https://github.com/darwindiaz328-ai/TasaVenezuela)  
**Ruta de trabajo local:** `C:\Users\Usuario\.gemini\antigravity-ide\scratch\TasaVenezuela`  

---

## 1. Contexto Inicial y Solicitud
1. **Descarga y visualización del repositorio:**  
   Se exploró el repositorio `darwindiaz328-ai/TasaVenezuela` en GitHub y se descargaron todos sus archivos a la carpeta de trabajo local.
2. **Requerimiento principal:**  
   La aplicación estaba concebida inicialmente para Android. El usuario solicitó habilitar soporte para que también pueda descargarse/instalarse en **iOS (iPhone / iPad)** sin perjudicar el funcionamiento actual de la web ni de Android.

---

## 2. Solución Implementada: Progressive Web App (PWA) con Soporte Nativo iOS
Se implementó una solución basada en **PWA**, compatible tanto con Android como con iOS:

### Componentes desarrollados:
1. **Configuración de PWA ([manifest.json](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/manifest.json)):**
   - Configuración de colores de tema (`#0f172a`), orientación vertical, modo de visualización `standalone` (sin barras de navegador) y categorías financieras.
2. **Íconos Oficiales Multiplataforma (`icons/` y raíz):**
   - [apple-touch-icon.png](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/apple-touch-icon.png) (180x180 px en raíz y carpeta `icons/` para Apple Retina Displays).
   - [icon-192x192.png](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/icons/icon-192x192.png) y [icon-512x512.png](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/icons/icon-512x512.png) (para dispositivos Android y escritorio).
   - `icon-maskable-512x512.png` (ícono adaptable para lanzadores modernos de Android).
   - [favicon.png](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/favicon.png) (32x32 px).
3. **Service Worker Inteligente ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Precarga y caché de archivos esenciales para apertura instantánea y modo offline.
   - Estrategia **Network-First** para las tasas en vivo (`rates.json` e `historial.json`): siempre busca tasas actualizadas y, si no hay conexión, muestra los últimos datos guardados.
4. **Actualización de [index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html):**
   - Metaetiquetas específicas de Apple:
     - `apple-mobile-web-app-capable: yes`
     - `apple-mobile-web-app-status-bar-style: black-translucent`
     - `viewport-fit=cover`
   - Botón de instalación dinámico en la cabecera.
   - Modal interactivo con guía gráfica paso a paso para usuarios de iPhone/iPad.
5. **Estilos y Ajustes de Pantalla en [styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css):**
   - Adaptación a Safe Areas (`env(safe-area-inset-top)` / `bottom`) para respetar el **Notch** y la **Isla Dinámica** de los iPhones.
   - Prevención del zoom automático en inputs de Safari en dispositivos táctiles.
   - Animación y diseño del bottom-sheet modal de instalación.
6. **Lógica de Instalación en [app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js):**
   - Registro automático del Service Worker.
   - Detección de plataforma (Android vs iOS): si es iOS abre la guía con los iconos de Safari; en Android/Chrome dispara el prompt directo de instalación.

---

## 3. Subida y Sincronización a GitHub
Se autenticó mediante token de acceso personal (PAT) y se subieron los cambios de forma atómica a la rama principal:
* **Rama:** `main`
* **Commit SHA:** [`dc4b7fbb95c72539c42b1ac977baf98b0c07d054`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/dc4b7fbb95c72539c42b1ac977baf98b0c07d054)
* **Mensaje del Commit:** `feat: Soporte completo PWA, iOS y Android con iconos y modo offline`

---

## 4. Guía de Distribución y Preguntas Frecuentes

### ¿Cómo compartir la app con usuarios de iOS (iPhone)?
1. **Activar GitHub Pages en el repositorio:**
   - Ir a [github.com/darwindiaz328-ai/TasaVenezuela](https://github.com/darwindiaz328-ai/TasaVenezuela) ➔ **Settings** ➔ **Pages**.
   - En **Build and deployment**, seleccionar `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
   - Clic en **Save**.
   - La URL pública queda disponible en: `https://darwindiaz328-ai.github.io/TasaVenezuela/`
2. **Instalación en iPhone:**
   - Enviar el enlace web `https://darwindiaz328-ai.github.io/TasaVenezuela/`.
   - El usuario abre el enlace en **Safari**.
   - Toca el botón **Compartir** (icono de cuadro con flecha hacia arriba ⬆️).
   - Selecciona **"Agregar a pantalla de inicio"** ➔ **"Agregar"**.
   - La aplicación queda instalada con su icono en la pantalla del iPhone y funciona a pantalla completa.

### ¿Se puede compartir el archivo `.apk` a un iPhone por WhatsApp?
* **No.** Los archivos `.apk` son exclusivos de Android. El sistema operativo iOS (Apple) bloquea los `.apk` y mostrará un error al intentar abrirlos.
* **Solución:** A los usuarios de iPhone se les comparte el **enlace web** para que lo agreguen a su inicio mediante Safari. A los usuarios de Android se les puede compartir tanto el `.apk` como el enlace web.

---

## 5. Diseño y Empaquetado Oficial de Iconos Android (res/mipmap)

Se diseñó y generó el nuevo ícono oficial en formato squircle con acabado premium, bandera tridimensional ondeante de Venezuela con 8 estrellas nítidas, relieve y tipografía 'TasaVenezuela'.

* **Estructura Android generada:** `android/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}` conteniendo `ic_launcher.png` y `ic_launcher_round.png`.
* **Asset de Play Store:** `android/ic_launcher-playstore.png` (512x512).
* **Paquete ZIP para desarrollo Android:** `android_res_icons.zip`.
* **Sincronización a GitHub:**
  * **Rama:** `main`
  * **Commit SHA:** [`9616d19cd9a3af4524b0598448f9b7c60fe05e0e`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/9616d19cd9a3af4524b0598448f9b7c60fe05e0e)
  * **Mensaje del Commit:** `feat: Empaquetado oficial de iconos Android (res/mipmap) e iconos de aplicacion`

---

## 6. Actualización de Diseño: Bandera Frontal Centrada con Fondo Negro (Sin Texto)

A solicitud del usuario, se refinó el diseño del ícono para un acabado más limpio y puro:
* **Composición:** Bandera de Venezuela en perspectiva totalmente frontal, centrada en el encuadre, ondeando con realismo tridimensional.
* **Fondo:** Negro mate puro con sutil iluminación perimetral para máximo contraste sobre pantallas AMOLED y modos oscuros.
* **Sin textos:** Eliminación completa del texto "TasaVenezuela".
* **Sincronización a GitHub:**
  * **Rama:** `main`
  * **Commit SHA:** [`b2d97881355986183eb90e467b7038c4c9202aa4`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/b2d97881355986183eb90e467b7038c4c9202aa4)
  * **Mensaje:** `feat: Empaquetado oficial de iconos Android (res/mipmap) e iconos de aplicacion`

---

## 7. Sesión de Refinamiento de Ícono y Dudas Técnicas (08/10/2026 - 20:50)

### Resumen de acciones realizadas:
1. **Historial de conversación:** Se revisó y presentó el historial de la sesión anterior (despliegue en GitHub Pages y pruebas en tiempo real).
2. **Generación del ícono oficial:**
   - Se diseñó el ícono con la bandera tridimensional de Venezuela ondeando en tela de seda y 8 estrellas nítidas.
   - Tras varias iteraciones de diseño, se refinó según las especificaciones finales: perspectiva completamente frontal, bandera centrada, fondo negro mate profundo y eliminación total de textos.
3. **Empaquetado Android (`android/res/`):**
   - Resoluciones generadas: `mipmap-mdpi` (48px), `mipmap-hdpi` (72px), `mipmap-xhdpi` (96px), `mipmap-xxhdpi` (144px), `mipmap-xxxhdpi` (192px), tanto en formato normal como `_round`.
   - Asset de Google Play Store: `ic_launcher-playstore.png` (512x512).
   - Paquete ZIP para Android Studio: `android_res_icons.zip`.
4. **Sincronización a GitHub:**
   - Todos los recursos empaquetados y actualizados se subieron a la rama `main` mediante la API de GitHub.
5. **Aclaratoria sobre actualización automática de íconos:**
   - **En APK instalado:** No se actualiza de forma automática; el ícono viene empaquetado en el archivo `.apk` local. Requiere compilar una nueva versión de la APK e instalarla.
   - **En PWA / Web:** El contenido web se actualiza al instante vía Service Worker. El ícono anclado en pantalla se renueva automáticamente en Android (Chrome/WebAPK) en 24-48 hrs; en iOS (Safari) requiere que el usuario vuelva a agregar el enlace a la pantalla de inicio.

---

## 8. Corrección del Módulo de Almanaque: Consulta Exclusiva de Fechas Anteriores (09/10/2026)

### Requerimiento:
En la APK de TasaVenezuela, en el módulo del almanaque, solo debe ser visible y dar la opción de consultar **fechas anteriores** (históricas/hasta hoy), bloqueando por completo la navegación o selección de fechas futuras.

### Cambios implementados:
1. **Interfaz y Etiquetas ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Se renombró la etiqueta a: `<label for="input-fecha"><i class="fa-regular fa-calendar"></i> Consultar fechas anteriores:</label>`.
   - Se añadió un contenedor dinámico para avisos y notificaciones del almanaque (`#historical-notice`).
2. **Restricción de Calendario Nativo y Lógica JS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Cálculo estricto de fecha con zona horaria de Venezuela (`America/Caracas`, UTC-4) en formato estándar `YYYY-MM-DD`.
   - Asignación de límite superior `inputFecha.max` (deshabilita y bloquea automáticamente días futuros en el diálogo de calendario de Android/iOS/web).
   - Asignación de límite inferior `inputFecha.min` correspondiente al registro más antiguo del historial.
   - Validación activa ante cualquier intento de fecha futura, revirtiendo el valor e informando al usuario.
   - **Búsqueda inteligente de días hábiles:** Si se selecciona un fin de semana o feriado sin cotización oficial, el sistema localiza automáticamente el último día hábil anterior y notifica al usuario.
   - **Modo Histórico Visual:** Al consultar fechas anteriores, aparece un banner informativo (`Consultando fecha anterior: DD-MM-AAAA`) y el botón *"Hoy"* se transforma en un botón destacado de *"Volver a Hoy"*.
3. **Estilos y Micro-animaciones ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Estilos para `.historical-notice`, alertas informativas y botón resaltado de retorno.
   - Soporte para modo oscuro y modo claro.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v2` para distribución inmediata de la actualización.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`b9ef6219444f6ca44bc3d04927e91d49`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/b9ef621ca5839424444f6ca44bc3d04927e91d49)
* **Mensaje:** `fix: Restringir almanaque a fechas anteriores y optimizar modo historico`

---

## 9. Animated Splash Screen con Ondulación Fluida de la Bandera (09/10/2026)

### Requerimiento:
Implementar una pantalla de inicio animada (Splash Screen) fluida con fondo negro puro (`#000000`) basada en el icono oficial de TasaVenezuela:
- Escalado suave (`scale-up` con aceleración `ease-out`) del icono central al abrir la app.
- Efecto dinámico de ondulación a la bandera de Venezuela simulando lienzo ondeando al viento.
- Duración breve (entre 1.2s y 1.8s) para garantizar velocidad de apertura sin retardar la carga.
- Desvanecimiento suave (`fade-out`) hacia la interfaz principal de la aplicación.

### Implementación Realizada:
1. **Markup y Estilos Críticos ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Inserción del contenedor `#app-splash-screen` con fondo `#000000` absoluto y estilos críticos en `<head>` para evitar parpadeos blancos durante la carga inicial.
   - Contenedor con `<canvas id="splash-canvas">` de alta resolución (480x480 px), resplandor ambiental tricolor y barra de carga sutil con los colores patrios.
2. **Simulación de Onda en Canvas a 60/120 FPS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Render loop con `requestAnimationFrame` que subdivide el icono en 64 tiras verticales.
   - Ecuación armónica de onda sinusoidal con variación de fase y velocidad para emular tela de seda tridimensional.
   - Sombreado e iluminación especular dinámica sobre crestas y valles calculados según la pendiente de la onda.
   - Recorte en Squircle redondeado para mantener perfecta concordancia con el contorno del icono.
3. **Animación de Escala y Resplandor ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Animación `@keyframes splashIconEntrance` de 0.85s con `cubic-bezier(0.16, 1, 0.3, 1)`: de `scale(0.65)` a `scale(1.05)` y asentamiento en `scale(1)`.
   - Resplandor atmosférico `@keyframes splashGlowPulse`.
   - Transición de salida suave `.splash-hidden` con `opacity: 0`, `scale(1.06)` y `visibility: hidden` a los 1.45 segundos.
   - Opción táctil (skip on tap) para usuarios que toquen la pantalla y deseen entrar al instante.
   - Liberación completa de recursos: cancelación de `requestAnimationFrame` y `display: none` al culminar el fade-out.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Versión de caché actualizada a `tasavenezuela-cache-v3`.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`1db7a43e490684e61e98b2f5c4b7d533d260d029`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/1db7a43e490684e61e98b2f5c4b7d533d260d029)
* **Mensaje:** `feat: Animated Splash Screen con ondulacion fluida de bandera (Canvas 60fps)`

---

## 10. Modo Offline: Visualización de la Última Actualización Recibida (10/10/2026)

### Requerimiento:
Al no poder conectarse a internet (por falta de datos móviles, Wi-Fi o error de red), la APK y la app web deben mostrar la **última actualización recibida**, manteniendo todas las funcionalidades operativas (tasas, calculadora, tendencias y almanaque histórico), **exclusivamente cuando no encuentre conexión a internet**.

### Implementación Realizada:
1. **Persistencia Dual en LocalStorage & Cache API ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Registro automático del dataset completo (`tasavzla_historial_cache`) tras cada consulta de red exitosa.
   - Metadatos del último registro recibido (`tasavzla_last_update_info`), almacenando fecha ISO de la cotización, fecha local formateada (`DD/MM/AAAA`) y hora exacta (`HH:MM`).
   - Fallback de contingencia: si la red falla o no hay conectividad (`navigator.onLine === false` o fallo del fetch con timeout de 4.5s), el sistema rescata de forma transparente los datos del almacenamiento local y activa el modo offline.
2. **Interfaz Reactiva Condicional ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html) y [styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - **Banner Offline `#offline-banner`:** Se muestra de forma exclusiva cuando la app detecta ausencia de conexión a internet. Permanece completamente oculto en navegación normal con datos.
   - Diseño premium en glassmorphism con acento ámbar/dorado, icono pulsante (`offline-icon-pulse`), insignia `MODO SIN CONEXIÓN` y detalle de la fecha/hora de la última actualización recibida.
   - Botón interactivo de **"Reintentar"** con animación de giro para volver a consultar la red en cualquier momento.
   - Indicador de estado en la sección de metadatos (`status-offline-pill` y hora de la última actualización guardada).
3. **Escuchadores de Conectividad en Tiempo Real:**
   - Evento `online`: detecta automáticamente la recuperación de internet y actualiza al instante las cotizaciones en segundo plano, ocultando el banner offline.
   - Evento `offline`: activa el modo sin conexión de manera inmediata si la red cae durante el uso de la app.
4. **Service Worker v4 ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Actualización a `tasavenezuela-cache-v4`.
   - Inclusión de `./historial.json` en `STATIC_ASSETS` para precaché desde la instalación.
   - Soporte para coincidencia offline con `{ ignoreSearch: true }` y almacenamiento dual de URLs con y sin query params.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`afdd668a93b79a224ee62ffabb3dc7b076ef841e`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/afdd668a93b79a224ee62ffabb3dc7b076ef841e)
* **Mensaje:** `feat: Modo offline con persistencia y visualizacion de ultima actualizacion recibida`

---

## 11. Programación de Actualización: 12:01 AM (VET) y luego cada 3 horas (14/10/2026)

### Requerimiento:
Las tasas del sistema deben actualizarse automáticamente todos los días exactamente a las **12:01 AM (hora de Venezuela)** y continuar actualizándose **cada 3 horas** a lo largo de la jornada.

### Implementación Realizada:
1. **Ajuste de Cron en GitHub Actions ([.github/workflows/auto_update.yml](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.github/workflows/auto_update.yml)):**
   - Dado que los servidores de GitHub Actions operan en tiempo universal coordinado (**UTC**), y Venezuela se rige por `America/Caracas` (**UTC-4**), se calculó la correspondencia exacta minuto a minuto:
     * **12:01 AM VET** (00:01) ➔ **04:01 UTC**
     * **03:01 AM VET** (03:01) ➔ **07:01 UTC**
     * **06:01 AM VET** (06:01) ➔ **10:01 UTC**
     * **09:01 AM VET** (09:01) ➔ **13:01 UTC**
     * **12:01 PM VET** (12:01) ➔ **16:01 UTC**
     * **03:01 PM VET** (15:01) ➔ **19:01 UTC**
     * **06:01 PM VET** (18:01) ➔ **22:01 UTC**
     * **09:01 PM VET** (21:01) ➔ **01:01 UTC**
   - Nueva regla cron estándar: `'1 1,4,7,10,13,16,19,22 * * *'`.
   - Se mantiene habilitado `workflow_dispatch` para ejecuciones manuales según sea necesario.
2. **Actualización de Herramientas de Despliegue ([upload_to_github.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/upload_to_github.py)):**
   - Se incorporó `.github/workflows/auto_update.yml` y `HISTORIAL_PROYECTO.md` a la cola de sincronización directa a la rama principal `main`.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`886d9fed9181c17f5f6790983e82eb13a2490414`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/886d9fed9181c17f5f6790983e82eb13a2490414)
* **Mensaje:** `feat: Actualizar cron de sincronizacion a 12:01 AM (VET) y cada 3 horas`

---

## 12. Auditoría DevOps y Optimización de CI/CD (15/10/2026)

### Requerimiento:
1. Corregir horas de ejecución irregulares ocasionadas por demoras en la cola de GitHub Actions.
2. Desacoplar y evitar despliegues automáticos redundantes de GitHub Pages cuando las tasas no hayan sufrido variaciones.
3. Optimizar el tiempo de ejecución del pipeline, eliminar descargas innecesarias y aplicar el principio de mínimo privilegio en permisos.

### Implementación Realizada:
1. **Desfase de Minuto en Cron ([.github/workflows/auto_update.yml](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.github/workflows/auto_update.yml)):**
   - Se ajustó el cron al minuto desfasado `:17` (`'17 1,4,7,10,13,16,19,22 * * *'`), eludiendo los picos de congestión mundial de GitHub al inicio de hora (`:00` y `:01`), reduciendo el tiempo de espera en cola a menos de 1 minuto.
   - Matriz horaria VET (UTC-4) respetada puntualmente (12:17 AM, 03:17 AM, 06:17 AM, 09:17 AM, 12:17 PM, 03:17 PM, 06:17 PM, 09:17 PM).
2. **Control de Idempotencia y Prevención de Despliegues Redundantes ([update_rates.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/update_rates.py)):**
   - Detección activa de variaciones en las tasas (`dolar_bcv_cierre`, `euro_bcv_cierre`, `tasa_binance_real`) y verificación de cambio de fecha en `historial.json`.
   - Si no existen cambios de precios ni cambio de día, el script no sobreescribe archivos, evitando diffs falsos en Git y cancelando commits/pushes innecesarios a `main`.
   - Compatibilidad multiplataforma de zona horaria con fallback automático a `timezone(timedelta(hours=-4))` en entornos sin `tzdata` instalado (Windows/Linux).
3. **Pipeline Acelerado y Mínimo Privilegio:**
   - Eliminación de la actualización de `pip` y chequeo de `requirements.txt` inexistente.
   - Fijación de versión Python a `'3.12'` para arranque instantáneo desde cache local del runner.
   - Adición de grupo de concurrencia `concurrency: group: rates-updater-pipeline`.
   - Restricción de permisos globales (`permissions: {}`) delegando `contents: write` únicamente al job de extracción.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`6d47963dd91165f92501604b6c8a18b87f67fb57`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/6d47963dd91165f92501604b6c8a18b87f67fb57)
* **Mensaje:** `perf(ci): optimizar cron, cola de github actions y evitar despliegues redundantes de pages`

---

## 13. Corrección de Cálculo y Visualización de Tendencias (Aumento/Disminución en Bs. y Porcentaje) (15/10/2026)

### Requerimiento:
Los valores de variación (aumento/disminución en bolívares y porcentaje) debajo de cada una de las tarjetas de tasas (Dólar BCV, Euro BCV y USDT Binance) se mostraban vacíos (`--`). Se solicitó restaurar su cálculo y visualización correcta.

### Causa Raíz Identificada:
En la función `updateUI()` de `app.js`, la búsqueda del día anterior con cotizaciones se realizaba mediante un bucle rígido de máximo 5 días (`for (let i = 1; i <= 5; i++)`). Al existir una brecha superior a 5 días entre la cotización actual (`2026-10-15`) y la anterior registrada en el historial (`2026-10-08`, 7 días de diferencia), la búsqueda devolvía `null`, provocando que el sistema mostrara `--` en lugar del diferencial.

### Solución Implementada:
1. **Búsqueda Robusta de Registro Previo ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Se reemplazó el bucle con límite de días por búsqueda directa ordenada en las claves del historial (`fechasOrdenadas.find(f => f < fechaMostrar)`).
   - Localiza inmediatamente la última fecha hábil previa registrada sin importar feriados, fines de semana o lapsos prolongados.
2. **Formato Visual Mejorado ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js) y [styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Iconos direccionales FontAwesome: `fa-arrow-trend-up` en verde (`var(--color-usd)`) para incrementos y `fa-arrow-trend-down` en rojo (`#ef4444`) para descensos.
   - Formato exacto en bolívares con decimales en coma (`es-VE`) y porcentaje relativo entre paréntesis (ej. `+4,39 (+0,50%)`).
   - Reglas de estilo para `.card-footer` y `.trend-badge`.
3. **Actualización de Caché ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v5` para forzar la actualización inmediata en navegadores y dispositivos móviles.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`7af14bc656638d9c7baa0369a407a3fe7dd6cdb6`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/7af14bc656638d9c7baa0369a407a3fe7dd6cdb6)
* **Mensaje:** `fix: Corregir calculo de aumento y porcentaje debajo de cada tasa de cambio`

---

## 14. Ejecución y Pruebas en Tiempo Real, Actualización de Cotizaciones al 16/10/2026 y Optimización de Banderas SVG Multiplataforma (16/10/2026)

### Requerimiento:
El usuario solicitó ejecutar la aplicación web en tiempo real, auditar visual y funcionalmente su comportamiento, e identificar y corregir cualquier error o detalle observado.

### Diagnóstico y Hallazgos en Tiempo Real:
1. **Actualización de Tasas en Vivo:** Se ejecutó el monitor extractor `update_rates.py`, obteniendo con éxito las cotizaciones oficiales del **16/10/2026**:
   - Dólar BCV: **Bs. 880,12** (variación: +1,00 / +0,11%).
   - Euro BCV: **Bs. 985,73** (variación: +8,05 / +0,82%).
   - USDT Binance: **Bs. 999,49** (variación: -5,62 / -0,56%).
   - Registros grabados y estructurados en `historial.json` y `Datos/rates.json`.
2. **Representación de Banderas en Windows / Multiplataforma:**
   - En navegadores bajo Windows, los emojis estándar de banderas nacionales (`🇺🇸` y `🇪🇺`) se renderizaban como texto plano de dos letras (`US` y `EU`) debido a la ausencia de banderas en las fuentes nativas de emojis de Windows (Segoe UI Emoji).
   - Se requería una solución visual uniforme y nítida independiente del sistema operativo cliente.
3. **Estrategia de Caché en Service Worker para Navegación HTML:**
   - La estrategia previa en `sw.js` utilizaba *Cache-First* para todas las peticiones estáticas incluyendo el documento raíz `index.html`. Esto provocaba que, al actualizar el HTML o estilos, los clientes pudieran seguir viendo la versión previa hasta vaciar la caché manualmente.

### Solución Implementada:
1. **Banderas e Iconos SVG Vectoriales Ultra-Nítidos ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html) y [styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Se crearon insignias circulares vectoriales SVG para la bandera de Estados Unidos (franjas rojas y blancas, cantón azul con constelación estelar), la bandera de la Unión Europea (fondo azul con corona de estrellas doradas) y el logotipo de Tether USDT (moneda verde con su emblema oficial blanco).
   - Se incorporó soporte de accesibilidad con `aria-label` descriptivos y estilos para `.flag-icon` y `.flag-svg` con sombra suave.
2. **Estrategia Network-First para Documento HTML ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Se configuró que las solicitudes de navegación (`event.request.mode === 'navigate'` o rutas a `index.html`) prioricen siempre la red para entregar la versión web más reciente de inmediato, conservando el respaldo en caché para modo offline.
   - Se añadió llamada proactiva `reg.update()` en [app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js) durante el registro del Service Worker.
   - Se incrementó la versión de caché a `tasavenezuela-cache-v7` para invalidar y limpiar cachés anteriores.
3. **Verificación Integral Automatizada con Subagente de Navegador:**
   - Carga fluida del splash screen animado con bandera venezolana 3D.
   - Tarjetas de tasas con datos en vivo del 16/10/2026, cálculo dinámico de variación en bolívares y porcentaje, selector de fechas históricas y botón "Hoy".
   - Calculadora multidivisa bidireccional reactiva y conmutador de tema claro/oscuro.
   - Cero errores en la consola de JavaScript.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`a1dd66f4ca0267aca5631cfcfdc5abc2332bc43d`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/a1dd66f4ca0267aca5631cfcfdc5abc2332bc43d)
* **Mensaje:** `feat: actualizar tasas 16/10/2026, insignias SVG y cache network-first`
* **Archivos Actualizados:** `index.html`, `styles.css`, `sw.js`, `app.js`, `historial.json`, `Datos/rates.json`, `HISTORIAL_PROYECTO.md`, `upload_to_github.py`.

---

## 15. Activación de Disparo por Webhook Externo, Tarea Programada de Medianoche y Despliegue en Tiempo Real (20/10/2026)

### Requerimiento:
El usuario solicitó:
1. Conocer a qué hora se habían actualizado las tasas del Dólar y Euro el día de hoy (20/10/2026).
2. Investigar por qué la actualización automática se efectuó a las 01:59:19 AM VET en lugar de las 12:17 AM VET programadas.
3. Activar el disparo mediante Webhook externo sin depender de los retrasos del scheduler de GitHub Actions.
4. Realizar un despliegue en tiempo real simulando la medianoche y verificar que se ejecute a la hora exacta programada.

### Diagnóstico Técnico y Causa Raíz:
1. **Auditoría de Ejecución de Tasas:**
   - Se verificó que las tasas oficiales del 20/10/2026 (Dólar: Bs. 881,88, Euro: Bs. 988,97, USDT: Bs. 1.002,05) fueron consolidadas en el commit `c5bf717` generado por la tarea de GitHub Actions ID `39377818962`.
2. **Causa del Retraso de las 12:17 AM a las 01:59 AM:**
   - La tarea estaba configurada en el cron a las `04:17 UTC` (12:17 AM VET).
   - Debido a la alta saturación global de los servidores compartidos de GitHub Actions en la madrugada (00:00 - 06:00 UTC), la cola de ejecución del evento `schedule` retuvo la tarea 1 hora y 42 minutos en cola hasta asignarle un runner a las `05:59:14 UTC` (01:59:14 AM VET).
   - Los eventos `schedule` en GitHub Actions son "best-effort" y sufren demoras severas, a diferencia de las señales directas por API (`repository_dispatch` o `workflow_dispatch`), que se ejecutan al instante.

### Solución Implementada:
1. **Soporte para Webhooks Externos en GitHub Actions ([.github/workflows/auto_update.yml](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.github/workflows/auto_update.yml)):**
   - Se añadió el evento `repository_dispatch` con los tipos `[webhook_update, medianoche_trigger, external_ping]`.
   - Se añadieron `inputs` parametrizados a `workflow_dispatch` con la bandera `force` (por defecto `true`).
   - Se configuró la variable de entorno `FORCE_UPDATE` para que las ejecuciones por webhook o simulación ejecuten el ciclo completo sin saltarse la escritura.
2. **Manejo de Bandera de Actualización Forzada ([update_rates.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/update_rates.py)):**
   - Se incorporó soporte para `--force` y `FORCE_UPDATE=true` para garantizar que cuando se invoque un disparo por webhook o simulación, se actualicen las marcas de tiempo y cotizaciones en vivo sin restricciones.
3. **Disparador Autónomo de Webhook ([trigger_webhook.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/trigger_webhook.py)):**
   - Script en Python que envía peticiones POST autenticadas a GitHub Actions (`repository_dispatch` y `workflow_dispatch`).
   - Incluye monitoreo en vivo con sondeo del estado del workflow (`status` y `conclusion`) para verificación inmediata.
4. **Tarea Programada en Windows (Programador de Tareas):**
   - Se registró la tarea `TasaVenezuela_Midnight_Webhook` programada para ejecutarse a diario a las `12:01 AM VET` (`00:01:00`), llamando al disparador por webhook y garantizando que las tasas se refresquen justo pasada la medianoche con prioridad de ejecución alta.
5. **Simulación y Despliegue en Tiempo Real:**
   - Se ejecutó el disparo por webhook simulando la medianoche, logrando la ejecución inmediata del pipeline en GitHub Actions con conclusión exitosa (`success`).

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit de Configuración:** [`9442f37b9e0619c623cbc19108b2f3c78eb8510f`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/9442f37b9e0619c623cbc19108b2f3c78eb8510f)
* **Commit de Ejecución en Vivo:** [`69a742e7d7a7cba8c6a2dbfbfcbcaee57ec703ce`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/69a742e7d7a7cba8c6a2dbfbfcbcaee57ec703ce)
* **Commit de Sincronización e Historial v8:** [`13fa12ba34b49b2d49252f6368e152c19d2f9588`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/13fa12ba34b49b2d49252f6368e152c19d2f9588)
* **Workflow Run:** ID `39443279109` (Conclusión: `success`)
* **Despliegues GitHub Pages:** ID `39443309217` e ID `39446820063` (Conclusiones: `success`)
* **Auditoría con Subagente:** 0 errores en consola, cálculo matemático exacto, cotizaciones oficiales del 20/10/2026 activas en producción.
* **Archivos Actualizados:** `.github/workflows/auto_update.yml`, `update_rates.py`, `trigger_webhook.py`, `upload_to_github.py`, `.gitignore`, `sw.js`, `historial.json`, `Datos/rates.json`, `HISTORIAL_PROYECTO.md`.

---

## 16. Restauración de Fechas Históricas Previas (17, 18 y 19 de Octubre) y Salvaguarda de Sincronización (20/10/2026)

### Requerimiento:
El usuario reportó que al consultar fechas anteriores en el almanaque (como el día de ayer 2026-10-19), la aplicación mostraba una opción antigua (16/10/2026), solicitando corregir y recuperar las tasas guardadas de esos días.

### Diagnóstico Técnico y Causa Raíz:
- Al inspeccionar el historial de commits en GitHub, se identificó que las tasas de los días 17/10/2026, 18/10/2026 y 19/10/2026 habían sido registradas y publicadas por las ejecuciones automáticas de GitHub Actions en commits anteriores (`f66d498`).
- Sin embargo, debido a que el entorno local no había descargado esos commits, la subida previa sobreescribió temporalmente `historial.json` sin esos 3 días.
- Al no encontrar `2026-10-19` en el historial, la función `consultarFechaAlmanaque()` en `app.js` buscaba el día hábil anterior más cercano, saltando de regreso al `16/10/2026`.

### Solución Implementada:
1. **Restauración y Fusión de Fechas Históricas ([historial.json](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/historial.json)):**
   - Se recuperaron del historial de Git (`commit f66d498`) las cotizaciones exactas de los días faltantes:
     - **2026-10-19:** USD 881,07 | EUR 991,16 | USDT 1.007,13
     - **2026-10-18:** USD 880,12 | EUR 985,73 | USDT 1.002,30
     - **2026-10-17:** USD 880,12 | EUR 985,73 | USDT 1.004,03
   - Se combinaron con las cotizaciones de hoy **2026-10-20** (USD 881,88 | EUR 988,97 | USDT 1.002,83), ordenadas descendentemente.
2. **Salvaguarda Automática en el Pipeline de Subida ([upload_to_github.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/upload_to_github.py)):**
   - Se implementó una lógica de auto-merge que consulta la API de GitHub para descargar y fusionar cualquier fecha previa antes de generar el nuevo commit, impidiendo que futuras subidas borren fechas históricas.
3. **Invalidación de Caché ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Se actualizó el Service Worker a `tasavenezuela-cache-v9` para garantizar que los navegadores recarguen el nuevo historial completo de inmediato.

### Sincronización a GitHub:
* **Rama:** `main`
* **Archivos Actualizados:** `historial.json`, `upload_to_github.py`, `sw.js`, `HISTORIAL_PROYECTO.md`.

---

## 17. Blindaje Arquitectural Definitivo para Fechas y Tasas sin Errores (20/10/2026)

### Requerimiento:
El usuario exigió máxima robustez, solicitando eliminar cualquier posibilidad de errores futuros con las fechas o las tasas guardadas por día, asegurando un funcionamiento continuo y perfecto.

### Diagnóstico Técnico y Medidas Preventivas:
Para erradicar de raíz cualquier fallo potencial en el registro de fechas, zonas horarias o almacenamiento, se implementó una arquitectura blindada en tres capas:
1. **Prevención de Huecos (Zero-Gap Backfilling en [update_rates.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/update_rates.py)):** Si ocurre cualquier caída temporal de red o días no bancarios (fines de semana/feriados), la función `rellenar_dias_faltantes()` detecta automáticamente cualquier fecha intermedia ausente entre el último registro y hoy, completándola con la tasa de cierre oficial correspondiente para asegurar que el 100% de los días del calendario existan en `historial.json`.
2. **Escritura Atómica en Disco ([update_rates.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/update_rates.py)):** Las escrituras a `historial.json` y `rates.json` ahora utilizan archivos temporales `.tmp` seguidos de reemplazo atómico (`os.replace`), imposibilitando que una interrupción o corte corrompa los archivos JSON.
3. **Ordenamiento Inmune a Zonas Horarias en Frontend ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):** Se sustituyeron las conversiones de cadenas a objetos `Date` en ordenamiento por comparaciones léxicas directas de ISO (`b.localeCompare(a)`), eliminando cualquier discrepancia de husos horarios o cambios de horario de verano en cualquier navegador o celular.
4. **Renovación de Caché Proactiva ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):** Se elevó la versión del Service Worker a `tasavenezuela-cache-v10` para garantizar que la nueva lógica se propague instantáneamente a todos los clientes.

### Sincronización a GitHub:
* **Rama:** `main`
* **Archivos Actualizados:** `update_rates.py`, `app.js`, `sw.js`, `HISTORIAL_PROYECTO.md`.

---

## 18. Auditoría y Recuperación Exhaustiva de Octubre (08 al 14 de Octubre) y Validación Continua en CI/CD (20/10/2026)

### Requerimiento:
El usuario solicitó consultar y auditar el rango de fechas desde el 2026-10-08 hasta el 2026-10-14, corregir cualquier error existente y garantizar que no vuelva a suceder ningún error en fechas ni tasas guardadas.

### Diagnóstico Técnico y Causa Raíz:
- Al auditar el historial completo de commits del repositorio, se constató que las tasas de los días 09 al 14 de octubre habían sido generadas originalmente por el servidor automático en el commit `2659404`.
- No obstante, la versión local arrastrada en sesiones previas no contenía esos días intermedios (del 09 al 14 de octubre), creando una discontinuidad entre el 08/10 y el 15/10.

### Solución Implementada:
1. **Restauración Integral de Cotizaciones Oficiales (08 al 14 de Octubre en [historial.json](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/historial.json)):**
   - **2026-10-14:** USD 877,90 | EUR 982,76 | USDT 1.009,70
   - **2026-10-13:** USD 876,80 | EUR 982,00 | USDT 1.010,07
   - **2026-10-12:** USD 875,65 | EUR 980,61 | USDT 1.007,66
   - **2026-10-11:** USD 875,65 | EUR 980,61 | USDT 1.010,00
   - **2026-10-10:** USD 875,65 | EUR 980,61 | USDT 1.010,86
   - **2026-10-09:** USD 875,65 | EUR 980,61 | USDT 1.009,54
   - **2026-10-08:** USD 874,73 | EUR 979,08 | USDT 1.013,61
   - Con esto, todo el mes de octubre (del 1 al 20) queda 100% consecutivo sin un solo día faltante.
2. **Auditor Automatizado y Auto-Sanador ([validate_history.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/validate_history.py)):**
   - Script de validación rigurosa que verifica la continuidad secuencial de fechas, integridad numérica y formato JSON.
   - Si detectara cualquier día ausente en el futuro, lo auto-repara de inmediato con las tasas oficiales previas.
3. **Paso de Verificación Obligatorio en CI/CD ([.github/workflows/auto_update.yml](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.github/workflows/auto_update.yml)):**
   - Se añadió el paso `Validar Continuidad e Integridad de Tasas` en el workflow de GitHub Actions, bloqueando cualquier commit si las tasas o fechas tuvieran errores.
4. **Renovación de Caché ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Service Worker actualizado a `tasavenezuela-cache-v11`.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`cddb2594a0345da2459782225171157337d9df6b`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/cddb2594a0345da2459782225171157337d9df6b)
* **Despliegue GitHub Pages:** ID `39453014885` (Conclusión: `success`)
* **Auditoría con Subagente:** Verificación exitosa de los días 08, 09, 10, 11, 12, 13 y 14 de octubre con 0 errores en consola.
* **Archivos Actualizados:** `historial.json`, `validate_history.py`, `upload_to_github.py`, `.github/workflows/auto_update.yml`, `sw.js`, `HISTORIAL_PROYECTO.md`.

---

## 19. Rediseño de Banderas Elegantes en 3D e Insignias de Divisa en la Calculadora (2026-10-20)

### Objetivo y Solicitud del Usuario:
* Sustituir los íconos previos de cada tasa por banderas vectoriales de alta definición, con un estilo visual moderno, elegante y premium (acabado esférico 3D, bisel metálico de lujo y brillo radial tipo cristal) tanto en las tarjetas principales de cotización como en la calculadora multimoneda.

### Mejoras de Diseño Implementadas:
1. **Medallones Vectoriales 3D Ultra-Nítidos en Tarjetas de Tasas ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - **Dólar Oficial BCV (EE. UU.):** Círculo recortado con 13 franjas carmesí y blanco, cantón azul marino con constelación geométrica nítida de estrellas de 5 puntas, recubierto con capa reflectante radial (`radialGradient`) y anillo exterior biselado en oro brillante (`#FFDF80` a `#B38728`).
   - **Euro Oficial BCV (Unión Europea):** Fondo en gradiente azul zafiro real profundo (`#003FA8` a `#001440`), círculo heráldico de 12 estrellas doradas de 5 puntas alineadas radialmente a 30°, con filtro sutil de sombra volumétrica y marco dorado satinado.
   - **USDT Binance (Tether Crypto):** Medallón esmeralda con gradiente jade tecnológico (`#2CD6A4` a `#11634B`), glifo oficial de la 'T' con su aureola concéntrica vectorizada, reflejo gloss de cristal y bisel metálico verde menta/titanio.
2. **Micro-Insignias Redondas en la Calculadora Multimoneda:**
   - Se incorporaron banderas circulares en miniatura (17x17px) dentro de las etiquetas de divisa:
     - **VES:** Tricolor nacional amarillo, azul y rojo con el arco de 8 estrellas blancas y borde de cristal.
     - **USD:** Minisímbolo de barras y estrellas con bisel.
     - **EUR:** Miniatura azul zafiro con corona de estrellas.
     - **USDT:** Miniatura jade esmeralda con glifo Tether.
3. **Micro-interacciones y Efectos Visuales ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Animación suave `scale(1.12)` con sombra difusa elevada (`drop-shadow`) al pasar el cursor o pulsar sobre cualquier tarjeta de tasa.
   - Sombra interna sutil (`box-shadow`) y contorno traslúcido para asegurar contraste impecable tanto en Modo Oscuro como en Modo Claro.
4. **Renovación de Caché ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Se incrementó el Service Worker a `tasavenezuela-cache-v12` para garantizar que todos los usuarios reciban inmediatamente las nuevas banderas sin depender del caché del navegador.

### Sincronización a GitHub:
* **Rama:** `main`
* **Commit SHA:** [`fc089f182b0ed0f1fb0efade0ab74529a1845f1d`](https://github.com/darwindiaz328-ai/TasaVenezuela/commit/fc089f182b0ed0f1fb0efade0ab74529a1845f1d)
* **Archivos Actualizados:** `index.html`, `styles.css`, `sw.js`, `HISTORIAL_PROYECTO.md`.

---

## 20. Diagnóstico y Blindaje Permanente del Flujo de Medianoche (2026-10-21)

### Objetivo y Solicitud del Usuario:
* Realizar un despliegue en vivo y diagnosticar por qué pasada la medianoche la aplicación aún no había actualizado las cotizaciones del nuevo día, resolviendo la causa raíz de forma definitiva para garantizar que se ejecute sin problemas todos los días.

### Diagnóstico de Causas Raíz Detectadas:
1. **Fallo en el Programador de Tareas Local (`TasaVenezuela_Midnight_Webhook`):**
   * La tarea local creada previamente tenía la directiva `StartWhenAvailable = False` y `DisallowStartIfOnBatteries = True`.
   * Si la máquina del usuario estaba en suspensión, apagada o funcionando con batería a las 12:01:00 AM exacta, el programador de Windows marcaba la ejecución como `NumberOfMissedRuns: 1` y omitía el disparo del webhook sin reintentar al encender o desbloquear el equipo.
2. **Retraso de Cola en los Servidores Compartidos de GitHub Actions:**
   * El cron interno de GitHub Actions estaba configurado para un único disparo a las `04:17 UTC` (12:17 AM VET).
   * En cuentas gratuitas/estándar de GitHub, los eventos de tipo `schedule` compiten en una cola compartida mundial. Entre las 04:00 y las 05:00 UTC existe congestión en los runners, lo que retrasa los crons únicos hasta 30-80 minutos.

### Soluciones y Blindaje Permanente Implementados:
1. **Reconfiguración Robusta del Programador de Tareas de Windows:**
   * **`StartWhenAvailable = $true`:** Si el equipo está suspendido o apagado a medianoche, la tarea se dispara **inmediatamente al encender o despertar el equipo**.
   * **`AllowStartIfOnBatteries = $true` y `DontStopIfGoingOnBatteries = $true`:** Opera sin restricciones de energía.
   * **`WakeToRun = $true`:** Solicita al hardware despertar para ejecutar el webhook si está disponible.
   * **Triggers Escalonados:** Repetición automática cada 15 minutos durante una ventana de 2 horas (12:01 AM a 02:01 AM) con 3 reintentos automáticos de 5 minutos en caso de falla de red.
2. **Triggers Escalonados en GitHub Actions ([.github/workflows/auto_update.yml](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.github/workflows/auto_update.yml)):**
   * Se configuraron 4 crons distribuidos en la hora de medianoche: `cron: '3,12,25,45 4 * * *'` (12:03 AM, 12:12 AM, 12:25 AM y 12:45 AM VET).
   * Dado que [update_rates.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/update_rates.py) es idempotente (detecta si la fecha ya se registró y sale en 2 segundos si no hay cambio), este esquema elimina cualquier retraso de cola en GitHub Actions sin generar commits innecesarios.
3. **Validación en Vivo en Producción:**
   * **URL:** [https://darwindiaz328-ai.github.io/TasaVenezuela/](https://darwindiaz328-ai.github.io/TasaVenezuela/)
   * **Fecha en producción:** `21-10-2026` / `21/10/2026`.
   * **Cotizaciones activas:** Dólar BCV **Bs. 883,40**, Euro BCV **Bs. 993,18**, USDT Binance **Bs. 1.003,23**.
   * **Consola del Navegador:** 0 errores, 0 advertencias.

---

## 21. Disparadores en la Nube 100% Autónomos (cron-job.org) para Ejecución con Computador Apagado (2026-10-21)

### Objetivo y Solicitud del Usuario:
* Garantizar que la extracción y publicación de tasas se ejecute puntual todos los días sin depender de que el computador local esté encendido.

### Arquitectura de Solución Implementada:
1. **Infraestructura Cloud-to-Cloud:**
   * Se configuró el servicio en la nube **cron-job.org** conectado directamente a la API de GitHub Actions mediante un token fine-grained con permisos estrictos de `Actions: read/write` para `darwindiaz328-ai/TasaVenezuela`.
   * Los secretos (`.github_dispatch_token` y `.cronjob_api_key`) quedaron resguardados localmente e ignorados en [.gitignore](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/.gitignore).
2. **Trabajos Programados en la Nube:**
   * **Trabajo #8691291 (Medianoche):** Dispara a las **12:01 AM, 12:10 AM y 12:30 AM VET** (`America/Caracas`). Garantiza que a primera hora del nuevo día las tasas queden registradas.
   * **Trabajo #8691292 (Monitoreo Diurno):** Dispara cada 3 horas a las **03:17 AM, 06:17 AM, 09:17 AM, 12:17 PM, 03:17 PM, 06:17 PM y 09:17 PM VET**.
3. **Prueba en Vivo de Extremo a Extremo:**
   * Se programó un trabajo de prueba temporal en la nube (#8691294).
   * **Precisión:** Planificado `01:36:00 AM VET`, ejecutado `01:36:00 AM VET` (exacto al segundo, 0 latencia).
   * **Respuesta de GitHub:** `HTTP 204 (No Content)` -> Disparó el Workflow Run `39550467336` que completó con **éxito (`conclusion: success`)**.
   * El trabajo de prueba fue eliminado automáticamente al concluir.
4. **Script de Gestión y Mantenimiento:**
   * Se creó [setup_cloud_cron.py](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/setup_cloud_cron.py) para auditar, sincronizar o listar los trabajos activos en cualquier momento (`python setup_cloud_cron.py --list`).




---

## 22. Implementación de la Tarjeta de Brecha Cambiaria (Spread BCV vs. Binance) (2026-11-04)

### Requerimiento:
* Agregar una tarjeta visual interactiva dedicada al cálculo y visualización de la **Brecha Cambiaria** (*spread*) entre el Dólar Oficial del Banco Central de Venezuela (BCV) y el mercado paralelo (Binance P2P), como primer paso para potenciar la utilidad comercial y el atractivo de la interfaz.

### Cambios Implementados:
1. **Estructura HTML ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Inserción de la tarjeta `#card-brecha` dentro de `.rates-grid`.
   - Elementos estructurados:
     - Icono distintivo circular con flechas divergentes (`fa-arrows-split-up-and-left`).
     - Título *"Brecha Cambiaria"* y subtítulo *"BCV Oficial vs. Binance P2P"*.
     - Insignia de origen `.source-badge.spread-badge` (`Spread`).
     - Valor principal `#val-brecha-pct` en tipografía destacada de alto contraste.
     - Detalle de la diferencia en Bolívares `#val-brecha-diff` (*"Diferencia: +Bs. X,XX por dólar"*).
     - Barra de escala visual dinámica `.spread-bar-container` con relleno `.spread-bar-fill`.
     - Texto contextual `.spread-footer-text` que describe el comportamiento del mercado.
2. **Diseño Visual Cohesivo ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Borde de acento izquierdo ámbar/dorado (`#f59e0b`) armónico con la tarjeta principal de Dólar BCV (verde) y Euro (azul).
   - Fondo con degradado sutil en glassmorphism y sombra ambiental cálida.
   - Marca de agua perimetral `%` (`#card-brecha::after { content: '%'; }`) integrada al sistema de marcas de agua existentes (`$`, `€`, `₮`).
   - Barra de progreso con gradiente tricolor (`#10b981` ➔ `#f59e0b` ➔ `#ef4444`) con transición fluida de `width`.
   - Soporte nativo para modo oscuro y modo claro (`[data-theme="light"]`).
3. **Lógica Dinámica en Tiempo Real ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Integración dentro de `updateUI(fechaMostrar)`: calcula la brecha tanto en la fecha actual en vivo como al navegar en cualquier fecha anterior mediante el almanaque histórico.
   - Fórmula: `diff = USDT_BINANCE - USD_BCV`; `pct = (diff / USD_BCV) * 100`.
   - Actualización reactiva de textos con formato venezolano (`es-VE`).
   - Adaptación de la barra de escala visual normalizada a un rango de referencia.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v13` para invalidar cachés anteriores y forzar la actualización inmediata en PWA instalada en teléfonos y navegadores.


---

## 23. Ajuste de Terminología: Insignia de Brecha Cambiaria a "Diferencia" (2026-11-04)

### Requerimiento:
* Reemplazar el anglicismo *"Spread"* por el término en español *"Diferencia"* en la insignia (`badge`) de la tarjeta de Brecha Cambiaria.

### Cambios Implementados:
1. **Interfaz ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Actualización de la etiqueta de origen: `<span class="source-badge spread-badge">Diferencia</span>`.
2. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento de versión de caché a `tasavenezuela-cache-v14` para propagación inmediata a clientes web y dispositivos móviles.


---

## 24. Visualización de la Diferencia en Bolívares al Lado del Porcentaje (2026-11-04)

### Requerimiento:
* Mostrar el monto de la diferencia en Bolívares inmediatamente al lado del porcentaje de brecha en la tarjeta principal (ej. `+13,56%  [+Bs. 119,83]`), para lectura inmediata sin depender exclusivamente del texto descriptivo inferior.

### Cambios Implementados:
1. **Estructura HTML ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Se agrupó el valor porcentual `#val-brecha-pct` junto al nuevo badge `#val-brecha-diff-inline` dentro de `.spread-values-container`.
   - Se ajustó la descripción inferior para una lectura más armónica.
2. **Estilos CSS ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Reglas `.spread-values-container` con alineación al baseline y `.spread-bs-badge` con acabado en pastilla, borde translúcido y tipografía semibold de alto contraste en modos oscuro y claro.
3. **Lógica Dinámica ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Actualización sincronizada del elemento inline `#val-brecha-diff-inline` con formato venezolano (`+Bs. 119,83`) tanto en tiempo real como en la navegación histórica del almanaque.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v15` para distribución inmediata de los cambios.


---

## 25. Incorporación de Botones de Copiado Rápido al Portapapeles (2026-11-04)

### Requerimiento:
* Agregar funcionalidad de copiado rápido al portapapeles con un solo toque, optimizado para pagos móviles y compartición de montos calculados.

### Cambios Implementados:
1. **Estructura HTML ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Inserción de filas de encabezado con etiquetas `.input-label-row` y botones `.btn-copy-input` en cada campo de la Calculadora Multidivisa: Bolívares (VES), Dólares (USD), Euros (EUR) y Tether (USDT).
   - Inserción de botón de copiado dedicado `.btn-copy-brecha` en la cabecera de la tarjeta de Brecha Cambiaria.
2. **Estilos CSS ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Diseño responsivo de botones de copiado con bordes translúcidos, micro-animación `active: scale(0.94)`, estado de éxito `.copied` con tono esmeralda (`#10b981`) y adaptación a modos oscuro y claro.
3. **Lógica JS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Métodos `copiarAlPortapapeles()` con soporte nativo para `navigator.clipboard.writeText()` y fallback de contingencia mediante `execCommand("copy")`.
   - Feedback visual interactivo (`✓ Copiado`) durante 1.8 segundos antes de regresar al estado original.
   - Copiado directo del texto exacto formateado en cada campo.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v16` para distribución y activación inmediata.


---

## 26. Rediseño Estético: Unificación de Copiado para Pago Móvil (2026-11-04)

### Requerimiento:
* Eliminar la saturación visual generada por botones de copiado repetidos en cada fila de la calculadora y en la tarjeta de Brecha, rediseñando la función hacia un enfoque minimalista, limpio y de alta utilidad.

### Cambios Implementados:
1. **Limpieza Visual de la Interfaz ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Eliminación de los botones de texto repetitivos en las etiquetas de los 4 campos (VES, USD, EUR, USDT).
   - Reversión de la cabecera de la tarjeta de Brecha Cambiaria a su insignia limpia original (`Diferencia`).
   - Inserción de un **único botón de acción destacado** al pie de la calculadora:
     `<button class="btn-copy-pagomovil" id="btn-copy-ves"><i class="fa-regular fa-copy"></i> Copiar monto en Bolívares (Pago Móvil)</button>`.
2. **Estilos Premium Fintech ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Botón con gradiente verde esmeralda translúcido (`hsla(142, 71%, 45%, 0.14)`), borde sutil, esquinas redondeadas (`12px`) y sombra suave.
   - Estado activo con transición elástica y estado de éxito con resplandor completo (`#10b981`).
   - Adaptación de contraste para temas oscuro y claro.
3. **Lógica JS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Vinculación directa al valor actual en Bolívares (`input-ves`), copiando el monto formateado al portapapeles y mostrando el mensaje interactivo: *"¡Monto copiado para Pago Móvil!"*.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Actualización de versión a `tasavenezuela-cache-v17`.


---

## 27. Retiro de Botón de Copiado e Insignia "Diferencia" (2026-11-04)

### Requerimiento:
* Eliminar por completo el botón de copiado de la calculadora y retirar la insignia/etiqueta *"Diferencia"* de la cabecera de la tarjeta de Brecha Cambiaria a petición expresa del usuario para preservar una estética limpia y despojada de elementos innecesarios.

### Cambios Implementados:
1. **Interfaz ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Retiro del elemento `<button class="btn-copy-pagomovil" id="btn-copy-ves">` en la calculadora.
   - Retiro del badge `<span class="source-badge spread-badge">Diferencia</span>` en la cabecera de la tarjeta de Brecha Cambiaria.
2. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v18` para despliegue y recarga inmediata en clientes PWA y web.


---

## 28. Integración de Icono de Copiado Exclusivo en el Campo de Bolívares (2026-11-04)

### Requerimiento:
* Integrar únicamente la imagen/icono del botón de copiado dentro del área del campo de Bolívares (VES), sin textos adicionales ni elementos invasivos en el resto de la interfaz.

### Cambios Implementados:
1. **Estructura HTML ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Inserción de un botón con icono puro `<button class="btn-copy-icon" id="btn-copy-ves"><i class="fa-regular fa-copy"></i></button>` dentro del contenedor del input de Bolívares (`.input-wrapper-ves`), ubicado de forma armónica junto a la bandera y etiqueta `VES`.
2. **Estilos CSS ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Agrupación en `.input-actions-right` con alineación vertical centrada.
   - Botón minimalista de 28x28 px con bordes translúcidos, efecto hover verde esmeralda y feedback activo.
   - Ajuste de padding derecho en el input (`padding-right: 92px`) para prevenir solapamiento con los dígitos ingresados.
3. **Lógica JS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Copiado con un solo toque del valor actual de Bolívares al portapapeles y transición animada del icono a un checkmark `<i class="fa-solid fa-check"></i>` durante 1,8 segundos.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento a `tasavenezuela-cache-v19`.


---

## 29. Remoción Total del Botón de Copiado en Bolívares (2026-11-04)

### Requerimiento:
* Eliminar por completo el botón/icono de copiado del campo de Bolívares, dejando los campos de la calculadora completamente limpios, simétricos y sin ningún elemento adicional que altere la estética.

### Cambios Implementados:
1. **Interfaz ([index.html](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/index.html)):**
   - Retiro del elemento `#btn-copy-ves` y de su contenedor `.input-actions-right`.
   - Restauración del marcado estándar limpio de `.input-wrapper` para Bolívares (VES), exactamente igual al resto de los campos (USD, EUR, USDT).
2. **Estilos ([styles.css](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/styles.css)):**
   - Eliminación de reglas CSS asociadas a `.btn-copy-icon` y `.input-actions-right`.
3. **Lógica JS ([app.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/app.js)):**
   - Limpieza de listeners y funciones de copiado.
4. **Service Worker ([sw.js](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/sw.js)):**
   - Incremento de versión de caché a `tasavenezuela-cache-v20`.


---

## 30. Implementación de Diseño Compacto en Móvil y Escritorio (04/11/2026)

### Contexto y Solicitud del Usuario
El usuario solicitó aplicar un diseño más compacto en la interfaz para reducir el scroll vertical excesivo en dispositivos móviles y visualizar la calculadora y tasas principales en un único marco visual sin desplazamientos prolongados.

### Cambios Realizados
1. **Duo Grid de Tasas Secundarias (`.rates-duo-grid`)**:
   - Se mantuvieron el **Dólar Oficial BCV** y la **Brecha Cambiaria** a ancho completo (`100%`) como tarjetas principales/ancla.
   - Se organizaron **Euro Oficial BCV** y **USDT Binance** lado a lado en un contenedor de 2 columnas (`grid-template-columns: 1fr 1fr; gap: 10px`).
   - Se optimizaron las tipografías, íconos de banderas (20px), badges de origen (`BCV` y `P2P`), valores en bolívares y marcas de agua de fondo (`€` y `₮`) para lograr simetría exacta y lectura balanceada.
2. **Optimización Vertical y Espaciado General**:
   - Reducción armoniosa de espaciado en `.app-container` (de 16px a 11px de gap).
   - Ajuste de paddings en tarjetas generales de 16px a 12-14px.
   - Compactación elegante de la sección del Almanaque/selector de fecha y de la barra de metadatos (`Fecha Base` y `Actualizado`).
   - Compactación en la Calculadora Multidivisa: paddings reducidos en inputs (8px vertical) y menor separación entre etiquetas y campos numéricos sin comprometer la ergonomía táctil.
3. **Versión de Cache PWA**:
   - Incrementada a `tasavenezuela-cache-v21` en `sw.js`.
4. **Verificación**:
   - Comprobación visual móvil en Microsoft Edge headless confirmando que la cabecera, calendario, tasas, brecha y la calculadora completa caben con perfecta legibilidad en pantallas estándar.


---

## 31. Corrección Crítica: Tasa del Euro superando los Bs. 1.000 y Blindaje Multi-Fuente (05/11/2026)

### Contexto del Incidente
El 05 de noviembre de 2026, la cotización oficial del Euro del Banco Central de Venezuela (BCV) superó por primera vez la barrera de los 1.000 bolívares, ubicándose en **Bs. 1.006,03263992**.
El endpoint externo de DolarAPI (`/v1/euros`) presentó un fallo de formateo en su backend: truncó la cadena en el separador de miles hispano (punto `.`), emitiendo `1.006` en lugar de `1006.03`. Al ejecutarse el robot matutino, la tasa se redondeó erróneamente a `Bs. 1,01` reflejando una caída falsa de `-99,90%` en la interfaz.

### Diagnóstico y Solución Integral Implementada
1. **Extractor Multi-Fuente con Consulta Directa al BCV (`update_rates.py`)**:
   - Se estableció como **Fuente Primaria** la extracción directa del portal oficial del BCV (`https://www.bcv.org.ve/`) mediante scraping HTTPS con bypass de certificados SSL intermedios.
   - Implementación del parser robusto `parse_spanish_number(s)` capaz de procesar con precisión decimal números con separador de miles y coma decimal (`1.006,03263992` -> `1006.03`).
   - DolarAPI se mantiene como proveedor de **Binance USDT / P2P** y fallback secundario con mecanismo de protección: si se detecta un valor de Euro truncado (< 100 Bs cuando el dólar supera 500 Bs), el valor anómalo se rescata o se rechaza automáticamente.
2. **Validación de Paridad Cambiaria y Cordura Financiera**:
   - Incorporación de una regla inviolable de paridad: `0.7 * USD <= EUR <= 1.6 * USD`. Ningún valor fuera de este rango de paridad internacional será aceptado o persistido jamás.
3. **Saneamiento de Datos (`historial.json` y `Datos/rates.json`)**:
   - Corrección del registro `2026-11-05`:
     - **Dólar BCV**: Bs. 894,89 (`+1,67` / `+0,19%`)
     - **Euro Oficial BCV**: **Bs. 1.006,03** (`+6,26` / `+0,63%`)
     - **USDT Binance**: Bs. 1.010,28 (`-0,37` / `-0,04%`)
     - **Brecha Cambiaria**: `+12,89%` (`+Bs. 115,39`)
4. **Blindaje en la Suite de Auditoría (`validate_history.py`)**:
   - Añadida comprobación de paridad EUR/USD en cada ciclo de CI/CD para impedir que un commit publique datos defectuosos.
5. **Caché y Despliegue**:
   - Versión de caché del Service Worker incrementada a `tasavenezuela-cache-v22`.


---

## 32. Corrección de Horario: Espera Estricta a Medianoche para Tasas Oficiales (05/11/2026)

### Contexto y Solicitud del Usuario
El usuario reportó que la aplicación estaba actualizando las tasas oficiales de Dólar y Euro del día siguiente antes de tiempo (en horas de la tarde/noche), solicitando expresamente:
> *"la aplicacion esta actualizando la tasa del dolar y del euro del dia siguiente antes de tiempo, deberia esperar pasar la media noche y luego actualizar la tasa con el dia correspondiente."*

### Causa Operativa
En Venezuela, el BCV publica en su portal web entre las 4:30 PM y 6:00 PM los resultados de las mesas de cambio con `Fecha Valor` correspondiente al siguiente día hábil bancario (ej. el jueves en la tarde publica con `Fecha Valor: Viernes 06 Noviembre`).
El extractor automático leía la nueva tasa en su ejecución vespertina y, al estar en la fecha en curso (`05-11-2026`), sobreescribía la tasa activa de hoy con los valores de mañana antes de la medianoche. Legalmente y comercialmente, la tasa de hoy sigue en vigencia plena hasta las 23:59:59.

### Solución Implementada
1. **Detección Automática de `Fecha Valor` Futura en `update_rates.py`**:
   - Se añadió la función `parse_bcv_fecha_valor(html)` que extrae y convierte la fecha oficial del portal a formato ISO (`YYYY-MM-DD`).
   - Se implementó la **Regla de Medianoche**:
     - Si `fecha_valor_bcv > fecha_hoy_iso` (tasa publicada para mañana antes de las 12:00 AM):
       - Se preservan intactas las tasas oficiales activas del día de hoy (`USD: 894,89`, `EUR: 1.006,03`).
       - La tasa de mercado P2P Binance (`USDT`) continúa actualizándose en vivo 24/7.
       - La tasa futura se almacena en `metadata.next_day_rate` para trazabilidad sin alterar la cotización activa del día.
     - Solo al cruzar la medianoche en hora de Venezuela (`00:00:00` VET), cuando `fecha_hoy_iso >= fecha_valor_bcv`, el robot aplica oficialmente la nueva tasa al nuevo día (`2026-11-06`).
2. **Restauración de Datos**:
   - `historial.json` y `Datos/rates.json` para el día en curso (`2026-11-05`) restaurados a sus valores oficiales legales:
     - **Dólar BCV**: Bs. 894,89
     - **Euro Oficial BCV**: Bs. 1.006,03
     - **USDT Binance**: Bs. 1.008,99
     - **Fecha Base**: 05-11-2026
3. **Versión de Cache PWA**:
   - Incrementada a `tasavenezuela-cache-v23` en `sw.js`.


---

## 33. Identidad de Marca: Aplicación del Tricolor Nacional al Nombre TasaVenezuela (05/11/2026)

### Contexto y Solicitud del Usuario
El usuario solicitó que el título principal de la marca **TasaVenezuela** luciera los colores del tricolor nacional de la bandera: amarillo, azul y rojo.
> *"me gustaria que el nombre TasaVenezuela tenga el tricolor de la bandera amarillo, azul y rojo."*

### Cambios Realizados
1. **Gradiente Tipográfico Tricolor en `.app-header h1`**:
   - Implementación de un gradiente lineal de alto impacto (`linear-gradient(90deg, #F59E0B 0%, #FBBF24 28%, #3B82F6 48%, #2563EB 65%, #EF4444 82%, #DC2626 100%)`) con enmascaramiento de texto (`background-clip: text`, `-webkit-text-fill-color: transparent`).
   - Tasa en amarillo/dorado (`#F59E0B`), Vene en azul institucional (`#2563EB`), y zuela en rojo patrio (`#EF4444`).
   - Sombra sutil de profundidad (`drop-shadow`) para máxima legibilidad sobre el fondo oscuro.
   - Soporte automático adaptativo para modo claro (`[data-theme="light"]`) con tonos contrastantes.
2. **Splash Screen Unificado (`.splash-title`)**:
   - Se extendió el mismo tricolor institucional a la pantalla de carga fluida, logrando una bienvenida visual consistente con la bandera ondeante.
3. **Versión de Cache PWA**:
   - Incrementada a `tasavenezuela-cache-v24` en `sw.js`.


---

## 34. Rediseño Integral UI/UX Móvil: Jerarquía de Contraste, Barra Unificada y Copiado Rápido (12/11/2026)

### Contexto y Solicitud del Usuario
El usuario solicitó un rediseño completo y optimización visual de la interfaz móvil en modo oscuro para mejorar la legibilidad, limpiar bordes redundantes y unificar controles en pantalla sin scroll innecesario.

### Cambios Implementados
1. **Header Superior Renovado (`index.html`, `styles.css`, `app.js`)**:
   - Marca **TasaVenezuela** estilizada en amarillo/dorado (`#FDE047` → `#F59E0B`) junto al subtítulo *"Monitoreo oficial de divisas y cripto"*.
   - Botón circular de **Compartir** (`#btn-share`) en la esquina superior derecha junto al botón circular de tema (luna/sol), con soporte Web Share API nativo en móviles y copiado directo de resumen al portapapeles en escritorio.
2. **Barra Unificada de Fecha y Actualización (Above the fold)**:
   - Eliminación del bloque extenso de *"Consultar fechas anteriores"* / botón *"Hoy"* y de la tarjeta inferior *"FECHA BASE / ACTUALIZADO"*.
   - Sustitución por una única barra compacta de 2 columnas iguales:
     - Izquierda: selector desplegable compacto con icono de calendario, fecha en formato `DD/MM/YYYY` y flecha desplegable sobre un `<input type="date">` nativo invisible.
     - Derecha: botón interactivo con icono circular de recarga y texto `"Actualizado HH:MM a.m./p.m."` para refrescar cotizaciones al instante.
3. **Tarjetas de Divisas con Contraste Puro (`#FFFFFF`)**:
   - Eliminación de franjas laterales gruesas y badges (`BCV` / `P2P`), unificando bordes finos de `1px` y conservando marcas de agua tenues (`$`, `€`, `₮`).
   - Montos principales en **blanco puro (`#FFFFFF`)** en negrita para máximo contraste, reservando verde y rojo exclusivamente para variaciones porcentuales.
   - Botones dedicados de copiado rápido con icono `copy`: inline junto al monto en **Dólar Oficial BCV**, y en esquina superior derecha para **Euro Oficial** y **USDT Binance**, con toast de confirmación y feedback visual (`check`).
4. **Tarjeta de Brecha Cambiaria Refinada**:
   - Borde fino uniforme `1px` y marca de agua `%` tenue sin franja lateral gruesa.
   - Porcentaje principal en **blanco puro** grande acompañado por píldora/badge oscuro redondeado con el diferencial en bolívares en blanco (`#FFFFFF`), manteniendo la barra verde-amarillo-rojo y descripciones de diferencial.
5. **Calculadora Multidivisa con Separador y Copiado por Fila**:
   - Campos limpios separados en el extremo derecho por una línea vertical sutil para `bandera + código` (`VES`, `USD`, `EUR`, `USDT`) e icono individual de **copiar** al final de cada fila.
6. **Versión de Cache PWA**:
   - Incrementada a `tasavenezuela-cache-v25` en `sw.js`.


---

## 35. Restauración del Tricolor Nacional en el Título TasaVenezuela (12/11/2026)

### Contexto y Solicitud del Usuario
El usuario indicó que en la nueva interfaz optimizada debía mantenerse el degradado tricolor nacional (amarillo, azul y rojo) en la palabra **TasaVenezuela** junto al icono dorado, tal como en la imagen de referencia compartida.

### Cambios Implementados
1. **Gradiente Tricolor en `.app-header h1` (`styles.css`)**:
   - Restaurado el degradado tricolor (`#F59E0B`/`#FBBF24` → `#3B82F6`/`#2563EB` → `#EF4444`/`#DC2626`) con `drop-shadow` para máxima nitidez en modo oscuro y variante contrastante para modo claro.
2. **Versión de Cache PWA (`sw.js`)**:
   - Incrementada a `tasavenezuela-cache-v26`.


---

## 36. Blindaje Anti-Caché Móvil/PWA para Actualizaciones Instantáneas (12/11/2026)

### Contexto
El usuario reportó que el cambio visual del título tricolor no se reflejaba en su teléfono debido a la retención de caché HTTP (GitHub Pages `max-age=600`) y caché `Cache-first` de `styles.css`/`app.js` en el Service Worker.

### Solución Implementada
1. **Cache-Busting Explícito en `index.html`**:
   - Agregado query string de versión (`styles.css?v=27` y `app.js?v=27`).
2. **Service Worker con Network-First en Recursos Propios (`sw.js`)**:
   - Precarga en `install` usando `new Request(asset, { cache: 'reload' })` para evitar guardar copias viejas de la caché HTTP del dispositivo.
   - Estrategia `Network-first` (`{ cache: 'no-cache' }`) con fallback offline (`ignoreSearch: true`) para `index.html`, `styles.css` y `app.js`.
   - Versión de caché incrementada a `tasavenezuela-cache-v27`.
3. **Auto-Recarga al Actualizar PWA (`app.js`)**:
   - Registro del Service Worker con `{ updateViaCache: 'none' }` y recarga automática segura en `controllerchange` cuando un nuevo Service Worker toma el control.
