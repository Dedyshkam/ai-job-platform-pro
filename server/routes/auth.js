import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run } from '../database.js';
import { auth } from '../middleware/auth.js';
const router = express.Router();
const sign = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'super_secret_jwt_key_change_me', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Заполните все поля' });
    const exists = await get('SELECT id FROM users WHERE email=?', [email]);
    if (exists) return res.status(409).json({ message: 'Email уже зарегистрирован' });
    const hash = await bcrypt.hash(password, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const result = await run('INSERT INTO users(name,email,password,role,verification_code) VALUES (?,?,?,?,?)', [name, email, hash, role, code]);
    await run('INSERT INTO profiles(user_id,full_name,verification_status) VALUES (?,?,?)', [result.lastID, name, 'Не проверен']);
    await run('INSERT INTO notifications(user_id,title,message) VALUES (?,?,?)', [result.lastID, 'Код подтверждения email', `Ваш учебный код подтверждения: ${code}`]);
    const user = await get('SELECT id,name,email,role,email_verified FROM users WHERE id=?', [result.lastID]);
    res.json({ token: sign(user), user, demoEmailCode: code });
  } catch (e) { res.status(500).json({ message: 'Ошибка регистрации', error: e.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await get('SELECT * FROM users WHERE email=?', [email]);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Неверный email или пароль' });
  res.json({ token: sign(user), user: { id:user.id, name:user.name, email:user.email, role:user.role, email_verified:user.email_verified } });
});

router.post('/verify-email', auth, async (req, res) => {
  const { code } = req.body;
  const user = await get('SELECT verification_code FROM users WHERE id=?', [req.user.id]);
  if (!user || user.verification_code !== code) return res.status(400).json({ message: 'Неверный код' });
  await run('UPDATE users SET email_verified=1 WHERE id=?', [req.user.id]);
  res.json({ message: 'Email подтверждён' });
});

router.get('/me', auth, async (req, res) => {
  const user = await get('SELECT id,name,email,role,email_verified,created_at FROM users WHERE id=?', [req.user.id]);
  const profile = await get('SELECT * FROM profiles WHERE user_id=?', [req.user.id]);
  res.json({ user, profile });
});
export default router;
