# Stage 2: English topics (B1-B2), part 2 - meetings, async, openers, questions to employer
from lbgen import *

meetings = T("en.biz.meetings", "en", "B2", "Стендапы и митинги", "📅", [
    W("Yesterday I worked on…", "вчера я работал над…", "Yesterday I worked on the login page."),
    W("Today I'm going to…", "сегодня я собираюсь…", "Today I'm going to fix the payment bug."),
    W("I'm blocked by…", "меня блокирует…", "I'm blocked by the missing API keys."),
    W("on track", "идём по плану", "We're on track for the Friday release."),
    W("behind schedule", "отстаём от графика", "The project is a bit behind schedule."),
    W("Let's take this offline", "давайте обсудим это отдельно", "Good point. Let's take this offline after the call."),
    W("action items", "задачи по итогам встречи", "Let's go over the action items."),
    W("I'll keep you posted", "буду держать в курсе", "I'm still waiting for an answer. I'll keep you posted.")
], [
    C("c1", "«We're behind schedule» — это…", ["Мы отстаём от графика", "Мы опережаем график", "Мы в отпуске"], "Опережать — <b>ahead of schedule</b>, по плану — <b>on track</b>."),
    C("c2", "Как сказать на стендапе, что тебе что-то мешает?", ["I'm blocked by the design review.", "I'm blocking the design review.", "The design review is my block."], "<b>I'm blocked by…</b> = меня блокирует… «I'm blocking» — это ты блокируешь других 😅"),
    F("c3", "I'll keep you posted.", "Буду держать в курсе."),
    L("c4", "Yesterday I finished the report. Today I'm going to start on the dashboard.", EN, "Что планируют на сегодня?", ["Начать дашборд", "Закончить отчёт", "Отправить отчёт клиенту"], "Отчёт — это вчера (<b>finished</b>), дашборд — сегодня (<b>going to start</b>)."),
    L("c5", "Let's take this offline. Can you two set up a quick call after the meeting?", EN, "Что предлагает руководитель?", ["Обсудить это отдельно после встречи", "Отключить интернет", "Отменить встречу"], "<b>Take it offline</b> — не про интернет, а «не тратить время всех, обсудим вдвоём»."),
    B("c6", "Мы идём по плану к релизу в пятницу.", ["We're", "on", "track", "for", "the", "Friday", "release"], ["in", "way"], "We're on track for + [что]"),
    B("c7", "Давайте пройдёмся по задачам.", ["Let's", "go", "over", "the", "action", "items"], ["make", "under"], "Let's go over + [что]"),
    S("c8", "Yesterday I worked on the login page. Today I'm going to write tests. No blockers.", "Вчера я работал над страницей входа. Сегодня буду писать тесты. Блокеров нет.", EN),
    S("c9", "I'm blocked by the missing API keys. Could someone help me with that after the call?", "Меня блокирует отсутствие API-ключей. Может кто-нибудь помочь после созвона?", EN, "boost")
], SC("en.biz.meetings.s1", "Дейли-стендап", "📅", "Ты", "Team lead", EN, {
    "n1": N("Morning, everyone! Let's start. What did you work on yesterday?", "Всем доброе утро! Начинаем. Над чем ты работал вчера?", [
        ch("Yesterday I worked on the onboarding emails and finished the first draft.", "n2", 2, "Коротко и по делу — идеальный формат стендапа."),
        ch("Many things. Emails, meetings, some research, and also a lot of other small stuff…", "n2", 1, "Стендап — это 30 секунд. Назови главное."),
        ch("Emails.", "n2", 1, "Слишком коротко. Добавь результат: «finished the first draft».")]),
    "n2": N("Nice. And what's the plan for today?", "Отлично. А какой план на сегодня?", [
        ch("Today I'm going to get feedback from the design team and make the final version.", "n3", 2, "Чёткий план 👍"),
        ch("I will see.", "n3", 0, "Звучит как «не знаю». Назови одну конкретную задачу.")]),
    "n3": N("Any blockers?", "Есть блокеры?", [
        ch("Yes, I'm blocked by the design review. I need their comments by tomorrow.", "n4", 2, "Блокер + что нужно + когда. Профессионально!"),
        ch("No blockers, I'm on track.", "n5", 2, "Коротко и уверенно."),
        ch("The designers are slow and I don't like their ideas.", "n4", 0, "На общем созвоне лучше без критики. Опиши факт: «I'm blocked by…».")]),
    "n4": N("Okay, that sounds like a longer discussion.", "Понял, похоже, это длинный разговор.", [
        ch("Sure, let's take this offline. I'll message you after the call.", "n5", 2, "Идеально использовал «take this offline»."),
        ch("Let me explain everything now.", "n5", 1, "На стендапе все ждут. Лучше обсудить отдельно.")]),
    "n5": N("Thanks! Let's go over the action items at the end.", "Спасибо! Пройдёмся по задачам в конце.", [
        ch("Sounds good. I'll keep you posted on the emails.", "n6", 2, "Отличная финальная фраза."),
        ch("OK.", "n6", 1, "Нормально. «I'll keep you posted» звучит ещё лучше.")]),
    "n6": N("Perfect. Great update, thanks!", "Отлично. Классный апдейт, спасибо!")
}))

