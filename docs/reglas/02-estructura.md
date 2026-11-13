# Estructura

- `src/api.ts` — HTTP, sesión en `sessionStorage`, config de dominio.
- `src/i18n/catalog.ts` — todos los textos de interfaz, `en` y `es`.
- `src/Workspace.tsx` — shell, navegación según `modules`, cambio de vista.
- `src/modules/` — una pantalla por módulo. Subcarpetas cuando el módulo ya las tiene (`crew/`).
- `src/ui/` — piezas compartidas. No metas una llamada de negocio nueva aquí.
- `docs/reglas/` — ley de agentes. El producto no se duplica: vive en el backend, `docs/producto/`.

No abras un segundo cliente HTTP ni un segundo catálogo de textos.
