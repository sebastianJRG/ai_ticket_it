/**
 * Punto de entrada de la jerarquía de errores de la aplicación.
 * Reexporta `AppError` y sus subclases, una por código HTTP usado.
 *
 * @module errors
 * @owner backend
 * @license ISC
 */
export { default as AppError } from './AppError.js';
export { default as BadRequestError } from './BadRequestError.js';
export { default as UnauthorizedError } from './UnauthorizedError.js';
export { default as ForbiddenError } from './ForbiddenError.js';
export { default as NotFoundError } from './NotFoundError.js';
export { default as ConflictError } from './ConflictError.js';
