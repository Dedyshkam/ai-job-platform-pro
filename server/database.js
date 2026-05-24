import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

export const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
export const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
export const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

export async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', email_verified INTEGER DEFAULT 0, verification_code TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, full_name TEXT, phone TEXT, country TEXT, language TEXT DEFAULT 'ru', theme TEXT DEFAULT 'light', verification_status TEXT DEFAULT 'Не проверен', FOREIGN KEY(user_id) REFERENCES users(id))`);
  await run(`CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, country TEXT, city TEXT, salary INTEGER, category TEXT, language_required TEXT, housing INTEGER DEFAULT 0, description TEXT, employer TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, job_id INTEGER, status TEXT DEFAULT 'Новая', cover_letter TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, type TEXT, filename TEXT, original_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, message TEXT, read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS ai_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, role TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, job_id INTEGER, UNIQUE(user_id, job_id))`);
  await run(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, rating INTEGER, text TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS manager_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, sender TEXT, message TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

  const userCount = await get('SELECT COUNT(*) as c FROM users');
  if (!userCount.c) {
    const userPass = await bcrypt.hash('123456', 10);
    const adminPass = await bcrypt.hash('admin123', 10);
    const empPass = await bcrypt.hash('employer123', 10);
    await run('INSERT INTO users(name,email,password,role,email_verified) VALUES (?,?,?,?,1)', ['Тестовый пользователь','user@test.com',userPass,'user']);
    await run('INSERT INTO users(name,email,password,role,email_verified) VALUES (?,?,?,?,1)', ['Администратор','admin@test.com',adminPass,'admin']);
    await run('INSERT INTO users(name,email,password,role,email_verified) VALUES (?,?,?,?,1)', ['Работодатель','employer@test.com',empPass,'employer']);
    await run('INSERT INTO profiles(user_id,full_name,phone,country,verification_status) VALUES (?,?,?,?,?)', [1,'Иван Петров','+380991112233','Германия','На проверке']);
    await run('INSERT INTO profiles(user_id,full_name,phone,country,verification_status) VALUES (?,?,?,?,?)', [2,'Администратор платформы','+380000000000','Украина','Проверен']);
    await run('INSERT INTO profiles(user_id,full_name,phone,country,verification_status) VALUES (?,?,?,?,?)', [3,'EuroWork GmbH','+49111111111','Германия','Проверен']);
    const jobs = [
      ['Работник склада','Германия','Берлин',1800,'Склад','Не требуется',1,'Комплектация товаров, упаковка заказов, базовый график 8 часов. Подходит без знания языка.','EuroWork GmbH'],
      ['Помощник на производстве','Польша','Вроцлав',1400,'Производство','Не требуется',1,'Работа на линии, контроль качества, обучение на месте.','WorkLine'],
      ['Сиделка','Германия','Мюнхен',2200,'Уход','A1',1,'Уход за пожилыми людьми, желателен минимальный немецкий.','CarePro'],
      ['Водитель категории B','Чехия','Прага',1700,'Логистика','A2',0,'Доставка товаров по городу, нужен опыт вождения.','LogiTrans'],
      ['Работник отеля','Великобритания','Лондон',2300,'Сервис','B1',0,'Уборка номеров, помощь гостям, сменный график.','HotelStaff UK'],
      ['Фермерский работник','Нидерланды','Роттердам',1900,'Сезонная работа','Не требуется',1,'Сбор овощей и цветов, сезонный контракт.','GreenFarm']
    ];
    for (const j of jobs) await run('INSERT INTO jobs(title,country,city,salary,category,language_required,housing,description,employer) VALUES (?,?,?,?,?,?,?,?,?)', j);
    await run('INSERT INTO notifications(user_id,title,message) VALUES (?,?,?)', [1,'Добро пожаловать','Заполните профиль и пройдите верификацию для подачи заявок.']);
    await run('INSERT INTO reviews(user_id,rating,text) VALUES (?,?,?)', [1,5,'Платформа помогла быстро подобрать вакансии для Германии.']);
  }
}
