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
   * @param {import('../controllers/mensajeController.js').default} mensajeController - Controlador de mensajes
   * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
   * @returns {void}
   */
  static init(app, compraController, mensajeController, authMiddleware) {
    const router = Router();

    // POST /api/compras - Crear compra (solo compradores autenticados)
    router.post(
      '/',
      authMiddleware,
      requerirRol('COMPRADOR'),
      compraController.crear.bind(compraController)
    );

    // GET /api/compras - Compras del comprador autenticado (con días restantes)
    router.get(
      '/',
      authMiddleware,
      requerirRol('COMPRADOR'),
      compraController.listarPropias.bind(compraController)
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

    // POST /api/compras/:idCompra/mensajes - Enviar mensaje (comprador dueño u organizador del evento)
    router.post(
      '/:idCompra/mensajes',
      authMiddleware,
      requerirRol('COMPRADOR', 'ORGANIZADOR'),
      mensajeController.crear.bind(mensajeController)
    );

    // GET /api/compras/:idCompra/mensajes - Ver mensajes (comprador dueño u organizador del evento)
    router.get(
      '/:idCompra/mensajes',
      authMiddleware,
      requerirRol('COMPRADOR', 'ORGANIZADOR'),
      mensajeController.listar.bind(mensajeController)
    );

    app.use('/api/compras', router);
  }
}
