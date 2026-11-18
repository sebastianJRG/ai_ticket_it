# TicketTypeForm

Bloque de alta de un tipo de entrada (nombre, descripción, precio, cupo), repetible dentro de Crear evento.

- Numerado ("Tipo de entrada 1"); el primero no se puede eliminar, los siguientes tienen papelera (pide confirmación si ya tiene datos).
- Precio con prefijo "$" y "0 = gratis"; cupo entero > 0. Validar al perder foco y al publicar; los errores dicen cómo resolverse.
- Debajo del último, `AddTicketTypeButton` (borde punteado) agrega otro. Sugerir nombres: General, Platea, VIP.
- En edición de un evento con ventas, el cupo no puede bajar de lo vendido (helper: "Ya vendiste 586").
