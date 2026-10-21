# Almacenamiento de archivos y respaldo (1A)

## Almacén local (iteración 1A)

| Variable | Default | Uso |
| --- | --- | --- |
| `STORAGE_ROOT` | `./storage` | Raíz en disco; un subdirectorio por tenant (`demoa/`, `demob/`). |
| `STORAGE_MAX_BYTES` | `15728640` (15 MiB) | Tamaño máximo por upload. |

### Modelo

- Tabla tenant `storage.files` (migración `005_storage.sql`): metadatos + `storage_key` relativo al tenant.
- El binario **no** va a Postgres; vive bajo `STORAGE_ROOT/{tenantSlug}/{fileId}/{nombre}`.
- En BD, `storage_key` usa siempre `/` (aunque el servidor corra en Windows).

### API (JWT + módulo)

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/files?module=aircraft&entityId={uuid}` | Lista adjuntos; exige permiso del módulo. |
| `POST` | `/files` | `multipart/form-data`: campos `module`, `entityId` (opcional), archivo `file`. |
| `GET` | `/files/{id}/download` | Descarga con aislamiento por prefijo de tenant en `storage_key`. |
| `DELETE` | `/files/{id}` | Borrado lógico de metadatos (archivo en disco se conserva en 1A). |
| `GET` | `/files/storage-info` | Diagnóstico de ruta y límite (admin autenticado). |

Módulos permitidos en 1A: `aircraft`, `library`, `crew`.

## Respaldo recomendado

1. **Postgres**: `pg_dump` por base tenant (`havectrl_demoa`, `havectrl_demob`) y central (`havectrl_central`) en ventana de mantenimiento.
2. **Archivos**: copiar `STORAGE_ROOT` completo (script `havectrl-backend/scripts/backup-storage.mjs`).
3. **Restauración**: restaurar BD antes que archivos; verificar que `storage_key` en BD coincida con rutas en disco.

## Próximo paso (fuera de 1A)

- Object storage (S3-compatible), antivirus, retención legal SMS, borrado físico programado.
