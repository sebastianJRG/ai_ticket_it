/**
 * @file Crear evento del ORGANIZADOR (feature 007 US1, CU-04): imágenes por
 *   URL con vista previa de la portada, nombre, categoría con alta rápida,
 *   fecha y hora locales, descripción y tipos de entrada repetibles. Valida
 *   con las reglas del servidor al perder el foco y al publicar, publica una
 *   sola vez y conserva el borrador ante errores
 *   (specs/007-organizador-eventos/contracts/pantallas.md › /organizador/crear;
 *   research R4–R8, R13).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useReducer, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../feedback/ToastContext';
import { useCrearEvento } from '../../hooks/useCrearEvento';
import { AgregarTipoEntrada } from '../../components/AgregarTipoEntrada';
import { AppHeader } from '../../components/AppHeader';
import { ArteCategoria } from '../../components/ArteCategoria';
import { BarraAccion } from '../../components/BarraAccion';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { TicketTypeForm } from '../../components/TicketTypeForm';
import { SelectorCategoria } from '../../eventos/SelectorCategoria';
import {
	MAX_IMAGENES,
	actualizarImagen,
	actualizarTipo,
	aCuerpoEvento,
	agregarImagen,
	agregarTipo,
	borradorInicial,
	enmascararFecha,
	enmascararHora,
	marcarTocado,
	marcarTodos,
	mensajeErrorPublicar,
	quitarImagen,
	quitarTipo,
	validarCampo,
	validarFormulario
} from '../../eventos/formularioEvento';
import { hrefComprasEvento } from '../../navegacion/reglas';

/**
 * Acción del reducer del borrador.
 * @typedef {{tipo: string, [clave: string]: any}} AccionBorrador
 */

/**
 * Reducer del borrador sobre las funciones puras de `formularioEvento.js`.
 * @param {import('../../eventos/formularioEvento').BorradorEvento} b Borrador actual.
 * @param {AccionBorrador} a Acción.
 * @returns {import('../../eventos/formularioEvento').BorradorEvento} Borrador nuevo.
 */
function reducer(b, a) {
	switch (a.tipo) {
		case 'campo':
			return { ...b, [a.campo]: a.valor };
		case 'tipoCampo':
			return actualizarTipo(b, a.clave, { [a.campo]: a.valor });
		case 'agregarTipo':
			return agregarTipo(b);
		case 'quitarTipo':
			return quitarTipo(b, a.clave);
		case 'agregarImagen':
			return agregarImagen(b);
		case 'quitarImagen':
			return quitarImagen(b, a.clave);
		case 'imagen':
			return actualizarImagen(b, a.clave, a.valor);
		case 'tocar':
			return marcarTocado(b, a.ruta);
		case 'tocarTodos':
			return marcarTodos(b);
		case 'reiniciar':
			return borradorInicial();
		default:
			return b;
	}
}

/**
 * Indica si un tipo de entrada tiene algún dato cargado.
 * @param {import('../../eventos/formularioEvento').TipoEntradaBorrador} tipo Tipo.
 * @returns {boolean} `true` si hay texto en algún campo.
 */
const tieneDatos = (tipo) =>
	['nombre', 'descripcion', 'precio', 'cupo'].some(
		(k) => tipo[k].trim() !== ''
	);

/**
 * Título de la sección del formulario.
 * @param {{children: string}} props Texto.
 * @returns {JSX.Element} Encabezado.
 */
function Seccion({ children }) {
	const t = useTheme();
	return (
		<Text
			accessibilityRole="header"
			style={[t.typography.titleMd, { color: t.colors.text }]}
		>
			{children}
		</Text>
	);
}

/**
 * Pantalla Crear evento.
 * @returns {JSX.Element} Pantalla.
 */
