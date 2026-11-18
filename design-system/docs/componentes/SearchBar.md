# SearchBar

Barra de búsqueda tipo pill con botón de filtros y contador de filtros activos.

- Placeholder que enseña qué se puede buscar: "Buscá artistas, obras, eventos…".
- En Home es un disparador: al tocar navega a Búsqueda con el teclado abierto.
- El botón de filtros pasa a `primary` y muestra el número en `secondary` cuando hay filtros activos; abre un BottomSheet.
- Botón para borrar el texto cuando hay valor (`accessibilityLabel="Borrar búsqueda"`).
- Búsqueda con debounce de 300 ms; mientras carga, mostrar `EventCardSkeleton` en la lista, no un spinner.
