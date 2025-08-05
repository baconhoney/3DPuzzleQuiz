import utils

#async ??
def printQuiz(teamID: int, lang: str, quizType: utils.QuizSize):
    print("print or do stuff idk")
    if quizType == utils.QuizSize.SIZE_20:
        quizNumber = utils.QuizState.currentQuizNumber
    else:
        quizNumber = -1
    rawData: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT name_{lang} as Name, CONCAT( country_{lang}, NULLIF(CONCAT(', ',city_{lang}),', -') ) as Location \
        FROM quizzes JOIN buildings ON quizzes.building_id == buildings.id \
        WHERE quizzes.quiz_number == {quizNumber} \
        ORDER BY Name;"
    ).fetchall()
    
    print(rawData)



def main():
    print("fe")


if __name__ == "__main__":
    main()


