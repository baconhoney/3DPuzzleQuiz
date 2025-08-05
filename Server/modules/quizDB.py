from os import makedirs
from pathlib import Path
import logging
import sqlite3


__all__ = ["QuizDB"]

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


_buildingsSQL = """
CREATE TABLE buildings
(
    id         INTEGER PRIMARY KEY NOT NULL,
    box        INTEGER,
    answer     INTEGER UNIQUE      NOT NULL,
    name_hu    TEXT                NOT NULL,
    name_en    TEXT                NOT NULL,
    country_hu TEXT                NOT NULL,
    country_en TEXT                NOT NULL,
    city_hu    TEXT                NOT NULL,
    city_en    TEXT                NOT NULL
) STRICT;
"""

_quizzesSQL = """
CREATE TABLE quizzes
(
    id          INTEGER PRIMARY KEY NOT NULL,
    quiz_number INTEGER             NOT NULL,
    building_id INTEGER             NOT NULL,
    
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) STRICT;
"""

_teamsSQL = """
CREATE TABLE teams
(
    id           INTEGER PRIMARY KEY NOT NULL,
    name         TEXT,
    language     TEXT                NOT NULL,
    quiz_number  INTEGER             NOT NULL,
    quiz_size    INTEGER             NOT NULL,
    score        INTEGER,
    submitted_at TEXT
) STRICT;
"""

_answersSQL = """
CREATE TABLE answers
(
    id          INTEGER PRIMARY KEY NOT NULL,
    team_id     INTEGER             NOT NULL,
    building_id INTEGER             NOT NULL,
    answer      INTEGER             NOT NULL,
    
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) STRICT;
"""


class QuizDB:
    def __init__(self, dataRoot: Path) -> None:
        _logger.debug("Initializing QuizDB")
        self._dataRoot = dataRoot
        if not self._dataRoot:
            raise ValueError("dataRoot is required")
        if not Path.exists(self._dataRoot):
            makedirs(self._dataRoot)

        self._dbExisted = (self._dataRoot / "quizData.sqlite").exists()
        self.connection = sqlite3.connect(self._dataRoot / "quizData.sqlite")
        if not self.connection:
            raise RuntimeError("Database not found")

        self.cursor = self.connection.cursor()
        if not self.cursor:
            raise RuntimeError("Database cursor cannot be created")

        self._checkDBTable("buildings", _buildingsSQL)
        self._checkDBTable("quizzes", _quizzesSQL)
        self._checkDBTable("teams", _teamsSQL)
        self._checkDBTable("answers", _answersSQL)

    def _checkDBTable(self, tableName: str, tableSQL: str) -> None:
        if not self.cursor.execute(f"SELECT count(name) FROM sqlite_master WHERE type='table' AND name='{tableName}';").fetchone()[0] == 1:
            if not self._dbExisted or input(f"WARNING: Table '{tableName}' does not exist, are you sure to create it? (YES/NO) > ") == "YES":
                self.cursor.execute(tableSQL)
                print(f"Table '{tableName}' created successfully")
            else:
                print(f"Table creation aborted")

