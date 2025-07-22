import sqlite3
from os import makedirs
from pathlib import Path

__all__ = ["QuizDB"]

questionsSQL = """
    CREATE TABLE questions
    (
        building_id INTEGER PRIMARY KEY,
        box         INTEGER,
        answer      INTEGER,
        name_hu     TEXT,
        name_en     TEXT,
        country_hu  TEXT,
        country_en  TEXT,
        city_hu     TEXT,
        city_en     TEXT
    ) STRICT;
"""

quizzesSQL = """
    CREATE TABLE quizzes
    (
        size         INTEGER, -- Size of the test
        question_ids TEXT     -- Store as JSON-encoded array [<questions.ROWID>, ...]
    ) STRICT;
"""

teamsSQL = """
    CREATE TABLE teams
    (
        uuid         INTEGER PRIMARY KEY,
        team_name    TEXT,
        language     TEXT,
        quiz_id      INTEGER,
        score        INTEGER,
        submitted_at TEXT, -- Time of answers submitted
        
        FOREIGN KEY (quiz_id) REFERENCES quizzes (ROWID)
    ) STRICT;
"""

answersSQL = """
    CREATE TABLE answers (
        team_id     INTEGER,
        question_id INTEGER,
        answer      INTEGER,
        is_correct  INTEGER,
        
        FOREIGN KEY (team_id)     REFERENCES teams (ROWID),
        FOREIGN KEY (question_id) REFERENCES questions (ROWID)
    ) STRICT;
"""


class QuizDB:
    def __init__(self, dataRoot: Path) -> None:
        self._dataRoot = dataRoot
        if not self._dataRoot:
            raise ValueError("dataRoot is required")
        if not Path.exists(self._dataRoot):
            makedirs(self._dataRoot)

        self.connection = sqlite3.connect(self._dataRoot / "quizData.db")
        if not self.connection:
            raise RuntimeError("Database not found")

        self.cursor = self.connection.cursor()
        if not self.cursor:
            raise RuntimeError("Database cursor cannot be created")

        self._checkDBTable("questions", questionsSQL)
        self._checkDBTable("quizzes", quizzesSQL)
        self._checkDBTable("teams", teamsSQL)
        self._checkDBTable("answers", answersSQL)

    def _checkDBTable(self, tableName: str, tableSQL: str) -> None:
        if not self.cursor.execute(f"SELECT count(name) FROM sqlite_master WHERE type='table' AND name='{tableName}';").fetchone()[0] == 1:
            if input(f"WARNING: Table '{tableName}' does not exist, are you sure to create it? (YES/NO) > ") == "YES":
                self.cursor.execute(tableSQL)
                print(f"Table '{tableName}' created successfully")
            else:
                print(f"Table creation aborted")
