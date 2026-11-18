# MessageComposer

Input de mensaje del chat con botón enviar; se bloquea cuando la compra ya no admite chat.

- Pill `surface-raised`, crece hasta 4 líneas; enviar (44, `primary`) deshabilitado si el texto está vacío.
- Va pegado al teclado (`KeyboardAvoidingView` / `react-native-keyboard-controller`) y respeta la safe area inferior.
- `locked` con motivo explícito (p. ej. compra reembolsada hace más de 30 días).
