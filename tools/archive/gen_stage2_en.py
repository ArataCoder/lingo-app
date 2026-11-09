# Stage 2: English topics (B1-B2), part 1 - paraphrase, clarify, STAR, strengths
from lbgen import *

paraphrase = T("en.barriers.paraphrase", "en", "B1", "Забыл слово → перефразируй", "🔁", [
    W("It's a kind of…", "это такой вид…", "It's a kind of tool for fixing things."),
    W("It's something you use to…", "это штука, которой…", "It's something you use to open bottles."),
    W("It's like…, but…", "это как…, только…", "It's like a sofa, but smaller."),
    W("What's the word for…?", "как называется…?", "What's the word for a person who fixes pipes?"),
    W("I can't think of the word", "не могу вспомнить слово", "Sorry, I can't think of the word right now."),
    W("the opposite of…", "противоположность…", "It's the opposite of cheap."),
    W("a person who…", "человек, который…", "It's a person who designs buildings."),
    W("Basically,…", "короче, по сути", "Basically, it's a plan for the whole year.")
], [
    C("c1", "Забыл слово «plumber». Как лучше выкрутиться?", ["A person who fixes pipes and taps.", "A man for water, you know.", "I don't know this word, sorry."], "Формула <b>a person who + [действие]</b> спасает почти всегда."),
    C("c2", "Как вежливо попросить подсказку?", ["What's the word for it?", "Say me the word.", "How is it called?"], "<b>How is it called?</b> — частая ошибка. Правильно: <b>What's it called?</b> или <b>What's the word for…?</b>"),
    F("c3", "I can't think of the word.", "Не могу вспомнить слово."),
    L("c4", "It's something you use to keep your food cold.", EN, "О чём говорят?", ["Холодильник", "Плита", "Духовка"], "<b>A fridge</b> — «something you use to keep food cold»."),
    L("c5", "It's like a meeting, but shorter, and everyone stands up.", EN, "Что описывают?", ["Стендап (короткий митинг)", "Корпоратив", "Собеседование"], "Именно так и объясняют <b>stand-up</b> 🙂"),
    B("c6", "Это противоположность слова «дешёвый».", ["It's", "the", "opposite", "of", "cheap"], ["a", "for"], "It's the opposite of + [слово]"),
    B("c7", "Это такой инструмент для ремонта.", ["It's", "a", "kind", "of", "tool", "for", "repairs"], ["the", "to"], "It's a kind of + [категория]"),
    S("c8", "Sorry, I can't think of the word. It's a person who designs websites.", "Простите, не могу вспомнить слово. Это человек, который делает дизайн сайтов.", EN),
    S("c9", "Basically, it's like a to-do list, but for the whole team.", "По сути, это как список дел, только для всей команды.", EN, "boost")
], SC("en.barriers.paraphrase.s1", "Забыл слово на собесе", "🧩", "Кандидат", "Recruiter", EN, {
    "n1": N("So, what tools did you use in your last job?", "Итак, какими инструментами ты пользовался на прошлой работе?", [
        ch("We used… sorry, I can't think of the word. It's a tool for tracking tasks, like a board with cards.", "n2", 2, "Идеально! Ты не завис, а описал предмет."),
        ch("Um… I forgot.", "n1b", 0, "Не страшно, но лучше описать: «It's a tool for…»."),
        ch("Jira, Slack and Notion.", "n3", 2, "Помнишь слова — отлично, отвечай коротко.")]),
    "n1b": N("No worries. Can you describe it?", "Ничего страшного. Можешь описать?", [
        ch("Sure. It's something you use to plan tasks with your team.", "n2", 2, "Вот так! Описание спасло ответ 💪")]),
    "n2": N("Oh, you mean Trello or Jira?", "А, ты имеешь в виду Trello или Jira?", [
        ch("Yes, exactly, Jira! Thanks.", "n3", 2, "«Exactly» — отличный способ подтвердить."),
        ch("Yes.", "n3", 1, "Нормально. «Yes, exactly» звучит увереннее.")]),
    "n3": N("Great. And what did you do when a customer was angry?", "Отлично. А что ты делал, когда клиент злился?", [
        ch("I tried to… how do you say… stay calm and listen first. Then I offered a solution.", "n4", 2, "«How do you say…» + описание — естественно и спокойно."),
        ch("I was… the opposite of nervous. Calm!", "n4", 2, "Красиво: «the opposite of» сработал 😄"),
        ch("Angry customer… no.", "n4", 0, "Попробуй описать действия: «I listened, then I…».")]),
    "n4": N("That's a great answer. Your English is really clear!", "Отличный ответ. Твой английский очень понятный!")
}))

