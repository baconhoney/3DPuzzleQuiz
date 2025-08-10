import asyncio
from io import BytesIO
from yattag import Doc
from barcode import Code128
from barcode.writer import SVGWriter
from datetime import date
from pyppeteer import launch
import utils
import os

#async ??
async def printQuiz(teamID: int, lang: str, quizType: utils.QuizSizes):
    # print("print or do stuff idk")
    if quizType == utils.QuizSizes.SIZE_20:
        quizNumber = utils.QuizState.currentQuizNumber
    else:
        quizNumber = -1
    rawData: list[list[str | int]] = utils.quizDB.cursor.execute(
        f"SELECT name_{lang} as Name, location_{lang}  \
        FROM quizzes JOIN buildings ON quizzes.building_id == buildings.id \
        WHERE quizzes.quiz_number == {quizNumber} \
        ORDER BY Name;"
    ).fetchall()


    svgFile = BytesIO()
    Code128(str(teamID)).write(svgFile, options={'module_width': 0.3, 'module_height': 15})
    svgStr: str = ('<svg' + svgFile.getvalue().decode("utf-8").split('<svg')[1]).strip()

    
    doc, tag, text, line = Doc().ttl()
    Vpadding = 3.7 if quizType == utils.QuizSizes.SIZE_100 else 5
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
                            line('p',f'Teszt {quizNumber}' if lang=="hu" else f'Test {quizNumber}', style='text-align: center;')
                            line('p',f'Kutatók éjszakája {date.today().year}', style='text-align: left;')

                with tag('tbody'):
                    with tag('tr'):
                            line('td',f'Név: _________________________' if lang=="hu" else f'Name: _________________________', klass='humanname', colspan='3' )

                    with tag('tr'):
                        with tag('td'):
                            with tag('table', klass='content'):
                                with tag('thead'):
                                    if(lang == "hu"):
                                        with tag('tr'):
                                            line('th', 'Írd az épület neve mellé a megfelelő makett mellett lévő számot!', klass='instruction', colspan='3')
                                        with tag('tr'):
                                            line('th','Név', klass='name')
                                            line('th','Ország, Város', klass='location')
                                            line('th','Szám', klass='number')   
                                    else: #lang =="en"
                                        with tag('tr'):
                                            line('th', 'Write the number found at the models into the rectangle next to the correct building\'s name!', klass='instruction', colspan='3')
                                        with tag('tr'):
                                            line('th','Name', klass='name')
                                            line('th','City, Country', klass='location')
                                            line('th','Number', klass='number')

                                with tag('tbody'):
                                    for rows in rawData:
                                        with tag('tr', klass='data'):
                                            line('td',rows[0])
                                            line('td',rows[1])
                                            line('td','')
            

  #  with open("temp.html",mode="w",encoding="UTF-8") as f:
  #      f.writelines(doc.getvalue())
    
    browser = await launch()
    page = await browser.newPage()
    await page.setContent(doc.getvalue())
#    await page.screenshot(path = 'temp.png', fullPage= True)
    await page.pdf({'path': 'temp.pdf', 'format': 'A4'})
    await browser.close()
    os.system('lpr temp.pdf && rm temp.pdf')

async def main():
   await printQuiz(1234567890, "en", utils.QuizSizes.SIZE_20)


if __name__ == "__main__":
    asyncio.run(main())


