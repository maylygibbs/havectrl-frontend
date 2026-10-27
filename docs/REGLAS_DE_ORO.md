# Reglas de oro

Aplican a todo PR de este repo. El detalle está en `docs/reglas/`. No copies este texto a `AGENTS.md` ni a `.cursor/rules/`.

1. **No versionar secretos ni tokens.** Ni `.env`, ni JWT, ni claves de proveedor. Lo que lleva prefijo `VITE_` sale en el bundle y es público.
2. **Un build, muchos clientes.** El hostname decide. El front no manda el slug de la compañía ni elige la base. Nada de `if (cliente === 'x')` en código compartido.
3. **Fail-closed en la UI.** Si `modules` de la sesión no incluye el módulo, no se muestra el menú, ni contadores, ni resultados, ni avisos de ese módulo.
4. **Ocultar no protege.** El backend es quien rechaza. No dupliques en el cliente la matriz de permisos del servidor.
5. **Sin default a un cliente real.** No hardcodees un slug de demo como tenant activo. El hostname que no está registrado se muestra como dominio desconocido.
6. **El test del repo acompaña al cambio.** Hoy `npm test` comprueba el catálogo. No se declara listo sin correrlo y decir el resultado. Tipos y UI: también `npm run build`.
7. **Un PR, una frase.** No metas cambio de auth, de tenancy o de catálogo entero dentro de un PR de una pantalla sin decirlo.
8. **Docs de reglas solo en `docs/`.** La ley de producto sigue en `../havectrl-backend/docs/producto/`.
9. **Nada de push directo a `main`.** El merge lo hace una persona.
10. **No cerrar dudas de producto aquí.** Si el manual y el resumen chocan, manda `../havectrl-backend/docs/producto/04-apis-e-iteraciones.md`. Si la duda sigue abierta, manda `../havectrl-backend/docs/producto/05-dudas.md`.
