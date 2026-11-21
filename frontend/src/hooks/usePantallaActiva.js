/**
 * @file Hook que indica si la pantalla está visible: enfocada en la
 *   navegación y con la app en primer plano (specs/008-chat-compra/
 *   data-model.md §5; research R2). Con `false`, el chat no consulta (SC-003).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Si un estado de `AppState` cuenta como primer plano. `background` e
 * `inactive` no; cualquier otro valor (incluido uno desconocido al arrancar) sí.
 * @param {unknown} estado Estado de la app.
 * @returns {boolean} Si está en primer plano.
 */
const enPrimerPlano = (estado) =>
	estado !== 'background' && estado !== 'inactive';

/**
 * Pantalla enfocada y app en primer plano.
 * @returns {boolean} Si la pantalla está visible.
 */
export function usePantallaActiva() {
	const [enfocada, setEnfocada] = useState(false);
	const [app, setApp] = useState(() => AppState.currentState);

	useFocusEffect(
		useCallback(() => {
			setEnfocada(true);
			return () => setEnfocada(false);
		}, [])
	);

	useEffect(() => {
		const suscripcion = AppState.addEventListener('change', setApp);
		return () => suscripcion.remove();
	}, []);

	return enfocada && enPrimerPlano(app);
}
