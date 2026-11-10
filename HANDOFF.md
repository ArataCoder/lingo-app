# Lingo Brain — документ передачи проекта (HANDOFF)

> Читать ПЕРВЫМ, если ты новый разработчик или другой ИИ-ассистент.
> Правило: после КАЖДОЙ версии обновлять этот файл (раздел «Журнал версий» + «Статус» + «Что дальше»).
> Последнее обновление: v6.0 (рефакторинг структуры), 9 ноября 2026.

---

## 1. Что это

Telegram Mini App + бот для изучения языков, сделанный под человека с СДВГ (ADHD):
- 🇪🇸 Испанский с нуля (A0–A2), упор на жизнь в Испании (Торревьеха): документы, врач, аренда, магазин.
- 🇬🇧 Английский разговорный (B1–B2), упор на собеседования и удалённую работу в IT.

Владелец: Aleks (не программист). Бюджет: **€0**. Все сервисы на бесплатных тарифах.
Бот: @LingoBrainBOT. Приложение: https://aratacoder.github.io/lingo-app/

### Принципы (не нарушать)
- 1 экран = 1 задача. Раунд ~2 минуты. Режим «Нет сил» (45 с, лёгкие карточки).
- Никакого стыда за ошибки: мягкие формулировки, «Почти!», «Ничего, запомнится 🌱».
- Тёмная тема, крупные кнопки, виброотклик, прогресс-точки.
- Одно маленькое улучшение за раз. Владелец просит напоминать: сначала поиск работы, на бота максимум 1 час в день.
- Без платных API, без привязки карты.

### Палитра
| Роль | Цвет |
|---|---|
| Фон | #1A1B26 / #12131C |
| Карточки | #24283B |
| Испанский (ES) | #F7A046 |
| Английский (EN) | #9D7CD8 |
| Верно | #10B981 |
| Ошибка | #F7768E |
| Текст | #EEEEFF |
| Вторичный текст | #565F89 |

---

## 2. Архитектура

```
Telegram (WebApp)  ──►  GitHub Pages (статический фронт: index.html + v3.js + v36.js + content/*.json + assets/audio/*.mp3)
        │                         │
        ▼                         ▼  fetch (initData подписан Telegram)
 Cloudflare Worker  lingo-brain-bot  (bot/worker.js)
   ├─ /webhook        — команды бота (/start ref-ссылки, /stats для админа)
   ├─ /setup?key=...  — ставит webhook + кнопку меню с APP_URL (нужно открывать после смены версии)
   ├─ /api/event      — события аналитики → D1
   ├─ /api/sync       — XP / стрик / слова → таблица players, рейтинг друзей
   ├─ /api/card       — загрузка картинки «Карточка игрока»; /card/<24hex>.jpg — отдача
   └─ /ava/<id>.jpg   — аватарка из профиля Telegram (getUserProfilePhotos), кэш 24 ч
 Cloudflare D1 (SQLite): players, friends, cards, events
 PostHog (EU, бесплатно) — продуктовая аналитика с клиента (ключ в content/config.json)
 GitHub Actions — генерация mp3 нейроголосами (edge-tts)
```

### Репозитории
- `ArataCoder/lingo-app` — основной код (этот репозиторий). Сюда же HANDOFF.md, ROADMAP.md, тесты, bot/worker.js.
- `ArataCoder/aratacoder.github.io` — сайт GitHub Pages. Приложение лежит в папке `lingo-app/` (копия фронта). **Не трогать** другие проекты в этом репозитории (например Focusday).
- Фронт нужно пушить в ОБА репозитория (живой сайт берётся из aratacoder.github.io/lingo-app/).

### Cloudflare
- Аккаунт: 6744b480c4663e86edadcfff8ecbeed3, воркер `lingo-brain-bot`, URL https://lingo-brain-bot.lingobrain.workers.dev
- D1: a6acc254-9562-4724-b94b-f9a8f448a521 (binding `DB`).
- Секреты (значения НЕ хранить в репо): BOT_TOKEN, SETUP_KEY, WEBHOOK_SECRET, ADMIN_CHAT_ID.
- Деплой: PUT /accounts/{id}/workers/scripts/lingo-brain-bot (multipart: metadata + worker.js), metadata:
  `{main_module:"worker.js", compatibility_date:"2026-11-01", bindings:[{type:"d1",name:"DB",id:"a6acc254-..."}], keep_bindings:["secret_text","plain_text"]}`
  Без keep_bindings секреты слетят!
