/**
 * @file Selector de rol al registrarse (comprador u organizador).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ChoiceCard } from './ChoiceCard';

/**
 * Roles que acepta el backend (`rol` en POST /api/usuarios).
 * @typedef {'COMPRADOR'|'ORGANIZADOR'} Rol
 */

/**
 * Props de {@link RoleSelector}.
 * @typedef {Object} RoleSelectorProps
 * @property {Rol} [value] Rol inicial (por defecto COMPRADOR).
 * @property {function(Rol): void} [onChange] Handler con el rol elegido, tal como lo espera el backend.
 */

/**
 * Grupo de dos ChoiceCard con selección única.
 * @param props Ver {@link RoleSelectorProps}.
 * @returns Vista con rol radiogroup.
 */
export function RoleSelector({ value = 'COMPRADOR', onChange }) {
	const t = useTheme();
	const [rol, setRol] = useState(value);
	const pick = (r) => {
		setRol(r);
		onChange?.(r);
	};
	return (
		<View
			accessibilityRole="radiogroup"
			accessibilityLabel="¿Cómo vas a usar AI Ticket It?"
			style={{ gap: t.spacing[2] }}
		>
			<ChoiceCard
				icon="Ticket"
				title="Quiero comprar entradas"
				description="Explorá, comprá y seguí tus compras."
				selected={rol === 'COMPRADOR'}
				onPress={() => pick('COMPRADOR')}
			/>
			<ChoiceCard
				icon="Calendar"
				title="Quiero organizar eventos"
				description="Publicá eventos y vendé entradas."
				selected={rol === 'ORGANIZADOR'}
				onPress={() => pick('ORGANIZADOR')}
			/>
		</View>
	);
}
