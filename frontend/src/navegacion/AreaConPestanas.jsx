/**
 * @file Layout compartido de un área con pestañas (comprador u organizador):
 *   aplica la guardia de acceso de `reglas.js` y monta `Tabs` de Expo Router
 *   con `BottomNav` como barra (specs/003-navegacion-sesion/contracts/navegacion.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect, useRef } from 'react';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { decidirAcceso } from './reglas';

/**
 * Props de {@link AreaConPestanas}.
 * @typedef {Object} AreaConPestanasProps
 * @property {ReadonlyArray<import('./reglas').TabDef>} tabs Pestañas del área, en orden.
 * @property {string} prefijo Prefijo de URL del área (`''` comprador, `'/organizador'`).
 * @property {function(import('./reglas').TabDef): (object|undefined)} [listeners]
 *   Devuelve los `listeners` de la pestaña (p. ej. `tabPress`), o `undefined`.
 */

/**
 * Adapta `BottomTabBarProps` de React Navigation (versión de expo-router 58:
 * `state`, `emitter`, `navigateToTab`) a {@link BottomNav}, emitiendo
 * `tabPress` para respetar los `listeners` de cada pestaña.
 * @param {Object} props Props del `tabBar` más las pestañas.
 * @param {object} props.state Estado del navegador de pestañas.
 * @param {{emit: function(object): {defaultPrevented: boolean}}} props.emitter Emisor de eventos del navegador.
 * @param {function(string): void} props.navigateToTab Navega a la pestaña por `route.key`.
 * @param {ReadonlyArray<import('./reglas').TabDef>} props.tabs Pestañas del área.
 * @returns {JSX.Element} Barra inferior.
 */
function BarraPestanas({ state, emitter, navigateToTab, tabs }) {
	const activa = state.routes[state.index]?.name;
	const seleccionar = (clave) => {
		const ruta = state.routes.find((r) => r.name === clave);
		if (!ruta) return;
		const evento = emitter.emit({
			type: 'tabPress',
			target: ruta.key,
			canPreventDefault: true
		});
		if (!evento.defaultPrevented && clave !== activa) navigateToTab(ruta.key);
	};
	return <BottomNav items={tabs} activo={activa} alSeleccionar={seleccionar} />;
}

/**
 * Área con pestañas protegida por {@link decidirAcceso}.
 * @param {AreaConPestanasProps} props Ver {@link AreaConPestanasProps}.
 * @returns {JSX.Element} `Redirect` si la ruta no corresponde a la sesión, o el navegador de pestañas.
 */
export function AreaConPestanas({ tabs, prefijo, listeners }) {
	const t = useTheme();
	const { usuario } = useAuth();
	const ruta = usePathname();
	const router = useRouter();
	// usePathname es global: con login apilado encima, esta área sigue montada y
	// ve `/login`. Solo se decide sobre rutas propias del área.
	const propia = tabs.some((tab) => {
		const base = `${prefijo}/${tab.clave}`;
		return ruta === base || ruta.startsWith(`${base}/`);
	});
	const decision = propia
		? decidirAcceso({ usuario, ruta })
		: { tipo: 'permitir' };
	const destino = decision.tipo === 'redirigir' ? decision.href : null;
	// Al montar se redirige con <Redirect> (enlaces profundos). Si la sesión
	// cambia con el área ya montada (p. ej. expiró), se usa router.replace:
	// devolver <Redirect> desmontaría las pestañas y la navegación terminaría
	// en otra pestaña (comportamiento de expo-router 58).
	const montada = useRef(false);
	useEffect(() => {
		if (montada.current && destino) router.replace(destino);
	}, [destino, router]);
	useEffect(() => {
		montada.current = true;
	}, []);
	if (destino && !montada.current) return <Redirect href={destino} />;
	return (
		<Tabs
			initialRouteName={tabs[0].clave}
			backBehavior="history"
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: t.colors.bg }
			}}
			tabBar={(props) => <BarraPestanas {...props} tabs={tabs} />}
		>
			{tabs.map((tab) => (
				<Tabs.Screen
					key={tab.clave}
					name={tab.clave}
					options={{ title: tab.etiqueta }}
					listeners={listeners?.(tab)}
				/>
			))}
		</Tabs>
	);
}
