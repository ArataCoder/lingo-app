# Stage 2: Spanish topics (A1-A2) - rent, doctor, repairs, work interview
from lbgen import *

rent = T("es.life.rent", "es", "A1", "Аренда и лендлорд", "🔑", [
    W("el piso", "квартира", "Busco un piso en Torrevieja."),
    W("el alquiler", "аренда, плата за аренду", "El alquiler es de 650 euros al mes."),
    W("el casero / la casera", "хозяин / хозяйка квартиры", "Voy a llamar a la casera."),
    W("la fianza", "залог", "La fianza es de un mes."),
    W("el contrato", "договор", "¿Puedo leer el contrato antes de firmar?"),
    W("los gastos", "коммуналка, расходы", "¿Los gastos están incluidos?"),
    W("amueblado", "с мебелью", "El piso está amueblado."),
    W("¿Se admiten mascotas?", "можно с домашними животными?", "Tengo un gato. ¿Se admiten mascotas?")
], [
    C("c1", "«La fianza» — это…", ["Залог", "Скидка", "Ключ от квартиры"], "Обычно 1–2 месяца аренды. Её возвращают при выезде, если всё в порядке."),
    C("c2", "Как спросить, включена ли коммуналка?", ["¿Los gastos están incluidos?", "¿Los gastos son bonitos?", "¿Dónde están los gastos?"], "<b>Los gastos</b> = свет, вода, интернет, плата за дом (comunidad)."),
    F("c3", "amueblado", "с мебелью"),
    L("c4", "El alquiler es de seiscientos cincuenta euros al mes, con los gastos aparte.", ES, "Что сказали про цену?", ["650 € в месяц, коммуналка отдельно", "615 € в месяц, всё включено", "650 € в неделю"], "<b>Aparte</b> = отдельно. <b>Seiscientos cincuenta</b> = 650."),
    L("c5", "Puede venir a ver el piso mañana a las cinco.", ES, "Когда можно посмотреть квартиру?", ["Завтра в 17:00", "Сегодня в 5 утра", "В пятницу в 15:00"], "<b>Ver el piso</b> = посмотреть квартиру. <b>A las cinco</b> = в пять."),
    B("c6", "Я ищу квартиру с мебелью.", ["Busco", "un", "piso", "amueblado"], ["una", "busca"], "Busco + [что] + [какое]"),
    B("c7", "Можно прочитать договор?", ["¿Puedo", "leer", "el", "contrato?"], ["la", "puede"], "¿Puedo + [действие]?"),
    S("c8", "Hola, llamo por el anuncio del piso. ¿Sigue disponible?", "Здравствуйте, я звоню по объявлению о квартире. Она ещё свободна?", ES),
    S("c9", "¿Cuánto es la fianza y qué gastos están incluidos?", "Какой залог и какие расходы включены?", ES, "boost")
], SC("es.life.rent.s1", "Звонок по объявлению", "📱", "Ты", "Casera", ES, {
    "n1": N("¿Sí? Dígame.", "Да? Слушаю.", [
        ch("Hola, llamo por el anuncio del piso. ¿Sigue disponible?", "n2", 2, "Идеально: приветствие + причина звонка."),
        ch("Piso. ¿Hay?", "n2", 1, "Понятно, но резковато. Добавь «Hola» и «llamo por el anuncio»."),
        ch("Perdón, ¿habla inglés?", "n1b", 1, "Можно! Но давай попробуем по-испански 💪")]),
    "n1b": N("Un poco… Mejor en español, despacio. ¿Llama por el piso?", "Немного… Лучше по-испански, медленно. Вы звоните насчёт квартиры?", [
        ch("Sí, por el piso. ¿Sigue disponible?", "n2", 2, "Отлично, ты справился!")]),
    "n2": N("Sí, sigue disponible. Son seiscientos cincuenta euros al mes.", "Да, ещё свободна. 650 евро в месяц.", [
        ch("¿Los gastos están incluidos?", "n3", 2, "Главный вопрос задан 👍"),
        ch("Vale, perfecto.", "n3", 1, "Хорошо, но не забудь уточнить про коммуналку."),
        ch("Es muy caro, adiós.", "n2b", 0, "Не сдавайся сразу — о цене иногда можно договориться.")]),
    "n2b": N("Espere, espere. El precio se puede hablar un poco.", "Подождите, подождите. О цене можно немного поговорить.", [
        ch("Vale. ¿Los gastos están incluidos?", "n3", 2, "Хорошо, вернулся к делу.")]),
    "n3": N("No, el agua y la luz van aparte. La fianza es de un mes.", "Нет, вода и свет отдельно. Залог — один месяц.", [
        ch("Entendido. ¿Puedo ver el piso mañana?", "n4", 2, "Супер: понял и сразу договариваешься о просмотре."),
        ch("¿Puede repetir, por favor?", "n3b", 2, "Переспросить — нормально и умно."),
        ch("Sí.", "n4", 1, "Ок, но лучше сразу спросить про просмотр.")]),
    "n3b": N("Claro. El agua y la luz se pagan aparte. La fianza, un mes.", "Конечно. Вода и свет оплачиваются отдельно. Залог — один месяц.", [
        ch("Vale, entendido. ¿Puedo ver el piso mañana?", "n4", 2, "Вот так — уверенно 💪")]),
    "n4": N("Claro. ¿Le va bien mañana a las cinco?", "Конечно. Вам удобно завтра в пять?", [
        ch("Sí, perfecto. Muchas gracias. ¡Hasta mañana!", "n5", 2, "Договорились — вежливо и чётко."),
        ch("Mejor a las seis, si puede.", "n5", 2, "Отлично — ты предложил своё время.")]),
    "n5": N("Perfecto. Le envío la dirección por WhatsApp. ¡Hasta mañana!", "Отлично. Пришлю адрес в WhatsApp. До завтра!")
}))

