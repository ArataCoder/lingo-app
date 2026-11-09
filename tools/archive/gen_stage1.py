import json, os
BASE = "/data/lingo_release/content"

def ch(text, nxt, score, fb):
    return {"text": text, "next": nxt, "score": score, "feedback": fb}
def W(term, tr, ex):
    return {"term": term, "tr": tr, "ex": ex}
def C(i, q, opts, ex, en="low"):
    return {"id": i, "type": "choice", "energy": en, "q": q, "options": opts, "answer": 0, "explain": ex}
def F(i, front, back):
    return {"id": i, "type": "flash", "energy": "low", "front": front, "back": back}
def L(i, text, lang, q, opts, ex, rate=0.85):
    return {"id": i, "type": "listen", "energy": "normal", "audio": {"text": text, "lang": lang, "rate": rate}, "q": q, "options": opts, "answer": 0, "explain": ex}
def B(i, prompt, tokens, distr, pattern):
    return {"id": i, "type": "build", "energy": "normal", "prompt": prompt, "tokens": tokens, "distractors": distr, "pattern": pattern}
def S(i, text, tr, lang, en="normal"):
    return {"id": i, "type": "speak", "energy": en, "text": text, "tr": tr, "lang": lang}
def N(say, tr, choices=None):
    if choices is None:
        return {"say": say, "tr": tr, "end": True}
    return {"say": say, "tr": tr, "choices": choices}
def SC(sid, title, emoji, user, bot, voice, nodes):
    return {"id": sid, "title": title, "emoji": emoji, "userRole": user, "botRole": bot, "voice": voice, "start": "n1", "nodes": nodes, "ai": {"enabled": False}}
def T(tid, track, level, title, emoji, cheat, cards, scen, mins=4):
    return {"id": tid, "track": track, "level": level, "title": title, "emoji": emoji, "estMinutes": mins, "cheatsheet": cheat, "cards": cards, "scenarios": [scen]}

ES = "es-ES"; EN = "en-US"; GBV = "en-GB"

