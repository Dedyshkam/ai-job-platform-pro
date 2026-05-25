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

(function () {
  const translations = {
    uk: {
      "Найти работу": "Знайти роботу",
      "Зарегистрироваться": "Зареєструватися",
      "Войти": "Увійти",
      "Выйти": "Вийти",
      "Главная": "Головна",
      "Вакансии": "Вакансії",
      "Личный кабинет": "Особистий кабінет",
      "Админ-панель": "Адмін-панель",
      "AI-помощник": "AI-помічник",
      "Документы": "Документи",
      "Заявки": "Заявки",
      "Уведомления": "Сповіщення",
      "Верификация": "Верифікація",
      "Не проверен": "Не перевірено",
      "На проверке": "На перевірці",
      "Проверен": "Перевірено",
      "Поиск": "Пошук",
      "Страна": "Країна",
      "Зарплата": "Зарплата",
      "Откликнуться": "Відгукнутися",
      "Избранное": "Обране",
      "Отзывы": "Відгуки",
      "Контакты": "Контакти",
      "Преимущества": "Переваги",
      "Статистика": "Статистика",
      "Вопросы и ответы": "Питання та відповіді",
      "Пользователи": "Користувачі",
      "Работодатели": "Роботодавці",
      "Добавить вакансию": "Додати вакансію",
      "Сохранить": "Зберегти",
      "Отправить": "Надіслати",
      "Email": "Email",
      "Пароль": "Пароль",
      "Имя": "Ім’я",
      "ФИО": "ПІБ",
      "Телефон": "Телефон",
      "Статус": "Статус"
    },
    en: {
      "Найти работу": "Find a job",
      "Зарегистрироваться": "Register",
      "Войти": "Login",
      "Выйти": "Logout",
      "Главная": "Home",
      "Вакансии": "Jobs",
      "Личный кабинет": "Dashboard",
      "Админ-панель": "Admin panel",
      "AI-помощник": "AI assistant",
      "Документы": "Documents",
      "Заявки": "Applications",
      "Уведомления": "Notifications",
      "Верификация": "Verification",
      "Не проверен": "Not verified",
      "На проверке": "Under review",
      "Проверен": "Verified",
      "Поиск": "Search",
      "Страна": "Country",
      "Зарплата": "Salary",
      "Откликнуться": "Apply",
      "Избранное": "Favorites",
      "Отзывы": "Reviews",
      "Контакты": "Contacts",
      "Преимущества": "Benefits",
      "Статистика": "Statistics",
      "Вопросы и ответы": "FAQ",
      "Пользователи": "Users",
      "Работодатели": "Employers",
      "Добавить вакансию": "Add job",
      "Сохранить": "Save",
      "Отправить": "Send",
      "Email": "Email",
      "Пароль": "Password",
      "Имя": "Name",
      "ФИО": "Full name",
      "Телефон": "Phone",
      "Статус": "Status"
    },
    ru: {}
  };

  function createSwitcher() {
    if (document.getElementById("language-switcher")) return;

    const box = document.createElement("div");
    box.id = "language-switcher";
    box.innerHTML = `
      <button data-lang="uk">UA</button>
      <button data-lang="en">EN</button>
      <button data-lang="ru">RU</button>
    `;

    box.style.position = "fixed";
    box.style.right = "20px";
    box.style.bottom = "90px";
    box.style.zIndex = "99999";
    box.style.display = "flex";
    box.style.gap = "6px";
    box.style.padding = "8px";
    box.style.borderRadius = "14px";
    box.style.background = "rgba(15, 23, 42, 0.9)";
    box.style.backdropFilter = "blur(10px)";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";

    box.querySelectorAll("button").forEach((btn) => {
      btn.style.border = "0";
      btn.style.padding = "7px 10px";
      btn.style.borderRadius = "10px";
      btn.style.cursor = "pointer";
      btn.style.fontWeight = "700";
      btn.style.background = "#ffffff";
      btn.style.color = "#111827";
    });

    document.body.appendChild(box);

    box.addEventListener("click", function (e) {
      const lang = e.target.dataset.lang;
      if (!lang) return;
      localStorage.setItem("site_lang", lang);
      translatePage(lang);
    });
  }

  function translateNode(node, lang) {
    if (!node || !node.childNodes) return;

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const original = child.nodeValue.trim();
        if (original && translations[lang] && translations[lang][original]) {
          child.nodeValue = child.nodeValue.replace(original, translations[lang][original]);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        ["placeholder", "title", "aria-label"].forEach((attr) => {
          const value = child.getAttribute(attr);
          if (value && translations[lang] && translations[lang][value]) {
            child.setAttribute(attr, translations[lang][value]);
          }
        });
        translateNode(child, lang);
      }
    });
  }

  function translatePage(lang) {
    if (lang === "ru") {
      location.reload();
      return;
    }

    translateNode(document.body, lang);

    document.querySelectorAll("#language-switcher button").forEach((btn) => {
      btn.style.background = btn.dataset.lang === lang ? "#2563eb" : "#ffffff";
      btn.style.color = btn.dataset.lang === lang ? "#ffffff" : "#111827";
    });
  }

  function init() {
    createSwitcher();
    const savedLang = localStorage.getItem("site_lang") || "ru";
    translatePage(savedLang);

    const observer = new MutationObserver(() => {
      const lang = localStorage.getItem("site_lang") || "ru";
      if (lang !== "ru") translatePage(lang);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
