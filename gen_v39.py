import json, os
ROOT = "/data/lr34/content/"

def cheat(rows):
    return [{"term": a, "tr": b, "ex": c} for a, b, c in rows]

def ch(text, nxt, score, fb):
    return {"text": text, "next": nxt, "score": score, "feedback": fb}

def choice(i, energy, q, opts, expl):
    return {"id": i, "type": "choice", "energy": energy, "q": q, "options": opts, "answer": 0, "explain": expl}

def listen(i, text, lang, rate, q, opts, expl):
    return {"id": i, "type": "listen", "energy": "normal", "audio": {"text": text, "lang": lang, "rate": rate}, "q": q, "options": opts, "answer": 0, "explain": expl}

def build(i, prompt, tokens, dis, pattern):
    return {"id": i, "type": "build", "energy": "normal", "prompt": prompt, "tokens": tokens, "distractors": dis, "pattern": pattern}

def speak(i, energy, text, tr, lang):
    return {"id": i, "type": "speak", "energy": energy, "text": text, "tr": tr, "lang": lang}

def flash(i, front, back):
    return {"id": i, "type": "flash", "energy": "low", "front": front, "back": back}

T = {}
ES, EN = "es-ES", "en-US"

# ---------------- ES: Соседи и small talk ----------------
T["es.social.neighbors"] = dict(level="A1", file="topics/es/social/neighbors.json", loc=ES,
 cheatsheet=cheat([
  ("¿Qué tal?", "как дела?", "¡Hola! ¿Qué tal?"),
  ("¡Qué calor!", "как жарко!", "¡Qué calor hace hoy!"),
  ("la vecina / el vecino", "соседка / сосед", "Mi vecina es muy simpática."),
  ("el edificio", "дом (здание)", "¿Vives en este edificio?"),
  ("el ruido", "шум", "Perdona, hay mucho ruido por la noche."),
  ("el ascensor", "лифт", "El ascensor no funciona."),
  ("¡Que tengas buen día!", "хорошего дня!", "Bueno, me voy. ¡Que tengas buen día!"),
  ("¡Igualmente!", "и тебе того же!", "¡Buen fin de semana! ¡Igualmente!"),
 ]),
 cards=[
  choice("c1", "low", "Сосед в лифте говорит «¡Qué calor!». Что ответить?", ["Sí, ¡muchísimo calor!", "No entiendo calor.", "Calor es malo, adiós."], "Погода — универсальный small talk. Просто согласись."),
  choice("c2", "low", "«El ascensor no funciona» значит…", ["Лифт не работает", "Лифт занят", "Лифт едет вниз"], "<b>funcionar</b> = работать (о технике)."),
  flash("c3", "¡Que tengas buen día!", "Хорошего дня!"),
  listen("c4", "Perdona, ¿puedes bajar un poco la música?", ES, 0.85, "О чём просит сосед?", ["Сделать музыку потише", "Включить музыку", "Спуститься вниз"], "<b>bajar la música</b> = убавить музыку."),
  listen("c5", "Soy Marta, vivo en el segundo.", ES, 0.85, "Что сказала соседка?", ["Она Марта, живёт на втором этаже", "Она Марта, ей два года", "Она пришла во второй раз"], "<b>el segundo</b> = второй (этаж)."),
  build("c6", "Ты живёшь в этом доме?", ["¿Vives", "en", "este", "edificio?"], ["eres", "esta"], "¿Vives en + [где]?"),
  build("c7", "Лифт не работает.", ["El", "ascensor", "no", "funciona."], ["es", "trabaja"], "[что] + no funciona"),
  speak("c8", "normal", "Hola, vivo en el tercero. ¿Qué tal?", "Привет, я живу на третьем. Как дела?", ES),
  speak("c9", "boost", "Perdona, hay mucho ruido por la noche. ¿Podemos hablar?", "Извини, ночью очень шумно. Можем поговорить?", ES),
 ],
 scenario=dict(title="Сосед у лифта", botRole="Paco", nodes={
  "n1": {"say": "¡Buenos días! ¡Qué calor hace hoy!", "tr": "Доброе утро! Как сегодня жарко!", "choices": [
    ch("¡Buenos días! Sí, muchísimo.", "n2", 2, "Идеально для small talk ☀️"),
    ch("Sí, calor.", "n2", 1, "Поймут! «Muchísimo» звучит живее."),
    ch("No hablo.", "n2", 0, "Лучше хоть короткий ответ: «Sí, mucho calor».")]},
  "n2": {"say": "¿Vives aquí desde hace poco? No te he visto antes.", "tr": "Ты недавно здесь живёшь? Раньше тебя не видел.", "choices": [
    ch("Sí, vivo en el tercero desde octubre.", "n3", 2, "Отлично: этаж + с какого времени."),
    ch("Sí, desde hace un mes. ¿Y tú?", "n3", 2, "И вопрос вернул(а) 🔥"),
    ch("¿Perdón? Más despacio, por favor.", "n2b", 2, "Переспросить — это нормально.")]},
  "n2b": {"say": "¿Vives aquí… desde hace poco?", "tr": "Ты здесь… недавно живёшь?", "choices": [
    ch("Sí, desde hace un mes.", "n3", 2, "Вот! 💪")]},
  "n3": {"say": "Yo soy Paco, del quinto. Oye, el ascensor no funciona otra vez.", "tr": "Я Пако, с пятого. Слушай, лифт опять не работает.", "choices": [
    ch("¡Uf! ¿Llamamos al presidente de la comunidad?", "n4", 2, "Знаешь местные реалии: presidente de la comunidad = председатель дома 🔥"),
    ch("Vaya, qué mal.", "n4", 2, "«Vaya, qué mal» = вот блин. Очень естественно."),
    ch("Ascensor no.", "n4", 1, "Понятно, но лучше: «El ascensor no funciona».")]},
  "n4": {"say": "Bueno, me voy. ¡Que tengas buen día!", "tr": "Ладно, я пошёл. Хорошего дня!", "choices": [
    ch("¡Igualmente, Paco!", "n5", 2, "«Igualmente» = и тебе того же. Топ-ответ."),
    ch("Gracias, adiós.", "n5", 2, "Вежливо 👍")]},
  "n5": {"say": "¡Hasta luego!", "tr": "До встречи!", "end": True}}))

