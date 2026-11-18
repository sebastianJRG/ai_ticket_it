# ChoiceCard

Opción grande de selección única con ícono, título y descripción; `RoleSelector` la usa para elegir rol al registrarse.

- Seleccionada: borde 2px `primary-text`, fondo `primary-soft`, ícono sobre `primary` y radio marcado.
- Toda la card es el target (`accessibilityRole="radio"`, dentro de un `radiogroup` con label).
- Títulos en primera persona y con verbo ("Quiero comprar entradas"); descripción de una línea.
- `RoleSelector`: comprador (por defecto) u organizador. El rol es único y no se cambia después (backend: un `rol` por usuario). Mapeo: `buyer` → `COMPRADOR`, `organizer` → `ORGANIZADOR`.
