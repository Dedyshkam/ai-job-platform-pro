import express from 'express';
import { auth, role } from '../middleware/auth.js';
import { all, get, run } from '../database.js';
const router = express.Router();
router.get('/stats', auth, role('admin'), async (_,res)=>{
  const users = await get('SELECT COUNT(*) c FROM users'); const jobs = await get('SELECT COUNT(*) c FROM jobs'); const apps = await get('SELECT COUNT(*) c FROM applications'); const docs = await get('SELECT COUNT(*) c FROM documents');
  const countries = await all('SELECT country, COUNT(*) count FROM jobs GROUP BY country');
  const verifications = await all('SELECT verification_status, COUNT(*) count FROM profiles GROUP BY verification_status');
  res.json({ users:users.c, jobs:jobs.c, applications:apps.c, documents:docs.c, countries, verifications });
});
router.get('/users', auth, role('admin'), async (_,res)=> res.json(await all('SELECT u.id,u.name,u.email,u.role,u.email_verified,p.verification_status,p.country,p.phone FROM users u LEFT JOIN profiles p ON p.user_id=u.id ORDER BY u.id DESC')));
router.get('/applications', auth, role('admin','employer'), async (_,res)=> res.json(await all('SELECT a.*, u.name user_name, u.email, j.title job_title, j.country FROM applications a JOIN users u ON u.id=a.user_id JOIN jobs j ON j.id=a.job_id ORDER BY a.created_at DESC')));
router.get('/jobs', auth, role('admin','employer'), async (_,res)=> res.json(await all('SELECT * FROM jobs ORDER BY created_at DESC')));
router.put('/users/:id/verification', auth, role('admin'), async (req,res)=>{ await run('UPDATE profiles SET verification_status=? WHERE user_id=?',[req.body.status,req.params.id]); await run('INSERT INTO notifications(user_id,title,message) VALUES (?,?,?)',[req.params.id,'Статус верификации изменён',`Новый статус: ${req.body.status}`]); res.json({message:'Статус обновлён'}); });
router.put('/applications/:id/status', auth, role('admin','employer'), async (req,res)=>{ await run('UPDATE applications SET status=? WHERE id=?',[req.body.status,req.params.id]); res.json({message:'Статус заявки обновлён'}); });
export default router;