# ---------------- ES: Планы и встречи (quedar) ----------------
T["es.social.plans"] = dict(level="A2", file="topics/es/social/plans.json", loc=ES,
 cheatsheet=cheat([
  ("¿Quedamos?", "встретимся?", "¿Quedamos el sábado?"),
  ("¿A qué hora?", "во сколько?", "¿A qué hora quedamos?"),
  ("¿Dónde quedamos?", "где встречаемся?", "¿Dónde quedamos? ¿En la plaza?"),
  ("Me viene bien.", "мне подходит (по времени)", "El viernes me viene bien."),
  ("No puedo, lo siento.", "не могу, извини", "Hoy no puedo, lo siento."),
  ("¿Te apetece…?", "хочешь…? (есть настроение)", "¿Te apetece ir a la playa?"),
  ("tomar algo", "посидеть, выпить чего-нибудь", "¿Vamos a tomar algo después?"),
  ("Llego tarde.", "я опаздываю", "Perdona, llego diez minutos tarde."),
 ]),
 cards=[
  choice("c1", "low", "Как предложить встретиться в субботу?", ["¿Quedamos el sábado?", "¿Quedo tú sábado?", "Sábado nosotros ver."], "<b>quedar</b> = договориться встретиться. Главный глагол для планов."),
  choice("c2", "low", "«¿Te apetece tomar algo?» — это…", ["Хочешь сходить посидеть?", "Тебе нужно что-то купить?", "Ты что-то потерял(а)?"], "<b>tomar algo</b> = выпить кофе, пива, чего угодно в компании."),
  flash("c3", "Me viene bien.", "Мне подходит (по времени)."),
  listen("c4", "¿Quedamos a las ocho en la plaza?", ES, 0.85, "Где и когда встреча?", ["В 8 на площади", "В 8 в баре", "В 18 на пляже"], "<b>a las ocho</b> = в восемь, <b>la plaza</b> = площадь."),
  listen("c5", "Perdona, llego diez minutos tarde.", ES, 0.85, "Что случилось?", ["Опаздывает на 10 минут", "Придёт на 10 минут раньше", "Не придёт совсем"], "<b>llego tarde</b> = я опаздываю."),
  build("c6", "Во сколько встречаемся?", ["¿A", "qué", "hora", "quedamos?"], ["cuándo", "es"], "¿A qué hora + [глагол]?"),
  build("c7", "Сегодня не могу, извини.", ["Hoy", "no", "puedo,", "lo", "siento."], ["quiero", "soy"], "No puedo, lo siento."),
  speak("c8", "normal", "¿Te apetece tomar algo el viernes?", "Хочешь посидеть где-нибудь в пятницу?", ES),
  speak("c9", "boost", "El viernes no puedo, pero el sábado me viene bien.", "В пятницу не могу, а в субботу мне подходит.", ES),
 ],
 scenario=dict(title="Договариваемся о встрече", botRole="Carlos", nodes={
  "n1": {"say": "¡Hola! ¿Te apetece tomar algo esta semana?", "tr": "Привет! Хочешь посидеть где-нибудь на этой неделе?", "choices": [
    ch("¡Sí, claro! ¿Cuándo te viene bien?", "n2", 2, "Отлично, и вопрос вернул(а) 🔥"),
    ch("Sí.", "n2", 1, "Ок! Можно сразу спросить: «¿Cuándo?»")]},
  "n2": {"say": "¿El viernes por la tarde?", "tr": "В пятницу вечером?", "choices": [
    ch("El viernes me viene bien.", "n3", 2, "«Me viene bien» — как у носителя."),
    ch("El viernes no puedo, ¿y el sábado?", "n3", 2, "Предложил(а) альтернативу — супер."),
    ch("Viernes no.", "n3", 0, "Резковато. Лучше: «El viernes no puedo, lo siento».")]},
  "n3": {"say": "Perfecto. ¿A qué hora y dónde quedamos?", "tr": "Отлично. Во сколько и где встречаемся?", "choices": [
    ch("¿A las ocho en la plaza?", "n4", 2, "Чётко: время + место."),
    ch("Me da igual, tú decides.", "n4", 2, "«Me da igual» = мне без разницы. Естественно.")]},
  "n4": {"say": "Vale, entonces a las ocho en la plaza. Si llego tarde, te escribo.", "tr": "Ок, тогда в восемь на площади. Если опоздаю, напишу.", "choices": [
    ch("¡Genial! ¡Hasta pronto!", "n5", 2, "Идеально."),
    ch("Vale, nos vemos.", "n5", 2, "«Nos vemos» = увидимся 👍")]},
  "n5": {"say": "¡Nos vemos!", "tr": "Увидимся!", "end": True}}))

