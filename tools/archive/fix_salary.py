# Bring en.interview.salary to the 8 cheat + 9 cards standard
import json
from lbgen import W, L, B, EN
p = "content/topics/en/interview/salary.json"
t = json.load(open(p, encoding="utf-8"))
terms = [w["term"] for w in t["cheatsheet"]]
for w in [W("base salary", "оклад", "The base salary is 30k a year."),
          W("benefits", "соцпакет и бонусы", "What benefits do you offer?")]:
    if w["term"] not in terms: t["cheatsheet"].append(w)
ids = [c["id"] for c in t["cards"]]
for c in [L("c8", "The base salary is thirty thousand, and we also offer private health insurance.", EN,
            "Что входит в предложение?", ["30k + медстраховка", "13k + медстраховка", "30k + бонус за результат"],
            "<b>Health insurance</b> = медстраховка. <b>THIR-ty</b> (30) vs <b>thir-TEEN</b> (13) — слушай ударение."),
          B("c9", "Какой соцпакет вы предлагаете?", ["What", "benefits", "do", "you", "offer?"], ["give", "does"], "What + [что] + do you offer?")]:
    if c["id"] not in ids: t["cards"].append(c)
json.dump(t, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("salary:", len(t["cheatsheet"]), "cheat,", len(t["cards"]), "cards")
