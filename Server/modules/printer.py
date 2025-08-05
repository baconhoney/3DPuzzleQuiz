import utils
from yattag import Doc
from barcode import Code128
from barcode.writer import SVGWriter 

#async ??
def printQuiz(teamID: int, lang: str, quizType: utils.QuizSize):
    print("print or do stuff idk")
    if quizType == utils.QuizSize.SIZE_20:
        quizNumber = utils.QuizState.currentQuizNumber
    else:
        quizNumber = -1
    rawData: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT name_{lang} as Name, country_{lang}, city_{lang}  \
        FROM quizzes JOIN buildings ON quizzes.building_id == buildings.id \
        WHERE quizzes.quiz_number == {quizNumber} \
        ORDER BY Name;"
    ).fetchall()
    
    with open(f'{teamID}.svg', 'wb') as f:
        Code128(str(teamID), writer=SVGWriter()).write(f)


    doc, tag, text, line = Doc().ttl()

    doc.asis('<!DOCTYPE html>')
    with tag('html'):
        with tag('head'):
            with tag('style'):
                doc.asis('  table, th, td { \
                            border: 1px solid black; \
                            border-collapse: collapse; \
                            } \
                            table { width:100%; }\
                            .name, .location { width:45%; }    \
                            .number { width:10%; }    \
                                \
                            ')
        with tag('body'):
            doc.stag('img', src=f'{teamID}.svg', klass='barcode')

            with tag('table'):
                if(lang == "hu"):
                    with tag('tr'):
                        line('th','Név', klass='name')
                        line('th','Ország, Város', klass='location')
                        line('th','Szám', klass='number')
                    for rows in rawData:
                        with tag('tr'):
                            line('td',rows[0])
                            line('td',rows[1] if rows[2]=="-" else rows[1]+", "+rows[2])
                            line('td','')


                else: #lang =="en"
                    with tag('tr'):
                        line('th','Name', klass='name')
                        line('th','City, Country', klass='location')
                        line('th','Number', klass='number')

                    for rows in rawData:
                        with tag('tr'):
                            line('td',rows[0])
                            line('td',rows[1] if rows[2]=="-" else rows[2]+", "+rows[1])
                            line('td','')
                

                

    with open("temp.html",mode="w",encoding="UTF-8") as f:
        f.writelines(doc.getvalue())


def main():
    print("fe")


if __name__ == "__main__":
    main()


