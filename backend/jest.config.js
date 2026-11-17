/**
 * Configuración de Jest para el backend (ES modules nativos).
 * Solo ejecuta los tests unitarios de `tests/unit/`; los tests antiguos
 * basados en `node:test` siguen corriendo con `node --test`.
 *
 * @license ISC
 */
export default {
	testEnvironment: 'node',
	// Sin transformación: Node ejecuta los módulos ES directamente
	transform: {},
	testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
	// Ningún mock sobrevive entre tests
	clearMocks: true,
	restoreMocks: true
};
