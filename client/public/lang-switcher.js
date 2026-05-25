(function () {
  const dictionary = {
    "Найти работу": "Знайти роботу",
    "Зарегистрироваться": "Зареєструватися",
    "Войти": "Увійти",
    "Выйти": "Вийти",
    "Главная": "Головна",
    "Вакансии": "Вакансії",
    "Личный кабинет": "Особистий кабінет",
    "Админ-панель": "Адмін-панель",
    "Контакты": "Контакти",
    "Отзывы": "Відгуки",
    "Статистика": "Статистика",
    "Преимущества": "Переваги",
    "Верификация": "Верифікація",
    "Документы": "Документи",
    "Заявки": "Заявки",
    "Уведомления": "Сповіщення",
    "Откликнуться": "Відгукнутися",
    "Добавить вакансию": "Додати вакансію",
    "Пользователи": "Користувачі",
    "Работодатели": "Роботодавці",
    "Пароль": "Пароль",
    "Имя": "Ім’я",
    "Телефон": "Телефон",
    "Страна": "Країна",
    "Поиск": "Пошук",
    "Зарплата": "Зарплата",
    "Сохранить": "Зберегти",
    "Отправить": "Надіслати",
    "Не проверен": "Не перевірено",
    "На проверке": "На перевірці",
    "Проверен": "Перевірено"
  };

  function translate(node) {
    if (!node) return;

    if (node.nodeType === 3) {
      const text = node.nodeValue.trim();

      if (dictionary[text]) {
        node.nodeValue = dictionary[text];
      }
    }

    node.childNodes.forEach(translate);
  }

  function addButton() {
    if (document.getElementById("ua-btn")) return;

    const btn = document.createElement("button");

    btn.id = "ua-btn";
    btn.innerText = "UA";

    btn.style.position = "fixed";
    btn.style.right = "20px";
    btn.style.bottom = "90px";
    btn.style.zIndex = "999999";
    btn.style.padding = "10px 14px";
    btn.style.borderRadius = "12px";
    btn.style.border = "0";
    btn.style.background = "#2563eb";
    btn.style.color = "white";
    btn.style.fontWeight = "bold";
    btn.style.cursor = "pointer";

    btn.onclick = () => {
      translate(document.body);
    };

    document.body.appendChild(btn);
  }

  window.addEventListener("load", () => {
    addButton();

    const observer = new MutationObserver(() => {
      addButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
