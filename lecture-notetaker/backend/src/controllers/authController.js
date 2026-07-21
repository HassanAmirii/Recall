import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';

function sign(user) { return jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' }); }
function safe(user) { return { id: user._id, username: user.username, email: user.email }; }

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) throw httpError(400, 'username, email, and password are required');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ token: sign(user), user: safe(user) });
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw httpError(401, 'Invalid credentials');
    res.json({ token: sign(user), user: safe(user) });
  } catch (error) { next(error); }
}
