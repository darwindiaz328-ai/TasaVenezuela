# Directrices del Proyecto TasaVenezuela

## 1. Bitácora de Conversación e Historial (Mandatorio)
En cada sesión o solicitud del usuario, es **OBLIGATORIO** documentar lo conversado y los cambios técnicos realizados en el archivo [`HISTORIAL_PROYECTO.md`](file:///C:/Users/Usuario/.gemini/antigravity-ide/scratch/TasaVenezuela/HISTORIAL_PROYECTO.md):
- Registrar la fecha de la sesión, requerimiento del usuario, causa raíz identificada, solución implementada y los commits/ramas actualizados en GitHub.
- Mantener siempre sincronizado `HISTORIAL_PROYECTO.md` con el repositorio remoto.

## 2. CI/CD y Automatización
- El workflow de actualización de tasas corre en `.github/workflows/auto_update.yml` con cron desfasado al minuto `:17` (`'17 1,4,7,10,13,16,19,22 * * *'`) para evitar contención de cola.
- El extractor de tasas `update_rates.py` es idempotente: solo modifica archivos si las tasas cambiaron o si es un nuevo día, evitando despliegues redundantes en GitHub Pages.

## 3. Caché de la Aplicación
- Siempre que se modifique `app.js`, `styles.css` o `index.html`, incrementar la versión de caché en `sw.js` (ej. `tasavenezuela-cache-vX`) para asegurar que los usuarios reciban los cambios de inmediato.
