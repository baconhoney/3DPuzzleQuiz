SELECT teams.language, teams.quiz_number FROM teams WHERE teams.id = {teamID};


SELECT buildings.id, buildings.name_{lang}, buildings.country_{lang}, buildings.city_{lang}
FROM buildings
JOIN quizzes ON buildings.id = quizzes.building_id WHERE quizzes.quiz_number = {quizNumber};

