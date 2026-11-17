import { Router } from 'express';

/**
 * Rutas para la gestión de categorías.
 * Las rutas requieren autenticación previa mediante el middleware inyectado.
 */
export default class CategoriasRoutes {
  /**
   * Monta el router de categorías en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../controllers/categoriaController.js').default} categoriaController - Controlador de categorías
   * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
   * @returns {void}
   */
  static init(app, categoriaController, authMiddleware) {
    const router = Router();

    // POST /api/categorias - Crear nueva categoría (solo para organizadores autenticados)
    router.post(
      '/',
      authMiddleware,
      categoriaController.crear.bind(categoriaController)
    );

    app.use('/api/categorias', router);
  }
}
