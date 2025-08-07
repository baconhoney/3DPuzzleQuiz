import React, { useState } from 'react'
import Quiz from './Quiz'
import { useGlobalContext } from './App';
import WantToStart from './WantToStart';
import Waiting from './Waiting';
import Navbar from './Navbar';
import Results from './Results';
import { getQuestions } from './apiHandler';

const Manager = () => {

    // running,     scoring,   idle
    // quizStarted, quizEnded, resultsReady
    const [gameState, setGameState] = useState("running");
    // TODO reset wantToPlay
    const [wantToPlay, setWantToPlay] = useState("NA"); // NA, Y, N
    const [teamID, setTeamID] = useState("123");
    const haveResults = true;

    const { t } = useGlobalContext();

    const answerData = {
        "quizdata": {
            "0": {
                "name": "Hősök tere",
                "country": "Magyarország",
                "city": "Budapest",
                "answers": 90,
                "correct": true
            },
            "1": {
                "name": "Kaminarimon Kapu",
                "country": "Japán",
                "city": "Tokió",
                "answers": 1,
                "correct": true
            },
            "2": {
                "name": "Kanadai Nemzeti TV-Torony",
                "country": "Kanada",
                "city": "Toronto",
                "answers": 76,
                "correct": true
            },
            "3": {
                "name": "Keleti Gyöngy torony",
                "country": "Kína",
                "city": "Shanghai",
                "answers": 4,
                "correct": true
            },
            "4": {
                "name": "Kínai Nagy Fal",
                "country": "Kína",
                "city": "-",
                "answers": 15,
                "correct": true
            },
            "5": {
                "name": "Kölni dóm",
                "country": "Németország",
                "city": "Köln",
                "answers": 91,
                "correct": true
            },
            "6": {
                "name": "Kul Sharif mecset",
                "country": "Oroszország",
                "city": "Kazán",
                "answers": 7,
                "correct": false
            },
            "7": {
                "name": "Kultúra és Tudomány Palotája",
                "country": "Lengyelország",
                "city": "Varsó",
                "answers": 80,
                "correct": true
            },
            "8": {
                "name": "Lincoln emlékmű",
                "country": "Egyesült Államok",
                "city": "Washington",
                "answers": 33,
                "correct": true
            },
            "9": {
                "name": "Louvre Múzeum",
                "country": "Franciaország",
                "city": "Párizs",
                "answers": 93,
                "correct": true
            },
            "10": {
                "name": "Mátyás-templom és Halászbástya",
                "country": "Magyarország",
                "city": "Budapest",
                "answers": 30,
                "correct": true
            },
            "11": {
                "name": "Mayflower",
                "country": "Hollandia",
                "city": "[elsüllyedt]",
                "answers": 63,
                "correct": true
            },
            "12": {
                "name": "Megváltó Krisztus szobra",
                "country": "Brazília",
                "city": "Rio de Janeiro",
                "answers": 59,
                "correct": true
            },
            "13": {
                "name": "Megváltó Krisztus-székesegyház",
                "country": "Oroszország",
                "city": "Moszkva",
                "answers": 14,
                "correct": false
            },
            "14": {
                "name": "Mennyei béke kapuja",
                "country": "Kína",
                "city": "Peking",
                "answers": 20,
                "correct": true
            },
            "15": {
                "name": "Milánói Dóm",
                "country": "Olaszország",
                "city": "Milánó",
                "answers": 26,
                "correct": true
            },
            "16": {
                "name": "Mississippi gőzhajó",
                "country": "Egyesült Államok",
                "city": "New Orleans",
                "answers": 52,
                "correct": true
            },
            "17": {
                "name": "Mustafa Kemal Atatürk mauzóleuma",
                "country": "Törökország",
                "city": "Ankara",
                "answers": 18,
                "correct": false
            },
            "18": {
                "name": "New York-i Szabadság szobor",
                "country": "Egyesült Államok",
                "city": "New York",
                "answers": 22,
                "correct": true
            },
            "19": {
                "name": "Notre-Dame",
                "country": "Franciaország",
                "city": "Párizs",
                "answers": 74,
                "correct": true
            }
        },
        "score": 17,
        "submittedAt": "2025-07-30T20:27:04.929"
    }

    function getComponent() {
        if (!!teamID) {
            if (gameState === "running" && wantToPlay !== "N") {
                // The quiz is running and the hasn't said they don't want to play
                return lateStart();

            } else if (gameState === "scoring" || wantToPlay === "N") {
                // The quiz is scoring or the team has said they don't want to play
                return <Waiting reason="results" />;

            } else if (gameState === "idle") {
                // The quiz is idle, meaning results are ready
                if (haveResults) {
                    // If results are available, show them
                    return <Results data={answerData} />;
                }
                return <div className='text-center p-4'>{t("no_results")}</div>;

            } else {
                // If the game state is unknown, show an error
                return errorDiv;
            }
        } else {
            if (gameState === "running" && wantToPlay !== "N") {
                // The quiz is running and the hasn't said they don't want to play
                return lateStart();

            } else if (gameState !== "running" || wantToPlay === "N") {
                // The quiz is not running or the team has said they don't want to play
                return <Waiting reason="quiz" />;

            } else {
                // If the game state is unknown, show an error
                return errorDiv;
            }
        }
    }

    const errorDiv = (<div className='text-error text-center p-4'>Hiba történt. There was an error.<br />gameState: {gameState}, wantToPlay: {wantToPlay}</div>)

    function lateStart() {
        const [quizData, setQuizData] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        React.useEffect(() => {
            const fetchQuestions = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const data = await getQuestions(localStorage.getItem("language") || "hu", 20);
                    setQuizData(data);
                } catch (error) {
                    console.error("Error fetching questions:", error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchQuestions();
        }, []);

        if (loading) {
            return <div className='text-center p-4'>Loading...</div>;
        }

        if (error) {
            return (
                <div className='text-error text-center p-4'>
                    Error loading quiz: {error}
                    <br />
                    <button
                        onClick={() => window.location.reload()}
                        className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!quizData) {
            return <div className='text-center p-4'>No quiz data available</div>;
        } else {

            // const now = new Date();
            // const endTime = new Date();
            // const [hours, minutes, seconds] = quizData.endTime.split(':');
            // endTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

            // const timeRemaining = endTime - now;
            // const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

            // if ((minutesRemaining <= 10 && wantToPlay === "NA") && minutesRemaining > 0) {
            //     return <WantToStart setWantToPlay={setWantToPlay} />;
            // }


            return <Quiz data={quizData} />;
        }
    }

    return (
        <>
            <Navbar />
            {getComponent()}
        </>
    )
}

export default Manager