async_t = T("en.biz.async", "en", "B2", "Email и Slack-тон", "✉️", [
    W("Quick question:", "быстрый вопрос:", "Quick question: is the meeting still at three?"),
    W("Just following up on…", "напоминаю про…", "Just following up on my email from Monday."),
    W("Could you take a look at…?", "можешь глянуть…?", "Could you take a look at this document?"),
    W("No rush", "не срочно", "No rush, whenever you have time."),
    W("by EOD", "до конца рабочего дня", "I'll send it by EOD."),
    W("Thanks for the heads-up", "спасибо, что предупредил", "Thanks for the heads-up about the delay."),
    W("Please find attached…", "во вложении…", "Please find attached my CV."),
    W("Let me know if you have any questions", "если будут вопросы — пишите", "Here's the plan. Let me know if you have any questions.")
], [
    C("c1", "«By EOD» означает…", ["До конца рабочего дня", "До конца недели", "Как можно скорее"], "<b>EOD</b> = end of day. Ещё: <b>EOW</b> = end of week, <b>ASAP</b> = as soon as possible."),
    C("c2", "Как вежливо напомнить о письме без ответа?", ["Just following up on my last email.", "Why didn't you answer me?", "Answer my email, please."], "<b>Just following up</b> — мягко и без давления."),
    F("c3", "Thanks for the heads-up!", "Спасибо, что предупредил!"),
    L("c4", "Could you take a look at the draft? No rush, tomorrow is fine.", EN, "Когда нужно ответить?", ["Можно завтра, не срочно", "Прямо сейчас", "До конца сегодня"], "<b>No rush</b> = не спеши."),
    L("c5", "Thanks for the heads-up. I'll move our call to Friday.", EN, "Что сделают со звонком?", ["Перенесут на пятницу", "Отменят совсем", "Созвонятся сейчас"], "<b>Move the call to…</b> = перенести созвон на…"),
    B("c6", "Я отправлю это до конца дня.", ["I'll", "send", "it", "by", "EOD"], ["until", "sent"], "I'll + [действие] + by + [срок]"),
    B("c7", "Можешь глянуть на этот документ?", ["Could", "you", "take", "a", "look", "at", "this", "document?"], ["see", "on"], "Could you take a look at + [что]?"),
    S("c8", "Hi Anna, quick question: is the client call still at three?", "Привет, Анна, быстрый вопрос: созвон с клиентом всё ещё в три?", EN),
    S("c9", "Just following up on the contract. Could you take a look at it by Friday?", "Напоминаю про договор. Можешь глянуть его до пятницы?", EN, "boost")
], SC("en.biz.async.s1", "Переписка в Slack", "💬", "Ты", "Teammate", EN, {
    "n1": N("Hey! Did you get a chance to look at my document?", "Привет! Ты успел посмотреть мой документ?", [
        ch("Not yet, sorry! I'll take a look and send you comments by EOD.", "n2", 2, "Честно + конкретный срок. Идеально."),
        ch("No.", "n2", 0, "В Slack короткое «No» звучит грубо. Добавь срок."),
        ch("Yes, it looks great! Just one small comment on page two.", "n2", 2, "Позитив + конкретика. Отлично.")]),
    "n2": N("Thanks! By the way, the client meeting moved to Thursday.", "Спасибо! Кстати, встречу с клиентом перенесли на четверг.", [
        ch("Thanks for the heads-up! Same time?", "n3", 2, "Идеальная реакция + уточнение."),
        ch("OK.", "n3", 1, "Нормально, но «Thanks for the heads-up» звучит теплее.")]),
    "n3": N("Yes, same time, ten a.m. Could you prepare the slides?", "Да, в то же время, в 10 утра. Можешь подготовить слайды?", [
        ch("Sure! Quick question: how many slides do you need?", "n4", 2, "«Quick question» — идеально для Slack."),
        ch("Sure, I'll send them by Wednesday EOD.", "n4", 2, "Конкретный срок — тебе доверяют."),
        ch("Why me?", "n4", 0, "Звучит конфликтно. Если занят: «I'm a bit busy, could it wait until Wednesday?».")]),
    "n4": N("Around ten is perfect. Let me know if you have any questions!", "Около десяти — идеально. Если будут вопросы — пиши!", [
        ch("Will do, thanks!", "n5", 2, "«Will do» = «сделаю». Коротко и дружелюбно."),
        ch("OK, I will do it.", "n5", 1, "Правильно, но звучит сухо. Попробуй «Will do, thanks!».")]),
    "n5": N("Great, talk soon!", "Отлично, до связи!")
}))