clarify = T("en.barriers.clarify", "en", "B1", "Переспросить и уточнить", "❓", [
    W("Sorry, could you repeat that?", "извините, можете повторить?", "Sorry, could you repeat that, please?"),
    W("Could you speak a bit slower?", "можно чуть медленнее?", "Could you speak a bit slower? The connection is bad."),
    W("What do you mean by…?", "что вы имеете в виду под…?", "What do you mean by ASAP?"),
    W("Just to clarify,…", "просто уточню…", "Just to clarify, is the deadline on Friday?"),
    W("So you're saying that…", "то есть вы говорите, что…", "So you're saying that we need more tests?"),
    W("Did you say…?", "вы сказали…?", "Did you say fifteen or fifty?"),
    W("Sorry, you broke up", "простите, связь прервалась", "Sorry, you broke up for a second."),
    W("Could you give me an example?", "можете привести пример?", "That's interesting. Could you give me an example?")
], [
    C("c1", "На созвоне пропал звук. Что сказать?", ["Sorry, you broke up for a second.", "Sorry, you are broken.", "Your voice is died."], "<b>You broke up</b> = связь прервалась. «You are broken» = «ты сломан» 😅"),
    C("c2", "Как уточнить дедлайн и не звучать неуверенно?", ["Just to clarify, is it due on Friday?", "I didn't understand nothing.", "Repeat, please, all again."], "<b>Just to clarify</b> звучит профессионально и спокойно."),
    F("c3", "What do you mean by that?", "Что вы имеете в виду?"),
    L("c4", "Did you say fifteen or fifty?", EN, "Что уточняют?", ["15 или 50?", "50 или 500?", "5 или 15?"], "Fif<b>teen</b> — ударение в конце, <b>fif</b>ty — в начале."),
    L("c5", "So you're saying that we should launch next month instead?", EN, "Что уточняет собеседник?", ["Что запуск переносят на следующий месяц", "Что запуск отменили", "Что запуск будет завтра"], "<b>Instead</b> = вместо этого. <b>So you're saying…</b> — пересказ, чтобы проверить понимание."),
    B("c6", "Можете говорить чуть медленнее?", ["Could", "you", "speak", "a", "bit", "slower?"], ["very", "speaking"], "Could you + [действие] + a bit + [-er]?"),
    B("c7", "Можете привести пример?", ["Could", "you", "give", "me", "an", "example?"], ["a", "say"], "Could you + [действие]?"),
    S("c8", "Sorry, could you repeat that? I didn't quite catch it.", "Извините, можете повторить? Я не совсем расслышал.", EN),
    S("c9", "Just to clarify, you need the report by Friday, right?", "Просто уточню: отчёт нужен к пятнице, верно?", EN, "boost")
], SC("en.barriers.clarify.s1", "Созвон с плохой связью", "📶", "Ты", "Manager", EN, {
    "n1": N("Hi! So, we need the… …by Thursday.", "Привет! Значит, нам нужен… [шум] …к четвергу.", [
        ch("Sorry, you broke up. Could you repeat that?", "n2", 2, "Идеально и вежливо."),
        ch("OK!", "n1x", 0, "Опасно: ты не понял, что нужно к четвергу 😬"),
        ch("What?", "n2", 1, "Поймут, но звучит резковато. Лучше: «Sorry, could you repeat that?».")]),
    "n1x": N("Great, so I'll see the presentation on Thursday!", "Отлично, значит, увижу презентацию в четверг!", [
        ch("Sorry, just to clarify: which presentation?", "n2", 2, "Хорошо, что уточнил, пока не поздно!")]),
    "n2": N("Sure. We need the client presentation by Thursday.", "Конечно. Нам нужна презентация для клиента к четвергу.", [
        ch("Got it. Just to clarify, do you mean this Thursday?", "n3", 2, "Уточнение даты — очень профессионально."),
        ch("Got it.", "n3", 1, "Нормально, но дату лучше уточнить.")]),
    "n3": N("Yes, this Thursday. Around fifteen slides, nothing crazy.", "Да, в этот четверг. Около 15 слайдов, ничего сложного.", [
        ch("Did you say fifteen or fifty?", "n4", 2, "Классическая ловушка — хорошо, что переспросил!"),
        ch("Fifty slides? That's a lot!", "n4", 1, "Послышалось 😄 Лучше переспросить: «Did you say…?»."),
        ch("OK, fifteen slides. No problem.", "n4", 2, "Повторил цифру — чётко.")]),
    "n4": N("Fifteen, one-five. And keep it simple, the client isn't technical.", "Пятнадцать, один-пять. И попроще: клиент не технарь.", [
        ch("So you're saying I should avoid technical details?", "n5", 2, "Пересказ своими словами — суперприём."),
        ch("What do you mean by simple?", "n5", 2, "Отличный уточняющий вопрос.")]),
    "n5": N("Exactly. Thanks for checking, that really helps!", "Именно. Спасибо, что уточнил, это очень помогает!")
}))

