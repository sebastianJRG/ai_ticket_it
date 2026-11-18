# ScreenLogin

Iniciar sesión: imagen de evento arriba que se funde con `bg`, nombre en `display-lg`, nombre de usuario (`autoCapitalize="none"`, `autoComplete="username"`), contraseña con mostrar/ocultar, CTA `primary` "Iniciar sesión", alternativa `secondary` "Explorar eventos sin cuenta" y link a crear cuenta.

- Explorar no requiere sesión; se pide al comprar, guardar favoritos o crear un evento (y al terminar se vuelve a esa acción).
- Credenciales incorrectas: error inline bajo la contraseña ("El usuario o la contraseña no coinciden"), sin decir cuál de los dos falló. Botón en `loading` mientras valida.
- Fuera de alcance por ahora (el backend no tiene endpoints): "¿Olvidaste tu contraseña?" y login con Google/Apple.
