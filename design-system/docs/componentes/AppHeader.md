# AppHeader

Header de pantalla: default (back + título + acciones), large title y transparente sobre imagen.

- `default` (56 + safe area superior): pantallas internas. `subtitle` para el contexto (nombre del evento).
- `large`: raíz de cada tab (Mis compras, Mis eventos) con `display-lg`.
- `transparent`: detalle de evento sobre la foto; los botones usan `onImage`. Al scrollear pasar a `default` con fondo `bg` y `shadow-md`.
- Máximo 2 acciones a la derecha; el resto en el menú "más".
