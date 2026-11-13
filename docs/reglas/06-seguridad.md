# Seguridad y secretos

- `.gitignore` ignora `.env` y `.env.*`, y deja pasar `.env.example`. No relajes eso.
- El bundle es público. No metas JWT de larga duración, contraseñas de demo ni claves de proveedor en código fuente ni en `VITE_*`.
- Si un secreto llegó a un remoto, se rota. Borrar el archivo no lo saca del historial.
- La sesión de la app no se comparte entre hostnames. No la copies a una cookie de dominio amplio ni a `localStorage`.
- No firmes ni confirmes en nombre de otro usuario. Esa regla de producto está en el backend; la pantalla no ofrece esa acción.
