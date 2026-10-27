# Tenancy y marca

- Al cargar, `loadDomainConfig` llama `GET /common/domain/config`. El navegador manda `Origin`. El front no envía el slug.
- Un hostname que el backend no reconoce se muestra como dominio no registrado. No hay fallback a `demoa` ni a otro cliente.
- La sesión pertenece a ese origen. Cambiar de `demoa.localhost` a `demob.localhost` no reutiliza el token.
- El branding visible (nombre, frase, colores de acento) sale de esa respuesta. El logo de la app sigue siendo HAVECTRL (`/logo-havectrl.png`). El logo del operador no lo sustituye en la interfaz.
- Cómo se pintan los colores de tenant está decidido en `../havectrl-backend/docs/producto/05-dudas.md` (duda 2). No reabras esa decisión en un componente.

No añadas un query param ni un campo de formulario para elegir la compañía.
