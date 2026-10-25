const CONFIRMATIONS_FILE_NAME = "confirmaciones.json";
const CONFIRMATIONS_FILE_ID_PROPERTY = "CONFIRMATIONS_FILE_ID";
const CONFIRMATIONS_BACKUP_PROPERTY = "CONFIRMATIONS_JSON_BACKUP";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doGet(event) {
  const params = (event && event.parameter) ? event.parameter : {};
  const action = (params.action || "").toLowerCase();
  const callback = params.callback ? String(params.callback).replace(/[^a-zA-Z0-9_$.]/g, "") : "";

  if (action === "add") {
    const result = saveConfirmation_(params);
    return buildJsonResponse_(result, callback);
  }

  try {
    const data = readConfirmationsData_();
    return buildJsonResponse_({
      ok: true,
      totalConfirmados: data.confirmations.length,
      actualizadoEn: new Date().toISOString(),
      confirmaciones: data.confirmations
    }, callback);
  } catch (error) {
    console.error(error);
    return buildJsonResponse_({
      ok: false,
      message: "No se pudieron obtener las confirmaciones.",
      error: String(error && error.message ? error.message : error)
    }, callback);
  }
}

function doPost(event) {
  let params = (event && event.parameter) ? Object.assign({}, event.parameter) : {};

  if (event && event.postData && event.postData.contents) {
    try {
      const parsed = JSON.parse(event.postData.contents);
      if (parsed && typeof parsed === "object") {
        params = Object.assign(params, parsed);
      }
    } catch (_) {}
  }

  const requestId = typeof params.requestId === "string" ? params.requestId : "";
  const mode = typeof params.mode === "string" ? params.mode : "";
  const result = saveConfirmation_(params);

  if (mode === "fetch" || !requestId) {
    return buildJsonResponse_(result, "");
  }

  return responsePage_(requestId, result.ok, result.message, result);
}

function saveConfirmation_(params) {
  try {
    const name = typeof params.name === "string" ? params.name.trim().replace(/\s+/g, " ") : "";
    const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
    const attendance = typeof params.attendance === "string" && params.attendance.trim()
      ? params.attendance.trim()
      : "Sí asistiré";
    const note = typeof params.note === "string" ? params.note.trim().slice(0, 300) : "";

    if (name.length < 2 || name.length > 120) {
      return {
        ok: false,
        message: "Ingresa tu nombre y apellidos (entre 2 y 120 caracteres)."
      };
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return {
        ok: false,
        message: "Ingresa un correo electrónico válido."
      };
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const data = readConfirmationsData_();
      const confirmations = data.confirmations;

      const duplicate = confirmations.some((item) => (
        item &&
        typeof item.correo === "string" &&
        item.correo.trim().toLowerCase() === email
      ));

      if (duplicate) {
        return {
          ok: false,
          message: "Este correo electrónico ya tiene una confirmación registrada.",
          confirmaciones: confirmations
        };
      }

      const newEntry = {
        id: Utilities.getUuid(),
        nombre: name,
        correo: email,
        asistencia: attendance,
        mensaje: note,
        fechaRegistro: new Date().toISOString()
      };

      confirmations.push(newEntry);
      writeConfirmationsData_(confirmations);

      return {
        ok: true,
        message: "¡Muchas gracias! Tu respuesta ha sido registrada.",
        registro: newEntry,
        totalConfirmados: confirmations.length,
        confirmaciones: confirmations
      };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "No se pudo guardar tu confirmación. Inténtalo de nuevo más tarde.",
      error: String(error && error.message ? error.message : error)
    };
  }
}

function readConfirmationsData_() {
  const properties = PropertiesService.getScriptProperties();
  let confirmations = [];

  try {
    const file = getOrCreateConfirmationsFile_();
    if (file) {
      const content = file.getBlob().getDataAsString("UTF-8").trim();
      const parsed = content ? JSON.parse(content) : [];
      if (Array.isArray(parsed)) {
        confirmations = parsed;
      }
    }
  } catch (driveErr) {
    console.warn("Usando respaldo en ScriptProperties debido a:", driveErr);
    const backup = properties.getProperty(CONFIRMATIONS_BACKUP_PROPERTY);
    if (backup) {
      try {
        const parsedBackup = JSON.parse(backup);
        if (Array.isArray(parsedBackup)) {
          confirmations = parsedBackup;
        }
      } catch (_) {}
    }
  }

  return { confirmations: confirmations };
}

function writeConfirmationsData_(confirmations) {
  const jsonText = JSON.stringify(confirmations, null, 2) + "\n";
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(CONFIRMATIONS_BACKUP_PROPERTY, jsonText);

  try {
    const file = getOrCreateConfirmationsFile_();
    if (file) {
      file.setContent(jsonText);
    }
  } catch (driveErr) {
    console.warn("Guardado en ScriptProperties (Drive no disponible):", driveErr);
  }
}

function getOrCreateConfirmationsFile_() {
  const properties = PropertiesService.getScriptProperties();
  const fileId = properties.getProperty(CONFIRMATIONS_FILE_ID_PROPERTY);

  if (fileId) {
    try {
      const existingFile = DriveApp.getFileById(fileId);
      if (!existingFile.isTrashed()) {
        return existingFile;
      }
    } catch (_) {}
  }

  const initialContent = properties.getProperty(CONFIRMATIONS_BACKUP_PROPERTY) || "[]\n";
  const file = DriveApp.createFile(CONFIRMATIONS_FILE_NAME, initialContent, "application/json");
  properties.setProperty(CONFIRMATIONS_FILE_ID_PROPERTY, file.getId());
  return file;
}

function buildJsonResponse_(data, callback) {
  const jsonString = JSON.stringify(data, null, 2);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + jsonString + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

function responsePage_(requestId, ok, message, extraData) {
  const payload = JSON.stringify(Object.assign({
    type: "confirmation-result",
    requestId: requestId,
    ok: ok,
    message: message
  }, extraData || {})).replace(/</g, "\\u003c");

  return HtmlService.createHtmlOutput(
    `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.top.postMessage(${payload}, "*");</script></body></html>`
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
