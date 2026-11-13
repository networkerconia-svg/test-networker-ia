/* ============================================================
   CONFIGURACIÓN DEL TEST — puedes cambiar estos valores sin tocar main.js
   ============================================================ */
(function () {
  "use strict";
  window.__BRAND__ = {
    owner: "Martha Lucía Hoyos C.",
    ownerRole: "Empresaria y líder en mercadeo en red",

    // [CONFIGURAR] Número de WhatsApp de Martha: código de país + número, solo dígitos.
    // Ejemplo Colombia: "573001234567". Si queda vacío, el botón abre WhatsApp sin destinatario.
    whatsappNumber: "",

    // Mensaje que se escribe solo al tocar "QUIERO CONOCER ESTA OPORTUNIDAD"
    // {nombre} y {resultado} se reemplazan automáticamente.
    whatsappMessage: "Hola Martha, soy {nombre}. Hice el test «¿Tu multinivel te impulsa o te limita?» y mi resultado fue: «{resultado}». Quiero conocer esta oportunidad.",

    // [CONFIGURAR] URL que recibe los registros (webhook de n8n / Make / Apps Script).
    // Recibe un POST JSON con todos los datos. Déjalo vacío para no enviar nada.
    endpoint: "https://tests-digitales-n8n.q6lzzd.easypanel.host/webhook/test-martha",

    // Prefijo sugerido para el campo de WhatsApp del participante
    defaultCountryCode: "+57",

    // Rangos de puntuación (solo preguntas 1 a 4 · mínimo 4, máximo 12)
    results: [
      { id: "r1", min: 4,  max: 5,  title: "¡Felicidades! Tu multinivel te impulsa." },
      { id: "r2", min: 6,  max: 8,  title: "Tienes oportunidades de crecimiento." },
      { id: "r3", min: 9,  max: 10, title: "Tu multinivel podría estar limitándote." },
      { id: "r4", min: 11, max: 12, title: "Es momento de evaluar nuevas oportunidades." }
    ]
  };
})();
