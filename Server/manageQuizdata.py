import datetime
import json
import pathlib
import random
import sys

sys.path.insert(1, str(pathlib.Path("./modules").resolve()))
import quizDB as quizDB

cwd = pathlib.Path(__file__).parent.resolve()
DBRoot = cwd / "data"
masterRoot = cwd / "masterdata"
quizDB = quizDB.QuizDB(DBRoot)


csvHeaders = {
    "Magyar Név": "name_hu",
    "Angol Név": "name_en",
    "Magyar Lokáció": "location_hu",
    "Angol Lokáció": "location_en",
    "Tipus": "type",
    "id": "id",
    "Doboz": "box",
    "Szám": "answer",
}

jsonHeaders = ["id", "box", "answer", "name_hu", "name_en", "location_hu", "location_en", "type"]


def JSON_to_DB():
    with open(masterRoot / "masterList.json", "r", encoding="utf-8") as f:
        rawQuizData: dict[str, list[dict[str, str | int]]] = json.load(f)
    if dt := rawQuizData.get("lastEdited"):
        print(f"Master list last edited: {dt}")
    quizData = rawQuizData.get("entries")
    if not quizData:
        raise ValueError(f"Failed to load masterList.json: {rawQuizData}")
    quizDB.cursor.execute("DELETE FROM buildings;")
    quizDB.cursor.executemany(
        f"INSERT INTO buildings ({', '.join(jsonHeaders)}) \
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [tuple(entry[k] for k in jsonHeaders) for entry in quizData],
    )
    quizDB.connection.commit()
    print(f"Loaded {quizDB.cursor.rowcount} entries into the database")


def DB_to_JSON():
    quizDB.cursor.execute(f"SELECT {', '.join(jsonHeaders)} FROM buildings;")
    data = [dict(zip(jsonHeaders, row)) for row in quizDB.cursor.fetchall()]
    jsonData = {"lastEdited": datetime.datetime.now().isoformat(timespec="milliseconds"), "entries": data}
    with open(masterRoot / "masterList.json", "w", encoding="utf-8") as f:
        json.dump(jsonData, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(data)} entries to masterList.json")


def JSON_to_XLSX():
    with open(masterRoot / "masterList.json", "r", encoding="utf-8") as f:
        rawQuizData: dict[str, list[dict[str, str | int]]] = json.load(f)
    if dt := rawQuizData.get("lastEdited"):
        print(f"Master list last edited: {dt}")
    quizData = rawQuizData.get("entries")
    if not quizData:
        raise ValueError(f"Failed to load masterList.json: {rawQuizData}")
    with open(masterRoot / "MesterLista.txt", "w", encoding="utf-16") as f:
        f.write("\t".join(csvHeaders.keys()) + "\n")
        for entry in quizData:
            f.write("\t".join(str(entry[v]) for v in csvHeaders.values()) + "\n")
    print(f"Saved {len(quizData)} entries to MesterLista.txt")


def XLSX_to_JSON():
    def format(key: str, value: str) -> str | int | None:
        if key in ["id", "box", "answer"]:
            if value == "None":
                return None
            return int(value)
        else:
            return value

    with open(masterRoot / "MesterLista.txt", "r", encoding="utf-16") as f:
        fileLines = [line.strip().split("\t") for line in f]
    header = fileLines[0]
    lines = fileLines[1:]
    if header != list(csvHeaders.keys()):
        raise ValueError(f"CSV header mismatch: {header} != {csvHeaders}")
    data = [{v: line[i] for i, v in enumerate(csvHeaders.values())} for line in lines]
    jsonData = {
        "lastEdited": datetime.datetime.now().isoformat(timespec="milliseconds"),
        "entries": [{k: format(k, line[k]) for k in jsonHeaders} for line in data],
    }
    with open(masterRoot / "masterList.json", "w", encoding="utf-8") as f:
        json.dump(jsonData, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(data)} entries to masterList.json")


def regenerateQuizzes(quizCount: int = 8, questionsCount: int = 20):
    res = quizDB.cursor.execute("SELECT id FROM buildings;").fetchall()
    availableBuildings = [row[0] for row in res]
    if len(availableBuildings) < questionsCount:
        raise RuntimeError(f"Too few questions in the database ({len(availableBuildings)}) to generate {questionsCount} questions")
    quizzes = [random.sample(availableBuildings, questionsCount) for _ in range(quizCount)]
    quizDB.cursor.execute("DELETE FROM quizzes;")
    quizDB.cursor.executemany("INSERT INTO quizzes (quiz_number, building_id) VALUES (?, ?);", [(-1, b) for b in availableBuildings])
    print(f"Generated the 'SIZE_100' quiz with {quizDB.cursor.rowcount} questions")
    for quizNum, quiz in enumerate(quizzes):
        quizDB.cursor.executemany("INSERT INTO quizzes (quiz_number, building_id) VALUES (?, ?);", [(quizNum + 1, b) for b in quiz])
    print(f"Generated {quizCount} quizzes with {quizDB.cursor.rowcount} questions each (taken from the last quiz)")
    quizDB.connection.commit()


# ------- MAIN -------
def main(arg: str = ""):
    if arg == "j2d":
        print("Converting JSON to database...")
        JSON_to_DB()
    elif arg == "d2j":
        print("Converting database to JSON...")
        DB_to_JSON()
    elif arg == "j2x":
        print("Converting JSON to XLSX...")
        JSON_to_XLSX()
    elif arg == "x2j":
        print("Converting XLSX to JSON...")
        XLSX_to_JSON()
    elif arg == "x2j2d":
        print("Converting XLSX to JSON and then to database...")
        XLSX_to_JSON()
        JSON_to_DB()
    elif arg == "d2j2x":
        print("Converting database to JSON and then to XLSX...")
        DB_to_JSON()
        JSON_to_XLSX()
    elif arg == "regen":
        print("WARNING: Automatically generating quizzes, uncomment line to enable asking")
        # if input("Are you sure to regenerate all quizzes? (YES/NO) > ") == "YES":
        if True:
            quizCount = len(sys.argv) > 2 and int(sys.argv[2]) or 8
            questionCount = len(sys.argv) > 3 and int(sys.argv[3]) or 20
            print(f"Regenerating quizzes with {quizCount} quizzes and {questionCount} questions...")
            regenerateQuizzes(quizCount, questionCount)
    else:
        # print help
        print(
            "\n".join(
                [
                    "\nUsage: python manageQuizdata.py <task>",
                    "",
                    "<task> =",
                    "- c2j: Convert CSV to JSON",
                    "- j2d: Convert JSON to database",
                    "- d2j: Convert database to JSON",
                    "- j2c: Convert JSON to CSV",
                    "- c2j2d: Convert CSV to JSON and then to database",
                    "- d2j2c: Convert database to JSON and then to CSV",
                    "- regen [quizCount] [questionsCount]: Regenerate quizzes",
                ]
            )
        )


if __name__ == "__main__":
    main(len(sys.argv) > 1 and sys.argv[1] or "")
