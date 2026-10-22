# Checklist — cierre Iteración 1 (MVP completo)

Fuente de alcance: documento `04-apis-e-iteraciones.md` en el repo **havectrl-backend** (`docs/producto/`) — hitos **1A**, **1B**, **1C** + entrega operativa.

Detalle del hito base: [iteracion-1a-checklist.md](./iteracion-1a-checklist.md). Avance 1B: [iteracion-1b-inicio.md](./iteracion-1b-inicio.md).

**Convención:** marcar `[x]` solo cuando negocio/QA acepte el ítem en demo o entorno acordado.

---

## Resumen de hitos

| Hito | Descripción (doc producto) | Progreso estimado |
| --- | --- | --- |
| **1A** | Base: tenant, roles, crew, aircraft, archivos, settings | ~90 % — ver checklist 1A |
| **1B** | Operación: vuelos/tramos, FPL, LOG, operations, mantenimiento | ~15 % |
| **1C** | Cierre: SMS completo, actas/biblioteca, pruebas por perfil, guía admin | ~20 % |
| **Entrega** | Código, despliegue, migraciones, pruebas críticas, respaldo | Parcial |

Las **APIs externas** (mapas, ADS-B, clima, Lido, etc.) son **Iteración 2**; no bloquean este checklist.

---

## 1A — Base (cerrar antes de declarar 1A aceptado)

### Multitenant y seguridad

- [ ] ACC-01: una compañía no lee datos de otra (JWT + BD por tenant; integración en CI con `INTEGRATION_TEST=1`)
- [ ] ACC-02: Home y módulos respetan matriz de perfiles (`access.ts`)
- [ ] SMS reservado: bandeja y conteo Home solo `admin` / `jefe_sms`
- [ ] Búsqueda/listados: campos sensibles SMS (`narrative`, `reporter_email`) no filtrables sin permiso de lectura completa
- [ ] Revocación / sesión: flujo documentado y probado (login, `GET /auth/me`, logout)

### Crew

- [ ] Data: CRUD + soft delete + ficha (assignments, experience demo)
- [ ] Schedule: listado global + alta/baja manual de assignments
- [ ] Experience: lectura aceptada como demo hasta LOG 1B (o derivación mínima documentada)

### Aircraft

- [ ] Ficha, discrepancias, historial de vuelos (lectura)
- [ ] Documentos: CRUD + modal UI
- [ ] Adjuntos: subida, descarga, preview, desactivar (`/files` + UI)

### Settings y archivos

- [ ] Compañía editable (nombre, lema, colores)
- [ ] Usuarios: listado + cambio de perfil (`PATCH .../profile`)
- [ ] Idioma usuario (`PATCH /settings/language`) + i18n EN/ES en UI
- [ ] Pestaña Integrations: estado **Not configured** (sin prometer proveedor)
- [ ] `STORAGE_ROOT`, migración `005_storage.sql`, script `backup-storage.mjs` probado en demo
- [ ] (Opcional 1A) Borrado físico de binarios al desactivar archivo

### UI / anexo visual (1A)

- [ ] Módulos principales montados (Home, Crew, Aircraft, Flights, Operations, Maintenance, SMS, Communication, Library, Settings)
- [ ] Formularios críticos en modal; grillas con búsqueda por listado
- [ ] PR backend + frontend mergeados por humano (no bot a `main`)

### Pruebas automáticas 1A

- [ ] `npm test` backend verde (unit)
- [ ] `npm run build` backend y frontend verdes
- [ ] ACC-01 integración ejecutada al menos en local antes de release 1A

---

## 1B — Operación

### Flights (parte interna, sin APIs de pago)

- [ ] Tramos asociados al vuelo (modelo + API + UI)
- [ ] Alta/edición de vuelo más allá de `POST /flights` (estados, tramos)
- [ ] FPL Venezuela en **PDF** (generación o plantilla + descarga)
- [ ] DLA / CHG / CNL como documentos + presentación manual registrada
- [ ] Manifiesto (registro / adjunto según spec módulo)
- [ ] Daily Log operativo (captura, revisión básica en UI)
- [ ] Sincronización **offline** y conservación de **hora del evento**
- [ ] Contadores (horas/ciclos): **idempotencia** — reintento no duplica LOG ni contadores
- [ ] PDF de LOG y de plan exportables
- [ ] Peso y balance: **adjunto** de documento externo (no motor de cálculo)
- [ ] Pestañas Weather / Tracking / Converter: “no disponible en MVP” alineado a RP11–RP14 (nadie abre mapa/tracking real en iter 1)