doctor = T("es.life.doctor", "es", "A1", "Врач, аптека, скорая 112", "🚑", [
    W("Me duele…", "у меня болит…", "Me duele la cabeza."),
    W("Tengo fiebre", "у меня температура", "Tengo fiebre desde ayer."),
    W("el centro de salud", "поликлиника", "Tengo cita en el centro de salud."),
    W("pedir cita", "записаться на приём", "Quiero pedir cita con el médico."),
    W("la farmacia de guardia", "дежурная аптека", "¿Dónde hay una farmacia de guardia?"),
    W("la receta", "рецепт (от врача)", "Necesito una receta para este medicamento."),
    W("Soy alérgico a…", "у меня аллергия на… (женщина: alérgica)", "Soy alérgico a la penicilina."),
    W("¡Llame al 112!", "звоните 112!", "¡Ayuda! ¡Llame al 112, por favor!")
], [
    C("c1", "Единый номер экстренной помощи в Испании:", ["112", "911", "03"], "<b>112</b> — скорая, полиция и пожарные. Звонок бесплатный, операторы часто говорят и по-английски."),
    C("c2", "«Me duele la garganta» — это…", ["Болит горло", "Болит живот", "Болит голова"], "<b>La garganta</b> = горло. <b>La cabeza</b> = голова, <b>el estómago</b> = живот."),
    F("c3", "la receta", "рецепт (от врача)"),
    L("c4", "Tome una pastilla cada ocho horas, después de comer.", ES, "Как принимать лекарство?", ["По 1 таблетке каждые 8 часов после еды", "8 таблеток в день до еды", "1 таблетку утром натощак"], "<b>Cada ocho horas</b> = каждые 8 часов. <b>Después de comer</b> = после еды."),
    L("c5", "La farmacia de guardia está en la calle Mayor, al lado del banco.", ES, "Где дежурная аптека?", ["На улице Mayor, рядом с банком", "Напротив больницы", "На пляже, у банка"], "<b>Al lado de</b> = рядом с."),
    B("c6", "У меня температура со вчерашнего дня.", ["Tengo", "fiebre", "desde", "ayer"], ["soy", "mañana"], "Tengo + [симптом] + desde + [когда]"),
    B("c7", "Я хочу записаться к врачу.", ["Quiero", "pedir", "cita", "con", "el", "médico"], ["la", "doy"], "Quiero pedir cita con + [кто]"),
    S("c8", "Me duele mucho el estómago. ¿Necesito receta para esto?", "У меня сильно болит живот. Для этого нужен рецепт?", ES),
    S("c9", "Necesito una ambulancia. Estoy en la calle Mayor, número diez.", "Мне нужна скорая. Я на улице Mayor, дом 10.", ES, "boost")
], SC("es.life.doctor.s1", "В аптеке", "💊", "Ты", "Farmacéutica", ES, {
    "n1": N("Buenas tardes. ¿Qué necesita?", "Добрый день. Что вам нужно?", [
        ch("Buenas tardes. Me duele la garganta y tengo un poco de fiebre.", "n2", 2, "Отлично: симптомы чётко и понятно."),
        ch("Medicina.", "n2", 1, "Тебя поймут, но лучше назвать симптом: «Me duele…»."),
        ch("No sé decirlo en español…", "n1b", 1, "Это нормально! Покажи на себе и используй «Me duele…».")]),
    "n1b": N("Tranquilo. ¿Qué le duele? ¿La cabeza, la garganta…?", "Спокойно. Что у вас болит? Голова, горло…?", [
        ch("La garganta. Y tengo un poco de fiebre.", "n2", 2, "Супер, ты справился!")]),
    "n2": N("¿Desde cuándo? ¿Es alérgico a algún medicamento?", "С каких пор? У вас есть аллергия на какое-нибудь лекарство?", [
        ch("Desde ayer. No, no soy alérgico.", "n3", 2, "Ответил на оба вопроса 👏"),
        ch("Desde ayer.", "n2b", 1, "Хорошо, но фармацевт спросил ещё про аллергию."),
        ch("Sí.", "n2b", 0, "Непонятно, на что «да». Отвечай по частям.")]),
    "n2b": N("¿Y alergias? ¿Es alérgico a algo?", "А аллергия? У вас есть на что-то аллергия?", [
        ch("No, no soy alérgico a nada.", "n3", 2, "Чётко! «A nada» = ни на что."),
        ch("Sí, soy alérgico a la penicilina.", "n3", 2, "Очень важная фраза — хорошо, что ты её знаешь.")]),
    "n3": N("Vale. Le doy este jarabe. Tome una cucharada cada ocho horas.", "Хорошо. Дам вам этот сироп. Принимайте по ложке каждые 8 часов.", [
        ch("Una cucharada cada ocho horas. ¿Necesito receta?", "n4", 2, "Повторил главное — так меньше ошибок."),
        ch("¿Puede repetir, por favor? Más despacio.", "n3b", 2, "С лекарствами переспрашивать — правильно!"),
        ch("Vale.", "n4", 1, "Ок, но дозировку лучше повторить вслух.")]),
    "n3b": N("Claro. Una cucharada… cada ocho horas. Tres veces al día.", "Конечно. Одна ложка… каждые восемь часов. Три раза в день.", [
        ch("Entendido, tres veces al día. Gracias.", "n4", 2, "Идеально 👌")]),
    "n4": N("Este no necesita receta. Si la fiebre sube, vaya al centro de salud.", "Для этого рецепт не нужен. Если температура поднимется, идите в поликлинику.", [
        ch("Muchas gracias. ¿Cuánto es?", "n5", 2, "Вежливо и по делу."),
        ch("Vale, gracias.", "n5", 1, "Хорошо, только не забудь оплатить 😄")]),
    "n5": N("Son seis euros con cincuenta. ¡Que se mejore!", "6,50 €. Выздоравливайте!")
}))

