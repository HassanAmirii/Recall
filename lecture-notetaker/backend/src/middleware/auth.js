import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Authentication required');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(payload.userId).select('_id username email');
    if (!user) throw httpError(401, 'Invalid authentication token');
    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'Invalid authentication token'));
  }
}