hello = T("es.survive.hello", "es", "A0", "Привет и «я не понимаю»", "👋", [
    W("Hola", "привет", "¡Hola! ¿Qué tal?"),
    W("Buenos días", "доброе утро / добрый день (до обеда)", "Buenos días, señora."),
    W("Buenas", "короткое «здрасте» на любое время", "¡Buenas! Una pregunta…"),
    W("Gracias", "спасибо", "Muchas gracias."),
    W("Perdón", "извините", "Perdón, no hablo bien español."),
    W("No entiendo", "я не понимаю", "Lo siento, no entiendo."),
    W("Más despacio, por favor", "помедленнее, пожалуйста", "¿Puede hablar más despacio, por favor?"),
    W("Me llamo…", "меня зовут…", "Me llamo Aleks.")
], [
    C("c1", "Сосед говорит слишком быстро. Что сказать?", ["Más despacio, por favor.", "Más rápido, por favor.", "Muy bien, gracias."], "<b>Despacio</b> = медленно. Испанцы не обижаются, а наоборот замедляются 🙂"),
    C("c2", "«Buenas» — это…", ["Короткое «здрасте» в любое время", "«Хорошие» про еду", "«Пока»"], "В Торревьехе так здороваются в магазине, в баре и в лифте."),
    F("c3", "No entiendo.", "Я не понимаю."),
    L("c4", "Hola, ¿qué tal? ¿Eres nuevo en el edificio?", ES, "Что спросили?", ["Ты новенький в этом доме?", "Где здесь лифт?", "Ты говоришь по-английски?"], "<b>El edificio</b> = здание, дом. <b>Nuevo</b> = новый."),
    L("c5", "Me llamo Carmen. Vivo en el tercero.", ES, "Где живёт Carmen?", ["На третьем этаже", "В третьем доме", "Три года здесь"], "<b>El tercero</b> = третий (этаж). Так говорят про квартиры."),
    B("c6", "Извините, я не понимаю.", ["Perdón,", "no", "entiendo"], ["sí", "tengo"], "Perdón, no + [глагол]"),
    B("c7", "Можете повторить, пожалуйста?", ["¿Puede", "repetir,", "por", "favor?"], ["tiene", "hablar"], "¿Puede + [действие], por favor?"),
    S("c8", "Hola, me llamo Aleks. Soy nuevo aquí.", "Привет, меня зовут Алекс. Я тут новенький.", ES),
    S("c9", "Perdón, hablo un poco de español. ¿Puede hablar más despacio?", "Извините, я немного говорю по-испански. Можете говорить медленнее?", ES, "boost")
], SC("es.survive.hello.s1", "Сосед в лифте", "🛗", "Ты", "Vecina", ES, {
    "n1": N("¡Buenas! ¿Eres el nuevo del cuarto?", "Здрасте! Ты новенький с четвёртого?", [
        ch("¡Hola! Sí, soy nuevo. Me llamo Aleks.", "n2", 2, "Идеально: привет + ответ + имя."),
        ch("Sí.", "n2", 1, "Понятно! Добавь имя — так теплее."),
        ch("Perdón, no entiendo.", "n1b", 1, "Нормально! Переспрашивать — это суперсила.")]),
    "n1b": N("Tranquilo. ¿Vives… en el cuarto piso?", "Спокойно. Ты живёшь… на четвёртом этаже?", [
        ch("¡Ah, sí! En el cuarto. Me llamo Aleks.", "n2", 2, "Отлично, ты понял со второго раза 💪")]),
    "n2": N("Encantada, yo soy Carmen. ¿De dónde eres?", "Очень приятно, я Кармен. Откуда ты?", [
        ch("Encantado. Soy de Ucrania.", "n3", 2, "«Encantado» = очень приятно. Красиво!"),
        ch("De Ucrania.", "n3", 1, "Коротко и понятно 👍")]),
    "n3": N("¡Qué bien! Si necesitas algo, estoy en el tercero.", "Здорово! Если что-то нужно, я на третьем.", [
        ch("Muchas gracias, Carmen. ¡Hasta luego!", "n4", 2, "Вежливо и по-местному."),
        ch("¿Puede repetir, por favor?", "n3b", 2, "Правильно, лучше переспросить, чем кивать.")]),
    "n3b": N("Claro. Yo vivo en el tercero. Si necesitas algo, me dices.", "Конечно. Я живу на третьем. Если что-то нужно — говори.", [
        ch("¡Vale, gracias! Hasta luego.", "n4", 2, "«Vale» = ок. Звучишь как местный 😎")]),
    "n4": N("¡Hasta luego, Aleks!", "Пока, Алекс!")
}))