openers = T("en.social.openers", "en", "B1", "Small talk на созвоне", "☕", [
    W("How's your week going?", "как проходит неделя?", "Hi Tom! How's your week going?"),
    W("Any plans for the weekend?", "есть планы на выходные?", "It's almost Friday! Any plans for the weekend?"),
    W("Where are you based?", "где вы находитесь?", "By the way, where are you based?"),
    W("That sounds great!", "звучит классно!", "A trip to the mountains? That sounds great!"),
    W("How about you?", "а у тебя как?", "I'm good, thanks. How about you?"),
    W("Oh, really?", "о, правда?", "Oh, really? I didn't know that."),
    W("Not much, just…", "да ничего особенного, просто…", "Not much, just relaxing at home."),
    W("It was nice chatting", "было приятно поболтать", "It was nice chatting with you!")
], [
    C("c1", "Коллега спросил «How are you?». Как продолжить разговор?", ["I'm good, thanks. How about you?", "Normal.", "I'm fine. Bye."], "Всегда возвращай вопрос: <b>How about you?</b> «Normal» в английском звучит странно."),
    C("c2", "«Where are you based?» — это…", ["Где ты живёшь/работаешь?", "На чём основан твой опыт?", "Где ты родился?"], "Стандартный вопрос в распределённых командах. Ответ: <b>I'm based in Torrevieja</b>."),
    F("c3", "How's your week going?", "Как проходит неделя?"),
    L("c4", "Not much, just relaxing at home and catching up on some series.", EN, "Как проходят выходные у собеседника?", ["Отдыхает дома и смотрит сериалы", "Работает над проектом", "Уезжает в путешествие"], "<b>Catch up on</b> = наверстать (сериалы, дела, новости)."),
    L("c5", "Oh, really? I've always wanted to visit Spain!", EN, "Как отреагировал собеседник?", ["Удивился и сказал, что давно хочет в Испанию", "Сказал, что уже жил в Испании", "Сказал, что не любит Испанию"], "<b>I've always wanted to…</b> = я всегда хотел…"),
    B("c6", "Есть планы на выходные?", ["Any", "plans", "for", "the", "weekend?"], ["make", "do"], "Any plans for + [когда]?"),
    B("c7", "Было приятно поболтать с тобой!", ["It", "was", "nice", "chatting", "with", "you!"], ["chat", "for"], "It was nice + [глагол + -ing]"),
    S("c8", "Hi! How's your week going so far?", "Привет! Как проходит твоя неделя?", EN),
    S("c9", "I'm based in Torrevieja, on the coast of Spain. How about you?", "Я живу в Торревьехе, на побережье Испании. А ты?", EN, "boost")
], SC("en.social.openers.s1", "5 минут до начала созвона", "☕", "Ты", "Colleague", EN, {
    "n1": N("Hi! We're a bit early. How's your week going?", "Привет! Мы немного рано. Как проходит неделя?", [
        ch("Pretty good, thanks! A bit busy, but okay. How about you?", "n2", 2, "Ответ + встречный вопрос = живой разговор."),
        ch("Good.", "n1b", 1, "Нормально, но разговор затухает. Добавь «How about you?»."),
        ch("Terrible, I hate Mondays.", "n2", 1, "Честно 😄 Но с новыми коллегами лучше полегче.")]),
    "n1b": N("Nice. Anything interesting happening?", "Здорово. Что-нибудь интересное происходит?", [
        ch("Not much, just work and the gym. How about you?", "n2", 2, "Вот так разговор продолжается 👍")]),
    "n2": N("Honestly, I'm exhausted. We just moved to a new apartment.", "Честно, просто сил нет — мы только что переехали в новую квартиру.", [
        ch("Oh, really? Congrats! How do you like it?", "n3", 2, "Реакция + вопрос. Классика small talk."),
        ch("OK.", "n3", 0, "Коллега поделился новостью. Попробуй «Oh, really?» + вопрос."),
        ch("Moving is so stressful! I moved last year too.", "n3", 2, "Эмпатия + свой опыт — супер.")]),
    "n3": N("It's great, but there are boxes everywhere! Where are you based, by the way?", "Классно, но коробки повсюду! Кстати, а ты где живёшь?", [
        ch("I'm based in Torrevieja, in the south of Spain. It's sunny almost all year.", "n4", 2, "Факт + интересная деталь — есть за что зацепиться."),
        ch("Spain.", "n4", 1, "Правильно, но добавь деталь — так легче продолжить.")]),
    "n4": N("Oh, nice! That sounds amazing. Okay, I think everyone's here.", "О, класс! Звучит потрясающе. Ладно, кажется, все в сборе.", [
        ch("Great! It was nice chatting. Let's start.", "n5", 2, "Красиво закрыл small talk."),
        ch("Yes, let's start.", "n5", 2, "Коротко и по делу.")]),
    "n5": N("Okay, let me share my screen.", "Так, сейчас покажу экран.")
}))

