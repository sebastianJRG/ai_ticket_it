import { createApp } from './app.js';
import { programarTarea } from './utils/programador.js';
import { cargarDatosPrueba } from './seed/datosPrueba.js';

const app = createApp();
const PORT = process.env.PORT || 3000;
/** Cada cuántos milisegundos se marcan como UTILIZADA las compras de eventos ya ocurridos. */
const INTERVALO_UTILIZADAS_MS =
	Number(process.env.INTERVALO_UTILIZADAS_MS) || 60_000;

programarTarea(
	async () => {
		const cantidad = await app.locals.compraService.marcarComprasUtilizadas();
		if (cantidad > 0) {
			console.log(JSON.stringify({ evento: 'compras_utilizadas', cantidad }));
		}
	},
	INTERVALO_UTILIZADAS_MS,
	{
		alError: (error) =>
			console.error(
				JSON.stringify({
					evento: 'error_compras_utilizadas',
					mensaje: error?.message
				})
			)
	}
);

// Datos de prueba para desarrollo: solo con SEED=true (npm run dev:seed).
if (process.env.SEED === 'true') {
	try {
		await cargarDatosPrueba(app.locals);
	} catch (error) {
		console.error(
			JSON.stringify({ evento: 'error_seed', mensaje: error?.message })
		);
	}
}

app.listen(PORT, () => {
	console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
