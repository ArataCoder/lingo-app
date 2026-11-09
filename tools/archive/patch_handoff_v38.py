p = "/data/lr34/HANDOFF.md"
s = open(p, encoding="utf-8").read()
v38 = """### v3.8 — контент (9 ноя 2026)
- +4 темы: ES «О себе и семье» (es.social.me, A1), ES «Как пройти?» (es.travel.directions, A1), EN «Планы и вежливый отказ» (en.social.plans, B1), EN «Согласиться / не согласиться» (en.debate.agree, B2).
- Каждая тема: 8 фраз в шпаргалке, 9 карточек (2 choice + flash low, 2 listen, 2 build, 2 speak), 1 сценарий с ветками.
- Темы генерирует gen_v38.py (шаблон для будущих партий: скопировать, заменить словарь T, запустить, затем validate_content.py).
- Код приложения не менялся, VER остаётся 13. Озвучку новых фраз делает GitHub Action после push в content/.
- Итого: 27 готовых тем; словарь es 468 / en 672.

---

## 6. Статус"""
s = s.replace("---\n\n## 6. Статус", v38, 1)
s = s.replace("- ✅ 23 темы (ES: выживание, жизнь, работа; EN: барьеры, собеседование, работа), сценарии.",
              "- ✅ 27 тем из 49 в каталоге (ES: выживание, быт, работа, + social.me, travel.directions; EN: барьеры, собеседование, бизнес, social.openers/plans, debate.agree), сценарии.", 1)
s = s.replace("1. **Расширить контент шире личного опыта владельца:** ES social / travel / work, EN social / debate / barriers / biz.",
              "1. **Расширить контент шире личного опыта владельца** (осталось 22 planned-темы в catalog.json). Следующие по плану: es.social.neighbors, es.social.plans, es.travel.hotel, es.work.search; en.barriers.story, en.debate.opinion, en.social.pub, en.biz.idioms. Шаблон: gen_v38.py.", 1)
open(p, "w", encoding="utf-8").write(s)
print("v3.8" in s, "27 тем" in s, "gen_v38" in s)