numbers = T("es.survive.numbers", "es", "A0", "Числа, цены, время", "🔢", [
    W("uno, dos, tres", "один, два, три", "Tres cafés, por favor."),
    W("diez, veinte, cincuenta", "10, 20, 50", "Son veinte euros."),
    W("cien", "сто", "Cien gramos de jamón."),
    W("¿Cuánto cuesta?", "сколько стоит?", "¿Cuánto cuesta esto?"),
    W("¿Cuánto es?", "сколько с меня?", "Perdón, ¿cuánto es?"),
    W("con cincuenta", "и 50 центов (в цене)", "Dos con cincuenta."),
    W("¿Qué hora es?", "который час?", "Perdón, ¿qué hora es?"),
    W("Son las cinco y media", "половина шестого (5:30)", "Son las cinco y media.")
], [
    C("c1", "Продавец говорит: «Dos con cincuenta». Сколько платить?", ["2,50 €", "2,15 €", "52 €"], "<b>Con</b> в цене = «и». Dos con cincuenta = 2 евро 50."),
    C("c2", "Как спросить «Сколько с меня?» на кассе?", ["¿Cuánto es?", "¿Qué hora es?", "¿Dónde está?"], "<b>¿Cuánto es?</b> — самая частая фраза в магазине."),
    F("c3", "veinte", "двадцать"),
    L("c4", "Son quince euros.", ES, "Сколько стоит?", ["15 €", "50 €", "5 €"], "<b>Quince</b> = 15. Не путай с <b>cincuenta</b> = 50."),
    L("c5", "Abrimos a las diez y cerramos a las dos.", ES, "Когда открыто?", ["С 10:00 до 14:00", "С 2:00 до 10:00", "С 12:00 до 14:00"], "В Испании многие закрываются на обед — это нормально."),
    B("c6", "Сколько стоит это?", ["¿Cuánto", "cuesta", "esto?"], ["es", "hora"], "¿Cuánto cuesta + [что]?"),
    B("c7", "Сейчас пять часов.", ["Son", "las", "cinco"], ["es", "los"], "Son las + [число]"),
    S("c8", "Perdón, ¿cuánto cuesta un kilo de tomates?", "Извините, сколько стоит кило помидоров?", ES),
    S("c9", "Son tres con cincuenta. Aquí tiene, gracias.", "Три пятьдесят. Вот, держите, спасибо.", ES, "boost")
], SC("es.survive.numbers.s1", "Рынок по пятницам", "🍅", "Ты", "Frutero", ES, {
    "n1": N("¡Buenas! ¿Qué le pongo?", "Здрасте! Что вам положить?", [
        ch("Un kilo de tomates, por favor.", "n2", 2, "Чётко: сколько + что + por favor."),
        ch("Tomates.", "n2", 1, "Поймут! Но с «un kilo de…» точнее."),
        ch("¿Cuánto cuestan los tomates?", "n1b", 2, "Сначала узнать цену — умно.")]),
    "n1b": N("Dos euros el kilo.", "Два евро за кило.", [
        ch("Vale, un kilo, por favor.", "n2", 2, "Отлично!")]),
    "n2": N("Aquí tiene. ¿Algo más?", "Вот. Что-нибудь ещё?", [
        ch("No, gracias. ¿Cuánto es?", "n3", 2, "Классика рынка 👌"),
        ch("Sí, medio kilo de fresas.", "n2b", 2, "«Medio kilo» = полкило. Сильно!")]),
    "n2b": N("Muy bien. ¿Algo más?", "Хорошо. Ещё что-то?", [
        ch("Nada más, gracias. ¿Cuánto es?", "n3", 2, "«Nada más» = больше ничего.")]),
    "n3": N("Son cuatro con cincuenta.", "С вас четыре пятьдесят.", [
        ch("Aquí tiene cinco euros.", "n4", 2, "Правильно понял цену: 4,50 €."),
        ch("¿Más despacio, por favor?", "n3b", 2, "Переспросить цену — нормально.")]),
    "n3b": N("Cuatro… con cincuenta. Cuatro euros y cincuenta céntimos.", "Четыре… пятьдесят. Четыре евро и пятьдесят центов.", [
        ch("¡Vale! Aquí tiene cinco.", "n4", 2, "Супер 💪")]),
    "n4": N("Cincuenta céntimos de cambio. ¡Gracias, guapo!", "Пятьдесят центов сдачи. Спасибо, красавчик!")
}))

