import { Router } from 'express';
import { requerirRol } from '../utils/autorizacion.js';

/**
 * Rutas de compras.
 * Requieren autenticación (token JWT) y rol COMPRADOR.
 */
export default class ComprasRoutes {
  /**
   * Monta el router de compras en la aplicación Express.
   * @param {import('express').Application} app - Aplicación Express
   * @param {import('../controllers/compraController.js').default} compraController - Controlador de compras
   * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
   * @returns {void}
   */
  static init(app, compraController, authMiddleware) {
    const router = Router();

    // POST /api/compras - Crear compra (solo compradores autenticados)
    router.post(
      '/',
      authMiddleware,
      requerirRol('COMPRADOR'),
      compraController.crear.bind(compraController)
    );

    app.use('/api/compras', router);
  }
}
