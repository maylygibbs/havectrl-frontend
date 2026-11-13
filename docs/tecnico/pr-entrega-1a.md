# PR — cierre iteración 1A (backend + frontend)

Repos separados:

| Repo | Rama sugerida |
| --- | --- |
| `havectrl-backend` | `feature/iter1-soft-delete-crew-i18n` |
| `havectrl-frontend` | `feature/iter1-soft-delete-crew-i18n` |

## Antes del PR

```bash
# Backend
cd havectrl-backend
npm run db:migrate
npm test
# Opcional con Postgres local:
# PowerShell: $env:INTEGRATION_TEST=1; npm run test:integration
npm run build

# Frontend
cd havectrl-frontend
npm run build
```

## Checklist PR

- [ ] Migración `005_storage.sql` aplicada en entornos demo.
- [ ] `STORAGE_ROOT` creado y en `.gitignore` (no commitear binarios).
- [ ] Tests unitarios verdes; integración ejecutada al menos en local.
- [ ] Docs en `/docs` actualizados (1A, almacenamiento, 1B inicio).
- [ ] Revisor humano mergea (no bot a `main`/`master`).

## Título sugerido

`feat(1A): settings, aircraft docs, storage API, flights create, UI modals`