super_ = T("es.survive.super", "es", "A0", "Супермаркет", "🛒", [
    W("¿Dónde está…?", "где находится…?", "¿Dónde está la leche?"),
    W("la bolsa", "пакет", "¿Quiere bolsa?"),
    W("la caja", "касса", "La caja está ahí."),
    W("con tarjeta", "картой", "Pago con tarjeta."),
    W("en efectivo", "наличными", "¿Puedo pagar en efectivo?"),
    W("el ticket", "чек", "¿Quiere el ticket?"),
    W("la oferta", "скидка, акция", "Está de oferta."),
    W("el pan / la leche / los huevos", "хлеб / молоко / яйца", "Necesito pan y huevos.")
], [
    C("c1", "Кассир спрашивает: «¿Quiere bolsa?» Это…", ["Нужен пакет?", "Нужен чек?", "Есть карта магазина?"], "Пакеты в Испании платные, поэтому спрашивают всегда."),
    C("c2", "Как сказать «Я плачу картой»?", ["Pago con tarjeta.", "Tengo una tarjeta roja.", "Pago la tarjeta."], "<b>Pago con</b> + способ оплаты."),
    F("c3", "en efectivo", "наличными"),
    L("c4", "¿Tiene la tarjeta de cliente?", ES, "Что спрашивают?", ["Есть ли у вас карта магазина?", "Будете платить картой?", "Нужен ли пакет?"], "<b>Tarjeta de cliente</b> = карта покупателя. Можно ответить: «No, gracias»."),
    L("c5", "Los huevos están en el pasillo cinco, al fondo.", ES, "Где яйца?", ["В 5-м ряду, в конце", "На кассе 5", "Закончились"], "<b>El pasillo</b> = проход, ряд. <b>Al fondo</b> = в конце."),
    B("c6", "Где молоко?", ["¿Dónde", "está", "la", "leche?"], ["es", "el"], "¿Dónde está + [что]?"),
    B("c7", "Нет, спасибо, пакет не нужно.", ["No,", "gracias,", "sin", "bolsa"], ["con", "sí"], "sin + [что] = без чего-то"),
    S("c8", "Perdón, ¿dónde está el pan?", "Извините, где хлеб?", ES),
    S("c9", "Sin bolsa, gracias. Pago con tarjeta.", "Без пакета, спасибо. Плачу картой.", ES, "boost")
], SC("es.survive.super.s1", "Касса в Mercadona", "🧾", "Ты", "Cajera", ES, {
    "n1": N("Hola, buenas. ¿Quiere bolsa?", "Здрасте. Пакет нужен?", [
        ch("No, gracias, tengo.", "n2", 2, "«Tengo» = у меня есть. Экономишь 15 центов 😄"),
        ch("Sí, una, por favor.", "n2", 2, "Чётко!"),
        ch("¿Perdón?", "n1b", 1, "Переспросить — норм. Слушай ключевое слово.")]),
    "n1b": N("¿Bolsa? ¿Necesita una bolsa?", "Пакет? Вам нужен пакет?", [
        ch("Ah, no, gracias.", "n2", 2, "Вот! Понял по слову «bolsa» 👍")]),
    "n2": N("¿Tiene la tarjeta de cliente?", "У вас есть карта покупателя?", [
        ch("No, no tengo.", "n3", 2, "Просто и правильно."),
        ch("No, gracias.", "n3", 2, "Тоже работает.")]),
    "n3": N("Son doce con veinte. ¿Tarjeta o efectivo?", "С вас 12,20. Картой или наличными?", [
        ch("Con tarjeta, por favor.", "n4", 2, "Идеально."),
        ch("En efectivo. Aquí tiene.", "n4", 2, "Отлично!"),
        ch("Tarjeta.", "n4", 1, "Поймут! С «Con… por favor» звучит мягче.")]),
    "n4": N("Perfecto. ¿Quiere el ticket?", "Отлично. Чек нужен?", [
        ch("No, gracias. ¡Que vaya bien!", "n5", 2, "«Que vaya bien» = хорошего дня. Звучишь как местный 😎"),
        ch("Sí, por favor.", "n5", 2, "Норм. Чек пригодится для возврата.")]),
    "n5": N("Gracias, igualmente. ¡Hasta luego!", "Спасибо, и вам. До свидания!")
}))

