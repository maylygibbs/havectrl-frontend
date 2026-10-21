# UI alineada al Anexo Visual

Documento técnico de la maquetación frontend según `HAVECTRL_Anexo_Visual.pdf` (12 láminas).

## Fuentes de diseño

| Fuente | Uso |
| --- | --- |
| `HAVECTRL_Anexo_Visual.pdf` | Láminas de interfaz (estructura, tabs, layout) |
| `design-assets/marketing/source-pack-20261021/` | Pack oficial de heroes y logos (2026-10-21) |
| `design-assets/anexo-laminas/sheet-*.png` | Extracción de láminas PDF (referencia, no runtime) |
| `havectrl-frontend/public/heroes/*.png` | Banners servidos por Vite |
| `havectrl-frontend/public/logo-havectrl.png` | Logo sin fondo en login, sidebar y settings |

## Heroes por módulo (assets oficiales)

| Módulo | Archivo | Origen |
| --- | --- | --- |
| Home | `heroes/hero-home.png` | Prototipo anexo (Beechcraft en pista) |
| Flights | `heroes/hero-flights.png` | Pack `image0` |
| Operations | `heroes/hero-operations.png` | Pack `image1` |
| Maintenance | `heroes/hero-maintenance.png` | Pack `image2` |
| SMS | `heroes/hero-sms.png` | Pack `image3` |
| Communication | `heroes/hero-communication.png` | Pack `image4` |
| Library | `heroes/hero-library.png` | Pack `image5` |
| Crew | `heroes/hero-crew.png` | Pack `image6` |
| Aircraft | `heroes/hero-aircraft.png` | Mismo hero Beechcraft del anexo (hasta llegue carpeta `home _ crew _ aircraft`) |

Detalle de rutas: `design-assets/marketing/README.md`.

## Shell

- Sidebar oscura con logo, módulos e identidad de usuario.
- Barra superior con búsqueda, reloj e idioma.
- Área de contenido clara con paneles y tablas.

## Módulos montados

| Módulo | Tabs (Anexo) | Hero | Layout |
| --- | --- | --- | --- |
| Home | — | `heroes/hero-home.png` | Métricas + vuelos + flota + actividad |
| Settings | General, Units, Alerts, Roles, Templates, Integrations | — | Perfil compañía + usuarios |
| Crew | Data, Schedule, Experience | `hero-crew.png` | Master-detail + CRUD; alta/edición en modal |
| Aircraft | Overview, Documents, Discrepancies, Flight History | `hero-aircraft.png` | Lista flota + detalle |
| Flights | Planning, Plan, Daily Log, W&B, Tracking, Weather, Converter | `hero-flights.png` | Tabs + listados API; detalle de vuelo en `Modal`; búsqueda por grilla vía `DataTable` / `TableSearchBar` |
| Operations | Overview, Fees, Services, Payments, Documents | `hero-operations.png` | Servicios y gastos |
| Maintenance | Overview, Inspections, Discrepancies, Orders, Components, History | `hero-maintenance.png` | Tabs + tablas API |
| Communication | Calls, Meetings | `hero-communication.png` | Meetings con datos; Calls placeholder |
| SMS / Library | — | `hero-sms.png` / `hero-library.png` | SMS: grilla fija + reporte en modal; Library catálogo |

## Componentes compartidos

- `src/ui/ModuleChrome.tsx` — hero, tabs, master list, status pills
- `src/ui/Modal.tsx` — diálogo modal para formularios de alta/edición (Crew, SMS)
- `src/ui/ConfirmModal.tsx` + `useConfirm` — confirmaciones de borrado lógico (sin `window.confirm`)
- `src/ui/FilePreviewModal.tsx` — vista previa de adjuntos (imagen / PDF) en modal ancho
- `src/ui/table.tsx` — tablas y panel de detalle
- `src/modules/*Page.tsx` — pantallas por módulo

## Nota de producto

Las pestañas siguen la estructura del anexo. Los flujos profundos (mapa de ruta, video call, conversor, etc.) quedan como layout/placeholder cuando la API de la iteración aún no los expone. Los listados y CRUD existentes siguen operativos.
