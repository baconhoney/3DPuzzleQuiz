import asyncio
import random
import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))

import quizDBManager
import utils


num_teams: int = random.randint(30, 40)
buildingData = asyncio.run(quizDBManager.getAllBuildingData())
correctAnswers: dict[int, int] = {e["id"]: e["answer"] for e in buildingData}
for i in range(num_teams):
    name = f"Team_{i+1}"
    lang = random.choice(["en"] + ["hu"] * 3)
    isDigital = random.random() < 0.75
    team_id = utils.getNewTeamID(isDigital and utils.QuizTypes.DIGITAL or utils.QuizTypes.PAPER)
    size = 20

    if isDigital:
        questions = asyncio.run(quizDBManager.getQuestions(lang, size))
        if len(questions) != 20:
            print(f"⚠️ Team {name}: Expected 20 questions but got {len(questions)}")
            continue

        answers = []
        for q in questions:
            correct = random.random() < 0.5
            answer_val = correctAnswers[q["id"]]
            answer = answer_val if correct else random.randint(1, 100)
            answers.append({"id": q["id"], "answer": answer})

        asyncio.run(quizDBManager.uploadAnswers(mode="digital-uploadFull", teamID=team_id, name=name, lang=lang, answers=answers))
        print(f"✅ Uploaded digital data for {name} (ID: {team_id}, lang: {lang})")
    else:
        asyncio.run(quizDBManager.addEmptyTeamEntry(team_id, lang, size))
        asyncio.run(quizDBManager.updateSubmittedAt(team_id))
        asyncio.run(asyncio.sleep(random.randint(1, 5)))
        print(f"✅ Uploaded paper data for ID: {team_id}, lang: {lang}")

