# TextField

Campo de texto con label arriba, helper/error abajo, prefijo/sufijo y versión multilínea.

- El consumidor provee `label` (siempre visible, nunca solo placeholder), `value`, `onChangeText` y, si corresponde, `error`.
- Campos obligatorios: `required`. Si no, el label agrega "(opcional)" — no usamos asteriscos.
- Foco: borde 2px `primary-text`. Error: borde 2px `error` + ícono + mensaje que dice cómo resolverlo ("Ingresá un precio (0 si es gratis)").
- Precios: `prefix="$"`, `keyboardType="numeric"` y formato de miles al perder foco (32.000). Cupos: `suffix="u."`.
- Multilínea con `maxLength` muestra contador `48/600`.
- Alto 52, texto 16 (evita el zoom de iOS en web y es legible con Dynamic Type).
- Contraseñas: `secureTextEntry` agrega el botón mostrar/ocultar (ojo) con su `accessibilityLabel`. Nombre de usuario: `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="username"` (el backend identifica por `nombreUsuario`, no hay email).
