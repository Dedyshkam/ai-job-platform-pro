import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '../middleware/auth.js';
import { all, run } from '../database.js';
const router = express.Router();

function localAI(message, jobs=[]) {
  const m = message.toLowerCase();
  if (m.includes('герман') || m.includes('склад')) {
    const found = jobs.filter(j => j.country.toLowerCase().includes('герман') || j.category.toLowerCase().includes('склад')).slice(0,3);
    return `Я нашёл подходящие варианты: ${found.map(j=>`${j.title} — ${j.country}, ${j.salary}€`).join('; ') || 'пока нет точного совпадения'}. Совет: сначала пройдите верификацию в личном кабинете, затем нажмите «Откликнуться».`;
  }
  if (m.includes('резюме') || m.includes('cv')) return 'Могу помочь с резюме: укажите имя, опыт, навыки и желаемую страну. В разделе AI CV можно сгенерировать текст и экспортировать PDF.';
  if (m.includes('вериф')) return 'Для верификации откройте «Верификация», заполните ФИО, телефон, страну и загрузите документ. Статус станет «На проверке», администратор сможет изменить его на «Проверен».';
  if (m.includes('документ')) return 'Документы находятся в личном кабинете. Можно загрузить паспорт, резюме, сертификаты или файл для верификации.';
  if (m.includes('заяв')) return 'Ваши заявки отображаются в личном кабинете. После отклика на вакансию заявка сохраняется в базе данных SQLite.';
  return 'Я AI-помощник платформы. Помогаю найти вакансии, пройти верификацию, подготовить CV, понять личный кабинет, документы, заявки и контакты.';
}
async function askGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
router.post('/chat', auth, async (req,res)=>{
  const { message } = req.body;
  const jobs = await all('SELECT * FROM jobs');
  const context = `Ты AI-помощник учебной платформы AI Job Platform. Разделы: главная, вакансии, верификация, кабинет, документы, заявки, контакты, админка. Вакансии: ${JSON.stringify(jobs)}. Отвечай по-русски кратко и полезно. Вопрос: ${message}`;
  let answer = null;
  try { answer = await askGemini(context); } catch { answer = null; }
  answer = answer || localAI(message, jobs);
  await run('INSERT INTO ai_messages(user_id,role,message) VALUES (?,?,?)',[req.user.id,'user',message]);
  await run('INSERT INTO ai_messages(user_id,role,message) VALUES (?,?,?)',[req.user.id,'assistant',answer]);
  res.json({ answer, mode: process.env.GEMINI_API_KEY ? 'gemini-or-local' : 'local' });
});
router.post('/recommend', auth, async (req,res)=>{
  const { query } = req.body;
  const jobs = await all('SELECT * FROM jobs');
  const q = query.toLowerCase();
  const scored = jobs.map(j=>{
    let score=0; const text = `${j.title} ${j.country} ${j.city} ${j.category} ${j.language_required} ${j.description}`.toLowerCase();
    q.split(/\s+/).forEach(w=>{ if(w.length>2 && text.includes(w)) score += 2; });
    if(q.includes('без знания') && j.language_required==='Не требуется') score += 5;
    if(q.includes('жиль') && j.housing) score += 3;
    return {...j, score};
  }).sort((a,b)=>b.score-a.score).slice(0,5);
  res.json({ recommendations: scored, explanation: 'Рекомендации построены по совпадению страны, категории, требований к языку, зарплаты и текста запроса.' });
});
router.post('/cv/generate', auth, async (req,res)=>{
  const { fullName, experience, skills, country, position } = req.body;
  const prompt = `Сгенерируй профессиональное резюме на русском для работы за границей. ФИО: ${fullName}. Должность: ${position}. Опыт: ${experience}. Навыки: ${skills}. Страна: ${country}.`;
  let cv = null; try { cv = await askGemini(prompt); } catch {}
  cv = cv || `РЕЗЮМЕ\n\nФИО: ${fullName}\nЖелаемая должность: ${position}\nСтрана: ${country}\n\nОпыт работы:\n${experience}\n\nКлючевые навыки:\n${skills}\n\nО себе:\nОтветственный кандидат, готовый к работе за границей, обучению и соблюдению требований работодателя.\n\nЦель:\nПолучить стабильную работу в международной компании с возможностью профессионального развития.`;
  res.json({ cv });
});
router.post('/cv/analyze', auth, async (req,res)=>{
  const { text, jobTitle } = req.body;
  const prompt = `Проанализируй резюме для вакансии ${jobTitle}. Дай сильные стороны, слабые стороны, что добавить. Резюме: ${text}`;
  let analysis = null; try { analysis = await askGemini(prompt); } catch {}
  analysis = analysis || `Анализ резюме для вакансии «${jobTitle}»: добавьте конкретный опыт, навыки, уровень языка, готовность к переезду, наличие документов. Хорошо указать ответственность, пунктуальность и опыт похожей работы.`;
  res.json({ analysis });
});
router.post('/interview', auth, async (req,res)=>{
  const { position='работник склада' } = req.body;
  res.json({ questions:[`Расскажите о себе и опыте для позиции ${position}.`,'Почему хотите работать за границей?','Готовы ли вы к сменному графику?','Какие документы у вас уже готовы?','Как вы решаете конфликтные ситуации на работе?'] });
});
router.get('/history', auth, async (req,res)=> res.json(await all('SELECT * FROM ai_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 50',[req.user.id])));
export default router;
