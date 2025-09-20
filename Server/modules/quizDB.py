import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from os import makedirs
from pathlib import Path
import atexit
import locale
import sqlite3


_buildingsSQL = """
CREATE TABLE buildings
(
    id          INTEGER PRIMARY KEY NOT NULL,
    box         INTEGER,
    answer      INTEGER UNIQUE,
    name_hu     TEXT NOT NULL COLLATE LANG_HU,
    name_en     TEXT NOT NULL COLLATE LANG_HU,
    location_hu TEXT NOT NULL COLLATE LANG_HU,
    location_en TEXT NOT NULL COLLATE LANG_HU,
    type        TEXT NOT NULL
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
    name         TEXT COLLATE LANG_HU,
    codeword     TEXT,
    language     TEXT NOT NULL,
    quiz_round   INTEGER NOT NULL,
    quiz_size    INTEGER NOT NULL,
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
        _logger.debug(f"Initializing QuizDB with dataRoot={dataRoot}")
        self._dataRoot = dataRoot
        if not self._dataRoot:
            raise ValueError("dataRoot is required")
        if not Path.exists(self._dataRoot):
            _logger.info(f"Creating data root directory at {self._dataRoot}")
            makedirs(self._dataRoot)

        dbInitiatedFlagPath = self._dataRoot / "db_initiated"

        self._dbExisted = dbInitiatedFlagPath.exists()
        _logger.debug(f"Database existed={self._dbExisted}")
        self.connection = sqlite3.connect(self._dataRoot / "quizData.sqlite")
        if not self.connection:
            raise RuntimeError("Database not found")

        locale.setlocale(locale.LC_ALL, "hu_HU.utf8")
        self.connection.create_collation("LANG_HU", locale.strcoll)
        self.cursor = self.connection.cursor()
        if not self.cursor:
            raise RuntimeError("Database cursor cannot be created")
        if not self._dbExisted:
            _logger.info("Creating fresh database tables")
            self._makeDBTable("buildings", _buildingsSQL)
            self._makeDBTable("quizzes", _quizzesSQL)
            self._makeDBTable("teams", _teamsSQL)
            self._makeDBTable("answers", _answersSQL)
            dbInitiatedFlagPath.touch()
            _logger.info("Database initialization complete")
            print("\n\nWARNING: Database was wiped clean. Run 'python manageQuizdata.py j2d && python manageQuizdata.py regen' to repopulate it!")
            if input("Press enter to exit...") == "":
                exit(0)
        else:
            _logger.info("Using existing database")
        atexit.register(lambda: self.connection.close())

    def _makeDBTable(self, tableName: str, tableSQL: str) -> None:
        try:
            _logger.debug(f"Creating table {tableName}")
            self.cursor.execute(f"DROP TABLE IF EXISTS {tableName}")
            self.cursor.execute(tableSQL)
            res = self.cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{tableName}';").fetchone()
            if res and len(res) == 1 and res[0] == tableName:
                _logger.info(f"Table '{tableName}' created successfully")
            else:
                _logger.error(f"Table '{tableName}' creation failed")
        except Exception as e:
            _logger.error(f"Table creation aborted for '{tableName}': {e}")
