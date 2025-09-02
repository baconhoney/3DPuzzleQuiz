from datetime import datetime
import json
import pathlib
import random
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./../modules").resolve()))

import utils

# Load source JSON
with open("./masterList.json", "r", encoding="utf-8") as f:
    master_data = json.load(f)

num_teams: int = random.randint(10, 40)
buildingData: list[dict[str, str | int]] = master_data["entries"]
correctAnswers: dict[int, int] = {e["id"]: e["answer"] for e in buildingData}

questions = random.sample(buildingData, 20)

quizData = {}

for i in range(num_teams):
    isDigital = random.random() < 0.75
    lang = random.choice(["en"] + ["hu"] * 3)
    name = f"Team {random.choice(['Hello', 'Alpha', 'Beta', 'Zeta', 'Rockets', 'Null', 'Testing', 'LongNameLoremIpsum'])} #{i+1}"
    team_id = utils.getNewTeamID(isDigital and utils.QuizTypes.DIGITAL or utils.QuizTypes.PAPER)

    q = []
    score = None
    for entry in questions:
        q.append(
            {
                "id": entry["id"],
                "name": entry["name_en"] if lang == "en" else entry["name_hu"],
                "location": entry["location_en"] if lang == "en" else entry["location_hu"],
                "answer": None,
                "correct": None
            }
        )
    # if quiz is digital -> add answer and correct field, and calculate score
    if isDigital:
        score = 0
        for entry in q:
            correct_answer = correctAnswers[entry["id"]]
            user_answer = correct_answer if random.random() < 0.5 else random.randint(1, 100)
            is_correct = user_answer == correct_answer
            if is_correct:
                score += 1
            entry["answer"] = user_answer
            entry["correct"] = is_correct

    # Add to output list
    quizData[str(team_id)] = {"name": name, "language": lang, "score": score, "timestamp": datetime.now().isoformat() if not (not isDigital and random.random() < 0.1) else None, "questions": q}

with open("real_testdata.json", "w", encoding="utf-8") as f:
    json.dump(quizData, f, indent=4, ensure_ascii=False)

