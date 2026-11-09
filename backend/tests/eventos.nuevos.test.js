import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';

import EventoRepository from '../src/repositories/eventoRepository.js';
import CategoriaRepository from '../src/repositories/categoriaRepository.js';
import TipoEntradaRepository from '../src/repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';
import EventoService from '../src/services/eventoService.js';
import UsuarioService from '../src/services/usuarioService.js';

let usuarioRepo, eventoRepo, categoriaRepo, tipoEntradaRepo;
let usuarioService, eventoService;

before(async () => {
  usuarioRepo = new UsuarioRepository();
  eventoRepo = new EventoRepository();
  categoriaRepo = new CategoriaRepository();
  tipoEntradaRepo = new TipoEntradaRepository();

  usuarioService = new UsuarioService(usuarioRepo);
  eventoService = new EventoService(eventoRepo, categoriaRepo, usuarioRepo, tipoEntradaRepo);
});

after(async () => {});

describe('EventoService - crearEvento', () => {
  beforeEach(async () => {
    await eventoRepo.eliminarTodos();
    await usuarioRepo.eliminarTodos();
  });

  it('evento creado exitosamente', async () => {
    const organizador = await usuarioService.crearUsuario({
      nombre: 'Org', apellido: 'Test', nombreUsuario: 'org1', contrasenia: 'Clave123!', rol: 'ORGANIZADOR'
    });
    const categoria = await categoriaRepo.crear({ nombre: 'Conciertos', descripcion: 'Eventos' });
    const tipo = await tipoEntradaRepo.crear({ nombre: 'Entrada', descripcion: 'X', precio: 100, cupo: 10 });
    const futuro = new Date('2100-01-01').toISOString();
    const evt = await eventoService.crearEvento({ 
      nombre: 'Evento', 
      descripcion: 'Descripción del evento', 
      organizadorId: organizador.id, 
      categoriaId: categoria.id, 
      tiposEntrada: [tipo], 
      fecha: futuro, 
      multimedia: [] 
    });
    assert.ok(evt.id);
    assert.equal(evt.nombre, 'Evento');
  });

  it('multimedia por defecto vacío', async () => {
    const organizador = await usuarioService.crearUsuario({ nombre: 'Org', apellido: 'Test', nombreUsuario: 'org2', contrasenia: 'Clave123!', rol: 'ORGANIZADOR' });
    const cat = await categoriaRepo.crear({ nombre: 'Conciertos', descripcion: 'Eventos' });
    const tip = await tipoEntradaRepo.crear({ nombre: 'Entrada', descripcion: 'X', precio: 100, cupo: 10 });
    const futuro = new Date('2100-01-01').toISOString();
    const evt = await eventoService.crearEvento({ 
      nombre: 'Sin Mult', 
      descripcion: 'Sin multimedia', 
      organizadorId: organizador.id, 
      categoriaId: cat.id, 
      tiposEntrada: [tip], 
      fecha: futuro, 
      multimedia: [] 
    });
    assert.equal(evt.multimedia.length, 0);
  });
});