p = "/data/lr34/HANDOFF.md"
s = open(p, encoding="utf-8").read()
v39 = """### v3.9 — контент + голос Andrew (9 ноя 2026)
- +4 темы: ES «Соседи и small talk» (es.social.neighbors, A1), ES «Планы и встречи» (es.social.plans, A2), EN «Рассказать историю» (en.barriers.story, B2), EN «Мнение + аргумент» (en.debate.opinion, B2). Генератор: gen_v39.py.
- Английский голос: en-US-AriaNeural → **en-US-AndrewNeural**. В generate_audio.py добавлен LEGACY_VOICES: если голос языка отличается от legacy, имя mp3 = sha1(key|voice)[:12], поэтому смена голоса = автоматическая переозвучка всех фраз языка. Пока новый mp3 не готов, manifest указывает на старый (Aria) — фолбэк. Испанский (Elvira) не тронут.
- Откат голоса: вернуть в VOICES "en-US-AriaNeural" — старые файлы всё ещё в репо, перегенерации не будет. Альтернативы: en-US-AvaNeural, en-US-AndrewMultilingualNeural, en-US-BrianNeural.
- Итого: 31 готовая тема; словарь es 510 / en 731. VER остаётся 13 (код приложения не менялся).

---

## 6. Статус"""
s = s.replace("---\n\n## 6. Статус", v39, 1)
s = s.replace("- ✅ 27 тем из 49 в каталоге (ES: выживание, быт, работа, + social.me, travel.directions; EN: барьеры, собеседование, бизнес, social.openers/plans, debate.agree), сценарии.",
              "- ✅ 31 тема из 49 в каталоге (ES: выживание, быт, работа, social.me/neighbors/plans, travel.directions; EN: барьеры (+story), собеседование, бизнес, social.openers/plans, debate.agree/opinion), сценарии.", 1)
s = s.replace("Следующие по плану: es.social.neighbors, es.social.plans, es.travel.hotel, es.work.search; en.barriers.story, en.debate.opinion, en.social.pub, en.biz.idioms. Шаблон: gen_v38.py.",
              "Осталось 18. Следующие по плану: es.travel.hotel, es.work.search; en.social.pub, en.biz.idioms. Шаблон: gen_v39.py. Идея расширения треков (ждёт одобрения владельца): блоки по 8 тем + «босс-сценарий» в конце блока, новые блоки ES «Еда и бары», «Здоровье», «Документы и банки»; EN «Путешествия», «Тех-собеседования», «Интернет-сленг».", 1)
open(p, "w", encoding="utf-8").write(s)
print("v3.9" in s, "31 тема" in s, "Осталось 18" in s)