cafe = T("es.survive.cafe", "es", "A0", "Кафе и бар: заказ", "☕", [
    W("¿Me pone…?", "мне можно…? (так заказывают)", "¿Me pone un café con leche?"),
    W("un café con leche", "кофе с молоком", "Un café con leche, por favor."),
    W("un cortado", "эспрессо с каплей молока", "Un cortado, por favor."),
    W("una caña", "маленькое разливное пиво", "Dos cañas, por favor."),
    W("para llevar", "с собой", "Un café para llevar."),
    W("sin azúcar", "без сахара", "Un té sin azúcar."),
    W("¿Algo más?", "что-нибудь ещё?", "¿Algo más? No, gracias."),
    W("la cuenta", "счёт", "La cuenta, por favor.")
], [
    C("c1", "Как испанцы обычно заказывают в баре?", ["¿Me pone un café?", "Dame café ahora.", "Yo quiero comprar café."], "<b>¿Me pone…?</b> = «мне можно…?» Самый естественный вариант."),
    C("c2", "«Una caña» — это…", ["Маленькое разливное пиво", "Тростник сахара", "Чашка чая"], "Caña — классика испанского бара. Около 2 €."),
    F("c3", "para llevar", "с собой"),
    L("c4", "¿Para tomar aquí o para llevar?", ES, "Что спрашивают?", ["Здесь или с собой?", "Горячий или холодный?", "Картой или наличными?"], "<b>Para tomar aquí</b> = пить здесь."),
    L("c5", "Son tres euros con veinte. ¿Algo más?", ES, "Сколько платить?", ["3,20 €", "3,02 €", "20 €"], "Tres con veinte = 3 евро 20."),
    B("c6", "Мне можно кофе с молоком?", ["¿Me", "pone", "un", "café", "con", "leche?"], ["sin", "tengo"], "¿Me pone + [что]?"),
    B("c7", "Счёт, пожалуйста.", ["La", "cuenta,", "por", "favor"], ["el", "cuesta"], "La cuenta, por favor"),
    S("c8", "¿Me pone un cortado, por favor?", "Можно мне кортадо, пожалуйста?", ES),
    S("c9", "Un café con leche para llevar y la cuenta, por favor.", "Кофе с молоком с собой и счёт, пожалуйста.", ES, "boost")
], SC("es.survive.cafe.s1", "Утренний кофе", "☕", "Ты", "Camarero", ES, {
    "n1": N("¡Buenos días! ¿Qué te pongo?", "Доброе утро! Что тебе?", [
        ch("¿Me pones un café con leche, por favor?", "n2", 2, "Звучит на 100% по-испански 🔥"),
        ch("Un café, por favor.", "n2", 2, "Чётко. Обычно принесут эспрессо."),
        ch("Café.", "n2", 1, "Поймут! С «por favor» вежливее.")]),
    "n2": N("¿Para tomar aquí o para llevar?", "Здесь или с собой?", [
        ch("Para tomar aquí.", "n3", 2, "Отлично!"),
        ch("Para llevar, por favor.", "n3", 2, "Супер, ключевая фраза."),
        ch("¿Perdón? Más despacio, por favor.", "n2b", 2, "Правильно сделал, что переспросил.")]),
    "n2b": N("Claro. ¿Aquí… o para llevar?", "Конечно. Здесь… или с собой?", [
        ch("Aquí, gracias.", "n3", 2, "Вот! 💪")]),
    "n3": N("Muy bien. ¿Algo más? ¿Una tostada?", "Хорошо. Что-нибудь ещё? Тост?", [
        ch("Sí, una tostada con tomate, por favor.", "n4", 2, "Tostada con tomate — легендарный завтрак 🍅"),
        ch("No, nada más, gracias.", "n4", 2, "«Nada más» = больше ничего.")]),
    "n4": N("Aquí tienes. Luego me dices.", "Держи. Потом скажешь (когда платить).", [
        ch("¡Gracias! … La cuenta, por favor.", "n5", 2, "Идеально. В Испании счёт нужно попросить самому."),
        ch("¿Cuánto es?", "n5", 2, "Тоже работает 👍")]),
    "n5": N("Son dos con ochenta. ¡Gracias!", "С тебя 2,80. Спасибо!")
}))

