import json
import random
from datetime import datetime

# Load source JSON
with open("./masterList.json", "r", encoding="utf-8") as f:
    master_data = json.load(f)

entries = master_data["entries"]

# Ensure at least 20 entries available
if len(entries) < 20:
    raise ValueError("Not enough entries in masterList.json. Need at least 20.")

# Define 27 unique teams
team_names = [v + f" {i+1}" for i, v in enumerate(["Team Hello", "Team Alpha", "Team Beta", "Team Zeta", "Team Rockets", "Team Null", "Team Testing"] * 3)]
languages = ["en", "hu"]

JSONQuizData = {}

for i, name in enumerate(team_names):
    team_id = random.randint(int(5e9), int(1e10 - 1))
    language = random.choice(languages)
    timestamp = datetime.now().isoformat()

    selected_questions = random.sample(entries, 20)
    questions = []
    score = 0

    for entry in selected_questions:
        correct_answer = entry["answer"]
        user_answer = correct_answer if random.random() > 0.5 else random.randint(1, 100)  # 75% correct

        is_correct = user_answer == correct_answer
        if is_correct:
            score += 1

        question = {
            "name": entry["name_en"] if language == "en" else entry["name_hu"],
            "location": entry["location_en"] if language == "en" else entry["location_hu"],
            "answer": user_answer,
            "correct": is_correct,
        }

        questions.append(question)

    # Add to JSONQuizDetails
    JSONQuizData[str(team_id)] = {"name": name, "language": language, "score": score, "timestamp": timestamp, "questions": questions}

# Save to file
with open("real_testdata.json", "w", encoding="utf-8") as f:
    json.dump(JSONQuizData, f, indent=4, ensure_ascii=False)

print("✅ quiz_output.json has been created with 27 quiz results.")
