import json, os
ROOT = "/data/lr34/content/"

def cheat(rows):
    return [{"term": a, "tr": b, "ex": c} for a, b, c in rows]

def ch(text, nxt, score, fb):
    return {"text": text, "next": nxt, "score": score, "feedback": fb}

T = {}

# ---------------- ES: О себе и семье ----------------
T["es.social.me"] = dict(level="A1", file="topics/es/social/me.json", loc="es-ES",
 cheatsheet=cheat([
  ("Me llamo…", "меня зовут…", "Me llamo Ana, ¿y tú?"),
  ("Soy de…", "я из…", "Soy de Ucrania, pero vivo aquí."),
  ("Vivo en…", "я живу в…", "Vivo en Alicante con mi familia."),
  ("Tengo … años", "мне … лет (дословно «имею … лет»)", "Tengo treinta años."),
  ("mi familia", "моя семья", "Mi familia es pequeña."),
  ("un hermano / una hermana", "брат / сестра", "Tengo un hermano y una hermana."),
  ("¿A qué te dedicas?", "чем ты занимаешься (по работе)?", "¿A qué te dedicas? Trabajo en una tienda."),
  ("los hijos", "дети (сыновья и дочери)", "¿Tienes hijos? No, todavía no."),
 ]),
 cards=[
  {"id": "c1", "type": "choice", "energy": "low", "q": "Как сказать «меня зовут Ана»?", "options": ["Me llamo Ana.", "Yo llamo Ana.", "Mi nombre llamo Ana."], "answer": 0, "explain": "<b>Me llamo</b> = дословно «я себя называю»."},
  {"id": "c2", "type": "choice", "energy": "low", "q": "«¿A qué te dedicas?» — о чём спрашивают?", "options": ["Чем ты занимаешься по работе?", "Сколько тебе лет?", "Откуда ты?"], "answer": 0, "explain": "Вежливый вопрос о работе. Ответ: <b>Trabajo en…</b>"},
  {"id": "c3", "type": "flash", "energy": "low", "front": "Tengo treinta años.", "back": "Мне тридцать лет (в испанском возраст «имеют»)."},
  {"id": "c4", "type": "listen", "energy": "normal", "audio": {"text": "Soy de Polonia, pero vivo en Valencia.", "lang": "es-ES", "rate": 0.85}, "q": "Что человек сказал о себе?", "options": ["Из Польши, живёт в Валенсии", "Из Валенсии, живёт в Польше", "Едет из Валенсии в Польшу"], "answer": 0, "explain": "<b>Soy de</b> = я из, <b>vivo en</b> = живу в."},
  {"id": "c5", "type": "listen", "energy": "normal", "audio": {"text": "Tengo dos hijos y un perro.", "lang": "es-ES", "rate": 0.85}, "q": "Что ты услышал(а)?", "options": ["Двое детей и собака", "Два брата и кошка", "Две собаки и ребёнок"], "answer": 0, "explain": "<b>hijos</b> = дети, <b>perro</b> = собака."},
  {"id": "c6", "type": "build", "energy": "normal", "prompt": "Я живу в Аликанте с семьёй.", "tokens": ["Vivo", "en", "Alicante", "con", "mi", "familia."], "distractors": ["soy", "tengo"], "pattern": "Vivo en + [город]"},
  {"id": "c7", "type": "build", "energy": "normal", "prompt": "У меня есть брат и сестра.", "tokens": ["Tengo", "un", "hermano", "y", "una", "hermana."], "distractors": ["hermanos", "soy"], "pattern": "Tengo + [кто]"},
  {"id": "c8", "type": "speak", "energy": "normal", "text": "Hola, me llamo Ana. Soy de Ucrania.", "tr": "Привет, меня зовут Ана. Я из Украины.", "lang": "es-ES"},
  {"id": "c9", "type": "speak", "energy": "boost", "text": "Vivo aquí desde hace un año y me gusta mucho.", "tr": "Я живу здесь уже год, и мне очень нравится.", "lang": "es-ES"},
 ],
 scenario=dict(title="Знакомство на вечеринке", botRole="Lucía", nodes={
  "n1": {"say": "¡Hola! Soy Lucía. ¿Cómo te llamas?", "tr": "Привет! Я Лусия. Как тебя зовут?", "choices": [
    ch("Me llamo Alex. ¡Mucho gusto!", "n2", 2, "«Mucho gusto» подходит всем, без рода 👍"),
    ch("Alex.", "n2", 1, "Поймут! С «Me llamo…» звучит дружелюбнее."),
    ch("Yo llamo Alex.", "n2", 0, "Почти: правильно «Me llamo Alex».")]},
  "n2": {"say": "¡Mucho gusto! ¿De dónde eres?", "tr": "Очень приятно! Откуда ты?", "choices": [
    ch("Soy de Ucrania. ¿Y tú?", "n3", 2, "Отлично, и вопрос вернул(а) 🔥"),
    ch("De Ucrania.", "n3", 2, "Коротко и понятно."),
    ch("¿Perdón? Más despacio, por favor.", "n2b", 2, "Переспросить — это нормально.")]},
  "n2b": {"say": "Claro. ¿De dónde… eres?", "tr": "Конечно. Откуда… ты?", "choices": [
    ch("Soy de Ucrania.", "n3", 2, "Вот! 💪")]},
  "n3": {"say": "Yo soy de aquí, de Alicante. ¿Y a qué te dedicas?", "tr": "А я местная, из Аликанте. А чем ты занимаешься?", "choices": [
    ch("Ahora estoy buscando trabajo.", "n4", 2, "Честно и естественно. «Estoy buscando» = я ищу."),
    ch("Trabajo en una tienda.", "n4", 2, "Отлично!"),
    ch("Yo trabajo es tienda.", "n4", 0, "Почти: «Trabajo en una tienda».")]},
  "n4": {"say": "¡Qué bien! ¿Tienes familia aquí?", "tr": "Здорово! У тебя здесь есть семья?", "choices": [
    ch("Sí, vivo con mi familia.", "n5", 2, "Супер 👍"),
    ch("No, mi familia está en Ucrania.", "n5", 2, "Отлично: «está en» = где кто-то находится.")]},
  "n5": {"say": "Bueno, si necesitas algo, aquí estoy. ¡Hasta luego!", "tr": "Ну, если что-то нужно, я рядом. До встречи!", "choices": [
    ch("¡Gracias! ¡Hasta luego!", "n6", 2, "Идеальное завершение.")]},
  "n6": {"say": "¡Chao!", "tr": "Пока!", "end": True}}))

