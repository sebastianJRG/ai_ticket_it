import { Router } from 'express';
import { requerirRol } from '../utils/autorizacion.js';

/**
 * Rutas de compras.
 * Requieren autenticación (token JWT); el rol exigido depende de cada ruta.
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

    // PATCH /api/compras/:idCompra/cancelacion - Cancelar (comprador dueño u organizador del evento)
    router.patch(
      '/:idCompra/cancelacion',
      authMiddleware,
      requerirRol('COMPRADOR', 'ORGANIZADOR'),
      compraController.cancelar.bind(compraController)
    );

    // PATCH /api/compras/:idCompra/confirmacion - Confirmar (organizador del evento)
    router.patch(
      '/:idCompra/confirmacion',
      authMiddleware,
      requerirRol('ORGANIZADOR'),
      compraController.confirmar.bind(compraController)
    );

    // PATCH /api/compras/:idCompra/reembolso - Reembolsar (organizador del evento)
    router.patch(
      '/:idCompra/reembolso',
      authMiddleware,
      requerirRol('ORGANIZADOR'),
      compraController.reembolsar.bind(compraController)
    );

    app.use('/api/compras', router);
  }
}
