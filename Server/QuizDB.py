questionsSQL = """
               CREATE TABLE questions
               (
                   name_hu    TEXT,
                   country_hu TEXT,
                   city_hu    TEXT,
                   name_en    TEXT,
                   country_en TEXT,
                   city_en    TEXT,
                   uid        INTEGER,
                   box_id     INTEGER,
                   answer     INTEGER
               );"""

quizzesSQL = """
             CREATE TABLE quizzes
             (
                 size         INTEGER, -- Size of the test
                 question_ids TEXT     -- Store as JSON-encoded array {"0": <questions.ROWID>}
             );"""

teamsSQL = """
           CREATE TABLE teams
           (
               team_name    TEXT,
               language     TEXT,
               quiz_id      TEXT FOREIGN KEY REFERENCES quizzes (ROWID),
               score        INTEGER,
               submitted_at TEXT -- Time of answers submitted
           );"""

answersSQL = """
             CREATE TABLE answers
             (
                 participant_id INTEGER FOREIGN KEY REFERENCES participants (ROWID),
                 question_id    INTEGER FOREIGN KEY REFERENCES questions (ROWID),
                 answer         INTEGER,
                 is_correct     INTEGER
             );"""

quizDBConn = sqlite3.connect(dataRoot / "quizData.db")
if not quizDBConn:
    raise RuntimeError("Database not found")
quizDBCursor = quizDBConn.cursor()
if not quizDBCursor:
    raise RuntimeError("Database cursor cannot be created")
if not quizDBCursor.execute(r"SELECT name FROM sqlite_master WHERE type='table' AND name='tests';").rowcount == 1:
    if input("WARNING: Table 'tests' does not exist, are you sure to create it? (YES/NO) > ") == "YES":
        quizDBCursor.execute(questionsSQL)
        print("Table 'tests' created successfully")
    else:
        print("Table creation aborted")
if not quizDBCursor.execute(r"SELECT name FROM sqlite_master WHERE type='table' AND name='teams';").rowcount == 1:
    if input("WARNING: Table 'teams' does not exist, are you sure to create it? (YES/NO) > ") == "YES":
        quizDBCursor.execute(teamsSQL)
        print("Table 'teams' created successfully")
    else:
        print("Table creation aborted")
