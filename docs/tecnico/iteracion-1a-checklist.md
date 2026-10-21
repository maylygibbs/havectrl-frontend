# Checklist Iteración 1A (Base)

Referencia: [04-apis-e-iteraciones.md](../../havectrl-backend/docs/producto/04-apis-e-iteraciones.md).

## Estado por bloque

| Bloque | Criterio | Estado |
| --- | --- | --- |
| Multitenant | Hostname → tenant aislado; JWT anclado al slug | Hecho |
| Roles / módulos | Matriz en `access.ts`; Home oculta contadores sin permiso | Hecho |
| SMS reservado | Bandeja y conteo Home solo `admin` / `jefe_sms` | Hecho |
| Crew Data | CRUD + soft delete + detalle plano | Hecho |
| Crew Schedule | Listado global + alta/baja manual de assignments | Hecho (esta entrega) |
| Crew Experience | Lectura desde seed / LOG futuro | Parcial (lectura demo) |
| Aircraft | Ficha, documentos CRUD, discrepancias, historial | Hecho (documentos CRUD en esta entrega) |
| Settings | Compañía editable + usuarios + cambio de rol (perfil) | Hecho (esta entrega) |
| Archivos / respaldo | Almacén local + API + script backup + docs | Hecho (esta entrega) |
| Pruebas ACC / RP | ACC-01/02 unit + ACC-01 integración DB (`INTEGRATION_TEST=1`) | Parcial |

## APIs añadidas en 1A (avance)

| Método | Ruta |
| --- | --- |
| `GET` | `/crew/assignments` |
| `POST` | `/crew/:id/assignments` |
| `DELETE` | `/crew/assignments/:assignmentId` |
| `GET` | `/settings/company` |
| `PATCH` | `/settings/company` |
| `GET` | `/settings/profiles` |
| `PATCH` | `/settings/users/:email/profile` |
| `POST` | `/aircraft/:id/documents` |
| `PUT` | `/aircraft/documents/:documentId` |
| `DELETE` | `/aircraft/documents/:documentId` |
| `GET/POST/DELETE` | `/files` (+ download) |
| `POST` | `/flights` |

## Pruebas automáticas (ACC)

| ID | Archivo | Qué valida |
| --- | --- | --- |
| ACC-01 | `auth/tenant-session.spec.ts`, `tenant-isolation.integration.spec.ts` | JWT + BD separada por tenant |
| ACC-02 | `home-metrics.spec.ts`, `access.spec.ts` | Conteo/bandeja SMS solo admin/jefe_sms; módulos por perfil |

Integración: `npm run test:integration` con `INTEGRATION_TEST=1` (Postgres demo levantado).

## Correcciones UI (Crew)

- Al cambiar de módulo se vacían las listas antes de recargar, para no auto-seleccionar IDs de otro módulo (`GET /crew/{id}` con 404).
- `openDetail` captura errores de API y muestra el mensaje del servidor en lugar de dejar rechazos sin manejar.
- Edición de tripulante: formulario precarga licencia/médico; tras `PUT` se refresca la ficha del mismo ID.
- CORS del backend declara explícitamente `PUT`/`PATCH`/`DELETE` para peticiones desde el dev server (5174 → 3100).

## Próximo paso sugerido

1. PR en backend y frontend (`feature/iter1-soft-delete-crew-i18n` o rama dedicada) + CI.  
2. Continuar **1B**: tramos, Daily Log, FPL PDF, Operations completo.  
3. Object storage y borrado físico de binarios.
