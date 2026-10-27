# Principios

Fuente de review: `docs/REGLAS_DE_ORO.md`. Producto: `../havectrl-backend/docs/producto/`.

1. **Un build, muchos clientes.** Vite produce un artefacto. `GET /common/domain/config` y el `Origin` del navegador dicen qué compañía es. El cliente no elige.
2. **El backend manda.** La UI refleja `modules` de la sesión. No concede un módulo que el login no trajo.
3. **El test del repo acompaña al cambio.** El comando real es `npm test`. No hay otra suite: no se inventa un verde.
4. **La convención manda.** React 19, Vite, TypeScript estricto, textos en `src/i18n/catalog.ts`, HTTP solo vía `src/api.ts`.
5. **Fail-closed.** Módulo ausente de `modules` = menú y datos ocultos. Un flag nuevo de UI nace apagado.

Un PR se explica en una frase. Cambiar cómo se guarda la sesión, cómo se resuelve el dominio o qué módulos pinta el shell no viaja dentro de un arreglo visual sin decirlo.
