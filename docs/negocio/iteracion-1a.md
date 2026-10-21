# Primera entrega: Iteración 1A (Base)

Para negocio y QA, la **primera aceptación** del MVP es el hito **1A**, no la iteración completa.

## Qué debe poder hacer el usuario

- Entrar por el subdominio de su compañía (`demoa.localhost`, `demob.localhost`) sin ver datos de otra.  
- Ver en Home solo módulos y cifras permitidas por su rol.  
- Gestionar **tripulación** (ficha) y **programación manual** (turnos/actividades).  
- Consultar **aeronaves** con documentos, discrepancias ligadas a mantenimiento e historial de vuelos.  
- **Administrador:** editar perfil de compañía (nombre, lema, colores) y asignar rol/perfil a usuarios en Ajustes.  
- **Administrador / mantenimiento:** documentos de aeronave (alta, edición, baja lógica) en modal con grilla fija.  
- **SMS:** cualquier rol autorizado envía reportes; la bandeja completa solo administrador y jefe SMS.

## Qué no entra en 1A

- Plan de vuelo Venezuela completo, Daily Log operativo, Operations de punta a punta (1B).  
- Mapas, clima, NOTAM, ADS-B (Iteración 2).  
- Llamadas con video, IA en biblioteca (ampliaciones).

## Cómo probar hoy

1. Levantar backend y frontend (ver README del backend).  
2. `http://demoa.localhost:5174` — `admin@demoa.local` / `havectrl-demo`.  
3. Crew → Schedule: listar y crear una actividad; Data: abrir ficha con experiencia demo.  
4. Aircraft: pestañas Documents / Discrepancies / Flight History con datos seed.  
5. Piloto (`piloto@demoa.local`): no debe ver Ajustes ni conteo reservado de SMS en Home.