# ---------------- EN: Рассказать историю ----------------
T["en.barriers.story"] = dict(level="B2", file="topics/en/barriers/story.json", loc=EN,
 cheatsheet=cheat([
  ("So, the other day…", "короче, на днях…", "So, the other day I got lost in Madrid."),
  ("It turned out that…", "оказалось, что…", "It turned out that the store was closed."),
  ("All of a sudden", "вдруг, внезапно", "All of a sudden, the lights went out."),
  ("Long story short", "короче говоря", "Long story short, I missed the flight."),
  ("At first… but then…", "сначала… но потом…", "At first I was nervous, but then it was fine."),
  ("You won't believe this.", "ты не поверишь", "You won't believe what happened."),
  ("In the end", "в итоге", "In the end, everything worked out."),
  ("The funny thing is…", "самое смешное, что…", "The funny thing is, I had the keys all along."),
 ]),
 cards=[
  choice("c1", "low", "Как естественно начать историю?", ["So, the other day…", "History: one day…", "I want tell you story."], "<b>So, the other day…</b> — классический заход. History = история как наука, а рассказ — <b>story</b>."),
  choice("c2", "low", "«Long story short» значит…", ["Короче говоря", "Это длинная история", "История была короткой"], "Связка, чтобы сразу перейти к финалу."),
  flash("c3", "It turned out that…", "оказалось, что…"),
  listen("c4", "All of a sudden, my phone died and I had no map.", EN, 0.9, "Что произошло?", ["Внезапно сел телефон, и не было карты", "Телефон украли вместе с картой", "Упала карта, разбился телефон"], "<b>my phone died</b> = телефон сел."),
  listen("c5", "Long story short, we missed the last bus.", EN, 0.9, "Чем закончилось?", ["Опоздали на последний автобус", "Успели на последний автобус", "Автобус сломался"], "<b>miss the bus</b> = опоздать на автобус."),
  build("c6", "В итоге всё получилось.", ["In", "the", "end,", "everything", "worked", "out."], ["finally", "at"], "In the end, + [итог]"),
  build("c7", "Ты не поверишь, что случилось.", ["You", "won't", "believe", "what", "happened."], ["don't", "that"], "You won't believe + what…"),
  speak("c8", "normal", "So, the other day, something funny happened at work.", "Короче, на днях на работе случилась смешная штука.", EN),
  speak("c9", "boost", "At first I was nervous, but in the end it turned out fine.", "Сначала я нервничал(а), но в итоге всё оказалось нормально.", EN),
 ],
 scenario=dict(title="История на перерыве", botRole="Coworker", nodes={
  "n1": {"say": "Hey, how was your weekend? Anything fun?", "tr": "Привет, как выходные? Было что-то интересное?", "choices": [
    ch("Actually, yes! You won't believe what happened.", "n2", 2, "Отличный крючок для истории 🔥"),
    ch("Good.", "n2b", 1, "Нормально, но разговор гаснет. Добавь деталь.")]},
  "n2b": {"say": "Just good? Come on, tell me something!", "tr": "Просто хорошо? Да ладно, расскажи что-нибудь!", "choices": [
    ch("Okay, so, I went to the beach, and all of a sudden it started raining.", "n3", 2, "Вот, история пошла 💪")]},
  "n2": {"say": "Oh no, what happened?", "tr": "Ой, что случилось?", "choices": [
    ch("So, I went to the beach, and all of a sudden it started raining.", "n3", 2, "Связки работают: so → all of a sudden."),
    ch("I go to beach, rain.", "n3", 0, "Поймут, но нужно прошедшее: «I went to the beach and it started raining».")]},
  "n3": {"say": "No way! So what did you do?", "tr": "Да ладно! И что ты сделал(а)?", "choices": [
    ch("At first we waited, but then we ran to a café.", "n4", 2, "At first… but then… — скелет любой истории 👍"),
    ch("Long story short, we got completely wet.", "n4", 2, "Ха, «long story short» к месту.")]},
  "n4": {"say": "Ha! That sounds like a fun day anyway.", "tr": "Ха! Всё равно звучит как классный день.", "choices": [
    ch("The funny thing is, it was sunny again ten minutes later.", "n5", 2, "Панчлайн! Так истории и заканчивают 😂"),
    ch("Yeah, in the end it was a good day.", "n5", 2, "«In the end» — аккуратное завершение.")]},
  "n5": {"say": "Classic. Okay, back to work!", "tr": "Классика. Ладно, за работу!", "end": True}}))

