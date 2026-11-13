# Archivos y respaldo (negocio)

## Qué puede hacer el operador en 1A

- Adjuntar archivos a una **aeronave** (pestaña Documentos): certificados escaneados, PDF de pólizas, etc.
- Los archivos quedan **aislados por compañía** (mismo criterio que el resto del tenant).
- Solo perfiles con acceso al módulo correspondiente pueden subir, listar o descargar.

## Respaldo

La operación debe incluir **base de datos + carpeta de archivos** en el mismo plan de backup. Sin la carpeta, los adjuntos listados en la app no se recuperan aunque la BD esté intacta.

Detalle técnico: [almacenamiento-respaldo.md](../tecnico/almacenamiento-respaldo.md).