transport = T("es.survive.transport", "es", "A1", "Автобус и такси", "🚌", [
    W("la parada", "остановка", "¿Dónde está la parada?"),
    W("el billete", "билет", "Un billete a Alicante, por favor."),
    W("¿Este autobús va a…?", "этот автобус едет в…?", "¿Este autobús va al hospital?"),
    W("ida y vuelta", "туда и обратно", "Un billete de ida y vuelta."),
    W("el próximo", "следующий", "¿A qué hora sale el próximo?"),
    W("bajarse", "выходить (из транспорта)", "¿Dónde me bajo?"),
    W("a la derecha / a la izquierda", "направо / налево", "La estación está a la derecha."),
    W("Aquí, por favor", "здесь, пожалуйста (остановите)", "Pare aquí, por favor.")
], [
    C("c1", "Как спросить «Этот автобус едет в Аликанте?»", ["¿Este autobús va a Alicante?", "¿Este autobús es Alicante?", "¿Alicante tiene autobús?"], "<b>Va a</b> + место = едет в…"),
    C("c2", "«Ida y vuelta» — это…", ["Туда и обратно", "Только туда", "Пересадка"], "Билет ida y vuelta часто дешевле двух отдельных."),
    F("c3", "la parada", "остановка"),
    L("c4", "El próximo sale a las once y cuarto.", ES, "Когда следующий?", ["В 11:15", "В 11:40", "Через 4 минуты"], "<b>Y cuarto</b> = и четверть = :15."),
    L("c5", "Tienes que bajarte en la tercera parada.", ES, "Где выходить?", ["На третьей остановке", "На конечной", "Через три минуты"], "<b>Bajarse</b> = выходить. <b>Tercera</b> = третья."),
    B("c6", "Один билет до Аликанте, пожалуйста.", ["Un", "billete", "a", "Alicante,", "por", "favor"], ["una", "de"], "Un billete a + [город]"),
    B("c7", "Где мне выходить?", ["¿Dónde", "me", "bajo?"], ["está", "te"], "¿Dónde me + [глагол]?"),
    S("c8", "Perdón, ¿este autobús va a la estación?", "Извините, этот автобус идёт на вокзал?", ES),
    S("c9", "Al hospital de Torrevieja, por favor. Pare aquí, gracias.", "В больницу Торревьехи, пожалуйста. Остановите здесь, спасибо.", ES, "boost")
], SC("es.survive.transport.s1", "Автобус до Аликанте", "🚌", "Ты", "Conductor", ES, {
    "n1": N("Buenas. ¿A dónde va?", "Здрасте. Куда едете?", [
        ch("A Alicante, por favor. ¿Cuánto es?", "n2", 2, "Куда + цена в одной фразе. Отлично!"),
        ch("Alicante.", "n2", 1, "Поймут! С «A… por favor» вежливее."),
        ch("¿Este autobús va a Alicante?", "n1b", 2, "Проверить маршрут — всегда правильно.")]),
    "n1b": N("Sí, sí, va a Alicante, a la estación.", "Да-да, идёт в Аликанте, до вокзала.", [
        ch("Perfecto. Un billete, por favor.", "n2", 2, "Супер 💪")]),
    "n2": N("¿Solo ida o ida y vuelta?", "Только туда или туда-обратно?", [
        ch("Ida y vuelta, por favor.", "n3", 2, "Экономно и правильно."),
        ch("Solo ida.", "n3", 2, "Чётко.")]),
    "n3": N("Son siete con ochenta. ¿Tarjeta?", "7,80. Картой?", [
        ch("Sí, con tarjeta.", "n4", 2, "Отлично."),
        ch("¿Puede repetir, por favor?", "n3b", 2, "Переспросить цену — нормально.")]),
    "n3b": N("Siete euros con ochenta.", "Семь евро восемьдесят.", [
        ch("Vale, con tarjeta.", "n4", 2, "👍")]),
    "n4": N("Listo. ¿Algo más?", "Готово. Что-то ещё?", [
        ch("Sí, ¿me avisa cuando lleguemos a la estación?", "n5", 2, "Уровень boss: «предупредите, когда приедем» 🔥"),
        ch("No, gracias.", "n5", 2, "Ок!")]),
    "n5": N("Claro, sin problema. ¡Buen viaje!", "Конечно, без проблем. Хорошей поездки!")
}))

