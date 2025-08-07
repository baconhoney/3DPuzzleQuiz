import random
import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))

import quizDBManager
import utils


def generate_test_data(num_teams=None):
    num_teams: int = num_teams or random.randint(10, 40)
    buildingData = quizDBManager.getAllBuildingData()
    correctAnswers: dict[int, int] = {e["id"]: e["answer"] for e in buildingData}
    for i in range(num_teams):
        team_id = utils.getNewTeamID(utils.QuizTypes.DIGITAL)
        name = f"Team_{i+1}"
        lang = random.choice(["en"] + ["hu"] * 3)
        size = 20

        try:
            # Get 20 questions
            questions = quizDBManager.getQuestions(lang, size)
            if len(questions) != 20:
                print(f"⚠️ Team {name}: Expected 20 questions but got {len(questions)}")
                continue

            # Create answers with ~50% correct
            answers = []
            for q in questions:
                correct = random.random() < 0.5
                answer_val = correctAnswers[q["id"]]  # Assume correct answer stored externally
                answer = answer_val if correct else random.randint(1, 100)
                answers.append({"id": q["id"], "answer": answer})

            # Upload to DB
            quizDBManager.uploadAnswers(mode="digital-uploadFull", teamID=team_id, name=name, lang=lang, answers=answers)
            print(f"✅ Uploaded data for {name} (ID: {team_id}, lang: {lang})")

        except Exception as e:
            print(f"❌ Error with team {name} (ID: {team_id}): {e}")


# Run the generator
generate_test_data()

