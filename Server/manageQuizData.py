import json, pathlib, sys, datetime
import QuizDB


cwd = pathlib.Path(__file__).parent.resolve()
dataRoot = cwd / "data"
quizRoot = cwd / "Teszt"
quizDB = QuizDB.QuizDB(dataRoot)

csvHeaders = {
    "Név": "name_hu",
    "Ország": "country_hu",
    "Város": "city_hu",
    "Angol Név": "name_en",
    "Angol Ország": "country_en",
    "Angol Város": "city_en",
    "id": "uid",
    "Doboz": "box",
    "Szám": "answer",
}
jsonHeaders = ["uid", "box", "answer", "name_hu", "name_en", "country_hu", "country_en", "city_hu", "city_en"]


def JSON_to_Database():
    with open(quizRoot / "masterList.json", "r", encoding="utf-8") as f:
        rawQuizData: dict[str, list[dict[str, str | int]]] = json.load(f)
    if dt := rawQuizData.get("lastEdited"):
        print(f"Master list last edited: {dt}")
    quizData = rawQuizData.get("entries")
    if not quizData:
        raise ValueError(f"Failed to load masterList.json: {rawQuizData}")
    quizDB.cursor.execute("DELETE FROM questions;")
    quizDB.cursor.executemany(
        "INSERT INTO questions (uid, box, answer, name_hu, name_en, country_hu, country_en, city_hu, city_en) \
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                entry["uid"],
                entry["box"],
                entry["answer"],
                entry["name_hu"],
                entry["name_en"],
                entry["country_hu"],
                entry["country_en"],
                entry["city_hu"],
                entry["city_en"],
            )
            for entry in quizData
        ],
    )
    quizDB.connection.commit()
    print(f"Loaded {quizDB.cursor.rowcount} entries into the database")


def Database_to_JSON():
    quizDB.cursor.execute(f"SELECT {', '.join(jsonHeaders)} FROM questions;")
    data = [dict(zip(jsonHeaders, row)) for row in quizDB.cursor.fetchall()]
    jsonData = {"lastEdited": datetime.datetime.now().isoformat(timespec="milliseconds"), "entries": data}
    with open(quizRoot / "masterList.json", "w", encoding="utf-8") as f:
        json.dump(jsonData, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(data)} entries to masterList.json")


def JSON_to_CSV():
    with open(quizRoot / "masterList.json", "r", encoding="utf-8") as f:
        rawQuizData: dict[str, list[dict[str, str | int]]] = json.load(f)
    quizData = rawQuizData.get("entries")
    if not quizData:
        raise ValueError(f"Failed to load masterList.json: {rawQuizData}")
    with open(cwd / "Teszt/MesterLista.txt", "w", encoding="utf-16") as f:
        f.write("\t".join(csvHeaders.keys()) + "\n")
        for entry in quizData:
            f.write("\t".join(str(entry[v]) for v in csvHeaders.values()) + "\n")
    print(f"Saved {len(quizData)} entries to MesterLista.txt")


def CSV_to_JSON():
    with open(quizRoot / "MesterLista.txt", "r", encoding="utf-16") as f:
        fileLines = [line.strip().split("\t") for line in f]
    header = fileLines[0]
    lines = fileLines[1:]
    if header != list(csvHeaders.keys()):
        raise ValueError(f"CSV header mismatch: {header} != {csvHeaders}")
    data = [{v: line[i] for i, v in enumerate(csvHeaders.values())} for line in lines]
    jsonData = {
        "lastEdited": datetime.datetime.now().isoformat(timespec="milliseconds"),
        "entries": [{k: (int(line[k]) if k in ["uid", "box", "answer"] else line[k]) for k in jsonHeaders} for line in data],
    }
    with open(cwd / "Teszt" / "masterList.json", "w", encoding="utf-8") as f:
        json.dump(jsonData, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(data)} entries to masterList.json")


# ------- MAIN -------
def main():
    arg = len(sys.argv) > 1 and sys.argv[1] or ""
    if arg == "j2d":
        print("Converting JSON to database...")
        JSON_to_Database()
    elif arg == "d2j":
        print("Converting database to JSON...")
        Database_to_JSON()
    elif arg == "j2c":
        print("Converting JSON to CSV...")
        JSON_to_CSV()
    elif arg == "c2j":
        print("Converting CSV to JSON...")
        CSV_to_JSON()
    elif arg == "c2j2d":
        print("Converting CSV to JSON and then to database...")
        CSV_to_JSON()
        JSON_to_Database()
    elif arg == "d2j2c":
        print("Converting database to JSON and then to CSV...")
        Database_to_JSON()
        JSON_to_CSV()
    else:
        print("Usage: manageQuizDB.py [j2d | d2j | j2c | c2j | c2j2d | d2j2c]")


if __name__ == "__main__":
    main()