repairs = T("es.life.repairs", "es", "A1", "Поломки и мастер", "🔧", [
    W("No funciona", "не работает", "La lavadora no funciona."),
    W("Está roto / rota", "сломан / сломана", "El grifo está roto."),
    W("Hay una fuga de agua", "протекает вода", "Hay una fuga de agua en el baño."),
    W("el fontanero", "сантехник", "Necesito un fontanero urgente."),
    W("el electricista", "электрик", "El electricista viene mañana."),
    W("el aire acondicionado", "кондиционер", "El aire acondicionado no enfría."),
    W("el presupuesto", "смета, расчёт стоимости", "¿Me puede dar un presupuesto?"),
    W("¿Cuándo puede venir?", "когда вы можете прийти?", "¿Cuándo puede venir a arreglarlo?")
], [
    C("c1", "«El grifo gotea» — что случилось?", ["Капает кран", "Сломался холодильник", "Нет света"], "<b>El grifo</b> = кран, <b>gotear</b> = капать."),
    C("c2", "Кого звать, если течёт труба?", ["Al fontanero", "Al electricista", "Al cartero"], "<b>Fontanero</b> = сантехник. <b>Cartero</b> = почтальон 📮"),
    F("c3", "el presupuesto", "смета (сколько будет стоить ремонт)"),
    L("c4", "Puedo ir el jueves por la mañana, entre las nueve y las once.", ES, "Когда придёт мастер?", ["В четверг, с 9 до 11 утра", "В среду вечером", "Во вторник в 11:00"], "<b>El jueves</b> = четверг. <b>Por la mañana</b> = утром."),
    L("c5", "La reparación cuesta unos ochenta euros, más IVA.", ES, "Сколько стоит ремонт?", ["Около 80 € + НДС", "18 € без налога", "800 € с НДС"], "<b>Unos</b> = примерно. <b>IVA</b> = НДС (21%)."),
    B("c6", "Стиральная машина не работает.", ["La", "lavadora", "no", "funciona"], ["el", "es"], "[вещь] + no funciona"),
    B("c7", "Когда вы можете прийти?", ["¿Cuándo", "puede", "venir?"], ["dónde", "viene"], "¿Cuándo puede + [действие]?"),
    S("c8", "Hola, hay una fuga de agua en la cocina. ¿Puede venir hoy?", "Здравствуйте, на кухне протекает вода. Можете прийти сегодня?", ES),
    S("c9", "El aire acondicionado no enfría. ¿Me puede dar un presupuesto?", "Кондиционер не охлаждает. Можете посчитать, сколько будет стоить?", ES, "boost")
], SC("es.life.repairs.s1", "Звонок сантехнику", "🧰", "Ты", "Fontanero", ES, {
    "n1": N("Fontanería Ruiz, dígame.", "Сантехника Руис, слушаю.", [
        ch("Hola, hay una fuga de agua en el baño. ¿Puede venir hoy?", "n2", 2, "Проблема + где + когда. Идеально."),
        ch("Agua. Problema. Baño.", "n2", 1, "Тебя поймут 🙂 Попробуй: «Hay una fuga de agua en el baño»."),
        ch("¿Es usted fontanero?", "n1b", 1, "Хорошее уточнение. Теперь скажи, что случилось.")]),
    "n1b": N("Sí, soy fontanero. ¿Qué problema tiene?", "Да, я сантехник. Какая у вас проблема?", [
        ch("Hay una fuga de agua en el baño.", "n2", 2, "Вот, чётко 💪")]),
    "n2": N("Vale. ¿Sale mucha agua o gotea un poco?", "Хорошо. Воды течёт много или немного капает?", [
        ch("Gotea un poco, debajo del lavabo.", "n3", 2, "Супер: ещё и сказал, где именно."),
        ch("Sale mucha agua, ¡es urgente!", "n3u", 2, "Важно сразу сказать, что срочно."),
        ch("No sé.", "n3", 0, "Лучше описать хоть как-то: «mucha» или «poca».")]),
    "n3": N("Entonces puedo ir mañana por la mañana. ¿Le va bien a las diez?", "Тогда могу прийти завтра утром. Вам удобно в десять?", [
        ch("Sí, a las diez está bien. ¿Cuánto cuesta, más o menos?", "n4", 2, "Сразу спросил цену — по-взрослому."),
        ch("Sí, vale.", "n4", 1, "Ок! Цену лучше уточнить заранее.")]),
    "n3u": N("Vale, cierre la llave de paso. Llego en una hora.", "Хорошо, перекройте главный кран. Буду через час.", [
        ch("Vale, cierro la llave. ¿Cuánto cuesta, más o menos?", "n4", 2, "Отлично — понял инструкцию и спросил цену."),
        ch("¿Qué es la llave de paso?", "n3ub", 2, "Правильно спросил, если не знаешь.")]),
    "n3ub": N("Es la llave general del agua. Suele estar en la cocina o en el baño.", "Это главный кран воды. Обычно он на кухне или в ванной.", [
        ch("Ah, vale, la cierro ahora. ¿Cuánto cuesta, más o menos?", "n4", 2, "Супер, ты всё понял 💪")]),
    "n4": N("La visita cuesta treinta euros, y luego depende de la pieza.", "Выезд — 30 евро, а дальше зависит от детали.", [
        ch("Perfecto. Mi dirección es calle Mayor, diez, segundo B.", "n5", 2, "Адрес по-испански — молодец!"),
        ch("Vale, gracias.", "n5", 1, "Хорошо, только мастеру нужен адрес 😉")]),
    "n5": N("Muy bien. Le mando un mensaje cuando salga. ¡Hasta luego!", "Отлично. Напишу вам, когда выеду. До встречи!")
}))

