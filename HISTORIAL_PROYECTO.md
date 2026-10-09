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

