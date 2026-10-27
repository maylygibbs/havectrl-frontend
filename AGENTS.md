# HaveCtrl frontend

Un solo build React 19 + Vite, TypeScript estricto, para todas las compañías. El tenant es el hostname de la página. El front no envía el slug, no elige la base y no abre Postgres.

Ley de producto: `../havectrl-backend/docs/producto/`. Este archivo no cierra dudas. Reglas de review: `docs/REGLAS_DE_ORO.md`. Detalle: `docs/reglas/`. Los `.cursor/rules/*.mdc` solo enlazan.

## Comandos

Node 22. El API se apunta con `VITE_API_URL`; si no está, el default de desarrollo es `http://127.0.0.1:3100`. Vite escucha en el puerto `5174`.

- `npm run dev` — servidor de desarrollo
- `npm test` — paridad de claves del catálogo (`src/i18n/catalog.spec.mjs`)
- `npm run build` — `tsc --noEmit` y build de Vite

## Reglas duras

1. No pongas secretos en el repo ni en el bundle. `VITE_*` queda en el JavaScript público.
2. Un build, muchos hostnames. Sin `if (cliente === '…')` y sin elegir el slug en el cliente.
3. Ocultar un menú no autoriza. El backend rechaza. No muestres datos de un módulo que la sesión no trae.
4. La sesión vive en `sessionStorage` de ese origen. No se reutiliza en otro hostname.
5. Textos de interfaz en `src/i18n/catalog.ts`, en `en` y en `es`, salvo el nombre HAVECTRL y los códigos oficiales.
6. Todo cambio entra por PR. No hay push directo a `main`.
7. No se declara listo sin correr `npm test` y, si el diff toca tipos o UI, `npm run build`, y reportar el resultado.

## Cómo verificar listo

`npm test` en verde. Si cambió un componente, un tipo o el catálogo, también `npm run build`. Este repo no tiene runner de componentes: no inventes el resultado de una suite que no existe.
