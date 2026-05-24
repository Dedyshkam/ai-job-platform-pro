import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Нет токена авторизации' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me');
    next();
  } catch {
    res.status(401).json({ message: 'Неверный токен' });
  }
}

export function role(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Нет доступа' });
}
