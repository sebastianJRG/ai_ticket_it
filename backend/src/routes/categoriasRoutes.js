import CategoriaController from '../controllers/categoriaController.js';

/**
 * Rutas para la gestión de categorías.
 * Todas las rutas requieren autenticación previa y rol ORGANIZADOR.
 */
export default class CategoriasRoutes {
  /** Monta el router de categorías en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../services/categoriaService.js').default} categoriaService - Servicio de categorías
   * @param {import('express').NextFunction} [authMiddleware] - Middleware de autenticación JWT (opcional, para compatibilidad)
   * @returns {void}
   */
  static init(app, categoriaService, authMiddleware) {
    const categoriaController = new CategoriaController(categoriaService);

    // POST /api/categorias - Crear nueva categoría (solo para organizadores autenticados)
    app.post('/api/categorias',
      authMiddleware,
      categoriaController.crear.bind(categoriaController));
  }
}