# ---------------- ES: Как пройти? ----------------
T["es.travel.directions"] = dict(level="A1", file="topics/es/travel/directions.json", loc="es-ES",
 cheatsheet=cheat([
  ("¿Dónde está…?", "где находится…?", "¿Dónde está la estación?"),
  ("a la derecha", "направо", "Gira a la derecha."),
  ("a la izquierda", "налево", "La farmacia está a la izquierda."),
  ("todo recto", "прямо", "Sigue todo recto."),
  ("cerca / lejos", "близко / далеко", "¿Está cerca o lejos?"),
  ("la calle", "улица", "Está en la calle Mayor."),
  ("la esquina", "угол (улицы)", "El banco está en la esquina."),
  ("¿Me puede ayudar?", "вы можете мне помочь?", "Perdone, ¿me puede ayudar?"),
 ]),
 cards=[
  {"id": "c1", "type": "choice", "energy": "low", "q": "Как вежливо обратиться к прохожему?", "options": ["Perdone, ¿me puede ayudar?", "Oye, tú, ¿dónde?", "Ayuda, rápido."], "answer": 0, "explain": "<b>Perdone</b> = извините (на «вы»). Работает с любым прохожим."},
  {"id": "c2", "type": "choice", "energy": "low", "q": "«Todo recto» — это…", "options": ["прямо", "направо", "назад"], "answer": 0, "explain": "<b>Sigue todo recto</b> = иди прямо."},
  {"id": "c3", "type": "flash", "energy": "low", "front": "a la izquierda", "back": "налево"},
  {"id": "c4", "type": "listen", "energy": "normal", "audio": {"text": "Sigue todo recto y luego a la derecha.", "lang": "es-ES", "rate": 0.85}, "q": "Куда идти?", "options": ["Прямо, потом направо", "Направо, потом прямо", "Налево, потом прямо"], "answer": 0, "explain": "<b>luego</b> = потом."},
  {"id": "c5", "type": "listen", "energy": "normal", "audio": {"text": "Está a cinco minutos andando.", "lang": "es-ES", "rate": 0.85}, "q": "Как далеко?", "options": ["5 минут пешком", "5 километров", "5 минут на машине"], "answer": 0, "explain": "<b>andando</b> = пешком."},
  {"id": "c6", "type": "build", "energy": "normal", "prompt": "Где находится вокзал?", "tokens": ["¿Dónde", "está", "la", "estación?"], "distractors": ["es", "el"], "pattern": "¿Dónde está + [место]?"},
  {"id": "c7", "type": "build", "energy": "normal", "prompt": "Это на углу.", "tokens": ["Está", "en", "la", "esquina."], "distractors": ["es", "calle"], "pattern": "Está en + [где]"},
  {"id": "c8", "type": "speak", "energy": "normal", "text": "Perdone, ¿dónde está la parada de autobús?", "tr": "Извините, где автобусная остановка?", "lang": "es-ES"},
  {"id": "c9", "type": "speak", "energy": "boost", "text": "¿Está lejos? ¿Puedo ir andando?", "tr": "Это далеко? Можно дойти пешком?", "lang": "es-ES"},
 ],
 scenario=dict(title="Ищем аптеку", botRole="Señor", nodes={
  "n1": {"say": "¿Sí? Dígame.", "tr": "Да? Слушаю.", "choices": [
    ch("Perdone, ¿dónde está la farmacia?", "n2", 2, "Вежливо и чётко 👍"),
    ch("¿Farmacia?", "n2", 1, "Поймут, но с «Perdone, ¿dónde está…?» вежливее.")]},
  "n2": {"say": "Sigue todo recto y en la segunda calle, a la izquierda.", "tr": "Иди прямо и на второй улице налево.", "choices": [
    ch("¿Todo recto y luego a la izquierda?", "n3", 2, "Повторить маршрут — лучший способ не заблудиться 🔥"),
    ch("Perdone, más despacio, por favor.", "n2b", 2, "Переспросить — это нормально."),
    ch("Vale, a la derecha.", "n2c", 0, "Осторожно: izquierda = налево.")]},
  "n2b": {"say": "Todo recto… y la segunda calle… a la izquierda.", "tr": "Прямо… и вторая улица… налево.", "choices": [
    ch("Vale, gracias. ¿Está lejos?", "n3", 2, "Отлично!")]},
  "n2c": {"say": "No, no, a la izquierda.", "tr": "Нет-нет, налево.", "choices": [
    ch("Ah, a la izquierda. Perdón.", "n3", 2, "Вот так 💪")]},
  "n3": {"say": "No, está muy cerca, a cinco minutos andando.", "tr": "Нет, совсем близко, пять минут пешком.", "choices": [
    ch("¡Perfecto, muchas gracias!", "n4", 2, "Идеально."),
    ch("Gracias.", "n4", 2, "Коротко и вежливо.")]},
  "n4": {"say": "De nada. ¡Que te mejores!", "tr": "Не за что. Выздоравливай!", "end": True}}))