interview = T("es.work.interview", "es", "A2", "CV и собеседование", "💼", [
    W("el currículum", "резюме", "Le envío mi currículum por correo."),
    W("la entrevista", "собеседование", "Tengo una entrevista el lunes."),
    W("la experiencia", "опыт", "Tengo tres años de experiencia."),
    W("el puesto", "должность, вакансия", "Me interesa mucho el puesto."),
    W("trabajar en equipo", "работать в команде", "Me gusta trabajar en equipo."),
    W("la jornada completa", "полный рабочий день", "Busco un trabajo de jornada completa."),
    W("el sueldo", "зарплата", "¿Cuál es el sueldo del puesto?"),
    W("Aprendo rápido", "я быстро учусь", "Mi español no es perfecto, pero aprendo rápido.")
], [
    C("c1", "«La jornada parcial» — это…", ["Неполный рабочий день", "Ночная смена", "Испытательный срок"], "<b>Parcial</b> = частичная. Полный день — <b>jornada completa</b>."),
    C("c2", "Как вежливо сказать, что тебе интересна вакансия?", ["Me interesa mucho el puesto.", "Quiero el dinero del puesto.", "El puesto es interesante para usted."], "<b>Me interesa</b> = мне интересно. Звучит мотивированно."),
    F("c3", "Tengo experiencia en atención al cliente.", "У меня есть опыт в обслуживании клиентов."),
    L("c4", "¿Cuándo podría empezar a trabajar con nosotros?", ES, "Что спрашивают?", ["Когда вы можете начать работать?", "Сколько вы хотите получать?", "Где вы работали раньше?"], "<b>Empezar</b> = начать. Ответ: <b>Puedo empezar el lunes</b>."),
    L("c5", "El contrato es de seis meses, con posibilidad de ser indefinido.", ES, "Какой контракт?", ["На 6 месяцев, потом может стать бессрочным", "Бессрочный с первого дня", "На 6 недель без продления"], "<b>Indefinido</b> = бессрочный контракт. Это то, что все хотят 🙂"),
    B("c6", "У меня три года опыта.", ["Tengo", "tres", "años", "de", "experiencia"], ["soy", "con"], "Tengo + [число] + años de experiencia"),
    B("c7", "Мне нравится работать в команде.", ["Me", "gusta", "trabajar", "en", "equipo"], ["con", "gusto"], "Me gusta + [действие]"),
    S("c8", "Mi español no es perfecto, pero aprendo rápido. También hablo inglés y ruso.", "Мой испанский не идеален, но я быстро учусь. Ещё я говорю по-английски и по-русски.", ES),
    S("c9", "Me interesa mucho el puesto porque me gusta ayudar a los clientes.", "Мне очень интересна эта вакансия, потому что мне нравится помогать клиентам.", ES, "boost")
], SC("es.work.interview.s1", "Собеседование в отеле", "🏨", "Кандидат", "Entrevistadora", ES, {
    "n1": N("Buenos días. Siéntese, por favor. Hábleme un poco de usted.", "Доброе утро. Садитесь, пожалуйста. Расскажите немного о себе.", [
        ch("Buenos días. Me llamo Aleks, soy de Ucrania y vivo en Torrevieja. Tengo experiencia en atención al cliente.", "n2", 2, "Отличная мини-презентация: имя, откуда, опыт."),
        ch("Soy Aleks.", "n2", 1, "Хорошее начало. Добавь опыт: «Tengo experiencia en…»."),
        ch("Perdón, estoy un poco nervioso.", "n1b", 1, "Честно и по-человечески. Это нормально!")]),
    "n1b": N("No pasa nada, tranquilo. ¿Cómo se llama y qué experiencia tiene?", "Ничего страшного, спокойно. Как вас зовут и какой у вас опыт?", [
        ch("Me llamo Aleks. Tengo experiencia en atención al cliente.", "n2", 2, "Вот, получилось 💪")]),
    "n2": N("Muy bien. ¿Por qué le interesa este puesto?", "Хорошо. Почему вас интересует эта вакансия?", [
        ch("Me gusta trabajar con gente y quiero mejorar mi español.", "n3", 2, "Мотивация + рост — сильный ответ."),
        ch("Porque necesito trabajo.", "n3", 1, "Честно 🙂 Но лучше сказать, что тебе нравится в этой работе."),
        ch("No sé.", "n3", 0, "Подготовь заранее одну фразу: «Me gusta…».")]),
    "n3": N("¿Habla otros idiomas?", "Вы говорите на других языках?", [
        ch("Sí, hablo inglés, ruso y ucraniano. Mi español no es perfecto, pero aprendo rápido.", "n4", 2, "Идеально: сильная сторона + честность."),
        ch("Inglés y ruso.", "n4", 1, "Хорошо! Можно добавить: «aprendo rápido».")]),
    "n4": N("Perfecto. ¿Cuándo podría empezar?", "Отлично. Когда вы могли бы начать?", [
        ch("Puedo empezar el lunes, si le parece bien.", "n5", 2, "Конкретно и вежливо."),
        ch("Ya mismo, mañana si quiere.", "n5", 2, "Энергично 😄 Работодатели это любят."),
        ch("¿Cuál es el sueldo?", "n4b", 1, "Спросить можно, но сначала ответь на вопрос.")]),
    "n4b": N("Eso lo hablamos al final. Primero, ¿cuándo podría empezar?", "Это обсудим в конце. Сначала — когда вы могли бы начать?", [
        ch("Perdón. Puedo empezar el lunes.", "n5", 2, "Хорошо исправился 👍")]),
    "n5": N("Muy bien, Aleks. Le llamamos esta semana. ¡Gracias por venir!", "Отлично, Алекс. Мы позвоним вам на этой неделе. Спасибо, что пришли!")
}))

TOPICS = [
    (rent, "topics/es/life/rent.json"), (doctor, "topics/es/life/doctor.json"),
    (repairs, "topics/es/life/repairs.json"), (interview, "topics/es/work/interview.json")
]
if __name__ == "__main__":
    write_topics(TOPICS)
