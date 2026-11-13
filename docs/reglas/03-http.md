# HTTP

`src/api.ts` es el único sitio que llama a `fetch` y pone `Authorization`.

- Un componente pide datos con `api`, `uploadFile`, `fetchStoredFileBlob` o `downloadAuthorized`. No armes otro header de sesión.
- El token de la app sale de `sessionStorage` (`havectrl.session`) y se manda como Bearer. No lo copies a `localStorage`.
- No guardes el token de un proveedor aeronáutico en el navegador. Esta iteración no tiene ese proveedor.
- `VITE_API_URL` es público. No pongas ahí un secreto.
- El error de red, el 401 y el dominio desconocido se muestran como estados distintos. Vacío no es cero y no es «todo operativo».
