/* Configuración del test — puedes cambiar estos valores sin tocar main.js */
(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Networker con IA",
    community: "Borge IA",
    whatsappCommunity: "https://chat.whatsapp.com/GXk68Wavu8VEea2MnmWwY0",
    // Rangos de puntuación (A=1, B=2, C=3 · mínimo 3, máximo 9)
    results: [
      { id: "r1", min: 3, max: 5 },
      { id: "r2", min: 6, max: 7 },
      { id: "r3", min: 8, max: 9 }
    ],
    // Mensajes que aparecen mientras se "calcula" el resultado
    calcMessages: [
      "Sumando tus puntos…",
      "Identificando qué frena tu prospección…",
      "Preparando tu diagnóstico personalizado…"
    ],
    calcDurationMs: 2100,
    // Opcional: URL de webhook (n8n, Make, Google Apps Script) para registrar resultados anónimos.
    // Déjalo vacío si no lo necesitas.
    endpoint: ""
  };
})();
