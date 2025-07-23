SELECT teams.language, teams.quiz_number FROM teams WHERE teams.id = {teamID};


SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}
FROM buildings JOIN quizzes ON buildings.id = quizzes.building_id
WHERE quizzes.quiz_number = {quizNumber};

SELECT count(answers.id)
FROM teams JOIN answers ON teams.id = answers.team_id JOIN buildings ON answers.building_id = buildings.id
WHERE teams.id = {teamID} AND buildings.answer = answers.answer;