- В воркере константы APP_ORIGIN (https://aratacoder.github.io, для CORS) и APP_URL (с ?v=N для сброса кэша Telegram).

---

## 3. Файлы

| Файл | Что внутри |
|---|---|
| index.html | Только разметка экранов и список `<script>` (порядок важен, см. ниже) |
| css/app.css | Базовые стили (палитра, экраны). Стили модулей v5.x пока вставляются из JS |
| js/core.js | **Грузится первым.** Хуки `LB.on/emit` и обработчики `LB.handle/run`, сбор ошибок `LB.report` (+ window.onerror → событие `js_error` в PostHog) |
| js/analytics.js | PostHog + свой /api/event (`lbTrack`, `lbTrackInit`) |
| js/base.js | Базовая логика v1–v2: состояние `S`, `show()`, `goBack()`, `renderHome()`, `openTrack()`, квиз/говорилка, `complete()` — экран итога |
| js/engine.js (бывш. v3.js) | Движок: треки, каталог тем, раунды (startRun / grade / nextStep / finishRun), сценарии, озвучка, трекер слов, заморозка серии. `var VER` = версия для сброса кэша контента |
| js/friends.js (v36) | Друзья и рейтинг, аватарки, «Карточка игрока», шер с реф-ссылкой |
| js/blocks.js (v41) | Блоки тем на экране трека |
| js/learn.js (v50) | Hero «следующая тема», повторение ошибок (SRS), подсказки, профиль |
| js/shell.js (v51) | Нижняя навигация, шапка, офлайн-баннер, «повторить ошибки» на итоге, a11y |
| js/mascot-img.js, js/mascot.js (v52), js/mascot-fx.js (v53), js/mascot-home.js (v54) | Маскот: встроенные позы; где какая поза + онбординг в 1 шаг; моушн-эффекты; приветствие на главной |
| content/catalog.json | Список треков, блоков и тем (status: ready / soon). Пути тем относительно content/ |
| content/topics/es/{life,survive,work}/*.json, content/topics/en/... | Темы: шпаргалка из 8 слов, ~9 карточек, сценарий |
| content/config.json | Настройки: unlock.mode ("open" / "chain"), analytics.posthogKey |
| assets/audio/{es,en}/<hash>.mp3 + manifest.json | Нейроозвучка. Ключ = `lang|слова в нижнем регистре без пунктуации` (aKey в js/engine.js = akey в generate_audio.py, должны совпадать!) |
| generate_audio.py | Собирает все фразы из контента и генерирует отсутствующие mp3 через edge-tts (голоса es-ES-ElviraNeural / en-US-…Neural). Инкрементально |
| .github/workflows/lingo-audio.yml | Запускает generate_audio.py при push в content/** или generate_audio.py и коммитит mp3 (в сайте — вариант lingo-audio-site.yml с --root lingo-app) |
| .github/workflows/ci.yml | На каждый push/PR: node --check, тесты воркера, validate_content.py, аудио-манифест, e2e Playwright |
| validate_content.py | Проверка контента: структура, граф сценариев, линт ES/EN |
| bot/worker.js | Cloudflare Worker (бот + API) |
| tests/e2e.cjs | Playwright e2e: моки Telegram, офлайн, 44px, контраст, a11y |
| tests/worker.test.mjs, tests/worker-social.test.mjs | Тесты воркера с моками D1 / Telegram (`node tests/worker.test.mjs`) |
| tests/legacy/qa3*.js | Старые Playwright-скрипты (заменены tests/e2e.cjs) |
| tools/archive/ | Одноразовые patch_/gen_-скрипты прошлых версий (история, не запускать) |
| ROADMAP.md | Старый план по этапам |

### Как расширять экраны (v6.0+)
Не переопределяй `window.show / goBack / renderHome / openTrack / shareResult` — это ломало порядок цепочек. Используй хуки из js/core.js:
```js
LB.on("show", function (name) { ... });      // после показа экрана, модули в порядке загрузки
LB.on("home", function () { ... });          // после renderHome()
LB.on("track", function (lang) { ... });     // после openTrack()
LB.handle("back", function () { if (...) { ...; return true; } return false; }); // новые первыми
LB.handle("share", function () { ... return true; });
```
Ошибку, которую нельзя показывать пользователю, не глотай пустым `catch (e) {}`, а отправляй в `LB.report(e, "где")`.

### Хранилище прогресса
- localStorage + Telegram CloudStorage (лимит 4096 символов на ключ), слияние по максимуму.
- `lingo_w` — трекер слов: { topicId: "строка, 1 символ на карточку" }, "-" не видел, "0".."4" учу, "5" выучено.
- `lingo_voice` — темп речи (VS.rate). Поле neural больше не используется (v3.7.1).

---

## 4. Как выпускать версию (чеклист)
1. Поднять `VER` в js/engine.js (если менялся контент), одно общее `?v=N` у всех `<script>`/`<link>` в index.html и APP_URL в bot/worker.js (если нужно).
2. Локально: `python3 -m http.server 8080 & node tests/e2e.cjs`, `node tests/worker.test.mjs`, `node tests/worker-social.test.mjs`, `python3 validate_content.py`. То же самое гоняет CI.
3. Задеплоить воркер (если менялся) с keep_bindings.
4. Задеплоить фронт целиком (index.html, css/, js/, content/, assets/) в lingo-brain-app и в `aratacoder.github.io/lingo-app/`. Файлы лежат в папках css/ и js/ — при inline-деплое их нужно добавить, а не только заменить старые v*.js.
5. Владелец открывает /setup?key=SETUP_KEY, чтобы кнопка бота открыла новую версию.
6. **Обновить этот HANDOFF.md** (журнал + статус).

Известные ловушки:
- GitHub MCP не умеет бинарники и запуск Actions: workflow запускается push-ем файла из списка paths.
- setHeaderColor с hex падает на Telegram 6.1–6.8; shareToStory с widget_link только для Premium.
- photo_url в initDataUnsafe приходит не всегда, поэтому аватарки идут через /ava/<id>.jpg воркера.
- В Windows нет испанского системного голоса, поэтому вся озвучка должна быть mp3.
- Контент: никаких эмодзи в произносимых строках; учитывать род (encantada/encantado).

---

## 5. Журнал версий

### v1 — Telegram-бот (текстовый)
- Первый бот для СДВГ-обучения: короткие задания в чате. Заменён Mini App, но старый бот ещё не закрыт.

### Mini App v1 → v2
- Статическое приложение на GitHub Pages, тёмная тема, 1 экран = 1 задача, прогресс-точки, «скажи вслух».
- v2: дизайн-спецификация под СДВГ (палитра выше, крупные зоны нажатия, мягкие тексты).

### v3 — новый движок
- Треки ES / EN, каталог блоков и тем, раунды 2 мин с XP и комбо, режим «Нет сил».
- Типы карточек: выбор, слух (послушай и выбери), флеш-карта (помню / не помню), собери фразу, скажи вслух.
- Сценарии-диалоги с ветками и очками.
- Cloudflare Worker как бэкенд бота.

### v3.1
- Twemoji с откатом на системные эмодзи, виброотклик, разблокировка тем (60%), офлайн-кэш контента, фикс setHeaderColor. Темы Банк (ES), Удалёнка (EN).

### v3.2
- По просьбе владельца вместо кодов ES / EN снова флаги 🇪🇸 🇬🇧.

### v3.3 / v3.3.1
- 11 готовых тем, validate_content.py, разблокировка внутри блока.
- Аналитика: PostHog + свой /api/event в D1, /stats для админа. Мелкие правки контента (тема зарплаты).

### v3.4
- 23 готовые темы (стандарт 8 слов + 9 карточек + 1 сценарий), все открыты (unlock.mode = open).
- Озвучка Web Speech API, трекер слов (5 верных = выучено 🎓), кнопка «Поделиться с другом».

### v3.5
- Исправлено кривое расположение кнопок, экран «Слова» (учу / выучено с подсветкой), в навигации появилась кнопка «📚 Темы».
- Выбор голоса браузера, расширение карточек (меньше привязки к личной жизни владельца).

### v3.6
- Вкладка «Друзья»: рейтинг за неделю и за всё время, приглашение личной ref-ссылкой /start, бот уведомляет пригласившего.
- «Карточка игрока»: картинка 1080x1350 (XP, уровень, стрик, слова), отправка в чат через бота, в Stories, сохранение.
- Нейроголоса: generate_audio.py + GitHub Action (edge-tts), умный выбор голоса браузера как запасной вариант.

### v3.7 (8 ноя 2026)
- **Работа над ошибками:** ошибочные карточки собираются в r.mistakes. После основных карточек (или когда кончилось время) раунд не заканчивается, а показывает «⚡️ Работа над ошибками (закрепи результат)». Повторная ошибка снова отправляет карточку в очередь. «Идеально!» только когда всё исправлено, подпись «Сразу верно X из N · ошибки исправлены: K». Счёт засчитывается только по основной фазе, за исправления половина XP. «Не помню» во флеш-карте = ошибка, «скажи вслух» всегда верно.
- **Скрыты настройки голоса:** для пользователя остался только темп (0.8 / 1 / 1.15). Голос выбирается автоматически.
- **Аватарки:** /ava/<id>.jpg в воркере (фото профиля Telegram) в списке друзей и на карточке игрока. Если фото скрыто, остаётся буква.
- **Нет системного голоса** для языка (Windows и испанский): вместо чужого голоса показывается тост с текстом.
- Запущена генерация mp3: 832 фразы (408 ES, 424 EN), коммит бота lingo-audio-bot.

### v3.7.1 (8 ноя 2026)
- Фикс «голос всё ещё роботный»: mp3 теперь всегда приоритетнее системного голоса. Старый переключатель v3.6 мог оставить в localStorage neural=false, а после скрытия UI это нельзя было вернуть. Значение сбрасывается при запуске.
- manifest.json грузится без кэша (no-cache + метка времени на 10 мин) с двумя повторами, если Pages ещё не обновился.
- VER 13, APP_URL ?v=13. Тест qa37b.js проверяет, что играет mp3, а не системный голос.
- Этот HANDOFF.md.

### v3.8 — контент (9 ноя 2026)
- +4 темы: ES «О себе и семье» (es.social.me, A1), ES «Как пройти?» (es.travel.directions, A1), EN «Планы и вежливый отказ» (en.social.plans, B1), EN «Согласиться / не согласиться» (en.debate.agree, B2).
- Каждая тема: 8 фраз в шпаргалке, 9 карточек (2 choice + flash low, 2 listen, 2 build, 2 speak), 1 сценарий с ветками.
- Темы генерирует gen_v38.py (шаблон для будущих партий: скопировать, заменить словарь T, запустить, затем validate_content.py).
- Код приложения не менялся, VER остаётся 13. Озвучку новых фраз делает GitHub Action после push в content/.
- Итого: 27 готовых тем; словарь es 468 / en 672.

### v3.9 — контент + голос Andrew (9 ноя 2026)
- +4 темы: ES «Соседи и small talk» (es.social.neighbors, A1), ES «Планы и встречи» (es.social.plans, A2), EN «Рассказать историю» (en.barriers.story, B2), EN «Мнение + аргумент» (en.debate.opinion, B2). Генератор: gen_v39.py.
- Английский голос: en-US-AriaNeural → **en-US-AndrewNeural**. В generate_audio.py добавлен LEGACY_VOICES: если голос языка отличается от legacy, имя mp3 = sha1(key|voice)[:12], поэтому смена голоса = автоматическая переозвучка всех фраз языка. Пока новый mp3 не готов, manifest указывает на старый (Aria) — фолбэк. Испанский (Elvira) не тронут.
- Откат голоса: вернуть в VOICES "en-US-AriaNeural" — старые файлы всё ещё в репо, перегенерации не будет. Альтернативы: en-US-AvaNeural, en-US-AndrewMultilingualNeural, en-US-BrianNeural.
- Итого: 31 готовая тема; словарь es 510 / en 731. VER остаётся 13 (код приложения не менялся).

---

### v4.0 — все 51 тема (9 ноя 2026)
- Добавлено 20 тем (каталог 31 → 51/51):
  - ES: social.opinions, social.bar, travel.hotel, travel.renfe, travel.beach, travel.problems, work.search, work.colleagues, work.calls (B1), work.rights (B1).
  - EN: debate.persuade, debate.conflict, debate.hottakes, barriers.pron (B1), biz.idioms (C1), biz.fintech (B2), biz.product (C1), social.pub (B2), social.banter (C1), social.texting (B2).
- Каждая тема: шпаргалка 8 фраз, 9 карточек (choice ×2, flash, listen ×2, build ×2, speak ×2), сценарий с ветками n1–n4 → n5.
- Проверки перед push: уровень = каталог, 3 уникальных варианта, дистракторы build не совпадают с токенами, граф сценария (n1, end, у каждого узла есть ответ на 2 балла, все next существуют), нет эмодзи в озвучиваемых полях, баланс ¿? ¡! в испанском, кириллица во всех переводах.
- Исправлено: процесс. Временная VM дважды сбрасывалась и теряла несохранённые темы → теперь каждая партия генерируется, валидируется и пушится в оба репо одним скриптом, без VM.
- Финальная проверка: все 51 файл тем существуют в lingo-app, парсятся, id совпадает с каталогом, сценарии стартуют.
- Аудио: генерируется GitHub Actions (lingo-audio.yml) после push.

### v4.1 — расширение треков до 8 тем (9 ноя 2026)
- Каталог 51 → 80/80: каждый из 10 блоков (es.survive, es.life, es.social, es.travel, es.work, en.barriers, en.interview, en.biz, en.social, en.debate) теперь содержит 8 тем.
- Добавлено 29 тем (batch 1–7): ES — аптека, одежда, 112, падрон, коммуналка, почта, семья, хобби, фиесты, ресторан, аренда авто, экскурсии, смены, CV, увольнение; EN — numbers & dates, phrasal verbs, phone calls, CV gaps, follow-up, emails, standups, feedback, hobbies, travel stories, support, negotiation, interrupting, compromise.
- Каждая тема: шпаргалка 8 фраз, 9 карточек (2 choice, flash, 2 listen, 2 build, 2 speak), сценарий из 5 узлов. Линт: уровни, 3 уникальных варианта, дистракторы не дают валидной альтернативы, граф сценария, без эмодзи в озвучке, баланс ¿?¡! для ES, кириллица в переводах.
- Финальная проверка: все 80 файлов существуют, парсятся, id совпадает, сценарии стартуют; catalog.json сайта идентичен lingo-app. Аудио генерируется через Actions (lingo-audio.yml / lingo-audio-site.yml).

### v4.2 — быстрые уроки + треки на экране языка (9 ноя 2026)
- Новый файл v41.js (подключён в index.html после v36.js). Код старых файлов не менялся.
- +10 быстрых уроков по 6 карточек: ES — Аптека, Транспорт, Банк, Работа, Соседи; EN — Телефон, Письма, Small talk, Цифры, Путешествия. Теперь 10 уроков на язык (+ «Повторяй вслух»).
- На экране языка: заголовок «⚡ Быстрые раунды», под ними «📚 Треки» — карточки блоков (8 тем · уровень · ✅ пройдено + прогресс-бар). Нажатие открывает каталог на этом блоке; «Назад» возвращает на экран языка.

### v5.0 — удобство для новичков (9 ноя 2026)
- Новый файл `v50.js` (подключён после `v41.js`). Ключи хранилища: `lingo_p` (язык, уровень, цель, порядок блоков, подсказки, напоминание) и `lingo_rv` (ошибки: `"topicId#idx": [коробка, деньПовтора]`).
- Онбординг из 3 шагов (язык → уровень → цель), после него сразу открывается шпаргалка первой темы. Старые пользователи (есть раунды/XP) онбординг не видят, язык определяется по их прогрессу.
- Большая кнопка «▶ Начать / Продолжить: <тема>» на главной. «Нет сил», «Сюрприз» и «Разминка» — в маленьком ряду. Второй язык — через переключатель.
- Точки на главной показывают прогресс текущего блока: «пройдено N из 8».
- «🔁 Повторить ошибки»: неверные карточки попадают в повторение, интервалы 1 → 3 → 7 дней, после третьего верного ответа карточка уходит.
- Напоминания в «Прогрессе»: 08/12/15/19/21 или «Выкл», по умолчанию 19:00. Фронт шлёт POST `/api/remind` {initData, on, hour, tz, lang}; воркер проверяет раз в 15 минут.
- Меньше вкладок: Главная · Темы · Прогресс. «Слова» и «Друзья» открываются из «Прогресса» (Друзья — только если есть хотя бы один друг). Кнопка «←» возвращает в «Прогресс».
- Текст не меньше 13px, светлее --muted/--dim. Одноразовые подсказки на главной и в каталоге.
- Правки текстов: «и день засчитан», «Не помнишь слово», «День пропущен? Ничего страшного.», нейтральный по роду текст «Поделиться».
- Проверено в headless Chromium с моками Telegram и воркера: новый и старый пользователь, онбординг, кнопка, повторение, напоминание, навигация. Ошибок JS нет.

## 6. Статус: что реализовано
- ✅ v5.0: онбординг, кнопка «Продолжить», повторение ошибок, напоминания, 3 вкладки, подсказки, контраст 13px+.
- ✅ 80 тем из 80 в каталоге, по 8 тем в каждом из 10 блоков (v4.1).
- ✅ 10 быстрых уроков на язык + треки прямо на экране языка (v4.2). Примечание: раньше в HANDOFF было «49 тем / осталось 18» — это ошибка подсчёта, реально в catalog.json 51 тема и оставалось 20.
- ✅ Раунды, режим «Нет сил», работа над ошибками, XP, уровни, стрик, трекер слов.
- ✅ Нейроозвучка всего контента (mp3) + запасной голос браузера.
- ✅ Друзья, рейтинг, приглашения, аватарки, карточка игрока, шер.
- ✅ Аналитика (PostHog + D1), /stats.
- ✅ Автотесты фронта и воркера, валидатор контента.

## 7. Что дальше (приоритет сверху)
1. **Расширение треков** — блоки по 8 тем ✅ (v4.1). Дальше: boss-сценарии в конце блока, новые блоки. Шаблон генерации: см. v4.0 (генерация + валидация + push в одном скрипте).
2. **SRS-повторение:** ошибки и выученные слова → «Повторить сегодня» (1 → 3 → 7 → 14 дней), кнопка «🔁 3 повтора · 1 мин».
3. **Напоминания** через Cloudflare Cron (время выбирает пользователь, тихие часы).
4. **Проверка речи:** Web Speech Recognition (где есть), позже whisper на домашнем ПК.
5. CI: validate_content.py + node --check + Playwright в GitHub Actions.
6. Запасной TTS, если edge-tts закроют: Piper (офлайн) или Cloudflare Workers AI MeloTTS. Формат manifest.json не меняется.
7. Позже: Telegram Stars, /setuserpic боту (icon.png), закрыть старый бот v1.

## 8. Открытые вопросы к владельцу
- PostHog: регион EU или US (ключ phc_... уже в config.json)?
- Напоминания через GitHub Actions или через Cron воркера?

### v5.2 — маскот + онбординг в 1 шаг (9 ноя 2026)
- Новый файл `v52.js` (подключён после v51.js, `?v=1`). `v50.js?v=2`: в `window.__v5` добавлены `saveP, setTr, go, whenReady`. `v3.js`: VER 14 (`?v=15`), `bot/worker.js`: APP_URL `?v=14`.
- Маскот: `assets/mascot/mascot_{start,error,win}.webp` (≈280×280, прозрачный фон). Пока файлов нет, показывается 🧠/🏆, ничего не ломается.
  - start: шпаргалка и первая карточка урока; error: первая карточка «Работы над ошибками»; win: экран результата с «Идеально!». Учитывает prefers-reduced-motion, картинка скрыта от скринридеров, реплика в role=status.
- Онбординг: вместо 3 шагов v5.0 один экран: язык (ES по умолчанию) + «Я с нуля (A0)» / «Уже знаю базу (A1+)». Старая модалка `#v5onb` подменяется автоматически.
  - ES A0: lvl 1, блоки survive→life (первая тема es.survive.hello со шпаргалкой). ES A1+: lvl 2, life→social→survive.
  - EN «с нуля»: barriers→social. EN A1+: lvl 4, interview→barriers.
  - После выбора урок стартует, как только загружена нужная тема (не ждём все 80 файлов — раньше это могло занимать до 10 с).
  - Событие `onboarding_done` с `variant: "1step"`.
- Озвучка: в generate_audio.py уже es-ES-AlvaroNeural и en-US-GuyNeural (старые Elvira/Aria в LEGACY_VOICES).
- Контент: 80/80 тем ready, validate_content.py OK, lint пунктуации/акцентов ES/EN — ошибок нет.
- QA (headless Chromium + мок Telegram SDK): онбординг 44px+ кнопки, фокус, EN-ветка, сохранение P, повторный вход без онбординга, маскоты start/error/win, reduced-motion, 0 JS-ошибок.


## v5.3 — хостинг приложения на Cloudflare (бесплатно)

- **Основной адрес мини-аппа:** https://lingo-brain-app.lingobrain.workers.dev/ (воркер `lingo-brain-app`, Workers Free).
- GitHub Pages (https://aratacoder.github.io/lingo-app/) остаётся зеркалом/фолбэком, ничего не удалено.
- Воркер `lingo-brain-app` генерируется при деплое: index.html, v*.js и весь content/** вшиты в код. `/assets/*` (аудио, маскот) проксируются с GitHub Pages (фолбэк raw.githubusercontent) и кэшируются на edge.
- Кэш: index.html и файлы без `?v=` — `no-cache` + ETag (обновы видны сразу после деплоя). Файлы с `?v=` — immutable на год, поэтому при изменении JS/контента **обязательно бампать ?v= / VER**.
- `/__build` показывает время сборки и количество файлов — быстрый способ проверить, что деплой долетел.
- Бот `lingo-brain-bot`: APP_URL = новый адрес; кнопка меню синхронизируется сама (таблица D1 `meta`, ключ `menu_url`) при первом апдейте после деплоя, либо вручную: `/sync-menu?force=1`. SETUP_KEY больше не нужен для смены ссылки.
- Деплой: после пуша в main агент пересобирает воркер через Cloudflare API (PUT script). Автодеплой из GitHub (Workers Builds / GitHub Action) можно добавить позже — для этого нужен API-токен Cloudflare в секретах репо.
- Прогресс: localStorage привязан к домену, поэтому на новом адресе локальный прогресс начинается заново; прогресс из Telegram CloudStorage и XP в D1 подтягиваются.


## v5.4 (2026-11-09)
- Cheat timer: requestAnimationFrame + transform:scaleX (smooth, not killed by reduced-motion rule). stopCheat uses cancelAnimationFrame.
- Friends: bot CORS is now "*" (workers.dev origin was blocked → rating never loaded). 12s timeout, loading spinner, error state with "Повторить" (lbFrRetry). Fixed invite-button overlap (#frList margin, .fr>.btn static).
- Fixed "Чт" (U+FFFD from bad UTF-8 transport). ALWAYS push via JSON/ASCII-safe transport and check for U+FFFD.
- Hero "Твой следующий шаг" redesigned per impeccable: no eyebrow, no emoji icon, title + block + "i из n", segmented progress (bar if >12 topics), label + "≈ 2 минуты", round SVG play button, soft shadow.
- Audio loads directly from GitHub Pages (AUDB in v3.js) → doesn't consume worker requests.
- Deploy: lingo-brain-app is still an inline-file worker (90 files, /__build mode "inline"). Static Assets upload needs a real API token (the MCP OAuth fetch overrides the upload JWT → 401). With a token "Workers Scripts:Edit" we can switch to Static Assets + Workers Builds auto-deploy.
- Cache: html no-cache; ?v= files immutable 1y; other files 10 min + SWR.


## v5.5 (2026-11-09)
- **Root cause of «Рейтинг не загрузился»:** the bot worker lost ALL bindings and secrets (DB, BOT_TOKEN, SETUP_KEY, WEBHOOK_SECRET, ADMIN_CHAT_ID). Without BOT_TOKEN, verifyInitData always fails, so /api/sync returns 401 "auth". This was caused by a deploy without keep_bindings / via /content.
- Restored: D1 binding DB plus new random SETUP_KEY and WEBHOOK_SECRET (full PUT with bindings in metadata). **BOT_TOKEN and ADMIN_CHAT_ID must be re-added by the owner** in the Cloudflare dashboard (lingo-brain-bot → Settings → Variables and Secrets → Secret). After that, open /setup?key=SETUP_KEY to re-register the webhook with the new WEBHOOK_SECRET.
- New GET /api/health on the bot: {db, tok, players, last_sync_err {t,e,d:{len,keys,age,match,tok}}, last_sync_ok}. initData itself is never stored.
- Client (v36?v=16): error state shows "код: auth / AbortError / TypeError / http N". For "auth" it asks the user to reopen the app via the bot.
- Play button (v51?v=3): rounded triangle centered by its centroid (no margin hack), 26px, a subtle ring.
- Gradual unlock: content/config.json unlock.mode = "chain", alwaysOpen = []. The first topic of each block is open; the next one opens after ≥60% on the previous one. Hero/nextTopic already respect isOpen.
- **Deploy rule (bot):** ALWAYS do a full PUT /workers/scripts/lingo-brain-bot with metadata.bindings + keep_bindings:["secret_text","plain_text"]. Never use /content.
- App deploy: patch the inline worker in place (GET /content/v2 → JSON.parse F → replace changed files → PUT with new BUILD). Build v5.5-2026-11-09T17:51:30Z.

- **REAL root cause (found later in v5.5):** a Cloudflare Workers Builds trigger (GitHub repo lingo-app, branch main, "npx wrangler deploy", root /) was attached to lingo-brain-bot. Every push to main redeployed the bot as a static-assets-only worker. That wiped the code, D1 and all secrets (and the dashboard said "Variables cannot be added to a Worker that only has static assets"). The trigger is DELETED. Do NOT reconnect Workers Builds to lingo-brain-bot without a wrangler.toml (main = "bot/worker.js", d1 binding DB).
- The bot was redeployed as an ES module with DB + new SETUP_KEY/WEBHOOK_SECRET + keep_bindings. The owner adds BOT_TOKEN (and optionally ADMIN_CHAT_ID) as Secrets in the dashboard, then the agent runs /setup?key=SETUP_KEY.

- **v5.5.3, IMPORTANT, content cache:** v3.js fetches content/*.json?v=VER, and the app worker used to serve any URL with a query as "immutable, 1 year". After config.json changed (open → chain), old clients kept the cached old config, so every topic stayed open. Fixes: VER bumped to "15", and the worker now serves .json with max-age=300. **Whenever content/*.json changes, bump VER in v3.js and the ?v= of v3.js in index.html.**
- v5.5.1: the toast is above the card overlay (z 10001), and the card buttons have a busy state. v5.5.2: locked topics are gray (.v3t.locked).


## v5.6 — маскот-кошкодевочка (4 позы)
- v52.js: позы start / error / win / tired. Картинки: assets/mascot/mascot_{start,error,win,tired}.webp (квадрат 512×512, прозрачный фон). Пока файлов нет, вместо них эмодзи 🧠 🏆 ☕.
- Где какая поза: start — шпаргалка и первая карточка темы; tired — первая карточка в режиме «Нет сил» (lastRun.key === "low"); error — старт работы над ошибками и итог раунда «Ошибки — это учёба»; win — итог «Идеально!» и «Мозг прокачан».
- CSS: картинка не выше 130px (win 120px), анимации pop + 2 подпрыгивания, учитывается prefers-reduced-motion. У .lbm стоит pointer-events:none, поэтому маскот никогда не перехватывает нажатия на кнопки.
- После загрузки картинок поднимите MV в v52.js, иначе останутся закэшированные 404.
- Онбординг в 1 шаг (A0 / A1+) уже есть с v5.2 (#lbonb), он не менялся.

## v5.6.1 — первая поза маскота (start)
- `mascot_img.js`: картинки маскота встроены как data:URI (webp 256px, фон вырезан) в `window.LB_MASCOT` — обход того, что пуш через MCP умеет только текст.
- `v52.js` сначала берёт `LB_MASCOT[pose]`, иначе `assets/mascot/mascot_<pose>.webp`, иначе эмодзи.
- Готово: start. Ждём: win, error, tired — добавлять ключами в `mascot_img.js` и поднимать `?v=` у mascot_img.js.


## v5.6.2 — все 4 позы + анимации
- `mascot_img.js`: start, error, win, tired (webp 256px, фон вырезан, ~78 KB).
- Если картинка есть, круглая подложка убирается (`.pic:has(img)`), маскот — «стикер».
- Анимации по позам: start — покачивание (wave ×2), error — смущённое «мотание» ×1, tired — медленное дыхание ×3, win — прыжок со squash&stretch ×2 + оранжевое свечение + CSS-конфетти (::before/::after).
- Всё конечное (не бесконечные циклы), `prefers-reduced-motion` отключает.


## v6.0 — рефакторинг структуры кода (9 ноя 2026)
Поведение приложения не менялось; e2e-тесты и тесты воркера зелёные.
- Фронт разложен по папкам: `css/app.css`, `js/core.js`, `js/analytics.js`, `js/base.js` (вынесено из index.html), `v*.js` переименованы по смыслу (таблица в разделе 3). Все теги грузятся с единым `?v=60`.
- **Цепочки перехвата убраны.** Раньше `show()` переопределяли 6 файлов подряд, `goBack()` — 3, `renderHome()` — 3. Теперь base.js вызывает хуки `LB.on / LB.handle` из js/core.js, модули только подписываются. Порядок вызова тот же, что и раньше.
- `js/core.js`: ошибки из хуков и `window.onerror` / `unhandledrejection` уходят в PostHog событием `js_error` (не больше 10 за сессию, без дублей).
- `js/mascot-frames.js` (v53, покадровая анимация) теперь подключён и в index.html репозитория (раньше был только в задеплоенной версии).
- a11y: кнопка 🔊 в шторке получила aria-label (Twemoji заменял эмодзи картинкой раньше, чем a11y() читал текст).
- Воркер: `/api/health` без `?key=SETUP_KEY` отвечает только `{"ok":true}`; диагностика — с ключом. Удалена неиспользуемая константа APP_ORIGIN.
- Тесты: `tests/worker*.test.mjs` больше не зависят от путей `/data/...` и запускаются в CI (Node 24). Обновлены устаревшие проверки (CORS `*`, APP_URL на Cloudflare, текст hero).
- Одноразовые скрипты → `tools/archive/`, старые qa3x.js → `tests/legacy/`.
- **Деплой:** фронт нужно выкладывать с новыми папками `css/` и `js/`.
- **Перенесено из прода в репозиторий** (v5.8–v5.9.2 были задеплоены в Cloudflare без коммита): `sayAfter` в js/engine.js (реплика собеседника ждёт конца твоей фразы), js/mascot-fx.js (бывш. прод-v53: парение, аура, искры/Zzz вместо смены кадров), js/mascot-home.js (бывш. v54: приветствие маскота на главной), новые позы в js/mascot-img.js. `mascot_frames.js` в проде не подключался — не перенесён.
- **Правило:** всё, что выкладывается в Cloudflare, сначала коммитится сюда. Иначе следующий деплой из репозитория откатит прод.
- **Задеплоено 9 ноя 2026, 23:46 UTC:** `lingo-brain-app` build `v6.0-2026-11-09T23:46:18.158Z` (97 файлов: index.html, css/, js/, content/; старые v*.js и неиспользуемый mascot_frames.js убраны из сборки), `lingo-brain-bot` с закрытым /api/health. Привязки и секреты сохранены (keep_bindings). Зеркало aratacoder.github.io/lingo-app/ осталось на v5.7.
- **Безопасность:** BOT_TOKEN у `lingo-brain-bot` хранится как Text (plain_text), а не Secret. Владельцу: в Cloudflare → lingo-brain-bot → Settings → Variables and Secrets пересоздать BOT_TOKEN с типом Secret.


## v6.1 — чёткий маскот + «живые» детали (10 ноя 2026)
- `assets/mascot/hd/{start,error,win,tired}.webp` — 480×480, вырезаны из исходников владельца 2048px (Photoroom): квадрат по альфа-контуру +2%, LANCZOS, webp q82. Встроенные маленькие позы в js/mascot-img.js остаются как мгновенная заглушка; js/mascot.js подгружает HD и подменяет картинку (HV = версия HD-файлов).
- В приложении (воркер `lingo-brain-app`) `/assets/*` проксируются с GitHub Pages, затем с raw.githubusercontent `main` — **HD-файлы появятся только после мержа в main**. Деплоить JS после мержа (воркер кэширует ответы /assets/, в т.ч. 404).
- js/mascot-fx.js переписан: всё движение конечное (раньше парение/свечение крутились бесконечно), через ~10 с маскот неподвижен. Детали по позам (координаты в % квадрата): start — искорка у подмигивающего глаза; error — капля пота стекает; win — вспышка и блик по кубку, XP подпрыгивает (вырезанные копии позы поверх оригинала, без drop-shadow — иначе видна рамка clip-path); tired — пар из кружки (Zzz убран). prefers-reduced-motion: всё статично.


## v6.2 — вёрстка на iPhone, аватарка бота, задел под подписку за звёзды (10 ноя 2026)
- **Hero на главной (iOS):** WebKit сжимал содержимое `<button id="v5hero">`, полоса прогресса и кнопка ▶ занимали ~половину карточки. js/shell.js: кнопка — flex-колонка, `.v51h` растянут (`align-self:stretch`). Проверено в Playwright WebKit (iPhone 13).
- **Аватарка бота:** `assets/brand/bot-avatar.jpg` (640×640, поза start, фон в цветах бренда, уши и логотип внутри круга). Ставится вручную: @BotFather → /mybots → Edit Bot → Edit Botpic.
- **Premium (Telegram Stars), выключено:** в bot/worker.js `PREMIUM.enabled = false`, цена `PREMIUM.stars`. Таблицы D1 `subs` (user_id, until) и `payments` (charge_id — нужен для возврата `refundStarPayment` и отмены `editUserStarSubscription`). `POST /api/invoice` → `createInvoiceLink` (XTR, subscription_period 2592000). `pre_checkout_query` проверяет валюту, сумму и что payload = `premium:<id того, кто платит>`. `successful_payment` продлевает `subs.until` по `subscription_expiration_date`. `/api/sync` возвращает `premium {enabled, active, until, stars}`. Команда `/paysupport` (требование Telegram для оплаты звёздами), в меню команд — только когда включено.
- Клиент (js/friends.js): `LB.isPremium()`, `LB.premium()`, `LB.buyPremium()` (Telegram.WebApp.openInvoice), событие `LB.on("premium", fn(active))`. UI покупки и ограничения по фичам ещё не сделаны — это решение по продукту.
- **Как включить:** `PREMIUM.enabled = true` → тесты → деплой бота с keep_bindings → открыть `/setup?key=SETUP_KEY` (перерегистрирует webhook с `pre_checkout_query`, иначе оплаты будут падать по таймауту) → добавить кнопку в приложение.


## v6.2.1 — бренд-материалы для бота (10 ноя 2026)
- `assets/brand/bot-avatar.png` — аватарка 640×640 PNG: фиолетовый фон, белый «стикерный» контур, лёгкий unsharp. PNG, а не JPEG: Telegram сам пережимает аватарки в JPEG 640, второе сжатие поверх нашего давало «мыло» и блоки на тёмном градиенте. Заменила bot-avatar.jpg.
- `assets/brand/description-960x540.mp4` (основной, ~0.7 МБ) и `description-640x360.gif` (запасной) — анимация для блока «Что умеет этот бот?» (@BotFather → /mybots → Edit Bot → Edit Description Picture). 6 с, цикл: кошка выпрыгивает и подмигивает (искорка), «Lingo Brain» появляется по буквам, плашка ADHD-FRIENDLY, слоган, чипы ES/EN, точки прогресса «2 минуты в день», затухание.
- Исходник анимации: `tools/brand/description.html` (CSS-кейфреймы на одной 6-секундной шкале) + `tools/brand/render.cjs` (Playwright покадрово → ffmpeg). Перегенерировать: `node tools/brand/render.cjs`.


## v6.3 — ежедневные напоминания (10 ноя 2026)
- Бот раз в час (Cloudflare Cron Trigger `0 * * * *`, хэндлер `scheduled` в bot/worker.js) шлёт **одно** напоминание в день тем, у кого сейчас выбранный час по их времени и кто сегодня ещё не прошёл раунд. По умолчанию включено, 19:00, часовой пояс CET, пока приложение не пришлёт свой (`tz` в /api/sync = минуты к востоку от UTC).
- Тексты — `REMIND.regular / streak / comeback` в начале bot/worker.js, плейсхолдеры `{name}`, `{streak}`. streak — если серия ≥ 2, comeback — если ≥ 2 дней без раунда. Не пишем тем, кто не заходил 14 дней (`REMIND.quietAfterDays`), заблокировал бота (403) или никогда его не запускал (400 chat not found) — они помечаются `remind.blocked = 1`.
- Таблица D1 `remind` (user_id, enabled, hour, tz, last_sent, last_round, blocked). `last_round` пишется из события `round_completed` (/api/event).
- `/remind`: кнопки 9/13/19/21:00, «Пример», «Выключить» (callback_query `rm:*`). Под каждым напоминанием — «🚀 2 минуты» (открыть приложение) и «⏰ Время / выключить».
- `syncBotConfig`: при первом апдейте или кроне после деплоя бот сам переставляет `allowed_updates` вебхука (теперь с `callback_query`) и меню команд — `/setup` для этого больше не нужен. Хранится в meta `bot_config`.
- **Cron Trigger** настраивается в Cloudflare отдельно от кода: `PUT /accounts/{id}/workers/scripts/lingo-brain-bot/schedules` с `[{"cron":"0 * * * *"}]` (или Dashboard → Worker → Settings → Triggers). Без него напоминания не идут. Последняя рассылка видна в `/api/health?key=…` → meta `last_remind`.


## v6.4 — мягкая монетизация, косметика и защита оплат Telegram Stars (10 ноя 2026)
- **Защита платежей в `bot/worker.js`:**
  - В таблицу `payments` добавлена колонка `refunded INTEGER DEFAULT 0` (с авто-миграцией `ALTER TABLE` в `ensureSchema`).
  - Идемпотентность `onPayment`: проверка существующего `charge_id` до начисления подписки исключает двойное продление и повторное сообщение при дублях вебхука; запись в `payments` и `subs` выполняется атомарно через `env.DB.batch`.
  - Обработка возвратов `onRefund` (`message.refunded_payment`): выставляет `refunded = 1` в `payments` и обнуляет активную подписку в `subs`.
  - При сбое БД во время обработки апдейта `/webhook` возвращает HTTP 500, чтобы Telegram повторил доставку вебхука и платёж не потерялся.
  - `listFriends` делает `LEFT JOIN subs` и возвращает флаг `plus: boolean` для отображения значка и рамки у друзей.
- **Мягкая монетизация и косметика (`js/friends.js`, все 80 тем 100% бесплатны):**
  - В рейтинге друзей и шапке главной страницы у поддержавших проект игроков отображается золотая рамка вокруг аватарки/строки и значок `⭐ Плюс` / `⭐`.
  - В «Карточку игрока» (`lbCard` / `lbDrawCard`) добавлен переключатель из 4 тем оформления: бесплатная «🌙 Классика» и 3 кастомных стиля для спонсоров — «⭐ Золото» (`SUPPORTER`), «🌌 Аврора» (`AURORA PLUS`), «⚡ Неон» (`HYPERFOCUS`) с декоративными звёздами, градиентным свечением и бейджем.
  - На экране «📊 Прогресс» через хуки `LB.on("show")` / `LB.on("home")` / `LB.on("premium")` добавлена карточка мягкого доната «⭐ Поддержать Lingo Brain», вызывающая `LB.buyPremium()`.


## v6.5 — достижения, рамки и титулы на себе, 3 тарифа поддержки и фиксы iPhone (10 ноя 2026)
- **Экран «🏅 Достижения и стиль» (`scr_ach`, открывается из «📊 Прогресс» и по клику на аватарку/титул на главной):**
  - Карточка предпросмотра профиля с живой аватаркой, выбранной рамкой и титулом + кнопка «🖼 Карточка».
  - **5 рамок аватара** (`Стандарт`, `🔥 Огненная` за 3 дня серии, `🎓 Изумрудная` за 10 выученных слов, `⚡ Неоновая` за 10 раундов/300 XP, `👑 Золотая VIP` за поддержку проекта).
  - **6 выбираемых титулов** под именем (`🌱 Новичок`, `🔥 Машина серии`, `🎓 Полиглот`, `⚡ Кибермозг`, `🏆 Легенда Lingo`, `⭐ Меценат`).
  - **10 достижений** с прогресс-барами и наградами.
  - Выбранная рамка и титул отображаются **на самом игроке** (в шапке главной страницы, в карточке игрока, в профиле достижений) и синхронизируются в `players (frame, title)` для отображения в рейтинге друзей.
- **3 разовых уровня поддержки в Telegram Stars (`50 / 150 / 500 ⭐`):**
  - `POST /api/invoice` принимает `{ initData, tier: 50 | 150 | 500 }` и создаёт разовый счёт в `XTR` без принудительной ежемесячной подписки; `onPreCheckout` и `onPayment` открывают VIP-косметику навсегда.
- **Исправления багов по скриншотам с iPhone:**
  - **Модалка «Карточка игрока» (`#cardOv`):** селектор `#cardOv img` заменён на `#cardImg`, чтобы Twemoji-иконки (`img.emj`) внутри кнопок не растягивались на 380px. Кнопки собраны в компактную сетку `.cacts`. При открытии карточки вне раунда отображается общий XP, титул и число достижений вместо `+0 XP`.
  - **Напоминания из Mini App (`POST /api/remind`):** в `bot/worker.js` добавлен обработчик `onRemindApi`, сохраняющий `enabled, hour, tz` в таблицу `remind`.
  - **Аватарки (`/ava/<id>.jpg` и `js/base.js`):** убрана блокировка по наличию строки в `players` в `onAva`; на главной добавлен фоллбэк на `/ava/<id>.jpg`, если Telegram не прислал `user.photo_url`.
  - **Шапка карточки в квизе/аудировании (`.qlabel` в `js/engine.js`):** разделена на аккуратный бейдж режима (`.qmode`) слева и название темы (`.qtop-t`) справа без капса и слипания строк.