# ---------------- EN: Планы и вежливый отказ ----------------
T["en.social.plans"] = dict(level="B1", file="topics/en/social/plans.json", loc="en-US",
 cheatsheet=cheat([
  ("Are you free on…?", "у тебя есть время в…?", "Are you free on Saturday?"),
  ("I'd love to, but…", "с удовольствием бы, но…", "I'd love to, but I already have plans."),
  ("Can I take a rain check?", "давай в другой раз?", "Can I take a rain check on dinner?"),
  ("What about…?", "как насчёт…?", "What about Sunday instead?"),
  ("I'm down.", "я за / я в деле", "Pizza tonight? I'm down."),
  ("Let me check.", "сейчас проверю", "Let me check my calendar."),
  ("Count me in / out", "я участвую / без меня", "Count me in for Friday."),
  ("Something came up.", "кое-что неожиданно случилось", "Sorry, something came up. Can we move it?"),
 ]),
 cards=[
  {"id": "c1", "type": "choice", "energy": "low", "q": "Как вежливо отказаться от приглашения?", "options": ["I'd love to, but I already have plans.", "No. I don't want.", "Maybe never."], "answer": 0, "explain": "<b>I'd love to, but…</b> смягчает любой отказ."},
  {"id": "c2", "type": "choice", "energy": "low", "q": "«Can I take a rain check?» значит…", "options": ["Давай перенесём на другой раз?", "Можно проверить прогноз погоды?", "Можно взять зонт?"], "answer": 0, "explain": "Идиома: отказываюсь сейчас, но хочу в другой раз."},
  {"id": "c3", "type": "flash", "energy": "low", "front": "I'm down.", "back": "я за / я в деле (неформально)"},
  {"id": "c4", "type": "listen", "energy": "normal", "audio": {"text": "Something came up. Can we move it to Thursday?", "lang": "en-US", "rate": 0.9}, "q": "Что предлагают?", "options": ["Перенести на четверг", "Встретиться сегодня", "Отменить совсем"], "answer": 0, "explain": "<b>move it to</b> = перенести на."},
  {"id": "c5", "type": "listen", "energy": "normal", "audio": {"text": "Let me check my calendar and get back to you.", "lang": "en-US", "rate": 0.9}, "q": "Что пообещал человек?", "options": ["Проверить календарь и ответить", "Прислать свой календарь", "Перезвонить через минуту"], "answer": 0, "explain": "<b>get back to you</b> = вернусь с ответом."},
  {"id": "c6", "type": "build", "energy": "normal", "prompt": "Как насчёт воскресенья?", "tokens": ["What", "about", "Sunday?"], "distractors": ["how", "on"], "pattern": "What about + [день]?"},
  {"id": "c7", "type": "build", "energy": "normal", "prompt": "Без меня в этот раз.", "tokens": ["Count", "me", "out", "this", "time."], "distractors": ["in", "my"], "pattern": "Count me in / out"},
  {"id": "c8", "type": "speak", "energy": "normal", "text": "Are you free on Saturday? Let's grab a coffee.", "tr": "У тебя есть время в субботу? Давай выпьем кофе.", "lang": "en-US"},
  {"id": "c9", "type": "speak", "energy": "boost", "text": "I'd love to, but something came up. What about next week?", "tr": "С удовольствием бы, но кое-что случилось. Как насчёт следующей недели?", "lang": "en-US"},
 ],
 scenario=dict(title="Друг зовёт гулять", botRole="Friend", nodes={
  "n1": {"say": "Hey! A few of us are going out on Friday. Are you in?", "tr": "Привет! Мы компанией идём гулять в пятницу. Ты с нами?", "choices": [
    ch("Sounds fun! Count me in.", "n2", 2, "Естественно и тепло 🔥"),
    ch("I'd love to, but I already have plans on Friday.", "n3", 2, "Вежливый отказ — идеально."),
    ch("No.", "n3", 0, "Слишком резко. Лучше: «I'd love to, but…»")]},
  "n2": {"say": "Awesome! We're meeting at eight. Is that okay?", "tr": "Круто! Встречаемся в восемь. Нормально?", "choices": [
    ch("Eight works for me.", "n4", 2, "«Works for me» = мне подходит."),
    ch("Let me check and get back to you.", "n4", 2, "Тоже нормально, только не забудь ответить 😉")]},
  "n3": {"say": "Oh, no worries! What about Saturday instead?", "tr": "Ничего страшного! Может, тогда в субботу?", "choices": [
    ch("Saturday works! I'm down.", "n4", 2, "Отлично!"),
    ch("Can I take a rain check? This weekend is busy.", "n4", 2, "Хороший вежливый перенос.")]},
  "n4": {"say": "Cool, I'll send you the details later.", "tr": "Хорошо, потом пришлю подробности.", "choices": [
    ch("Great, thanks! See you.", "n5", 2, "Идеально."),
    ch("Thanks for the invite!", "n5", 2, "Поблагодарить за приглашение — очень по-английски 👍")]},
  "n5": {"say": "See you!", "tr": "Увидимся!", "end": True}}))