export default function CrearEvento() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const { mostrar } = useToast();
	const { publicar, enviando } = useCrearEvento();
	const [b, despachar] = useReducer(reducer, undefined, borradorInicial);
	const [banner, setBanner] = useState(null);
	const [aQuitar, setAQuitar] = useState(null);
	const [versionCategorias, setVersionCategorias] = useState(0);
	const [falloPortada, setFalloPortada] = useState(false);
	const scroll = useRef(null);
	const posTipos = useRef(0);

	const error = (ruta) => (b.tocados.has(ruta) ? validarCampo(b, ruta) : null);
	const tocar = (ruta) => despachar({ tipo: 'tocar', ruta });
	const campo = (nombre, valor) =>
		despachar({ tipo: 'campo', campo: nombre, valor });

	const pedirQuitar = (tipo) => {
		if (tieneDatos(tipo)) setAQuitar(tipo);
		else despachar({ tipo: 'quitarTipo', clave: tipo.clave });
	};

	const alPublicar = async () => {
		if (enviando) return;
		despachar({ tipo: 'tocarTodos' });
		const { valido, errores } = validarFormulario(b);
		if (!valido) {
			const soloTipos = Object.keys(errores).every((r) =>
				r.startsWith('tiposEntrada.')
			);
			scroll.current?.scrollTo?.({ y: soloTipos ? posTipos.current : 0 });
			return;
		}
		setBanner(null);
		const resultado = await publicar(aCuerpoEvento(b));
		if (!resultado) return;
		if (resultado.ok) {
			mostrar({ tono: 'success', titulo: 'Evento publicado' });
			despachar({ tipo: 'reiniciar' });
			router.push(hrefComprasEvento(resultado.evento.id));
			return;
		}
		setBanner(mensajeErrorPublicar(resultado.error));
		if (resultado.error?.status === 404) {
			campo('categoriaId', null);
			setVersionCategorias((v) => v + 1);
		}
		scroll.current?.scrollTo?.({ y: 0 });
	};

	const portada = b.multimedia[0]?.url.trim() ?? '';
	const portadaValida =
		portada !== '' && !validarCampo(b, `multimedia.${b.multimedia[0].clave}`);

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader variante="large" titulo="Crear evento" />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					ref={scroll}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{
						padding: t.spacing[4],
						gap: t.spacing[6],
						paddingBottom: t.spacing[8]
					}}
				>
					{banner ? (
						<View
							accessibilityRole="alert"
							accessibilityLiveRegion="polite"
							style={{
								flexDirection: 'row',
								gap: t.spacing[3],
								padding: t.spacing[4],
								borderRadius: t.radius.md,
								backgroundColor: c.errorSoft
							}}
						>
							<Icon name="CircleAlert" size={t.sizes.iconMd} color={c.error} />
							<Text style={[t.typography.body, { flex: 1, color: c.text }]}>
								{banner}
							</Text>
						</View>
					) : null}

					<View style={{ gap: t.spacing[3] }}>
						<Seccion>Imágenes</Seccion>
						{portadaValida && !falloPortada ? (
							<Image
								testID="portada"
								source={{ uri: portada }}
								onError={() => setFalloPortada(true)}
								contentFit="cover"
								accessibilityLabel="Vista previa de la portada"
								style={{
									width: '100%',
									aspectRatio: t.sizes.eventImageRatio,
									borderRadius: t.radius.lg
								}}
							/>
						) : portadaValida ? (
							<ArteCategoria
								estilo={{
									width: '100%',
									aspectRatio: t.sizes.eventImageRatio,
									borderRadius: t.radius.lg
								}}
							/>
						) : null}
						{b.multimedia.map((img, i) => (
							<View
								key={img.clave}
								style={{ flexDirection: 'row', alignItems: 'flex-start' }}
							>
								<View style={{ flex: 1 }}>
									<TextField
										label={
											i === 0 ? 'URL de imagen (portada)' : 'URL de imagen'
										}
										required
										value={img.url}
										placeholder="https://…"
										keyboardType="url"
										autoCapitalize="none"
										error={error(`multimedia.${img.clave}`)}
										onChangeText={(valor) => {
											if (i === 0) setFalloPortada(false);
											despachar({ tipo: 'imagen', clave: img.clave, valor });
										}}
										onBlur={() => tocar(`multimedia.${img.clave}`)}
									/>
								</View>
								<View style={{ marginTop: 22 }}>
									<IconButton
										icon="Trash2"
										label={`Quitar imagen ${i + 1}`}
										onPress={() =>
											despachar({ tipo: 'quitarImagen', clave: img.clave })
										}
									/>
								</View>
							</View>
						))}
						{b.multimedia.length < MAX_IMAGENES ? (
							<View style={{ alignItems: 'flex-start' }}>
								<Button
									variant="secondary"
									size="sm"
									onPress={() => despachar({ tipo: 'agregarImagen' })}
								>
									Agregar imagen
								</Button>
							</View>
						) : null}
					</View>

					<View style={{ gap: t.spacing[4] }}>
						<Seccion>Datos del evento</Seccion>
						<TextField
							label="Nombre del evento"
							required
							value={b.nombre}
							error={error('nombre')}
							onChangeText={(x) => campo('nombre', x)}
							onBlur={() => tocar('nombre')}
						/>
						<SelectorCategoria
							key={versionCategorias}
							valor={b.categoriaId}
							error={error('categoriaId')}
							alElegir={(id) => campo('categoriaId', id)}
							alPerderFoco={() => tocar('categoriaId')}
						/>
						<View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
							<View style={{ flex: 3 }}>
								<TextField
									label="Fecha"
									required
									placeholder="DD/MM/AAAA"
									keyboardType="number-pad"
									value={b.fecha}
									error={error('fecha')}
									onChangeText={(x) => campo('fecha', enmascararFecha(x))}
									onBlur={() => tocar('fecha')}
								/>
							</View>
							<View style={{ flex: 2 }}>
								<TextField
									label="Hora"
									required
									placeholder="HH:MM"
									helper="Hora local"
									keyboardType="number-pad"
									value={b.hora}
									error={error('hora')}
									onChangeText={(x) => campo('hora', enmascararHora(x))}
									onBlur={() => tocar('hora')}
								/>
							</View>
						</View>
						<TextField
							label="Descripción"
							required
							multiline
							maxLength={2000}
							value={b.descripcion}
							error={error('descripcion')}
							onChangeText={(x) => campo('descripcion', x)}
							onBlur={() => tocar('descripcion')}
						/>
					</View>

					<View
						style={{ gap: t.spacing[3] }}
						onLayout={(e) => {
							posTipos.current = e.nativeEvent.layout.y;
						}}
					>
						<Seccion>Tipos de entrada</Seccion>
						{b.tiposEntrada.map((tipo, i) => {
							const ruta = (k) => `tiposEntrada.${tipo.clave}.${k}`;
							return (
								<TicketTypeForm
									key={tipo.clave}
									numero={i + 1}
									tipo={tipo}
									quitable={i > 0}
									errores={{
										nombre: error(ruta('nombre')),
										descripcion: error(ruta('descripcion')),
										precio: error(ruta('precio')),
										cupo: error(ruta('cupo'))
									}}
									alCambiar={(k, valor) =>
										despachar({
											tipo: 'tipoCampo',
											clave: tipo.clave,
											campo: k,
											valor
										})
									}
									alPerderFoco={(k) => tocar(ruta(k))}
									alQuitar={() => pedirQuitar(tipo)}
								/>
							);
						})}
						<AgregarTipoEntrada
							alPresionar={() => despachar({ tipo: 'agregarTipo' })}
						/>
					</View>
				</ScrollView>
				<BarraAccion>
					<Button size="lg" loading={enviando} onPress={alPublicar}>
						Publicar evento
					</Button>
				</BarraAccion>
			</KeyboardAvoidingView>
			<Modal
				visible={!!aQuitar}
				titulo={
					aQuitar?.nombre.trim()
						? `¿Quitar «${aQuitar.nombre.trim()}»?`
						: '¿Quitar este tipo de entrada?'
				}
				cuerpo="Se borran los datos cargados de este tipo de entrada."
				icono="Trash2"
				destructivo
				etiquetaConfirmar="Sí, quitar"
				etiquetaCancelar="Volver"
				alConfirmar={() => {
					despachar({ tipo: 'quitarTipo', clave: aQuitar.clave });
					setAQuitar(null);
				}}
				alCancelar={() => setAQuitar(null)}
			/>
		</View>
	);
}
