# Guardar confirmaciones en un JSON de Google Drive

GitHub Pages solo publica archivos estáticos: no puede modificar `confirmaciones.json` en el repositorio cuando alguien responde. La solución guarda el resultado en un archivo JSON privado de Google Drive. Google Apps Script recibe los envíos y mantiene un único `confirmaciones.json` con solo `nombre` y `correo`. No se utiliza una base de datos.

El formulario ya está configurado con una URL de Apps Script. La dirección responde y rechaza entradas inválidas; la página muestra el rechazo correctamente. No envié una confirmación válida de prueba para evitar añadir datos ficticios al archivo.

## Si el despliegue actual no crea el archivo

1. Abre [script.google.com](https://script.google.com/) e inicia un proyecto nuevo.
2. Copia el contenido de `Code.gs` y pégalo en el editor del proyecto, reemplazando el código inicial.
3. Guarda el proyecto.
4. Selecciona **Implementar → Nueva implementación**.
5. En tipo, elige **Aplicación web**.
6. Configura **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**. Así el script puede crear y actualizar el archivo privado en tu Drive cuando un invitado envíe el formulario.
7. Pulsa **Implementar**, autoriza los permisos de Google Drive y copia la URL de la aplicación web que termina en `/exec`.
8. La URL actual ya está en `index.html`. Si el nuevo despliegue te da una dirección distinta, reemplaza el valor de `appsScriptUrl` por esa URL.
9. Publica los cambios en GitHub Pages.

## Dónde ver las respuestas

La primera confirmación válida crea `confirmaciones.json` en **Mi unidad** de la cuenta de Google que implementó el script. Desde Google Drive puedes abrirlo o descargarlo. Cada elemento contiene `nombre` y `correo`. El archivo permanece privado: no lo compartas públicamente porque contiene correos electrónicos.

Las direcciones de correo se normalizan y el script rechaza las que ya estén en el JSON. Un bloqueo evita que dos envíos simultáneos con el mismo correo se guarden ambos. El endpoint no ofrece una ruta pública para consultar o descargar las respuestas.

Para verificar la configuración completa sin inventar datos, envía una confirmación real desde el sitio y revisa `confirmaciones.json` en Drive. Luego prueba el mismo correo otra vez: el formulario debe indicar que ya está registrado.

Si modificas `Code.gs`, publica una nueva versión desde **Implementar → Administrar implementaciones → Editar**. Publica también el `index.html` actualizado en GitHub Pages.
