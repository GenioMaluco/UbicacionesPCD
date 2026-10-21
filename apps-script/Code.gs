const CONFIRMATIONS_FILE_NAME = "confirmaciones.json";
const CONFIRMATIONS_FILE_ID_PROPERTY = "CONFIRMATIONS_FILE_ID";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doGet() {
  return HtmlService.createHtmlOutput("Servicio de confirmaciones activo.");
}

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const requestId = typeof parameters.requestId === "string" ? parameters.requestId : "";

  try {
    const name = typeof parameters.name === "string" ? parameters.name.trim().replace(/\s+/g, " ") : "";
    const email = typeof parameters.email === "string" ? parameters.email.trim().toLowerCase() : "";

    if (name.length < 1 || name.length > 120) {
      return responsePage_(requestId, false, "Ingresa un nombre válido (máximo 120 caracteres).");
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return responsePage_(requestId, false, "Ingresa un correo electrónico válido.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const file = getConfirmationsFile_();
      const content = file.getBlob().getDataAsString("UTF-8").trim();
      const confirmations = content ? JSON.parse(content) : [];

      if (!Array.isArray(confirmations)) {
        throw new Error("El archivo de confirmaciones no contiene una lista JSON.");
      }

      const duplicate = confirmations.some((confirmation) => (
        confirmation
        && typeof confirmation.correo === "string"
        && confirmation.correo.trim().toLowerCase() === email
      ));
      if (duplicate) {
        return responsePage_(requestId, false, "Este correo electrónico ya tiene una confirmación registrada.");
      }

      confirmations.push({ nombre: name, correo: email });
      file.setContent(`${JSON.stringify(confirmations, null, 2)}\n`);
    } finally {
      lock.releaseLock();
    }

    return responsePage_(requestId, true, "¡Gracias! Tu asistencia quedó confirmada.");
  } catch (error) {
    console.error(error);
    return responsePage_(requestId, false, "No se pudo guardar tu confirmación. Inténtalo de nuevo más tarde.");
  }
}

function getConfirmationsFile_() {
  const properties = PropertiesService.getScriptProperties();
  const fileId = properties.getProperty(CONFIRMATIONS_FILE_ID_PROPERTY);
  if (fileId) {
    return DriveApp.getFileById(fileId);
  }

  const file = DriveApp.createFile(CONFIRMATIONS_FILE_NAME, "[]\n", MimeType.JSON);
  properties.setProperty(CONFIRMATIONS_FILE_ID_PROPERTY, file.getId());
  return file;
}

function responsePage_(requestId, ok, message) {
  const payload = JSON.stringify({
    type: "confirmation-result",
    requestId: requestId,
    ok: ok,
    message: message
  }).replace(/</g, "\\u003c");

  return HtmlService.createHtmlOutput(
    `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.top.postMessage(${payload}, "*");</script></body></html>`
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
