# ScreenRegistro

Crear cuenta: `RoleSelector` (comprador / organizador), nombre, apellido, nombre de usuario, contraseña con requisitos en el helper y `Checkbox` de términos; CTA fijo "Crear cuenta" y link a iniciar sesión.

- Validar al perder foco cada campo y al enviar; los errores explican cómo resolverse ("El nombre de usuario no puede estar vacío").
- Nombre de usuario: `autoCapitalize="none"`, `autoComplete="username"`.
- Contraseña: 8 a 32 caracteres con mayúscula, minúscula, número y un especial (`!@#$%^&*`), listados en el helper; `autoComplete="new-password"`.
- El rol enviado al backend es `COMPRADOR` u `ORGANIZADOR` (`RoleSelector`: `buyer`/`organizer`).
- Sin términos aceptados el botón sigue habilitado y, al tocarlo, marca el error en el checkbox (no deshabilitar sin explicar).
- Al terminar: comprador → Explorar; organizador → Crear evento.
