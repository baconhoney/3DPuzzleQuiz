import React from 'react'
import { useLanguage } from './App'

const Quiz = () => {

    const data = {
        "quizNumber": 3,
        "quizdata": {
            "0": { "name": "Hősök tere", "country": "Magyarország", "city": "Budapest", "flag": "flag_hu", "id": 9675 },
            "1": { "name": "Kaminarimon Kapu", "country": "Japán", "city": "Tokió", "flag": "flag_jp", "id": 5131 },
            "2": { "name": "Kanadai Nemzeti TV-Torony", "country": "Kanada", "city": "Toronto", "flag": "flag_ca", "id": 2085 },
            "3": { "name": "Keleti Gyöngy torony", "country": "Kína", "city": "Shanghai", "flag": "flag_cn", "id": 4721 },
            "4": { "name": "Kínai Nagy Fal", "country": "Kína", "city": "-", "flag": "flag_cn", "id": 5210 },
            "5": { "name": "Kölni dóm", "country": "Németország", "city": "Köln", "flag": "flag_de", "id": 3265 },
            "6": { "name": "Kul Sharif mecset", "country": "Oroszország", "city": "Kazán", "flag": "flag_ru", "id": 9010 },
            "7": { "name": "Kultúra és Tudomány Palotája", "country": "Lengyelország", "city": "Varsó", "flag": "flag_pl", "id": 5466 },
            "8": { "name": "Lincoln emlékmű", "country": "USA", "city": "Washington", "flag": "flag_us", "id": 6939 },
            "9": { "name": "Louvre Múzeum", "country": "Franciaország", "city": "Párizs", "flag": "flag_fr", "id": 9266 },
            "10": { "name": "Mátyás-templom és Halászbástya", "country": "Magyarország", "city": "Budapest", "flag": "flag_hu", "id": 8948 },
            "11": { "name": "Mayflower", "country": "Hollandia", "city": "[elsüllyedt]", "flag": "flag_nl", "id": 3278 },
            "12": { "name": "Megváltó Krisztus szobra", "country": "Brazília", "city": "Rio de Janeiro", "flag": "flag_br", "id": 4805 },
            "13": { "name": "Megváltó Krisztus-székesegyház", "country": "Oroszország", "city": "Moszkva", "flag": "flag_ru", "id": 9218 },
            "14": { "name": "Mennyei béke kapuja", "country": "Kína", "city": "Peking", "flag": "flag_cn", "id": 9483 },
            "15": { "name": "Milánói Dóm", "country": "Olaszország", "city": "Milánó", "flag": "flag_it", "id": 8053 },
            "16": { "name": "Mississippi gőzhajó", "country": "USA", "city": "New Orleans", "flag": "flag_us", "id": 4954 },
            "17": { "name": "Mustafa Kemal Atatürk mauzóleuma", "country": "Törökország", "city": "Ankara", "flag": "flag_tr", "id": 2340 },
            "18": { "name": "New York-i Szabadság szobor", "country": "USA", "city": "New York", "flag": "flag_us", "id": 2354 },
            "19": { "name": "Notre-Dame", "country": "Franciaország", "city": "Párizs", "flag": "flag_fr", "id": 7310 }
        },
        "endTime": "13:55:00"
    }

    const { t, teamName } = useLanguage();

    const isQuizActive = true;

    const formattedTime = data.endTime.split(':').slice(0, 2).join(':');

    function sendQuiz(e) {
        e.preventDefault();
        const form = document.getElementById('quiz-form');
        const inputs = form.querySelectorAll('input[type="number"]');
        const answers = {};

        inputs.forEach((input, index) => {
            const value = input.value ? parseInt(input.value, 10) : 0;
            answers[index.toString()] = {
                "id": parseInt(input.id, 10),
                "num": value
            };
        });

        const formattedAnswers = {
            "answers": answers
        };

        // Here you would typically send the answers to the server
        console.log(formattedAnswers);
    }

    return (
        <>
            <div className="navbar bg-base-200 shadow-sm px-5 sticky top-0 z-50 justify-between">
                <p className="text-lg font-bold truncate">{teamName}</p>
                <p className='text-lg'>{isQuizActive ? formattedTime : ''}</p>
            </div>
            {isQuizActive ? (
                <form id='quiz-form'>
                    <div className='grid grid-cols-1 gap-2 p-3'>
                        {Object.entries(data.quizdata).map(([key, value]) => (
                            <div key={key} className="card bg-base-100 shadow-xl">
                                <div className="flex flex-row justify-between items-center p-5 card-body">
                                    <div>
                                        <h2 className="card-title">{value.name}</h2>
                                        {value.city === "-" ? (
                                            <p>{value.country}</p>
                                        ) : (
                                            <p>{value.city}, {value.country}</p>
                                        )}
                                    </div>
                                    <input id={value.id} type="number" className="input validator input-sm w-12" min={1} max={100} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='flex justify-center p-5'>
                        <button className="btn btn-primary btn-wide" onClick={sendQuiz}>{t("finish")}</button>
                    </div>
                </form>
            ) : (
                <div className="flex justify-center items-center p-10">
                    <p className="text-2xl font-bold">{t("quiz_not_started")}</p>
                </div>
            )}
        </>
    )
}

export default Quiz