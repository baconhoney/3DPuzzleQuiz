import asyncio
import random
import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))

import quizDBManager
import utils

buildingData = asyncio.run(quizDBManager.getAllBuildingData())
correctAnswers: dict[int, int] = {e["id"]: e["answer"] for e in buildingData}
for quizRound in [1, 2, 3, 5, 6, 8]:
    asyncio.run(utils.QuizState.updateState(newQuizRound=quizRound))
    num_teams = random.randint(10, 20)
    for i in range(num_teams):
        name = f"Team_{i+1 + quizRound * 20}"
        lang = random.choice(["en"] + ["hu"] * 3)
        isDigital = random.random() < 0.75
        team_id = utils.getNewTeamID(isDigital and utils.QuizTypes.DIGITAL or utils.QuizTypes.PAPER)
        size = random.random() < 0.15 and 100 or 20

        if isDigital:
            questions = asyncio.run(quizDBManager.getQuestions(lang, size))
            answers = []
            for q in questions:
                correct = random.random() < 0.5
                answer_val = correctAnswers[q["id"]]
                answer = answer_val if correct else random.randint(1, 100)
                answers.append({"id": q["id"], "answer": answer})

            asyncio.run(quizDBManager.uploadAnswers(mode="digital-uploadFull", teamID=team_id, name=name, lang=lang, answers=answers))
            print(f"✅ Uploaded digital data for {name} (ID: {team_id}, lang: {lang}, size: {size})")
        else:
            asyncio.run(quizDBManager.addEmptyTeamEntry(team_id, lang, size))
            if random.random() < 0.75: asyncio.run(quizDBManager.updateSubmittedAt(team_id))
            print(f"✅ Uploaded paper data for ID: {team_id}, lang: {lang}, size: {size}")
    asyncio.run(asyncio.sleep(random.randint(3, 5)))
