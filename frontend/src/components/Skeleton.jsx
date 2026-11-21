/**
 * @file Placeholder de carga con pulso suave; sin animación si el sistema
 *   tiene "reducir movimiento" (design-system/docs/componentes/Skeleton.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Props de {@link Skeleton}.
 * @typedef {Object} SkeletonProps
 * @property {number|string} [ancho] Ancho (`'100%'` por defecto).
 * @property {number} [alto] Alto en px (16 por defecto).
 * @property {'sm'|'md'|'lg'|'xl'|'full'} [radio] Radio del theme (`sm` por defecto).
 * @property {import('react-native').ViewStyle} [estilo] Estilo extra para componer formas.
 * @property {string} [testID] Identificador de pruebas (`skeleton` por defecto).
 */

/**
 * Hook: `true`/`false` según "reducir movimiento"; `null` mientras se consulta.
 * @returns {boolean|null} Preferencia del sistema.
 */
function useReducirMovimiento() {
	const [reducir, setReducir] = useState(null);
	useEffect(() => {
		let vivo = true;
		AccessibilityInfo.isReduceMotionEnabled()
			.then((v) => vivo && setReducir(!!v))
			.catch(() => vivo && setReducir(false));
		const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) =>
			setReducir(!!v)
		);
		return () => {
			vivo = false;
			sub?.remove?.();
		};
	}, []);
	return reducir;
}

/**
 * Bloque decorativo que pulsa la opacidad entre `opacity.skeletonMin` y 1.
 * @param {SkeletonProps} props Ver {@link SkeletonProps}.
 * @returns {JSX.Element} Vista animada no accesible.
 */
export function Skeleton({
	ancho = '100%',
	alto = 16,
	radio = 'sm',
	estilo,
	testID = 'skeleton'
}) {
	const t = useTheme();
	const reducir = useReducirMovimiento();
	const opacidad = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (reducir !== false) {
			opacidad.setValue(1);
			return undefined;
		}
		const mitad = t.motion.duration.skeleton / 2;
		const animacion = Animated.loop(
			Animated.sequence([
				Animated.timing(opacidad, {
					toValue: t.opacity.skeletonMin,
					duration: mitad,
					useNativeDriver: true
				}),
				Animated.timing(opacidad, {
					toValue: 1,
					duration: mitad,
					useNativeDriver: true
				})
			])
		);
		animacion.start();
		return () => animacion.stop();
	}, [reducir, opacidad, t]);

	return (
		<Animated.View
			testID={testID}
			accessible={false}
			importantForAccessibility="no-hide-descendants"
			style={[
				{
					width: ancho,
					height: alto,
					borderRadius: t.radius[radio] ?? t.radius.sm,
					backgroundColor: t.colors.surfaceRaised,
					opacity: opacidad
				},
				estilo
			]}
		/>
	);
}
