"""Проверка всего контента одной командой:  python content/validate.py
Запускай после каждой новой темы. Зелёный = можно заливать.
"""
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from models import Catalog, GameConfig, SurpriseBox, Topic

ROOT = Path(__file__).parent
errors: list[str] = []
warnings: list[str] = []


def load(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def check(label: str, fn):
    try:
        return fn()
    except (ValidationError, ValueError, FileNotFoundError, json.JSONDecodeError) as e:
        errors.append(f"{label}: {e}")
        return None


catalog = check("catalog.json", lambda: Catalog.model_validate(load("catalog.json")))
check("surprise.json", lambda: SurpriseBox.model_validate(load("surprise.json")))
check("config.json", lambda: GameConfig.model_validate(load("config.json")))

total = ready = 0
if catalog:
    seen: set[str] = set()
    for track in catalog.tracks:
        for block in track.blocks:
            for ref in block.topics:
                total += 1
                if ref.id in seen:
                    errors.append(f"повтор id темы: {ref.id}")
                seen.add(ref.id)
                if ref.status != "ready":
                    continue
                if not ref.file:
                    errors.append(f"{ref.id}: status=ready, но нет file")
                    continue
                topic = check(ref.file, lambda r=ref: Topic.model_validate(load(r.file)))
                if not topic:
                    continue
                ready += 1
                if topic.id != ref.id or topic.track != track.id:
                    errors.append(f"{ref.file}: id/track не совпадают с catalog.json")
                if topic.low_energy_count < 3:
                    warnings.append(
                        f"{ref.id}: карточек energy=low {topic.low_energy_count}/3 "
                        "(режим «Нет сил» доберёт из других тем)"
                    )

for w in warnings:
    print("⚠️ ", w)
for e in errors:
    print("❌", e)
if errors:
    sys.exit(1)
print(f"✅ Всё ок: тем в каталоге {total}, готово {ready}, в плане {total - ready}")