questions = T("en.interview.questions", "en", "B2", "Вопросы работодателю", "🧾", [
    W("Do you have any questions for us?", "у вас есть вопросы к нам?", "That's all from me. Do you have any questions for us?"),
    W("What does a typical day look like?", "как выглядит обычный день?", "What does a typical day look like in this role?"),
    W("What are the next steps?", "какие следующие шаги?", "Thank you! What are the next steps?"),
    W("How do you measure success?", "как вы оцениваете успех?", "How do you measure success in this position?"),
    W("the team I'd be working with", "команда, с которой я бы работал", "Could you tell me about the team I'd be working with?"),
    W("onboarding", "адаптация новичка", "What does onboarding look like for new hires?"),
    W("the biggest challenge", "главная сложность", "What's the biggest challenge for the team right now?"),
    W("I'm really excited about…", "меня очень вдохновляет…", "I'm really excited about this opportunity.")
], [
    C("c1", "Рекрутер: «Do you have any questions for us?» Что лучше ответить?", ["Yes! What does a typical day look like?", "No, everything is clear.", "How many days of vacation do I get?"], "«No questions» = «мне неинтересно». Про отпуск лучше спрашивать после оффера."),
    C("c2", "Как правильно спросить про обычный рабочий день?", ["What does a typical day look like?", "How does a typical day look like?", "How is a typical day looks?"], "Либо <b>What does it look like?</b>, либо <b>How does it look?</b> — но не «How… look like»."),
    F("c3", "What are the next steps?", "Какие следующие шаги?"),
    L("c4", "The next step is a short call with the team lead, probably next week.", EN, "Какой следующий этап?", ["Короткий звонок с тимлидом на следующей неделе", "Тестовое задание до завтра", "Оффер сегодня вечером"], "<b>Team lead</b> = тимлид, <b>probably</b> = скорее всего."),
    L("c5", "We measure success by customer satisfaction and how fast we solve problems.", EN, "Как оценивают успех?", ["По довольству клиентов и скорости решения проблем", "По количеству продаж", "По числу отработанных часов"], "<b>Customer satisfaction</b> = довольство клиентов."),
    B("c6", "Как выглядит обычный день?", ["What", "does", "a", "typical", "day", "look", "like?"], ["how", "is"], "What does + [что] + look like?"),
    B("c7", "Какие следующие шаги?", ["What", "are", "the", "next", "steps?"], ["is", "after"], "What are the next + [что]?"),
    S("c8", "Could you tell me about the team I'd be working with?", "Расскажите, пожалуйста, о команде, с которой я бы работал.", EN),
    S("c9", "Thank you for your time. I'm really excited about this role. What are the next steps?", "Спасибо за ваше время. Меня очень вдохновляет эта роль. Какие следующие шаги?", EN, "boost")
], SC("en.interview.questions.s1", "Конец собеседования", "🤝", "Кандидат", "Recruiter", EN, {
    "n1": N("That's all from my side. Do you have any questions for us?", "С моей стороны всё. У вас есть вопросы к нам?", [
        ch("Yes, thank you! What does a typical day look like in this role?", "n2", 2, "Отличный первый вопрос — показывает интерес."),
        ch("No, I think everything is clear.", "n1b", 0, "Рекрутеры ждут хотя бы 1–2 вопроса."),
        ch("What's the salary?", "n1c", 1, "Можно, но лучше начать с вопроса про работу.")]),
    "n1b": N("Are you sure? Nothing about the team or the role?", "Вы уверены? Ничего про команду или роль?", [
        ch("Actually, yes. What does a typical day look like?", "n2", 2, "Хорошо спас ситуацию 👍")]),
    "n1c": N("We'll discuss the package at the offer stage. Anything about the role itself?", "Условия обсудим на этапе оффера. Есть вопросы про саму роль?", [
        ch("Of course. What does a typical day look like?", "n2", 2, "Хорошо перестроился.")]),
    "n2": N("Mostly calls with clients and working closely with the support team.", "В основном звонки с клиентами и тесная работа с командой поддержки.", [
        ch("That sounds great. How do you measure success in this role?", "n3", 2, "Сильный вопрос — ты думаешь о результате."),
        ch("What's the biggest challenge for the team right now?", "n3", 2, "Отличный вопрос: показывает, что ты готов помогать."),
        ch("OK.", "n3", 1, "Можно задать ещё один вопрос — это только плюс.")]),
    "n3": N("Good question. Mainly customer satisfaction and fast response times.", "Хороший вопрос. В основном по довольству клиентов и скорости ответа.", [
        ch("Thank you. I'm really excited about this role. What are the next steps?", "n4", 2, "Идеальный финал: благодарность + мотивация + next steps."),
        ch("OK, bye.", "n4", 0, "Слишком резко. Поблагодари и спроси про следующие шаги.")]),
    "n4": N("We'll get back to you by Friday. Thanks for your time!", "Мы свяжемся с вами до пятницы. Спасибо за ваше время!")
}))

NEW_REFS = [("en.interview", {"id": "en.interview.questions", "title": "Вопросы работодателю", "emoji": "🧾", "level": "B2", "tags": ["interview"], "status": "planned"})]
TOPICS = [
    (meetings, "topics/en/biz/meetings.json"), (async_t, "topics/en/biz/async.json"),
    (openers, "topics/en/social/openers.json"), (questions, "topics/en/interview/questions.json")
]
if __name__ == "__main__":
    write_topics(TOPICS, NEW_REFS)
