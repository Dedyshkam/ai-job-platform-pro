import express from 'express';
import multer from 'multer';
import path from 'path';
import PDFDocument from 'pdfkit';
import { auth, role } from '../middleware/auth.js';
import { all, get, run } from '../database.js';
const router = express.Router();
const storage = multer.diskStorage({ destination: 'uploads/', filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_')) });
const upload = multer({ storage });

router.get('/jobs', async (req, res) => {
  const { q='', country='', minSalary=0, category='' } = req.query;
  const rows = await all(`SELECT * FROM jobs WHERE title LIKE ? AND country LIKE ? AND salary>=? AND category LIKE ? ORDER BY created_at DESC`, [`%${q}%`,`%${country}%`,Number(minSalary)||0,`%${category}%`]);
  res.json(rows);
});
router.post('/jobs', auth, role('admin','employer'), async (req, res) => {
  const { title,country,city,salary,category,language_required,housing,description,employer } = req.body;
  const r = await run('INSERT INTO jobs(title,country,city,salary,category,language_required,housing,description,employer) VALUES (?,?,?,?,?,?,?,?,?)',[title,country,city,salary,category,language_required,housing?1:0,description,employer||req.user.name]);
  res.json({ id:r.lastID, message:'Вакансия добавлена' });
});
router.post('/applications', auth, async (req, res) => {
  const { job_id, cover_letter='' } = req.body;
  await run('INSERT INTO applications(user_id,job_id,cover_letter) VALUES (?,?,?)',[req.user.id, job_id, cover_letter]);
  await run('INSERT INTO notifications(user_id,title,message) VALUES (?,?,?)',[req.user.id,'Заявка отправлена','Ваша заявка сохранена и ожидает рассмотрения.']);
  res.json({ message:'Отклик успешно отправлен' });
});
router.get('/dashboard', auth, async (req,res)=>{
  const applications = await all('SELECT a.*, j.title, j.country, j.salary FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.user_id=? ORDER BY a.created_at DESC',[req.user.id]);
  const documents = await all('SELECT * FROM documents WHERE user_id=? ORDER BY created_at DESC',[req.user.id]);
  const notifications = await all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC',[req.user.id]);
  const favorites = await all('SELECT f.id as favorite_id, j.* FROM favorites f JOIN jobs j ON j.id=f.job_id WHERE f.user_id=?',[req.user.id]);
  res.json({ applications, documents, notifications, favorites });
});
router.post('/profile', auth, upload.single('document'), async (req,res)=>{
  const { full_name, phone, country } = req.body;
  await run('UPDATE profiles SET full_name=?, phone=?, country=?, verification_status=? WHERE user_id=?',[full_name,phone,country,'На проверке',req.user.id]);
  if (req.file) await run('INSERT INTO documents(user_id,type,filename,original_name) VALUES (?,?,?,?)',[req.user.id,'Документ верификации',req.file.filename,req.file.originalname]);
  res.json({ message:'Профиль обновлён, заявка на верификацию отправлена' });
});
router.post('/documents', auth, upload.single('file'), async (req,res)=>{
  await run('INSERT INTO documents(user_id,type,filename,original_name) VALUES (?,?,?,?)',[req.user.id,req.body.type||'Документ',req.file.filename,req.file.originalname]);
  res.json({ message:'Документ загружен' });
});
router.post('/favorites/:jobId', auth, async (req,res)=>{ await run('INSERT OR IGNORE INTO favorites(user_id,job_id) VALUES (?,?)',[req.user.id,req.params.jobId]); res.json({message:'Добавлено в избранное'}); });
router.delete('/favorites/:jobId', auth, async (req,res)=>{ await run('DELETE FROM favorites WHERE user_id=? AND job_id=?',[req.user.id,req.params.jobId]); res.json({message:'Удалено из избранного'}); });
router.post('/reviews', auth, async (req,res)=>{ await run('INSERT INTO reviews(user_id,rating,text) VALUES (?,?,?)',[req.user.id,req.body.rating,req.body.text]); res.json({message:'Отзыв добавлен'}); });
router.get('/reviews', async (_,res)=> res.json(await all('SELECT r.*, u.name FROM reviews r JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC')));
router.post('/settings', auth, async (req,res)=>{ await run('UPDATE profiles SET theme=?, language=? WHERE user_id=?',[req.body.theme,req.body.language,req.user.id]); res.json({message:'Настройки сохранены'}); });
router.get('/export/cv', auth, async (req,res)=>{
  const p = await get('SELECT * FROM profiles WHERE user_id=?',[req.user.id]);
  const doc = new PDFDocument();
  res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition','attachment; filename=cv.pdf'); doc.pipe(res);
  doc.fontSize(22).text('AI Job Platform CV', {align:'center'}); doc.moveDown(); doc.fontSize(14).text(`ФИО: ${p?.full_name||req.user.name}`); doc.text(`Телефон: ${p?.phone||'-'}`); doc.text(`Желаемая страна: ${p?.country||'-'}`); doc.text('Навыки: ответственность, пунктуальность, готовность к работе за границей.'); doc.end();
});
export default router;
