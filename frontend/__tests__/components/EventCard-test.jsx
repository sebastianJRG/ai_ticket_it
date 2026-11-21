import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { EventCard } from '../../src/components/EventCard';
import { renderConTema } from '../helpers/renderConTema';
import { AHORA, EVENTOS, crearEvento } from '../helpers/eventosEjemplo';

const jazz = EVENTOS.find((e) => e.id === 'ev-jazz');
const hamlet = EVENTOS.find((e) => e.id === 'ev-hamlet');
const pasado = EVENTOS.find((e) => e.id === 'ev-pasado');
const oculto = { modo: 'oculto', activo: false, alPresionar: () => {} };

describe.each(['dark', 'light'])('EventCard (%s)', (scheme) => {
	describe.each(['feature', 'compact'])('variante %s', (variante) => {
		it('muestra nombre, fecha, categoría, precio y puntaje', async () => {
			await renderConTema(
				<EventCard
					evento={jazz}
					variante={variante}
					ahora={AHORA}
					favorito={oculto}
					alPresionar={() => {}}
				/>,
				{ scheme }
			);
			expect(screen.getByText('Noche de jazz')).toBeTruthy();
			expect(screen.getByText(/sáb 5 dic · 21:00/)).toBeTruthy();
			expect(screen.getByText('Recitales')).toBeTruthy();
			expect(screen.getByText(/^Desde\s\$\s32\.000$/)).toBeTruthy();
			expect(screen.getByText('4,7')).toBeTruthy();
		});

		it('sin multimedia usa el arte por categoría; con multimedia, la imagen', async () => {
			await renderConTema(
				<EventCard
					evento={jazz}
					variante={variante}
					ahora={AHORA}
					favorito={oculto}
					alPresionar={() => {}}
				/>,
				{ scheme }
			);
			expect(
				screen.getByTestId('arte-categoria', { includeHiddenElements: true })
			).toBeTruthy();
			expect(
				screen.queryByTestId('imagen-evento', { includeHiddenElements: true })
			).toBeNull();
			await renderConTema(
				<EventCard
					evento={hamlet}
					variante={variante}
					ahora={AHORA}
					favorito={oculto}
					alPresionar={() => {}}
				/>,
				{ scheme }
			);
			expect(
				screen.getByTestId('imagen-evento', { includeHiddenElements: true })
			).toBeTruthy();
		});

		it('evento finalizado muestra "Finalizado"', async () => {
			await renderConTema(
				<EventCard
					evento={pasado}
					variante={variante}
					ahora={AHORA}
					favorito={oculto}
					alPresionar={() => {}}
				/>,
				{ scheme }
			);
			expect(screen.getByText('Finalizado')).toBeTruthy();
		});

		it('sin puntaje muestra "Sin reseñas"', async () => {
			await renderConTema(
				<EventCard
					evento={crearEvento({ nombre: 'X' })}
					variante={variante}
					ahora={AHORA}
					favorito={oculto}
					alPresionar={() => {}}
				/>,
				{ scheme }
			);
			expect(screen.getByText(/Sin reseñas/)).toBeTruthy();
		});
	});

	it('tocar la tarjeta llama alPresionar; su label es la etiqueta accesible', async () => {
		const alPresionar = jest.fn();
		await renderConTema(
			<EventCard
				evento={jazz}
				variante="compact"
				ahora={AHORA}
				favorito={oculto}
				alPresionar={alPresionar}
			/>,
			{ scheme }
		);
		const tarjeta = screen.getByRole('button', {
			name: /^Noche de jazz, sáb 5 dic · 21:00, Desde\s\$\s32\.000$/
		});
		await fireEvent.press(tarjeta);
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it('modo oculto no renderiza el corazón', async () => {
		await renderConTema(
			<EventCard
				evento={jazz}
				variante="compact"
				ahora={AHORA}
				favorito={oculto}
				alPresionar={() => {}}
			/>,
			{ scheme }
		);
		expect(screen.queryByRole('button', { name: /favoritos/ })).toBeNull();
	});

	it('corazón: labels según activo, ocupado y toque independiente de la tarjeta', async () => {
		const alPresionar = jest.fn();
		const alFavorito = jest.fn();
		await renderConTema(
			<EventCard
				evento={jazz}
				variante="feature"
				ahora={AHORA}
				favorito={{
					modo: 'alternar',
					activo: false,
					ocupado: true,
					alPresionar: alFavorito
				}}
				alPresionar={alPresionar}
			/>,
			{ scheme }
		);
		const corazon = screen.getByRole('button', { name: 'Agregar a favoritos' });
		expect(corazon.props.accessibilityState).toEqual(
			expect.objectContaining({ busy: true })
		);
		await fireEvent.press(corazon);
		expect(alFavorito).toHaveBeenCalledTimes(1);
		expect(alPresionar).not.toHaveBeenCalled();

		await renderConTema(
			<EventCard
				evento={jazz}
				variante="compact"
				ahora={AHORA}
				favorito={{
					modo: 'pedirSesion',
					activo: true,
					alPresionar: alFavorito
				}}
				alPresionar={alPresionar}
			/>,
			{ scheme }
		);
		expect(
			screen.getByRole('button', { name: 'Quitar de favoritos' })
		).toBeTruthy();
	});
});
