/**
 * @readonly
 * @enum {string}
 */
const EstadoCompra = Object.freeze({
	PENDIENTE: 'PENDIENTE',
	CONFIRMADA: 'CONFIRMADA',
	UTILIZADA: 'UTILIZADA',
	CANCELADA: 'CANCELADA',
	REEMBOLSADA: 'REEMBOLSADA'
});

/**
 * Estados en los que una compra ocupa cupo. CANCELADA y REEMBOLSADA lo liberan.
 * Lo comparten la validación de cupo al comprar y la disponibilidad informada.
 * @type {ReadonlySet<string>}
 */
export const ESTADOS_QUE_RESERVAN = Object.freeze(
	new Set([
		EstadoCompra.PENDIENTE,
		EstadoCompra.CONFIRMADA,
		EstadoCompra.UTILIZADA
	])
);

export default EstadoCompra;
