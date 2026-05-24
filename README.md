# AI Job Platform PRO

Учебный fullstack-проект: React + Vite + Tailwind CSS + Node.js + Express + SQLite + JWT + AI.

## Функции

- Главная страница с преимуществами, статистикой, отзывами, FAQ и контактами
- Регистрация и вход
- JWT авторизация
- Роли: user, admin, employer
- Личный кабинет
- Верификация пользователя
- Загрузка документов
- Вакансии, поиск и фильтры
- Отклик на вакансию
- Избранные вакансии
- AI-чат
- AI подбор вакансий
- AI генератор CV
- AI анализ CV
- AI собеседование
- PDF экспорт CV
- Email verification demo через код в уведомлении
- Админ-панель
- Панель работодателя
- Статистика и графики
- Таблицы SQLite: users, profiles, jobs, applications, documents, notifications, ai_messages, favorites, reviews, manager_messages
- Тёмная тема
- PWA manifest
- Socket.io структура для онлайн-чата
- Gemini API структура

## Важно про Gemini API

Не вставляйте API ключ в код и не отправляйте его в чат. Создайте файл:

server/.env

Пример:

PORT=5000
JWT_SECRET=super_secret_jwt_key_change_me
GEMINI_API_KEY=ВАШ_НОВЫЙ_КЛЮЧ

Если GEMINI_API_KEY пустой, AI работает в локальном демо-режиме.

## Тестовые аккаунты

User:
email: user@test.com
password: 123456

Admin:
email: admin@test.com
password: admin123

Employer:
email: employer@test.com
password: employer123

## Запуск Backend

cd server
npm install
npm start

Backend: http://localhost:5000

## Запуск Frontend

Откройте второй терминал:

cd client
npm install
npm run dev

Frontend: http://localhost:5173

## Что показать преподавателю

1. Главную страницу и адаптивный дизайн
2. Регистрацию и вход
3. JWT токен и защищённые страницы
4. Личный кабинет
5. Верификацию и загрузку документов
6. Вакансии, фильтры, отклик
7. Избранные вакансии
8. AI-чат
9. AI подбор вакансий
10. AI генератор CV
11. AI анализ CV
12. AI собеседование
13. Админ-панель
14. Изменение статуса верификации
15. Графики статистики
16. Панель работодателя
17. SQLite базу данных
18. Структуру под Gemini API
19. PWA manifest
20. Тёмную тему

## Как работает AI

Backend сначала пытается использовать Gemini API, если в `.env` есть GEMINI_API_KEY. Если ключ не указан, включается локальная имитация AI, которая понимает запросы про вакансии, верификацию, документы, кабинет и резюме.

## Примечание

Это учебный проект. Telegram, Google OAuth и полноценный deploy оставлены как архитектурно подготовленные направления, но без внешних ключей и сервисов, чтобы проект запускался локально сразу после установки.
