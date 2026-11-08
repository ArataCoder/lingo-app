# Lingo Brain ADHD: контент и бот

## Структура

```
content/
  catalog.json          дерево: треки → блоки → темы (50 тем)
  config.json           режимы энергии, XP, заморозка серии
  surprise.json         Surprise Box: факты, мемы, вопросы, челленджи
  topics/<track>/<block>/<topic>.json   одна тема = один файл
  topics/_TEMPLATE.json шаблон новой темы
  models.py             модели (pydantic v2)
  validate.py           проверка всего контента
bot/worker.js           Telegram-бот на Cloudflare Workers (бесплатно, 24/7)
brand/icon.png          аватарка бота 640×640
```

## Типы карточек

| type | что это |
|---|---|
| choice | выбор 1 из 2–4 |
| flash | карточка-переворот |
| listen | тренажёр уха: акцент (es-ES/es-MX/en-US/en-GB) и темп |
| build | конструктор фразы из плашек + шаблон |
| speak | скажи вслух |

`energy`: `low` (для режима «Нет сил»), `normal`, `boost`.
Сценарии: граф диалога (узлы и выборы), работает без ИИ. Блок `ai` включим в фазе 2.

## Как добавить тему (3 шага)

1. Скопируй `topics/_TEMPLATE.json` в `topics/es/life/rent.json` и заполни.
2. В `catalog.json` у этой темы поставь `"status": "ready"` и `"file": "topics/es/life/rent.json"`.
3. `cd content && python validate.py` → зелёная галочка = готово.

## Бот на Cloudflare (€0)

1. dash.cloudflare.com → бесплатный аккаунт → Workers & Pages → Create → Hello World → Deploy.
2. Edit code → вставь `bot/worker.js` → Deploy.
3. Settings → Variables and Secrets: `BOT_TOKEN`, `WEBHOOK_SECRET`, `SETUP_KEY` (тип Secret).
4. Открой `https://<твой-воркер>.workers.dev/setup?key=<SETUP_KEY>`. Должно быть `"allOk": true`.
5. Напиши боту /start.

Аватарка: BotFather → /setuserpic → отправь `brand/icon.png`.
