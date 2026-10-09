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






