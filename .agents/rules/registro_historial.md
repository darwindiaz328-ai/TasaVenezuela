# Regla del Proyecto: Registro Obligatorio del Historial de Conversación

En este proyecto (TasaVenezuela), **SIEMPRE** se debe mantener actualizada la documentación histórica y la bitácora de cada conversación y sesión de trabajo.

## Pautas Obligatorias:
1. **Archivo de Bitácora:** Todo cambio, diagnóstico, requerimiento del usuario e implementación debe registrarse en el archivo `HISTORIAL_PROYECTO.md` ubicado en la raíz del proyecto.
2. **Estructura de cada Entrada:**
   - Número correlativo de sección (ej. `## 13. ...`, `## 14. ...`).
   - Fecha de la sesión (ej. `(15/10/2026)`).
   - Requerimiento del usuario.
   - Diagnóstico o causa raíz técnica.
   - Implementación detallada con enlaces a los archivos modificados.
   - Sincronización a GitHub (Rama, Commit SHA y mensaje de commit).
3. **Persistencia en el Repositorio:**
   - El archivo `HISTORIAL_PROYECTO.md` debe formar parte de la cola de subida cada vez que se sincronicen cambios con GitHub mediante `upload_to_github.py`.
