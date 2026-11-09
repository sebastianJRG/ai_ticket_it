import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'clave-generica-cambiar-en-produccion';

/** Verifica un token JWT y retorna los datos decodificados. */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.id,
      rol: decoded.rol,
      permisos: decoded.permisos
    };
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/** Middleware de autenticación JWT. */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(); // No token - el controlador decidirá
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) {
      return next();
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}