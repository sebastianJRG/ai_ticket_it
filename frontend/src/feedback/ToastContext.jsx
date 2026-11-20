/**
 * @file Contexto de avisos (toasts): cola FIFO con un aviso visible por vez,
 *   ocultado automático a los 4 s (6 s con acción) y posición sobre la barra
 *   inferior (specs/003-navegacion-sesion/research.md R8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Toast } from '../components/Toast';

/** Duración en pantalla sin acción, en ms. */
const DURACION_MS = 4000;
/** Duración en pantalla con acción, en ms. */
const DURACION_CON_ACCION_MS = 6000;

const ToastContext = createContext(null);

/**
 * Acciones del contexto de avisos.
 * @typedef {Object} ApiToast
 * @property {function(import('../components/Toast').Aviso): void} mostrar Encola un aviso.
 * @property {function(): void} ocultar Oculta el visible y pasa al siguiente.
 */

/**
 * Provee {@link useToast} y renderiza el aviso visible.
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns {JSX.Element} Proveedor de avisos.
 */
export function ToastProvider({ children }) {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const [cola, setCola] = useState([]);
	const siguienteId = useRef(0);
	const entrada = useRef(new Animated.Value(0)).current;
	const visible = cola[0] ?? null;

	const mostrar = useCallback((aviso) => {
		siguienteId.current += 1;
		const id = siguienteId.current;
		setCola((c) => [...c, { ...aviso, id }]);
	}, []);

	const ocultar = useCallback(() => setCola((c) => c.slice(1)), []);

	useEffect(() => {
		if (!visible) return undefined;
		entrada.setValue(0);
		Animated.timing(entrada, {
			toValue: 1,
			duration: t.motion.duration.base,
			useNativeDriver: true
		}).start();
		if (visible.tono !== 'error') {
			AccessibilityInfo.announceForAccessibility?.(
				visible.mensaje
					? `${visible.titulo}. ${visible.mensaje}`
					: visible.titulo
			);
		}
		const timer = setTimeout(
			ocultar,
			visible.accion ? DURACION_CON_ACCION_MS : DURACION_MS
		);
		return () => clearTimeout(timer);
		// `visible` solo cambia de identidad cuando cambia el aviso al frente de la cola.
	}, [visible, entrada, ocultar, t.motion.duration.base]);

	const valor = useMemo(() => ({ mostrar, ocultar }), [mostrar, ocultar]);

	return (
		<ToastContext.Provider value={valor}>
			<View style={{ flex: 1 }}>
				{children}
				{visible ? (
					<Animated.View
						pointerEvents="box-none"
						style={{
							position: 'absolute',
							left: t.spacing[4],
							right: t.spacing[4],
							bottom: insets.bottom + t.sizes.bottomNavHeight + t.spacing[2],
							opacity: entrada
						}}
					>
						<Toast
							key={visible.id}
							tono={visible.tono}
							titulo={visible.titulo}
							mensaje={visible.mensaje}
							accion={visible.accion}
							alCerrar={ocultar}
						/>
					</Animated.View>
				) : null}
			</View>
		</ToastContext.Provider>
	);
}

/**
 * Devuelve las acciones de avisos.
 * @returns {ApiToast} `mostrar` y `ocultar`.
 * @throws {Error} Si se usa fuera de {@link ToastProvider}.
 */
export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider.');
	return ctx;
}
