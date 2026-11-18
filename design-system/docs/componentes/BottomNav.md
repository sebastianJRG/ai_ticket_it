# BottomNav

Navegación inferior por rol, con indicador pill en `primary` y punto de novedad.

- **Comprador**: Explorar · Buscar · Favoritos · Compras · Perfil.
- **Organizador**: Mis eventos · Crear · Mensajes · Perfil.
- Un usuario con ambos roles cambia de modo desde Perfil; nunca mezclar ítems de los dos.
- `dots` marca novedades (mensaje nuevo, compra que cambió de estado) en `secondary`.
- Alto 64 + safe area inferior (`useSafeAreaInsets().bottom`). Labels siempre visibles.