# ---------------- EN: Мнение + аргумент ----------------
T["en.debate.opinion"] = dict(level="B2", file="topics/en/debate/opinion.json", loc=EN,
 cheatsheet=cheat([
  ("In my opinion,", "по-моему,", "In my opinion, remote work is more productive."),
  ("The main reason is…", "главная причина в том, что…", "The main reason is that people save time."),
  ("For example,", "например,", "For example, I save two hours a day."),
  ("On the other hand,", "с другой стороны,", "On the other hand, it can feel lonely."),
  ("That's why…", "поэтому…", "That's why I prefer working from home."),
  ("It depends on…", "зависит от…", "It depends on the team."),
  ("As far as I know,", "насколько я знаю,", "As far as I know, the rules changed last year."),
  ("Overall,", "в целом,", "Overall, I think it's worth it."),
 ]),
 cards=[
  choice("c1", "low", "Как правильно сказать «это зависит от ситуации»?", ["It depends on the situation.", "It depends from the situation.", "It's depend the situation."], "Только <b>depends on</b>. «Depends from» — калька с русского."),
  choice("c2", "low", "Какая связка вводит противоположный аргумент?", ["On the other hand,", "For example,", "That's why"], "<b>On the other hand</b> = с другой стороны."),
  flash("c3", "Overall,", "в целом, (вывод в конце)"),
  listen("c4", "In my opinion, it's too expensive. That's why I said no.", EN, 0.9, "Почему человек отказался?", ["Слишком дорого", "Нет времени", "Не понравилось качество"], "<b>That's why</b> = поэтому."),
  listen("c5", "On the other hand, it saves a lot of time.", EN, 0.9, "Что это за аргумент?", ["Противоположный: экономит много времени", "Пример: тратит много времени", "Вывод: это дорого"], "<b>save time</b> = экономить время."),
  build("c6", "Главная причина — время.", ["The", "main", "reason", "is", "time."], ["cause", "are"], "The main reason is + [причина]"),
  build("c7", "Например, я экономлю два часа в день.", ["For", "example,", "I", "save", "two", "hours", "a", "day."], ["economy", "in"], "For example, + [факт]"),
  speak("c8", "normal", "In my opinion, remote work is more productive.", "По-моему, удалёнка продуктивнее.", EN),
  speak("c9", "boost", "The main reason is that I save time. For example, I don't commute.", "Главная причина — я экономлю время. Например, не нужно ездить на работу.", EN),
 ],
 scenario=dict(title="Офис или удалёнка?", botRole="Interviewer", nodes={
  "n1": {"say": "Quick question: do you prefer working remotely or in the office?", "tr": "Быстрый вопрос: ты предпочитаешь удалёнку или офис?", "choices": [
    ch("In my opinion, remote work suits me better.", "n2", 2, "Чёткая позиция с первой фразы 🔥"),
    ch("It depends on the team, to be honest.", "n2", 2, "Взвешенно и честно."),
    ch("Remote.", "n2", 1, "Ок, но добавь мнение: «In my opinion…»")]},
  "n2": {"say": "Interesting. Why is that?", "tr": "Интересно. Почему?", "choices": [
    ch("The main reason is focus. For example, I have fewer distractions at home.", "n3", 2, "Причина + пример = сильный ответ."),
    ch("Because I like.", "n3", 0, "Нужен объект и аргумент: «because I like the flexibility».")]},
  "n3": {"say": "But don't you miss the team?", "tr": "Но разве ты не скучаешь по команде?", "choices": [
    ch("On the other hand, yes, so I like meeting in person once a week.", "n4", 2, "Признать контраргумент — очень зрело."),
    ch("Not really. We talk on Slack every day.", "n4", 2, "Аргумент по делу 👍")]},
  "n4": {"say": "Fair enough. So, overall?", "tr": "Справедливо. Так в целом?", "choices": [
    ch("Overall, a hybrid setup works best for me.", "n5", 2, "Идеальный вывод с «Overall»."),
    ch("That's why I prefer remote work.", "n5", 2, "«That's why» — логичное завершение.")]},
  "n5": {"say": "Makes sense. Thanks for sharing!", "tr": "Логично. Спасибо, что поделился(ась)!", "end": True}}))

# ---------------- write ----------------
cat = json.load(open(ROOT + "catalog.json", encoding="utf-8"))
for tid, d in T.items():
    tp = None
    for tr in cat["tracks"]:
        for b in tr["blocks"]:
            for t in b["topics"]:
                if t["id"] == tid: tp = t
    assert tp, tid
    sc = d["scenario"]
    topic = {"id": tid, "track": tid.split(".")[0], "level": d["level"], "title": tp["title"], "emoji": tp.get("emoji", ""), "estMinutes": 4,
             "cheatsheet": d["cheatsheet"], "cards": d["cards"],
             "scenarios": [{"id": tid + ".s1", "title": sc["title"], "emoji": tp.get("emoji", ""), "userRole": "Ты", "botRole": sc["botRole"],
                            "voice": d["loc"], "start": "n1", "nodes": sc["nodes"], "ai": {"enabled": False}}]}
    path = ROOT + d["file"]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(topic, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tp["status"] = "ready"; tp["file"] = d["file"]
json.dump(cat, open(ROOT + "catalog.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote", len(T), "topics")
