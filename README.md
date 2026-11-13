# Test digital · Networker con IA

Landing tipo slides (3 preguntas → diagnóstico → comunidad de WhatsApp Borge IA).
Servida con nginx. Easypanel: fuente GitHub, builder **Dockerfile**, puerto **80**.

- `site/` — HTML, CSS, JS y logo
- `site/lib/manifest.js` — enlace de WhatsApp y rangos de puntaje

Despliegue automático: cada push a `main` publica en https://networkerconia.tech (webhook de Easypanel).

## prospeccion/ — Test «¿Tu multinivel te impulsa o te limita?» (Martha Lucía Hoyos C.)

Publicado en https://prospeccion.networkerconia.tech (servicio Easypanel `test-prospeccion`, build path `/prospeccion`).
- `prospeccion/site/lib/manifest.js` — número de WhatsApp, mensaje y webhook (`endpoint`) para registros.
- `prospeccion/plantilla-correo/resultado.html` — plantilla del correo de resultado.
