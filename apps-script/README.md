# Guardar y Compartir Confirmaciones en un Archivo JSON (`confirmaciones.json`)

## ¿Por qué fallaba antes el guardado en JSON?
En la versión anterior de `Code.gs`, la línea que creaba el archivo en Google Drive usaba:
```javascript
DriveApp.createFile(CONFIRMATIONS_FILE_NAME, "[]\n", MimeType.JSON);
```
En Google Apps Script, `MimeType.JSON` **no existe** dentro de la enumeración global `MimeType` (solo existe `ContentService.MimeType.JSON`), por lo que pasaba `undefined` y lanzaba un error cada vez que alguien intentaba confirmar asistencia. Además, la función `doGet()` solo devolvía un texto fijo en vez del contenido JSON.

## ¿Qué hace esta nueva versión?
1. **Guarda en `confirmaciones.json` sin fallos**: Usa `"application/json"` en `DriveApp.createFile(...)` y además guarda un respaldo automático en `PropertiesService` por seguridad.
2. **Genera un link directo al archivo JSON en vivo**:
   - Tu propia URL de Google Apps Script (`https://script.google.com/macros/s/.../exec`) ahora devuelve el archivo JSON en tiempo real cuando alguien la abre en el navegador.
   - Si agregas `?raw=1` al final de la URL (`.../exec?raw=1`), devuelve únicamente el arreglo JSON puro `[ ... ]`.
   - También configura el archivo `confirmaciones.json` en tu Google Drive con acceso de lectura mediante enlace (`driveFileUrl`) y enlace de descarga directa (`driveDownloadUrl`).
3. **Panel de Consulta y Compartir integrado en la página web**:
   - Desde la misma página web puedes abrir el panel **"Consultar / Compartir JSON"**, ver la lista en vivo, copiar el link compartible o descargar `confirmaciones.json`.
   - Incluso puedes compartir el link de tu página con `?ver=confirmaciones` para que cualquier organizador consulte la tabla y el JSON desde cualquier celular o computadora.

## Pasos para actualizar tu Google Apps Script (1 minuto)
1. Abre tu proyecto en [script.google.com](https://script.google.com/).
2. Reemplaza todo el contenido de `Code.gs` por el nuevo código de [`apps-script/Code.gs`](Code.gs) y guarda (**Ctrl + S**).
3. Haz clic en **Implementar → Administrar implementaciones** (o **Nueva implementación**).
4. Edita tu implementación actual (icono del lápiz ✏️), en **Versión** selecciona **"Nueva versión"**, verifica que diga:
   - **Ejecutar como**: *Yo*
   - **Quién tiene acceso**: *Cualquier persona*
5. Pulsa **Implementar** y autoriza permisos si Google te lo solicita.
6. ¡Listo! Si la URL `/exec` cambió, pégala en la constante `DEFAULT_APPS_SCRIPT_URL` dentro de `index.html` (o configúrala desde el botón de ajustes del panel JSON en la página).
