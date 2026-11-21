/**
 * @file Selector de categoría del formulario Crear evento, con alta rápida
 *   dentro del mismo BottomSheet (specs/007-organizador-eventos/research.md R8;
 *   contracts/pantallas.md › Selector de categoría). Carga las categorías con
 *   `useCategorias`, crea con `useCrearCategoria` y avisa con toast. Para
 *   recargar la lista, el padre lo vuelve a montar (cambiando su `key`).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../feedback/ToastContext';
import { useCategorias } from '../hooks/useCategorias';
import { useCrearCategoria } from '../hooks/useCrearCategoria';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { TextField } from '../components/TextField';
import { mensajeError } from './presentacion';
import { validarCategoria } from './formularioEvento';

/**
 * Props de {@link SelectorCategoria}.
 * @typedef {Object} SelectorCategoriaProps
 * @property {string|null} valor ID de la categoría elegida.
 * @property {string} [error] Error visible del campo.
 * @property {function(string): void} alElegir Recibe el ID elegido (o recién creado).
 * @property {function(): void} [alPerderFoco] Al cerrar el sheet (el campo queda tocado).
 */

const ALTA_VACIA = { nombre: '', descripcion: '' };

/**
 * Select de categoría con "+ Crear categoría".
 * @param {SelectorCategoriaProps} props Ver {@link SelectorCategoriaProps}.
 * @returns {JSX.Element} Campo y sheet.
 */
export function SelectorCategoria({ valor, error, alElegir, alPerderFoco }) {
	const t = useTheme();
	const c = t.colors;
	const { mostrar } = useToast();
	const { categorias, cargando, agregar } = useCategorias();
	const { crear, enviando } = useCrearCategoria();
	const [abierto, setAbierto] = useState(false);
	const [modo, setModo] = useState('lista');
	const [alta, setAlta] = useState(ALTA_VACIA);
	const [erroresAlta, setErroresAlta] = useState({});
	const [errorServidor, setErrorServidor] = useState(null);

	const cerrar = () => {
		setAbierto(false);
		setModo('lista');
		alPerderFoco?.();
	};
	const elegir = (id) => {
		alElegir(id);
		cerrar();
	};
	const irAAlta = () => {
		setModo('alta');
		setErrorServidor(null);
	};
	const volverALista = () => {
		setModo('lista');
		setErroresAlta({});
		setErrorServidor(null);
	};
	const cambiarAlta = (campo, texto) =>
		setAlta((a) => ({ ...a, [campo]: texto }));

	const guardar = async () => {
		const errores = validarCategoria(alta);
		setErroresAlta(errores);
		if (Object.keys(errores).length) return;
		setErrorServidor(null);
		const resultado = await crear({
			nombre: alta.nombre.trim(),
			descripcion: alta.descripcion.trim()
		});
		if (!resultado) return;
		if (resultado.ok) {
			agregar(resultado.categoria);
			setAlta(ALTA_VACIA);
			mostrar({ tono: 'success', titulo: 'Categoría creada' });
			elegir(resultado.categoria.id);
		} else {
			const e = resultado.error;
			setErrorServidor(
				e?.status === 400 && e.message ? e.message : mensajeError(e).titulo
			);
		}
	};

	const pie = (
		<View style={{ gap: t.spacing[2], marginTop: t.spacing[2] }}>
			{!cargando && categorias.length === 0 ? (
				<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
					Todavía no hay categorías
				</Text>
			) : null}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="+ Crear categoría"
				onPress={irAAlta}
				style={({ pressed }) => ({
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[2],
					minHeight: t.sizes.touchMin,
					paddingHorizontal: t.spacing[3],
					opacity: pressed ? t.opacity.pressed : 1
				})}
			>
				<Icon name="Plus" size={t.sizes.iconMd} color={c.primaryText} />
				<Text style={[t.typography.label, { color: c.primaryText }]}>
					Crear categoría
				</Text>
			</Pressable>
		</View>
	);

	const formularioAlta =
		modo === 'alta' ? (
			<View style={{ gap: t.spacing[3] }}>
				<TextField
					label="Nombre de la categoría"
					required
					value={alta.nombre}
					error={erroresAlta.nombre}
					onChangeText={(x) => cambiarAlta('nombre', x)}
				/>
				<TextField
					label="Descripción de la categoría"
					required
					value={alta.descripcion}
					error={erroresAlta.descripcion}
					onChangeText={(x) => cambiarAlta('descripcion', x)}
				/>
				{errorServidor ? (
					<Text
						accessibilityRole="alert"
						style={[t.typography.bodySm, { color: c.error }]}
					>
						{errorServidor}
					</Text>
				) : null}
				<Button size="lg" loading={enviando} onPress={guardar}>
					Crear y elegir
				</Button>
				<Button variant="ghost" disabled={enviando} onPress={volverALista}>
					Volver
				</Button>
			</View>
		) : undefined;

	return (
		<Select
			label="Categoría"
			valor={valor}
			opciones={categorias.map((cat) => ({
				clave: cat.id,
				etiqueta: cat.nombre
			}))}
			placeholder="Elegí una categoría"
			error={error}
			required
			abierto={abierto}
			alAbrir={() => setAbierto(true)}
			alCerrar={cerrar}
			alElegir={elegir}
			pie={pie}
		>
			{formularioAlta}
		</Select>
	);
}
