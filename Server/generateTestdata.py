import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))

import asyncio
import quizDBManager
import random
import utils


names = {
    "en": [
        "Iron Titans",
        "Shadow Wolves",
        "Stormbreakers",
        "Crimson Vipers",
        "Steel Hawks",
        "Phantom Raiders",
        "Thunderstrike",
        "Venom Fangs",
        "Blaze Warriors",
        "Frost Giants",
        "Inferno Blades",
        "Savage Rhinos",
        "Night Howlers",
        "Stone Crushers",
        "Rogue Lions",
        "Ghost Legion",
        "Blood Ravens",
        "Skybreakers",
        "Ashen Serpents",
        "Wild Reapers",
        "Eternal Flames",
        "Ironclad Beasts",
        "Bone Crushers",
        "Tempest Riders",
        "Dark Sabres",
        "Obsidian Wolves",
        "Stormborn",
        "Deathstalkers",
        "Titanfall",
        "Razor Fangs",
    ],
    "hu": [
        "Vas Farkasok",
        "Árnyék Harcosok",
        "Vihartörők",
        "Vörös Kígyók",
        "Acél Sólymok",
        "Kísértet Lovagok",
        "Mennydörgők",
        "Méregfogak",
        "Lángharcosok",
        "Jégóriások",
        "Pokoltüzek",
        "Vad Orrszarvúk",
        "Éjjeli Üvöltők",
        "Kőzúzók",
        "Lázadó Oroszlánok",
        "Szellem Légió",
        "Vérhollók",
        "Égbolttörők",
        "Hamvak Kígyói",
        "Vad Aratók",
        "Örök Lángok",
        "Páncélvadak",
        "Csontzúzók",
        "Viharlovasok",
        "Sötét Kardok",
        "Obszidián Farkasok",
        "Viharszülöttek",
        "Halálvadászok",
        "Titánok Földje",
        "Pengésfogak",
    ],
}


buildingData = asyncio.run(quizDBManager.getAllBuildingData())
correctAnswers = {e["id"]: e["answer"] for e in buildingData}
for quizRound in [1, 2, 3, 5, 6, 8]:
    asyncio.run(utils.QuizState.updateState(newQuizRound=quizRound))
    num_teams = random.randint(10, 20)
    for i in range(num_teams):
        lang = random.choice(["en"] + ["hu"] * 3)
        name = random.choice(names[lang])
        isDigital = random.random() < 0.75
        team_id, codeword = utils.getNewTeamID(isDigital and utils.QuizTypes.DIGITAL or utils.QuizTypes.PAPER, lang, name)
        size = random.random() < 0.15 and 100 or 20

        if isDigital:
            questions = asyncio.run(quizDBManager.getQuestions(lang, size))
            assert len(questions) == size
            answers = []
            for q in questions:
                correct = random.random() < 0.5
                answer_val = correctAnswers[q["id"]]
                answer = answer_val if correct else random.randint(1, 100)
                answers.append({"id": q["id"], "answer": answer})

            asyncio.run(quizDBManager.uploadAnswers(mode="digital-uploadFull", teamID=team_id, name=name, codeword=codeword, lang=lang, answers=answers))
            print(f"✅ Uploaded digital data for {name} (ID: {team_id}, lang: {lang}, size: {size})")
        else:
            asyncio.run(quizDBManager.addEmptyTeamEntry(team_id, lang, size))
            if random.random() < 0.67:
                asyncio.run(quizDBManager.updateSubmittedAt(team_id))
            print(f"✅ Uploaded paper data for ID: {team_id}, lang: {lang}, size: {size}")
    asyncio.run(asyncio.sleep(random.randint(3, 5)))
