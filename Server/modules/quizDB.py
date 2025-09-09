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
    id          INTEGER PRIMARY KEY NOT NULL,
    box         INTEGER,
    answer      INTEGER UNIQUE,
    name_hu     TEXT                NOT NULL,
    name_en     TEXT                NOT NULL,
    location_hu TEXT                NOT NULL,
    location_en TEXT                NOT NULL,
    type        TEXT                NOT NULL
) STRICT;
"""

_quizzesSQL = """
CREATE TABLE quizzes
(
    id          INTEGER PRIMARY KEY NOT NULL,
    quiz_round  INTEGER             NOT NULL,
    building_id INTEGER             NOT NULL,
    
    FOREIGN KEY (building_id) REFERENCES buildings (id)
) STRICT;
"""

_teamsSQL = """
CREATE TABLE teams
(
    id           INTEGER PRIMARY KEY NOT NULL,
    name         TEXT,
    codeword     TEXT,
    language     TEXT                NOT NULL,
    quiz_round   INTEGER             NOT NULL,
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
    answer      INTEGER,
    
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

        dbInitiatedFlagPath = self._dataRoot / "db_initiated"

        self._dbExisted = dbInitiatedFlagPath.exists()
        self.connection = sqlite3.connect(self._dataRoot / "quizData.sqlite")
        if not self.connection:
            raise RuntimeError("Database not found")

        self.cursor = self.connection.cursor()
        if not self.cursor:
            raise RuntimeError("Database cursor cannot be created")
        if not self._dbExisted:
            self._makeDBTable("buildings", _buildingsSQL)
            self._makeDBTable("quizzes", _quizzesSQL)
            self._makeDBTable("teams", _teamsSQL)
            self._makeDBTable("answers", _answersSQL)
            dbInitiatedFlagPath.touch()

    def _makeDBTable(self, tableName: str, tableSQL: str) -> None:
        try:
            self.cursor.execute(f"DROP TABLE IF EXISTS {tableName}")
            self.cursor.execute(tableSQL)
            print(f"Table '{tableName}' created successfully")
        except Exception as e:
            print(f"Table creation aborted: {e}")