star = T("en.interview.star", "en", "B2", "Поведенческие вопросы (STAR)", "⭐", [
    W("Situation", "ситуация, контекст", "In my last job, we had a lot of angry customers."),
    W("Task", "задача, твоя роль", "My task was to reduce the number of complaints."),
    W("Action", "действие: что сделал именно ты", "I created a simple FAQ for the team."),
    W("Result", "результат, лучше с цифрой", "As a result, complaints dropped by 30%."),
    W("I was responsible for…", "я отвечал за…", "I was responsible for onboarding new clients."),
    W("I took the initiative to…", "я по своей инициативе…", "I took the initiative to fix the process."),
    W("The main challenge was…", "главной сложностью было…", "The main challenge was the tight deadline."),
    W("What I learned was…", "я вынес из этого…", "What I learned was to ask for help earlier.")
], [
    C("c1", "Что означает буква R в STAR?", ["Result — результат", "Reason — причина", "Role — роль"], "Всегда заканчивай результатом, лучше с цифрой: <b>by 30%</b>."),
    C("c2", "Какая фраза лучше подходит для части Action?", ["I created a checklist for the team.", "We were very busy.", "The company had problems."], "В Action говори <b>I</b>, а не <b>we</b>: что сделал именно ты."),
    F("c3", "I was responsible for…", "Я отвечал за…"),
    L("c4", "As a result, our response time dropped from two days to four hours.", EN, "Какой результат?", ["Клиентам отвечали за 4 часа вместо 2 дней", "Время ответа выросло до 2 дней", "Клиентов стало в 4 раза больше"], "<b>Dropped from… to…</b> = снизилось с… до…"),
    L("c5", "Tell me about a time you had to deal with a difficult deadline.", EN, "О чём просят рассказать?", ["О случае со сложным дедлайном", "О любимом проекте", "О твоих слабых сторонах"], "<b>Tell me about a time…</b> = сигнал: отвечай по STAR."),
    B("c6", "Главной сложностью был сжатый срок.", ["The", "main", "challenge", "was", "the", "tight", "deadline"], ["were", "a"], "The main challenge was + [что]"),
    B("c7", "В итоге жалоб стало на 30% меньше.", ["As", "a", "result,", "complaints", "dropped", "by", "30%"], ["on", "the"], "As a result, + [что] + dropped by + [%]"),
    S("c8", "In my last job, I was responsible for customer support. The main challenge was long waiting times.", "На прошлой работе я отвечал за поддержку клиентов. Главной проблемой было долгое ожидание.", EN),
    S("c9", "I took the initiative to create a FAQ, and as a result, tickets dropped by thirty percent.", "Я по своей инициативе сделал FAQ, и в итоге обращений стало на 30% меньше.", EN, "boost")
], SC("en.interview.star.s1", "Вопрос по STAR", "⭐", "Кандидат", "Hiring manager", EN, {
    "n1": N("Tell me about a time you solved a problem at work.", "Расскажи о случае, когда ты решил проблему на работе.", [
        ch("Sure. In my last job, customers waited too long for answers.", "n2", 2, "Отличный старт: это Situation."),
        ch("I'm good at solving problems.", "n1b", 0, "Это общее утверждение. Нужна конкретная история."),
        ch("Let me think… One example is from my last job, where customers waited too long for answers.", "n2", 2, "Взять паузу — нормально, и ты сразу дал контекст.")]),
    "n1b": N("Okay, but can you give me a specific example?", "Хорошо, а можешь привести конкретный пример?", [
        ch("Sure. In my last job, customers waited too long for answers.", "n2", 2, "Вот, теперь есть история 👍")]),
    "n2": N("I see. And what was your role?", "Понятно. А какая была твоя роль?", [
        ch("My task was to reduce the waiting time.", "n3", 2, "Task — ясно и коротко."),
        ch("We all worked on it together.", "n3", 1, "Команда — это хорошо, но скажи, какой была твоя задача.")]),
    "n3": N("What exactly did you do?", "Что конкретно ты сделал?", [
        ch("I took the initiative to create templates for the most common questions.", "n4", 2, "Сильный Action: «I took the initiative»."),
        ch("We worked hard.", "n4", 0, "Слишком общо. Что сделал именно ты?"),
        ch("I analyzed the tickets and wrote a simple FAQ.", "n4", 2, "Конкретные действия — отлично.")]),
    "n4": N("And what was the result?", "И какой был результат?", [
        ch("As a result, the waiting time dropped from two days to four hours.", "n5", 2, "Результат с цифрами — идеально 🏆"),
        ch("It was better.", "n5", 1, "Добавь цифру: «dropped by…» звучит сильнее.")]),
    "n5": N("That's a very clear answer. I like that you measured the result.", "Очень понятный ответ. Мне нравится, что ты измерил результат.")
}))

