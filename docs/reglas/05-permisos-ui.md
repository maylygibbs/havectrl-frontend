# Permisos en la UI

El login devuelve `modules`. `Workspace` filtra el menú con esa lista. Settings solo aparece si `modules` incluye `settings`.

- No muestres contadores, búsqueda ni avisos de un módulo que no está en `modules`.
- Ocultar es cortesía. Si el usuario llama la acción igual, el backend responde 403. No sustituyas ese rechazo con un filtro solo visual.
- No crees en el cliente un perfil que `src/access.ts` del backend no tiene. Los códigos que el servidor concede hoy son los de ese mapa.
- La lectura del expediente SMS en la UI sigue la opción estrecha ya usada en `Workspace` (administrador y `jefe_sms`). No amplíes esa lista: la duda 1 sigue en `../havectrl-backend/docs/producto/05-dudas.md`.
- Flight Tracking no se ofrece activo en la iteración 1. El corte está en `../havectrl-backend/docs/producto/04-apis-e-iteraciones.md`.
