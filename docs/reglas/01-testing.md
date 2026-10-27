# Testing

Comando de este repo: `npm test`. Ejecuta `src/i18n/catalog.spec.mjs` y comprueba que `en` y `es` tienen las mismas claves de módulos y pestañas.

- Una clave nueva del catálogo entra en los dos idiomas. `npm test` tiene que pasar.
- Un cambio de tipos o de componentes también corre `npm run build` (`tsc --noEmit` y Vite).
- No existe hoy un runner de componentes, Cypress ni Playwright. No añadas uno dentro de un PR de pantalla. Si hace falta, se pregunta antes.
- Un bug de catálogo se reproduce primero con el spec que ya hay. No declares listo sin pegar el comando y el resultado.
