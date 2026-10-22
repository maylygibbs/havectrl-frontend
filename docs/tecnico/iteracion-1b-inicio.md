# Iteración 1B — operación (avance)

Referencia: [04-apis-e-iteraciones.md](../../havectrl-backend/docs/producto/04-apis-e-iteraciones.md) · Checklist: [iteracion-1-cierre.md](./iteracion-1-cierre.md).

## Entregado en código (sin commit)

| Capacidad | Backend | Frontend |
| --- | --- | --- |
| Alta de vuelo | `POST /flights` (+ tramo 1 automático) | Modal planificación |
| Tramos | `GET` detalle incluye `legs`; `POST /flights/:id/legs`; `PUT/DELETE /flights/legs/:id` | Modal detalle: grilla tramos + alta/baja |
| Daily Log (upsert) | `PUT /flights/:id/log` (único LOG por vuelo, reintento actualiza) | Formulario en modal detalle |
| Edición vuelo | `PUT /flights/:id` | Pendiente UI |
| Migración | `006_flight_legs.sql` + backfill tramo desde ruta | — |

## 1A cerrado en UI (mismo avance)

- Ajustes → **Integrations**: tabla “Sin configurar” / Iteración 2.
- Vuelos → **Tracking / Weather / Converter**: mensaje MVP (iteración 2).
- SMS: búsqueda en grilla omite `narrative`.

## Pendiente 1B

- FPL Venezuela PDF, DLA/CHG/CNL, manifiesto.
- Offline y contadores en aeronave (idempotencia end-to-end).
- PDF export LOG/plan.
- Operations Services CRUD manual.
- Maintenance + Log Review operativo.
- W&B: adjunto por vuelo (archivos).

## Probar

```bash
cd havectrl-backend && npm run db:migrate && npm run start:dev
cd havectrl-frontend && npm run dev
```

1. Vuelos → Abrir un vuelo → añadir tramo, guardar bitácora.  
2. Ajustes → Integrations.  
3. Tracking: solo mensaje “no disponible iteración 1”.
