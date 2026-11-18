# Formatos: precios y fechas

Todo en español de Argentina (es-AR). Los helpers están en `format.js` (sin dependencia de `Intl`, porque Hermes en Android puede no traer todos los locales).

## Precios (pesos argentinos)

| Caso | Formato | Ejemplo |
|---|---|---|
| Precio | `$` + espacio duro + miles con punto, sin decimales | **$ 25.000** |
| Con centavos (solo si existen) | coma decimal, 2 dígitos | $ 1.250,50 |
| Gratis | palabra, no "$ 0" | **Gratis** |
| Rango en cards | "Desde" + mínimo | **Desde $ 32.000** |
| Rango completo (detalle) | en dash con espacios | $ 32.000 – $ 85.000 |
| Total en botón | verbo + monto | **Pagar $ 70.400** |
| Cantidad × tipo | multiplicación tipográfica | 2 × Campo general |
| Negativo (descuentos) | signo menos real | −$ 6.400 |

- Usar `formatPrice(25000)` → `"$ 25.000"`. El espacio entre `$` y el número es no separable (` `) para que no corte de línea.
- Cifras tabulares (`price`, `price-lg`, `.at-num`) en listas, resúmenes y totales para que los montos se alineen.
- No escribir "ARS" ni "AR$" en la interfaz; solo en comprobantes.
- Cargos: siempre desglosados en el resumen antes de pagar ("Cargo por servicio $ 6.400").

## Fechas y horas

| Uso | Formato | Ejemplo |
|---|---|---|
| Cards y filas | día abreviado + número + mes abreviado · hora | **sáb 12 dic · 21:00** |
| Bloque de fecha en la imagen | día en `display` + mes en `overline` | **12** / **DIC** |
| Detalle del evento | completo, con año | **Sábado 12 de diciembre de 2026 · 21:00 h** |
| Formularios | numérico | 12/12/2026 · 21:30 |
| Chat | hora | 19:02 |
| Separador de chat | Hoy / Ayer / día | Hoy · Ayer · 10 nov |
| Actividad del organizador | relativo hasta 24 h, después fecha | hace 12 min · hace 1 h · ayer · 12 nov |
| Cuenta regresiva (CONFIRMADA) | días calendario | **Faltan 25 días** · Es mañana · Es hoy |
| Plazo de pago (PENDIENTE) | hora límite | Pagá antes de las 23:59 |

- Reloj de 24 h, sin "hs" en cards; "h" solo en la fecha larga.
- Días y meses en minúscula salvo al inicio de oración. Abreviaturas sin punto: lun mar mié jue vie sáb dom · ene feb mar abr may jun jul ago sep oct nov dic.
- Si el evento es de otro año, agregarlo: "vie 19 mar 2027".
- Zona horaria del evento (los eventos son presenciales): mostrar la hora local del lugar, no la del teléfono.
- `daysUntil(fecha)` cuenta días calendario, no 24 h: un evento de mañana a las 00:30 es "Es mañana".

## Números y puntajes

- Miles con punto: 1.284 reseñas. Puntaje con coma y un decimal: ★ 4,7. Porcentajes sin decimales: 88 %.
- Plurales: "1 entrada" / "2 entradas", "Queda 1" / "Quedan 14".