fillers = T("en.barriers.fillers", "en", "B1", "Филлеры: как выиграть время", "⏳", [
    W("Let me think…", "дай подумать…", "Hmm, let me think for a second."),
    W("That's a good question.", "хороший вопрос (выигрываешь 3 секунды)", "That's a good question. I'd say…"),
    W("How can I put it…", "как бы это сказать…", "How can I put it… it was a challenge."),
    W("What I mean is…", "я имею в виду…", "What I mean is, I prefer clear goals."),
    W("To be honest…", "честно говоря…", "To be honest, I've never tried it."),
    W("Off the top of my head…", "навскидку…", "Off the top of my head, maybe three."),
    W("Give me a second.", "секунду", "Give me a second, I'll find it."),
    W("Basically…", "в общем, по сути…", "Basically, it saves time.")
], [
    C("c1", "Тебя спросили сложное. Нужно 3 секунды на мысль. Что сказать?", ["That's a good question. Let me think…", "Ehhh… ehhh…", "I don't know."], "Филлер звучит уверенно, а «эээ» — как паника.", "low"),
    C("c2", "«Off the top of my head» — это…", ["Навскидку, без подготовки", "У меня болит голова", "Главная мысль"], "Удобно, когда спрашивают цифры: «Off the top of my head, about 20%»."),
    F("c3", "How can I put it…", "Как бы это сказать…"),
    L("c4", "That's a tricky one. Give me a second to think.", EN, "Что сделал говорящий?", ["Попросил секунду подумать", "Отказался отвечать", "Попросил повторить вопрос"], "<b>A tricky one</b> = непростой вопрос. Это нормально говорить на собесе.", 0.9),
    L("c5", "To be honest, I haven't used that tool, but I learn fast.", GBV, "Что он сказал?", ["Не пользовался, но быстро учится", "Использует этот инструмент каждый день", "Не любит учиться"], "Честно + сильная сторона = лучший ответ на «а вы умеете?..».", 0.9),
    B("c6", "Я имею в виду, мне нравятся чёткие цели.", ["What", "I", "mean", "is,", "I", "like", "clear", "goals"], ["say", "want"], "What I mean is + [мысль]"),
    B("c7", "Честно говоря, я не уверен.", ["To", "be", "honest,", "I'm", "not", "sure"], ["am", "true"], "To be honest, + [мысль]"),
    S("c8", "That's a good question. Let me think for a second.", "Хороший вопрос. Дай секунду подумать.", EN),
    S("c9", "How can I put it… basically, I like solving messy problems.", "Как бы сказать… по сути, мне нравится решать запутанные задачи.", EN, "boost")
], SC("en.barriers.fillers.s1", "Неудобный вопрос", "😬", "Кандидат", "Interviewer", EN, {
    "n1": N("What would you say is your biggest weakness?", "Какая у тебя самая большая слабость?", [
        ch("That's a good question. Let me think… I sometimes take on too much at once.", "n2", 2, "Филлер + честный ответ. Идеально."),
        ch("I don't have weaknesses.", "n2", 0, "Звучит как неправда 😅 Лучше назвать реальную, но рабочую слабость."),
        ch("Ehm… ehm… I don't know.", "n1b", 0, "Бывает! Попробуй выиграть время фразой.")]),
    "n1b": N("Take your time.", "Не торопись.", [
        ch("Thanks. To be honest, I sometimes take on too much at once.", "n2", 2, "Вот! «To be honest» спасает.")]),
    "n2": N("Interesting. And how do you deal with that?", "Интересно. И как ты с этим справляешься?", [
        ch("Basically, I plan my day in short blocks and say no to extra tasks.", "n3", 2, "Конкретно и по делу 🔥"),
        ch("I try my best.", "n3", 1, "Ок, но добавь как именно.")]),
    "n3": N("Off the top of your head, how many projects can you handle at once?", "Навскидку, сколько проектов ты тянешь одновременно?", [
        ch("Off the top of my head, two or three, if priorities are clear.", "n4", 2, "Ты повторил их фразу — это высший пилотаж."),
        ch("Give me a second… I'd say two or three.", "n4", 2, "Отлично, спокойно и уверенно."),
        ch("Ten!", "n4", 0, "Звучит нереально. Лучше честные 2–3.")]),
    "n4": N("Great answers. Thank you!", "Отличные ответы. Спасибо!")
}))

