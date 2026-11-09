import EventoController from '../controllers/eventoController.js';

/**
 * Rutas para la creación y gestión de eventos.
 * Todas las rutas requieren autenticación previa.
 */
export default class EventoRoutes {
  /**
   * Monta el router de eventos en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../services/eventoService.js').default} eventoService - Servicio de eventos
   * @returns {void}
   */
  static init(app, eventoService) {
    const eventoController = new EventoController(eventoService);

    // POST /api/eventos - Crear evento (solo para organizadores autenticados)
    app.post('/api/eventos',
      eventoController.crear.bind(eventoController));
  }
}