# ---------------- EN: Согласиться / не согласиться ----------------
T["en.debate.agree"] = dict(level="B2", file="topics/en/debate/agree.json", loc="en-US",
 cheatsheet=cheat([
  ("I see your point, but…", "понимаю твою мысль, но…", "I see your point, but I think it's too risky."),
  ("That's a fair point.", "справедливое замечание", "That's a fair point. I hadn't thought of that."),
  ("I'm not so sure about that.", "я в этом не уверен(а)", "I'm not so sure about that. Do we have data?"),
  ("I couldn't agree more.", "полностью согласен(на)", "I couldn't agree more. Let's do it."),
  ("to some extent", "до некоторой степени", "I agree to some extent."),
  ("I'd push back on…", "я бы поспорил(а) с…", "I'd push back on the timeline a little."),
  ("Fair enough.", "справедливо / ладно, принимаю", "Fair enough, let's try it your way."),
  ("Let's agree to disagree.", "останемся каждый при своём", "Let's agree to disagree and move on."),
 ]),
 cards=[
  {"id": "c1", "type": "choice", "energy": "low", "q": "Как правильно сказать «я согласен / согласна»?", "options": ["I agree.", "I am agree.", "I'm agree with."], "answer": 0, "explain": "<b>agree</b> — глагол, поэтому без «am». Типичная ошибка русскоговорящих."},
  {"id": "c2", "type": "choice", "energy": "low", "q": "«I couldn't agree more» значит…", "options": ["Полностью согласен(на)", "Не могу согласиться", "Больше не соглашусь"], "answer": 0, "explain": "Звучит как отрицание, но значит «согласен на 100%»."},
  {"id": "c3", "type": "flash", "energy": "low", "front": "Fair enough.", "back": "справедливо / ладно, принимаю"},
  {"id": "c4", "type": "listen", "energy": "normal", "audio": {"text": "I see your point, but I'm not sure it will work.", "lang": "en-US", "rate": 0.9}, "q": "Какая позиция у говорящего?", "options": ["Понимает, но сомневается", "Полностью согласен", "Резко против"], "answer": 0, "explain": "<b>I see your point, but…</b> = мягкое несогласие."},
  {"id": "c5", "type": "listen", "energy": "normal", "audio": {"text": "I agree to some extent, but the budget is a problem.", "lang": "en-US", "rate": 0.9}, "q": "Что сказали?", "options": ["Частично согласны, но бюджет — проблема", "Согласны, с бюджетом всё хорошо", "Не согласны ни в чём"], "answer": 0, "explain": "<b>to some extent</b> = до некоторой степени."},
  {"id": "c6", "type": "build", "energy": "normal", "prompt": "Справедливое замечание.", "tokens": ["That's", "a", "fair", "point."], "distractors": ["an", "fine"], "pattern": "That's a fair point."},
  {"id": "c7", "type": "build", "energy": "normal", "prompt": "Давай останемся каждый при своём мнении.", "tokens": ["Let's", "agree", "to", "disagree."], "distractors": ["agreed", "for"], "pattern": "Let's agree to disagree."},
  {"id": "c8", "type": "speak", "energy": "normal", "text": "That's a fair point. I hadn't thought of that.", "tr": "Справедливое замечание. Я об этом не подумал(а).", "lang": "en-US"},
  {"id": "c9", "type": "speak", "energy": "boost", "text": "I see your point, but I'd push back on the deadline.", "tr": "Понимаю твою мысль, но я бы поспорил(а) со сроком.", "lang": "en-US"},
 ],
 scenario=dict(title="Спор о дедлайне на созвоне", botRole="Manager", nodes={
  "n1": {"say": "I think we can ship the new feature by Friday. Thoughts?", "tr": "Думаю, мы успеем выпустить новую фичу к пятнице. Что думаете?", "choices": [
    ch("I see your point, but Friday feels too tight.", "n2", 2, "Мягко и профессионально 🔥"),
    ch("I couldn't agree more.", "n3", 2, "Отлично звучит, если правда согласен(на)."),
    ch("I am agree.", "n3", 0, "Ошибка: правильно «I agree».")]},
  "n2": {"say": "Hmm, why do you think so?", "tr": "Хм, почему ты так думаешь?", "choices": [
    ch("Testing usually takes two days, so we'd need until Tuesday.", "n4", 2, "Аргумент + цифры = сильная позиция."),
    ch("Because no.", "n4", 0, "Нужен аргумент: «because testing takes two days».")]},
  "n3": {"say": "Great. Are there any risks we should think about?", "tr": "Отлично. Есть риски, о которых стоит подумать?", "choices": [
    ch("Testing might take longer than we expect.", "n4", 2, "Хорошо подсветил(а) риск."),
    ch("No risks.", "n4", 1, "Звучит слишком уверенно, но допустимо.")]},
  "n4": {"say": "That's a fair point. What if we ship a smaller version on Friday?", "tr": "Справедливо. А если в пятницу выпустить урезанную версию?", "choices": [
    ch("That works for me.", "n5", 2, "Компромисс найден 👍"),
    ch("Fair enough, let's try it.", "n5", 2, "«Fair enough» — естественная реакция."),
    ch("I'm not so sure about that.", "n5", 1, "Можно, но лучше сразу предложи альтернативу.")]},
  "n5": {"say": "Great, let's go with that. Thanks, everyone.", "tr": "Отлично, так и сделаем. Всем спасибо.", "end": True}}))

# ---------------- write ----------------
cat = json.load(open(ROOT + "catalog.json", encoding="utf-8"))
for tid, d in T.items():
    tp = None
    for tr in cat["tracks"]:
        for b in tr["blocks"]:
            for t in b["topics"]:
                if t["id"] == tid: tp = t
    assert tp, tid
    track = tid.split(".")[0]
    sc = d["scenario"]
    topic = {"id": tid, "track": track, "level": d["level"], "title": tp["title"], "emoji": tp.get("emoji", ""), "estMinutes": 4,
             "cheatsheet": d["cheatsheet"], "cards": d["cards"],
             "scenarios": [{"id": tid + ".s1", "title": sc["title"], "emoji": tp.get("emoji", ""), "userRole": "Ты", "botRole": sc["botRole"],
                            "voice": d["loc"], "start": "n1", "nodes": sc["nodes"], "ai": {"enabled": False}}]}
    path = ROOT + d["file"]
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(topic, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tp["status"] = "ready"; tp["file"] = d["file"]
json.dump(cat, open(ROOT + "catalog.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote", len(T), "topics")
