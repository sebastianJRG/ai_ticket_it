import { Router } from 'express';
import { requerirRol } from '../utils/autorizacion.js';

/**
 * Rutas para la creación y gestión de eventos.
 * Listar y ver el detalle de un evento son públicos; crear y ver las compras de un evento requieren autenticación
 * previa mediante el middleware inyectado.
 */
export default class EventoRoutes {
  /**
   * Monta el router de eventos en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../controllers/eventoController.js').default} eventoController - Controlador de eventos
   * @param {import('../controllers/compraController.js').default} compraController - Controlador de compras
   * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
   * @returns {void}
   */
  static init(app, eventoController, compraController, authMiddleware) {
    const router = Router();

    // GET /api/eventos - Listar/buscar eventos (público)
    // Query: q, categoriaId, sortBy (precio|fecha|puntaje), order (asc|desc)
    router.get('/', eventoController.listar.bind(eventoController));

    // GET /api/eventos/:idEvento - Detalle de un evento (público)
    router.get('/:idEvento', eventoController.obtener.bind(eventoController));

    // POST /api/eventos - Crear evento (solo para organizadores autenticados)
    router.post(
      '/',
      authMiddleware,
      eventoController.crear.bind(eventoController)
    );

    // GET /api/eventos/:idEvento/compras - Compras del evento (solo su organizador)
    router.get(
      '/:idEvento/compras',
      authMiddleware,
      requerirRol('ORGANIZADOR'),
      compraController.listarPorEvento.bind(compraController)
    );

    app.use('/api/eventos', router);
  }
}
