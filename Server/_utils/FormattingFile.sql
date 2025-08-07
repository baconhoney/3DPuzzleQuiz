SELECT teams.language, teams.quiz_number FROM teams WHERE teams.id = {teamID};


SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}
FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id
WHERE quizzes.quiz_number = {quizNumber};

SELECT count(buildings.id) FROM buildings JOIN answers ON buildings.id = answers.building_id
WHERE answers.team_id = {teamID} AND answers.answer = buildings.answer;

INSERT INTO teams (name, language, quiz_number, score, submitted_at) VALUES (?, ?, ?, ?, ?);

SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer,
CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END
FROM answers JOIN buildings ON answers.building_id = buildings.id
WHERE answers.team_id = {teamID};

SELECT language, score, submitted_at FROM teams WHERE teams.id = {teamID};

SELECT name, score, submitted_at FROM teams WHERE quiz_number = {quizNumber}
ORDER BY score DESC, submitted_at ASC;

SELECT buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}, answers.answer,
CASE WHEN buildings.answer = answers.answer THEN 1 ELSE 0 END
FROM answers JOIN buildings ON answers.building_id = buildings.id
WHERE answers.team_id = {teamID};

SELECT id, box, answer, {localisedCols} FROM buildings;

INSERT INTO quizzes (quiz_number, building_id) VALUES (?, ?);