about = T("en.interview.about", "en", "B1", "«Tell me about yourself»", "🙋", [
    W("I'm currently…", "сейчас я… (начало рассказа)", "I'm currently based in Spain."),
    W("I have a background in…", "у меня опыт / образование в…", "I have a background in customer support."),
    W("Over the past X years…", "за последние X лет…", "Over the past three years, I've worked with clients."),
    W("What I enjoy most is…", "больше всего мне нравится…", "What I enjoy most is solving problems."),
    W("Recently, I…", "недавно я…", "Recently, I built a small app."),
    W("hands-on experience", "практический опыт", "I have hands-on experience with Notion."),
    W("I'm looking for…", "я ищу…", "I'm looking for a remote role."),
    W("That's why…", "поэтому…", "That's why this role caught my eye.")
], [
    C("c1", "С чего лучше начать ответ «Tell me about yourself»?", ["Настоящее: кто ты сейчас", "Детство и школа", "Твоя зарплата"], "Формула: <b>настоящее → прошлое → будущее</b>. Всего 60–90 секунд."),
    C("c2", "Чем закончить рассказ о себе?", ["Почему тебе интересна эта роль", "Списком хобби", "«That's all»"], "Свяжи себя с вакансией: «That's why this role…»"),
    F("c3", "hands-on experience", "практический опыт"),
    L("c4", "So, walk me through your background.", EN, "О чём просят?", ["Рассказать о своём опыте", "Пройтись по офису", "Показать резюме на экране"], "<b>Walk me through</b> = расскажи по порядку. Это тот же «Tell me about yourself».", 0.9),
    L("c5", "What I enjoy most is turning messy processes into simple systems.", GBV, "Что ему нравится?", ["Превращать хаос в простые системы", "Работать в одиночку", "Писать длинные отчёты"], "<b>Messy</b> = запутанный. Отличная фраза для резюме.", 0.9),
    B("c6", "Сейчас я живу в Испании.", ["I'm", "currently", "based", "in", "Spain"], ["live", "on"], "I'm currently based in + [место]"),
    B("c7", "Я ищу удалённую роль.", ["I'm", "looking", "for", "a", "remote", "role"], ["searching", "at"], "I'm looking for + [что]"),
    S("c8", "I'm currently based in Spain, and I have a background in customer support.", "Сейчас я живу в Испании, у меня опыт в поддержке клиентов.", EN),
    S("c9", "Recently, I built a language-learning app on my own. That's why I'm excited about product roles.", "Недавно я сам сделал приложение для изучения языков. Поэтому мне интересны продуктовые роли.", EN, "boost")
], SC("en.interview.about.s1", "Первая минута собеса", "🎤", "Кандидат", "Recruiter", EN, {
    "n1": N("Hi, thanks for joining! So, tell me a bit about yourself.", "Привет, спасибо, что пришёл! Расскажи немного о себе.", [
        ch("Sure! I'm currently based in Spain, and I have a background in customer support.", "n2", 2, "Старт с настоящего. Чётко!"),
        ch("I was born in 1995 in a small town…", "n2", 0, "Слишком издалека 😅 Начни с того, кто ты сейчас."),
        ch("What do you want to know?", "n1b", 1, "Можно, но лучше сразу дать короткий рассказ.")]),
    "n1b": N("Just a quick overview: where you are now and what you're looking for.", "Просто коротко: где ты сейчас и что ищешь.", [
        ch("Got it. I'm currently based in Spain, with a background in customer support.", "n2", 2, "Вот! «Got it» = понял.")]),
    "n2": N("Nice. What have you been working on recently?", "Здорово. Над чем ты работал в последнее время?", [
        ch("Recently, I built a Telegram app for learning languages, using no-code and AI tools.", "n3", 2, "Конкретный проект — это сильно 🔥"),
        ch("Nothing special.", "n3", 0, "Не принижай себя! Расскажи про свой проект."),
        ch("To be honest, I've been learning a lot on my own: English, Spanish and some product tools.", "n3", 2, "Честно и с ростом. Хорошо.")]),
    "n3": N("Interesting! And what are you looking for in your next role?", "Интересно! А что ты ищешь в следующей работе?", [
        ch("I'm looking for a remote role where I can solve user problems. That's why this position caught my eye.", "n4", 2, "Идеальная концовка: будущее + связь с вакансией."),
        ch("Money.", "n4", 0, "Честно, но 😅 Лучше про задачи и рост."),
        ch("A stable job with a good team.", "n4", 1, "Нормально. Добавь, почему именно эта роль.")]),
    "n4": N("That sounds great. Let's talk about the role!", "Звучит отлично. Давай поговорим о роли!")
}))

TOPICS = [
    (hello, "topics/es/survive/hello.json"), (numbers, "topics/es/survive/numbers.json"),
    (super_, "topics/es/survive/super.json"), (cafe, "topics/es/survive/cafe.json"),
    (transport, "topics/es/survive/transport.json"),
    (fillers, "topics/en/barriers/fillers.json"), (about, "topics/en/interview/about.json")
]
for t, path in TOPICS:
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    json.dump(t, open(full, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

cp = os.path.join(BASE, "catalog.json")
cat = json.load(open(cp, encoding="utf-8"))
fix = dict((t["id"], p) for t, p in TOPICS)
for tr in cat["tracks"]:
    for b in tr["blocks"]:
        for tp in b["topics"]:
            if tp["id"] in fix:
                tp["status"] = "ready"; tp["file"] = fix[tp["id"]]
json.dump(cat, open(cp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("written", len(TOPICS))
