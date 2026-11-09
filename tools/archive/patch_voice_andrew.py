p = "/data/lr34/generate_audio.py"
s = open(p, encoding="utf-8").read()
a = 'VOICES = {"es": "es-ES-ElviraNeural", "en": "en-US-AriaNeural"}'
b = ('VOICES = {"es": "es-ES-ElviraNeural", "en": "en-US-AndrewNeural"}\n'
     '# Голоса, которыми озвучены старые файлы (имя = sha1(key)). Для любого другого голоса\n'
     '# имя = sha1(key|voice), поэтому смена голоса = автоматическая переозвучка этого языка.\n'
     '# Пока новый mp3 не сгенерирован, в manifest остаётся старый файл (фолбэк).\n'
     'LEGACY_VOICES = {"es": "es-ES-ElviraNeural", "en": "en-US-AriaNeural"}')
assert a in s; s = s.replace(a, b, 1)
a2 = 'rel = lg + "/" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12] + ".mp3"'
b2 = ('hk = key if VOICES[lg] == LEGACY_VOICES.get(lg) else key + "|" + VOICES[lg]\n'
      '        rel = lg + "/" + hashlib.sha1(hk.encode("utf-8")).hexdigest()[:12] + ".mp3"')
assert a2 in s; s = s.replace(a2, b2, 1)
s = s.replace("# rev 3.7: full neural audio for all ready topics", "# rev 3.8: EN voice -> en-US-AndrewNeural (full EN re-voice)")
open(p, "w", encoding="utf-8").write(s)
print("ok")
