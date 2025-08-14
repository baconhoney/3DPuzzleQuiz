import asyncio
from io import BytesIO
from yattag import Doc
from barcode import Code128
from barcode.writer import SVGWriter
from datetime import date
from pyppeteer import launch
import utils
from quizDBManager import getQuestions, getAnswers
import os

localisation = {
    'testname': {'hu' : 'Teszt', 'en': 'Test'},
    'humanname': {'hu' : 'Név: ', 'en': 'Name: '},
    'instruction': {'hu' : 'Írd az épület neve mellé a megfelelő makett mellett lévő számot!', 'en': 'Write the number found at the models into the rectangle next to the correct building\'s name!'},
    'name': {'hu' : 'Név', 'en': 'Name'},
    'location': {'hu' : 'Ország, Város', 'en': 'City, Country'},
    'number': {'hu' : 'Szám', 'en': 'Number'},
}


async def printQuiz(teamID: int, quizLang: str = "hu", quizSize: utils.QuizSizes = utils.QuizSizes.SIZE_20):
    # print("print or do stuff idk")
    
    quizNumber = utils.QuizState.currentQuizNumber if quizSize == utils.QuizSizes.SIZE_20 else -1
    res = utils.quizDB.cursor.execute(f"SELECT name, language, score, submitted_at FROM teams WHERE teams.id = {teamID};").fetchone()
    if not res:
        isEmpty = True
        questions = await getQuestions(quizLang,quizSize.value)
        data = [{'name': entry['name'], 'location': entry['location']} for entry in questions]
    else:
        isEmpty = False
        teamName, quizLang, score, submittedAt = res[0], res[1], res[2], res[3]
        answers = await getAnswers(teamID)
        data = answers['quizdata']
        quizSize = utils.convertToQuizSize(str(len(data)))
        if quizSize == None :
            raise LookupError(f"Answer count does not match preexisting quiz size")



    svgFile = BytesIO()
    Code128(str(teamID)).write(svgFile, options={'module_width': 0.3, 'module_height': 15})
    svgStr: str = ('<svg' + svgFile.getvalue().decode("utf-8").split('<svg')[1]).strip()

    
    doc, tag, text, line = Doc().ttl()
    Vpadding = 3.7 if quizSize == utils.QuizSizes.SIZE_100 else 5
    Hpadding = 2
    doc.asis('<!DOCTYPE html>')
    with tag('html'):
        with tag('head'):
            doc.asis('<meta charset="UTF-8">')
            with tag('style'):
                doc.asis('  * { font-family: "Calibri" }\
                            table.content, table.content th, table.content td{ \
                            border: 1.5px solid black; \
                            border-collapse: collapse; \
                            } \
                            table { width:100%; }\
                            .name, .location { width:45%; }    \
                            .number { width:10%; }    \
                            svg {  float: right; }    \
                            header {  \
                                    top: 0; \
                                    width: 100%}  \
                            @page { \
                            size: A4; \
                            margin: 10mm 10mm 15mm 10mm; \
                            }            \
                            p { font-size: 10pt}\
                            td.humanname { font-size: 20pt}\
                            td { font-size: 13.5pt}\
                            svg text {display: inline}\
                            ')
                doc.asis(f'th.instruction {{font-size: 13pt}}')
                doc.asis(f'th, td {{ padding-top: {Vpadding }pt; padding-bottom: {Vpadding }pt; padding-left: {Hpadding}pt; padding-right: {Hpadding}pt  }} ')
        with tag('body'):
            with tag('table'):
                with tag('thead'):
                    with tag('tr'):
                        with tag('th'):
                            doc.asis(f'{svgStr}\n')
                            line('p',f'{localisation['testname'][quizLang]} {quizNumber}', style='text-align: center;')
                            line('p',f'Kutatók éjszakája {date.today().year}', style='text-align: left;')

                with tag('tbody'):
                    with tag('tr'):
                            line('td',localisation['humanname'][quizLang] + ("_________________________" if isEmpty else teamName), klass='humanname', colspan='3' )

                    with tag('tr'):
                        with tag('td'):
                            with tag('table', klass='content'):
                                with tag('thead'):
                                    with tag('tr'):
                                        line('th',localisation['instruction'][quizLang], klass='instruction', colspan='3')
                                    with tag('tr'):
                                        line('th',localisation['name'][quizLang], klass='name')
                                        line('th',localisation['location'][quizLang], klass='location')
                                        line('th',localisation['number'][quizLang], klass='number')   
                                with tag('tbody'):
                                    for rows in data:
                                        with tag('tr', klass='data'):
                                            line('td',rows['name'])
                                            line('td',rows['location'])
                                            line('td','' if isEmpty else str(rows['answer']) + (' ✓' if rows['correct'] else ' X'))
            

 #   with open("temp.html",mode="w",encoding="UTF-8") as f:
 #       f.writelines(doc.getvalue())
    
    browser = await launch()
    page = await browser.newPage()
    await page.setContent(doc.getvalue())
#    await page.screenshot(path = 'temp.png', fullPage= True)
    await page.pdf({'path': 'temp.pdf', 'format': 'A4'})
    await browser.close()
  #  os.system('lpr temp.pdf && rm temp.pdf') #UNCOMMENT THIS LINE TO PRINT

async def main():
   await printQuiz(9634099165, "hu", utils.QuizSizes.SIZE_20)


if __name__ == "__main__":
    asyncio.run(main())


