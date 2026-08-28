// Requiere que el usuario autenticado (ver auth.middleware) tenga el permiso
// indicado. Los administradores (rol 'admin') siempre pasan.
module.exports = function requirePermiso(permiso) {
  return function (req, res, next) {
    const usuario = req.usuario;
    if (!usuario) return res.status(401).json({ error: 'Sesión inválida.' });
    if (usuario.rol === 'admin' || (usuario.permisos || []).includes(permiso)) return next();
    res.status(403).json({ error: 'No tenés permiso para realizar esta acción.' });
  };
};
