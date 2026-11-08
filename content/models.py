"""Lingo Brain ADHD: модели контента (pydantic v2).

Новая тема = 1 JSON-файл в content/topics/... + 1 строка в catalog.json.
Интерфейс не трогаем: приложение рисует экран по полю `type` карточки.
"""
from __future__ import annotations

from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field, model_validator

Lang = Literal["es-ES", "es-MX", "en-US", "en-GB"]
Energy = Literal["low", "normal", "boost"]  # low = годится для режима «Нет сил»
Level = Literal["A0", "A1", "A2", "B1", "B2", "C1"]
TrackId = Literal["es", "en"]


class Base(BaseModel):
    model_config = {"extra": "forbid"}  # опечатка в ключе = ошибка, а не тихий баг


def _check_answer(card_id: str, answer: int, options: list[str]) -> None:
    if not 0 <= answer < len(options):
        raise ValueError(f"{card_id}: answer={answer}, а вариантов {len(options)}")


# ---------- Шпаргалка за 30 сек ----------
class CheatItem(Base):
    term: str
    tr: str
    ex: Optional[str] = None


# ---------- Карточки ----------
class CardBase(Base):
    id: str
    energy: Energy = "normal"


class ChoiceCard(CardBase):
    """Выбор 1 из 2–4."""
    type: Literal["choice"]
    q: str
    options: list[str] = Field(min_length=2, max_length=4)
    answer: int
    explain: Optional[str] = None

    @model_validator(mode="after")
    def _ok(self):
        _check_answer(self.id, self.answer, self.options)
        return self


class FlashCard(CardBase):
    """Карточка-переворот: тап, и видишь перевод."""
    type: Literal["flash"]
    front: str
    back: str


class Audio(Base):
    text: str
    lang: Lang  # акцент: es-ES / es-MX / en-US / en-GB
    rate: float = Field(1.0, ge=0.5, le=1.5)  # темп: 0.8 = медленно
    url: Optional[str] = None  # готовый mp3; если нет, озвучит TTS в браузере


class ListenCard(CardBase):
    """Аудио-тренажёр уха."""
    type: Literal["listen"]
    audio: Audio
    q: str
    options: list[str] = Field(min_length=2, max_length=4)
    answer: int

    @model_validator(mode="after")
    def _ok(self):
        _check_answer(self.id, self.answer, self.options)
        return self


class BuildCard(CardBase):
    """Конструктор конструкций: собери фразу из плашек."""
    type: Literal["build"]
    prompt: str  # что сказать (по-русски)
    tokens: list[str] = Field(min_length=2)  # правильный порядок
    distractors: list[str] = []  # лишние плашки
    pattern: Optional[str] = None  # подсказка-шаблон, без грамматики


class SpeakCard(CardBase):
    """Зажми и скажи вслух."""
    type: Literal["speak"]
    text: str
    tr: str
    lang: Lang


Card = Annotated[
    Union[ChoiceCard, FlashCard, ListenCard, BuildCard, SpeakCard],
    Field(discriminator="type"),
]


# ---------- Сценарии (диалог-граф, работает без ИИ) ----------
class Choice(Base):
    text: str
    next: str
    score: int = Field(1, ge=0, le=2)  # 0 = неудачно, 1 = ок, 2 = идеально
    feedback: Optional[str] = None


class Node(Base):
    say: str
    tr: Optional[str] = None
    end: bool = False
    choices: list[Choice] = []


class AiMode(Base):
    """Фаза 2: свободный диалог с ИИ (Ollama/Groq) по тем же целям."""
    enabled: bool = False
    persona: str
    goals: list[str]
    maxTurns: int = 8


class Scenario(Base):
    id: str
    title: str
    emoji: str = "🎭"
    userRole: str
    botRole: str
    voice: Lang
    start: str
    nodes: dict[str, Node]
    ai: Optional[AiMode] = None

    @model_validator(mode="after")
    def _graph(self):
        if self.start not in self.nodes:
            raise ValueError(f"{self.id}: start '{self.start}' не найден")
        for nid, n in self.nodes.items():
            if not n.end and not n.choices:
                raise ValueError(f"{self.id}.{nid}: тупик (нет choices и end=false)")
            for c in n.choices:
                if c.next not in self.nodes:
                    raise ValueError(f"{self.id}.{nid}: next '{c.next}' не найден")
        seen, stack = set(), [self.start]
        while stack:
            nid = stack.pop()
            if nid in seen:
                continue
            seen.add(nid)
            stack.extend(c.next for c in self.nodes[nid].choices)
        if not any(self.nodes[n].end for n in seen):
            raise ValueError(f"{self.id}: от start не дойти до финала")
        return self


# ---------- Тема ----------
class Topic(Base):
    id: str
    track: TrackId
    level: Level
    title: str
    emoji: str
    estMinutes: int = 2
    cheatsheet: list[CheatItem] = []
    cards: list[Card] = Field(min_length=1)
    scenarios: list[Scenario] = []

    @model_validator(mode="after")
    def _ids(self):
        ids = [c.id for c in self.cards]
        dup = {i for i in ids if ids.count(i) > 1}
        if dup:
            raise ValueError(f"{self.id}: повтор id карточек {dup}")
        return self

    @property
    def low_energy_count(self) -> int:
        return sum(1 for c in self.cards if c.energy == "low")


# ---------- Каталог ----------
class TopicRef(Base):
    id: str
    title: str
    emoji: str
    level: Level
    tags: list[str] = []
    status: Literal["ready", "planned", "hidden"] = "planned"
    file: Optional[str] = None  # путь от папки content/


class Block(Base):
    id: str
    title: str
    emoji: str
    order: int
    levelRange: str
    topics: list[TopicRef]


class Voice(Base):
    lang: Lang
    label: str


class Voices(Base):
    default: Lang
    variants: list[Voice]


class Track(Base):
    id: TrackId
    title: str
    subtitle: str
    color: str
    levels: list[Level]
    voices: Voices
    blocks: list[Block]


class Catalog(Base):
    schemaVersion: int
    appUrl: str
    tracks: list[Track]


# ---------- Surprise Box ----------
class SurpriseItem(Base):
    id: str
    track: TrackId
    type: Literal["fact", "meme", "question", "challenge"]
    text: Optional[str] = None
    q: Optional[str] = None
    options: Optional[list[str]] = None
    answer: Optional[int] = None
    explain: Optional[str] = None

    @model_validator(mode="after")
    def _shape(self):
        if self.type == "question":
            if not (self.q and self.options and self.answer is not None):
                raise ValueError(f"{self.id}: для question нужны q, options, answer")
            _check_answer(self.id, self.answer, self.options)
        elif not self.text:
            raise ValueError(f"{self.id}: для {self.type} нужен text")
        return self


class SurpriseBox(Base):
    items: list[SurpriseItem]


# ---------- Игровые настройки ----------
class EnergyMode(Base):
    label: str
    seconds: int
    cards: int
    cardEnergy: list[Energy]
    countsForStreak: bool = True
    xpMultiplier: float = 1.0


class StreakFreeze(Base):
    costXp: int
    maxStored: int
    autoApply: bool = True
    message: str


class GameConfig(Base):
    energyModes: dict[Energy, EnergyMode]
    xp: dict[str, int]
    streakFreeze: StreakFreeze
    surpriseBox: dict[str, int]
    dailyGoal: dict[str, int]
