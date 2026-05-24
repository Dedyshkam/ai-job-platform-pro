import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { initDb, run } from './database.js';
import authRoutes from './routes/auth.js';
import platformRoutes from './routes/platform.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors()); app.use(express.json({ limit:'10mb' })); app.use('/uploads', express.static('uploads'));
app.get('/', (_,res)=>res.json({ message:'AI Job Platform PRO API работает' }));
app.use('/api/auth', authRoutes); app.use('/api', platformRoutes); app.use('/api/ai', aiRoutes); app.use('/api/admin', adminRoutes);
io.on('connection', socket => {
  socket.on('manager-message', async data => {
    await run('INSERT INTO manager_messages(user_id,sender,message) VALUES (?,?,?)',[data.user_id||1,data.sender||'user',data.message]);
    io.emit('manager-message', { ...data, created_at: new Date().toISOString() });
  });
});
const PORT = process.env.PORT || 5000;
initDb().then(()=>server.listen(PORT,()=>console.log(`Server started on http://localhost:${PORT}`)));
