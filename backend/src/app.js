import cors from 'cors';
import express from 'express';
import UsuarioRepository from './repositories/usuarioRepository.js';
import UsuarioService from './services/usuarioService.js';
import UsuariosController from './controllers/usuariosController.js';
import UsuariosRoutes from './routes/usuariosRoutes.js';
import EventoService from './services/eventoService.js';
import EventoRoutes from './routes/eventosRoutes.js';
import { authMiddleware } from './utils/jwt.js';
import LoginService from './services/loginService.js';
import RefreshService from './services/refreshService.js';
import LogoutService from './services/logoutService.js';
import EventoController from './controllers/eventoController.js';
import LoginController from './controllers/loginController.js';
import RefreshController from './controllers/refreshController.js';
import LogoutController from './controllers/logoutController.js';
import LoginRoutes from './routes/loginRoutes.js';
import RefreshRoutes from './routes/refreshRoutes.js';
import LogoutRoutes from './routes/logoutRoutes.js';
import EventoRepository from './repositories/eventoRepository.js';
import CategoriaRepository from './repositories/categoriaRepository.js';
import TipoEntradaRepository from './repositories/tipoEntradaRepository.js';
import ReseniaRepository from './repositories/reseniaRepository.js';
import CategoriaService from './services/categoriaService.js';
import CategoriasRoutes from './routes/categoriasRoutes.js';
import CategoriaController from './controllers/categoriaController.js';
import CompraRepository from './repositories/compraRepository.js';
import CambioEstadoCompraRepository from './repositories/cambioEstadoCompraRepository.js';
import CompraService from './services/compraService.js';
import CompraController from './controllers/compraController.js';
import ComprasRoutes from './routes/comprasRoutes.js';
import ReseniaService from './services/reseniaService.js';
import ReseniaController from './controllers/reseniaController.js';
import ReseniasRoutes from './routes/reseniasRoutes.js';
import MensajeRepository from './repositories/mensajeRepository.js';
import MensajeService from './services/mensajeService.js';
import MensajeController from './controllers/mensajeController.js';

/**
 * Crea y configura la aplicación Express para el backend.
 * @param {import('../repositories/usuarioRepository.js').default} [repository] - Repositorio de usuarios (opcional, se crea uno en memoria si no se provee)
 * @returns {import('express').Application} Aplicación Express configurada
 */
export function createApp(repository) {
  const app = express();

  // Configurar CORS
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Middleware para parsear JSON en el cuerpo de las peticiones
  app.use(express.json());

  // Repositorios - se crean en memoria si no se proveen
  const usuarioRepository = repository || new UsuarioRepository();
  const eventoRepository = new EventoRepository();
  const categoriaRepository = new CategoriaRepository();
  const tipoEntradaRepository = new TipoEntradaRepository();
  const reseniaRepository = new ReseniaRepository();
  const compraRepository = new CompraRepository();
  const cambioEstadoCompraRepository = new CambioEstadoCompraRepository();
  const mensajeRepository = new MensajeRepository();

  // Servicios
  const usuarioService = new UsuarioService(usuarioRepository);
  const eventoService = new EventoService(
    eventoRepository,
    categoriaRepository,
    usuarioRepository,
    tipoEntradaRepository,
    reseniaRepository
  );
  const categoriaService = new CategoriaService(categoriaRepository);
  const compraService = new CompraService(
    compraRepository,
    eventoRepository,
    usuarioRepository,
    cambioEstadoCompraRepository
  );

  const reseniaService = new ReseniaService(
    reseniaRepository,
    eventoRepository,
    usuarioRepository,
    compraRepository
  );

  const mensajeService = new MensajeService(
    mensajeRepository,
    compraRepository,
    usuarioRepository
  );

  // Controladores
  const usuarioController = new UsuariosController(usuarioService);
  const eventoController = new EventoController(eventoService);
  const categoriaController = new CategoriaController(categoriaService);
  const compraController = new CompraController(compraService);
  const reseniaController = new ReseniaController(reseniaService);
  const mensajeController = new MensajeController(mensajeService);

  // Expone el servicio de compras al punto de entrada (index.js) para su tarea periódica
  app.locals.compraService = compraService;

  // Rutas de usuarios
  UsuariosRoutes.init(
    app,
    usuarioController,
    authMiddleware,
    reseniaController
  );

  // Rutas de categorías - crear requiere autenticación y rol ORGANIZADOR; listar es público
  CategoriasRoutes.init(app, categoriaController, authMiddleware);

  // Rutas de compras - requiere autenticación; el rol depende de cada ruta
  ComprasRoutes.init(app, compraController, mensajeController, authMiddleware);

  // Rutas de reseñas - crear requiere rol COMPRADOR; listar es público
  ReseniasRoutes.init(app, reseniaController, authMiddleware);

  // Rutas de eventos - requiere autenticación y rol ORGANIZADOR
  EventoRoutes.init(app, eventoController, compraController, authMiddleware);

  // Servicios y controladores de autenticación
  const loginService = new LoginService(usuarioRepository);
  const refreshService = new RefreshService(usuarioRepository);
  const logoutService = new LogoutService(usuarioRepository);
  const loginController = new LoginController(loginService);
  const refreshController = new RefreshController(refreshService);
  const logoutController = new LogoutController(logoutService);

  LoginRoutes.init(app, loginController);
  RefreshRoutes.init(app, refreshController);
  LogoutRoutes.init(app, logoutController);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Middleware de manejo de errores 404
  app.use((req, res, next) => {
    const error = new Error('No encontrada');
    error.status = 404;
    next(error);
  });

  // Middleware de manejo de errores centralizado
  app.use((error, req, res, next) => {
    console.error(error);

    if (error instanceof Error) {
      const status = error.status || 400;
      return res.status(status).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
  });

  return app;
}
