# HaveCtrl frontend

Ley de implementación. El detalle de producto está en el backend: `../havectrl-backend/docs/producto/`. La arquitectura y el multitenant están en [06-arquitectura-multitenant.md](../havectrl-backend/docs/producto/06-arquitectura-multitenant.md). El corte de fase está en [04-apis-e-iteraciones.md](../havectrl-backend/docs/producto/04-apis-e-iteraciones.md). Las dudas abiertas se tratan como en [05-dudas.md](../havectrl-backend/docs/producto/05-dudas.md): no se amplía el alcance para “completar” una pantalla.

## Arquitectura y multitenant

Hay un frontend y un backend. El frontend es un solo build. El tenant es el hostname de la página (`demoa.localhost`, `demob.localhost`). Al cargar se llama `GET /common/domain/config`. El navegador manda `Origin`. El backend lee `Origin`, luego `Referer`, `X-Forwarded-Host` y `Host`, y solo acepta un hostname registrado en la base central.

El front no envía el slug de la compañía, no elige la base y no abre Postgres. La base central guarda el mapa hostname → conexión. Cada cliente tiene su propia base, con el mismo nombre (`demoa`, `demob`). Los cambios de esquema los aplica el backend con migraciones en `havectrl-backend/migrations`.

La sesión guardada en `sessionStorage` pertenece a ese origen. No se reutiliza en otro hostname. El branding visible sale de la respuesta de dominio: nombre, frase, marca y colores de la tabla `branding` de esa compañía.

## Un build, un cliente por hostname

Hay un solo build. Al cargar se pide `GET /common/domain/config`. El navegador manda `Origin`. El front no envía el slug de la compañía como si pudiera elegirlo.

La marca HAVECTRL permanece en la aplicación: logo, negro, blanco, plata y acento azul cielo. El logo del operador se usa en la vista previa de un PDF, no como reemplazo de la marca de la app. Los colores por tenant que pinte toda la pantalla quedan en pausa hasta resolver la duda 2.

## La interfaz no autoriza

Ocultar un menú es cortesía. El backend rechaza la acción. No muestres contadores, resultados de búsqueda ni notificaciones de un módulo o un reporte SMS que el usuario no puede abrir.

Flight Tracking no se muestra en la iteración 1. Cuando exista, la pestaña y el mapa solo se montan para administrador y jefe de pilotos, después de entrar a la pestaña y pulsar abrir el mapa. Abrir Flights no inicializa un mapa.

No hay pestaña de gastos dentro de Flights. El gasto se abre en Operations Services.

## Estados

Distingue cargando, sin permiso, sin red, datos parciales, fuente no disponible y consulta vacía. Vacío no es cero y no es “todo operativo”.

Un documento firmado no se edita en el mismo formulario: la corrección es una versión, con motivo. Los campos calculados se ven distintos de los editables. El error queda junto al campo y no borra lo ya escrito.

El color acompaña al texto del estado. No uses solo un punto de color.

## Idioma y códigos

Inglés es el idioma inicial. Español se elige en el login y en preferencias, y se guarda en la cuenta. Traduce etiquetas, botones, validaciones y estados. No traduzcas matrículas, códigos OACI, FPL, DLA, CHG, CNL, METAR, TAF, NOTAM ni el texto de un formulario oficial o de una firma.

Cambiar de idioma no cambia identificadores, filtros ni el borrador.

## Iteración 1

Construye las pantallas de Home, Settings, Crew, Aircraft, Flights (plan Venezuela, LOG, conversor, adjunto de peso y balance), Operations Services, Maintenance básico, SMS, actas y biblioteca.

No dibujes mapas en vivo, clima, NOTAM, seguimiento, llamada con video ni un chat de IA como si ya funcionaran. Si la pestaña existe en el manual y pertenece a otra iteración, no la ofrezcas activa.

Una vista de demostración con datos fijos no cuenta como la función.

## Código

React y Vite. TypeScript estricto. Textos de interfaz en el catálogo de idioma, no dispersos en el componente salvo el nombre propio HAVECTRL.

No guardes el token de un proveedor aeronáutico en el navegador: en esta iteración no hay proveedor. La sesión de la app no se comparte entre hostnames.