strengths = T("en.interview.strengths", "en", "B2", "Сильные/слабые стороны", "💪", [
    W("One of my strengths is…", "одна из моих сильных сторон…", "One of my strengths is staying calm under pressure."),
    W("I'm good at…", "у меня хорошо получается…", "I'm good at explaining complex things simply."),
    W("I'm a fast learner", "я быстро учусь", "I'm a fast learner, so I adapt quickly."),
    W("I'm working on…", "я работаю над…", "I'm working on my public speaking."),
    W("I tend to…", "я склонен…", "I tend to take on too many tasks."),
    W("To improve, I…", "чтобы стать лучше, я…", "To improve, I started using a task planner."),
    W("attention to detail", "внимание к деталям", "My attention to detail helps me avoid mistakes."),
    W("self-motivated", "самомотивированный", "I'm self-motivated, and I like learning on my own.")
], [
    C("c1", "Какой ответ про слабую сторону лучше?", ["I tend to take on too much, so now I prioritize my tasks.", "I have no weaknesses.", "I'm a perfectionist, that's all."], "Формула: <b>слабость + что ты с ней делаешь</b>. «No weaknesses» — красный флаг."),
    C("c2", "«I'm a fast learner» — это…", ["Я быстро учусь", "Я быстро бегаю", "Я быстро ухожу"], "Отличная фраза, если опыта пока мало."),
    F("c3", "I'm working on…", "Я работаю над… (улучшаю)"),
    L("c4", "What would your previous manager say about you?", EN, "Что спрашивают?", ["Что о тебе сказал бы прошлый руководитель?", "Почему ты ушёл с прошлой работы?", "Кем ты видишь себя через 5 лет?"], "Отвечай через сильные стороны: <b>They would say I'm reliable…</b>"),
    L("c5", "One of my strengths is staying calm when things go wrong.", EN, "Какая сильная сторона?", ["Спокойствие, когда что-то идёт не так", "Скорость работы", "Знание языков"], "<b>Staying calm</b> = сохранять спокойствие."),
    B("c6", "У меня хорошо получается объяснять сложные вещи.", ["I'm", "good", "at", "explaining", "complex", "things"], ["in", "explain"], "I'm good at + [глагол + -ing]"),
    B("c7", "Я работаю над своими публичными выступлениями.", ["I'm", "working", "on", "my", "public", "speaking"], ["at", "work"], "I'm working on + [что]"),
    S("c8", "One of my strengths is that I'm a fast learner. I learned two languages on my own.", "Одна из моих сильных сторон — я быстро учусь. Я сам выучил два языка.", EN),
    S("c9", "I tend to take on too many tasks, so I started using a planner to prioritize.", "Я склонен брать слишком много задач, поэтому начал пользоваться планировщиком, чтобы расставлять приоритеты.", EN, "boost")
], SC("en.interview.strengths.s1", "Сильные и слабые стороны", "💪", "Кандидат", "Recruiter", EN, {
    "n1": N("What would you say is your greatest strength?", "Какую свою сильную сторону ты назвал бы главной?", [
        ch("I'd say I'm a fast learner. For example, I taught myself English and Spanish.", "n2", 2, "Сильная сторона + пример = 🔥"),
        ch("I'm good at everything.", "n1b", 0, "Звучит самоуверенно. Выбери одну сторону и дай пример."),
        ch("I'm good at staying calm with difficult customers.", "n2", 2, "Конкретно и полезно для работы.")]),
    "n1b": N("Haha, okay. But if you had to choose one?", "Ха-ха, ладно. А если выбрать одну?", [
        ch("Then I'd say I'm a fast learner.", "n2", 2, "Вот, теперь конкретно 👍")]),
    "n2": N("Nice. And what about weaknesses?", "Здорово. А что насчёт слабых сторон?", [
        ch("I tend to take on too many tasks. Now I plan my week and say no more often.", "n3", 2, "Идеальная формула: слабость + решение."),
        ch("I don't have any.", "n2b", 0, "Для рекрутера это красный флаг."),
        ch("My English isn't perfect yet, but I'm working on it every day.", "n3", 2, "Честно и с действием. Отлично.")]),
    "n2b": N("Everyone has something they're working on, though.", "Но у каждого есть что-то, над чем он работает.", [
        ch("That's true. I tend to take on too many tasks, so I'm learning to prioritize.", "n3", 2, "Хорошо исправился 💪")]),
    "n3": N("How do you handle feedback?", "Как ты относишься к обратной связи?", [
        ch("I see feedback as a gift. I ask questions and try to apply it quickly.", "n4", 2, "Звучит зрело и позитивно."),
        ch("I don't like criticism.", "n4", 0, "Честно, но лучше показать, что ты растёшь благодаря ей."),
        ch("I'm fine with it.", "n4", 1, "Нормально. Добавь, что ты с ней делаешь.")]),
    "n4": N("Great answers. You clearly know yourself well.", "Отличные ответы. Видно, что ты хорошо себя знаешь.")
}))

TOPICS = [
    (paraphrase, "topics/en/barriers/paraphrase.json"), (clarify, "topics/en/barriers/clarify.json"),
    (star, "topics/en/interview/star.json"), (strengths, "topics/en/interview/strengths.json")
]
if __name__ == "__main__":
    write_topics(TOPICS)
