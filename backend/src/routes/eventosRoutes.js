import { Router } from 'express';

/**
 * Rutas para la creación y gestión de eventos.
 * Las rutas requieren autenticación previa mediante el middleware inyectado.
 */
export default class EventoRoutes {
  /**
   * Monta el router de eventos en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../controllers/eventoController.js').default} eventoController - Controlador de eventos
   * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
   * @returns {void}
   */
  static init(app, eventoController, authMiddleware) {
    const router = Router();

    // GET /api/eventos - Listar/buscar eventos (público)
    // Query: q, categoriaId, sortBy (precio|fecha|puntaje), order (asc|desc)
    router.get('/', eventoController.listar.bind(eventoController));

    // POST /api/eventos - Crear evento (solo para organizadores autenticados)
    router.post(
      '/',
      authMiddleware,
      eventoController.crear.bind(eventoController)
    );

    app.use('/api/eventos', router);
  }
}
