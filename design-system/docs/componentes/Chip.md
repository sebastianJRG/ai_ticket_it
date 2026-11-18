# Chip

Chips de categoría (selección única, scroll horizontal) y de filtro (selección múltiple, removibles).

- **Categoría** (`variant="category"`, 40 de alto + área táctil 44): ícono + nombre. Seleccionado = relleno `primary`. Fila horizontal con `CategoryChips`, padding lateral `space-4`, gap `space-2`.
- **Filtro** (`variant="filter"`, 36 + hitSlop): contorno `border-strong`; seleccionado = `primary-soft` + borde y texto `primary-text` + check. `removable` en los filtros aplicados arriba de los resultados.
- Labels cortos (1–3 palabras). Precios en filtros con formato "Hasta $ 50.000".
