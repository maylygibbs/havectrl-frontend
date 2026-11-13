# havectrl-frontend

Interfaz de HaveCtrl. Un solo build de React 19 y Vite, en TypeScript, para todas las compañías. El hostname decide el cliente. El backend resuelve ese hostname y devuelve el branding.

## Requisitos

Node 22 y el API en marcha (`havectrl-backend`, por defecto `http://127.0.0.1:3100`).

```bash
npm install
npm run dev
```

Vite escucha en el puerto `5174`, también por IPv6, para que `*.localhost` resuelva.

| URL | Qué abre |
| --- | --- |
| http://demoa.localhost:5174 | Demo A |
| http://demob.localhost:5174 | Demo B |

| Tenant | Correo | Contraseña |
| --- | --- | --- |
| demoa | admin@demoa.local | havectrl-demo |
| demob | admin@demob.local | havectrl-demo |

Un hostname que no esté en la base central muestra «Dominio no registrado».

## API

`VITE_API_URL` apunta al backend. Si no se define, el valor es `http://127.0.0.1:3100`.

Al cargar, la app llama `GET /common/domain/config`. El navegador envía `Origin`; el front no elige el slug de la compañía. La sesión se guarda en `sessionStorage` y no se comparte entre hostnames.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm run preview` | Sirve la compilación |

## Idioma

Inglés por defecto. El selector del login y del workspace cambia a español. Si hay sesión, la preferencia se guarda en la cuenta.

## Documentación

La arquitectura y el multitenant están en `../havectrl-backend/docs/producto/06-arquitectura-multitenant.md`. El avance de soft delete, Crew e idioma está en `../havectrl-backend/docs/producto/07-iteracion1-avance.md`. Las reglas de la interfaz están en `AGENTS.md`.
