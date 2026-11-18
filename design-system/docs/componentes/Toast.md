# Toast

Mensaje breve y no bloqueante con ícono por tono y acción opcional.

- Aparece arriba de la bottom nav, `duration-base` con `ease-enter`; se va solo a los 4 s (6 s si tiene acción).
- Tonos: success (compra confirmada), error (pago rechazado), info (guardado en favoritos), warning (tiempo para pagar).
- Una línea de título; mensaje opcional de una línea. Acción `ghost` de una palabra (Ver, Deshacer, Reintentar).
- Errores que bloquean una tarea no van en toast: van inline o en Modal.