### Operations Services (manual)

- [ ] CRUD o flujo completo de solicitudes de servicio
- [ ] Tasas, gastos, comprobantes, pagos registrados a mano (enlace pago = URL)
- [ ] Regla: gastos sin auto-aprobación del mismo actor (ACC aplicable)

### Maintenance (alcance básico)

- [ ] Inspecciones / discrepancias / órdenes: más que lectura seed (acciones mínimas acordadas)
- [ ] Log Review operativo
- [ ] Separación revisión administrativa vs liberación técnica (servidor valida facultad)

### Historial y correcciones

- [ ] Corregir un registro “confirmado” deja **historial** auditable
- [ ] Firma / facultad técnica validadas en **servidor** (no solo UI)

---

## 1C — Cierre del MVP

### SMS

- [ ] Envío de reportes (roles autorizados)
- [ ] Expediente reservado (lectura restringida)
- [ ] Pestañas / flujo acordado con manual SMS (mínimo viable documentado)

### Communication (sin llamada / sin IA)

- [ ] Agenda y reuniones: acta manual o cargada, revisión, firmas/versiones (alcance mínimo spec)
- [ ] Calls / video: explícitamente fuera o “Not configured”

### Aviation Library (sin IA)

- [ ] Catálogo + lector
- [ ] Subida/administración de PDF del operador, versiones y marcadores (mínimo spec)

### Calidad y adopción

- [ ] Pruebas manuales con cuenta de **cada perfil** (RP01–RP10; RP11–RP14 = tracking no accesible)
- [ ] Matriz ACC crítica (ACC-01 … ACC-20) ejecutada o excepciones documentadas
- [ ] Guía de **administración** (tenant, usuarios, respaldo, migraciones)
- [ ] Correcciones de hallazgos bloqueantes cerradas

---

## Entrega de la iteración 1 (doc §61)

- [ ] Código en repos `havectrl-backend` y `havectrl-frontend` (ramas integradas vía PR)
- [ ] Migraciones tenant aplicadas en entorno demo/producción objetivo (`004`, `005`, …)
- [ ] Permisos documentados (matriz + volumen 01 referenciado)
- [ ] Despliegue repetible (README / runbook)
- [ ] Respaldo y **restauración** probados (no solo script escrito)
- [ ] Una demo puntual **no** sustituye esta entrega

---

## Criterios bloqueantes (no entregar sin resolver)

| # | Criterio (04-apis-e-iteraciones) | Checklist |
| --- | --- | --- |
| B1 | Una compañía no lee a otra | 1A ACC-01 |
| B2 | SMS no filtra por búsqueda/export/Home sin permiso | 1A búsqueda SMS + Home |
| B3 | Evento offline conserva su hora | 1B offline |
| B4 | LOG y contadores no se duplican al reintentar | 1B idempotencia |
| B5 | Corregir confirmado deja historial | 1B historial |
| B6 | Firma y facultad técnica en servidor | 1B maintenance/log |
| B7 | Tracking (cuando exista) no toca LOG | Iter 2 / pestaña cerrada en iter 1 |

---

## Orden sugerido de trabajo

1. Cerrar **1A** (ítems sin marcar arriba + PR + migraciones demo).
2. **1B** en cadena: tramos → Daily Log + contadores/idempotencia → FPL PDF + mensajes DLA/CHG/CNL → Operations CRUD → Maintenance/Log Review.
3. **1C** en paralelo al final de 1B: Communication/Library mínimos, SMS pestañas, ACC/RP manual, guía admin.
4. Ejecutar bloque **Entrega** y tabla **B1–B7**.

---

## Registro de aceptación

| Fecha | Hito | Aceptado por | Notas |
| --- | --- | --- | --- |
| | 1A | | |
| | 1B | | |
| | 1C | | |
| | Iteración 1 completa | | |
