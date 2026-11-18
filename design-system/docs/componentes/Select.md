# Select

Campo de selección única (categoría, tipo de documento, etc.) con lista de opciones.

- Mismo alto y estilo que TextField; el valor seleccionado puede llevar ícono.
- En React Native abrir las opciones en un **BottomSheet** (no un dropdown flotante): más de 5 opciones → sheet con scroll; el menú inline del preview muestra el estilo de cada opción.
- Opción elegida: fondo `primary-soft`, texto `primary-text` y check.
- Usar `Chip` en lugar de Select cuando hay ≤ 6 opciones y conviene verlas todas (filtros).
