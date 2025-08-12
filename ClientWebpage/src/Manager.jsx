import React, { useState } from 'react'
import Quiz from './Quiz'
import { useGlobalContext } from './App';
import WantToStart from './WantToStart';
import Waiting from './Waiting';
import Navbar from './Navbar';
import Results from './Results';
import { getAnswers, getQuestions } from './apiHandler';

const Manager = () => {

    // running,     scoring,   idle
    // quizStarted, quizEnded, resultsReady
    const [gameState, setGameState] = useState("running");
    // TODO reset wantToPlay
    const [wantToPlay, setWantToPlay] = useState("NA"); // NA, Y, N
    const [teamID, setTeamID] = useState(localStorage.getItem("teamID"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [quizData, setQuizData] = useState(null);
    const [answerData, setAnswerData] = useState(null);

    const { t } = useGlobalContext();

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

        const fetchAnswers = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getAnswers(teamID);
                setAnswerData(data);
            } catch (error) {
                console.error("Error fetching answers:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        // Only fetch questions if we need to show the quiz
        if (gameState === "running" && wantToPlay !== "N") {
            fetchQuestions();
        }
        // Fetch answers if the game is idle
        if (gameState === "idle") {
            fetchAnswers();
        }
    }, [gameState, wantToPlay]);

    // const answerData = {
    //     "nextPhaseChangeAt": "2025-08-12T17:43:57.433",
    //     "answers": {
    //         "score": 0,
    //         "submittedAt": "2025-08-12T18:15:35.180",
    //         "quizdata": [
    //             {
    //                 "name": "Colosseum",
    //                 "location": "Olaszország, Róma",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Eyüp Sultan mecset",
    //                 "location": "Törökország, Isztambul",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Galata torony",
    //                 "location": "Törökország, Isztambul",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Groupama Aréna",
    //                 "location": "Magyarország, Budapest",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Lincoln emlékmű",
    //                 "location": "Egyesült Államok, Washington",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Megváltó Krisztus szobra",
    //                 "location": "Brazília, Rio de Janeiro",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Megváltó Krisztus-székesegyház",
    //                 "location": "Oroszország, Moszkva",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Notre-Dame-székesegyház",
    //                 "location": "Franciaország, Párizs",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Országház",
    //                 "location": "Magyarország, Budapest",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Peles kastély",
    //                 "location": "Románia, Szinaja",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Szent István-bazilika",
    //                 "location": "Magyarország, Budapest",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Szent Jakab-katedrális",
    //                 "location": "Spanyolország, Santiago d. C.",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Szent Patrik-katedrális",
    //                 "location": "Egyesült Államok, New York",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Szent Pál-székesegyház",
    //                 "location": "Egyesült Királyság, London",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Szent Péter-bazilika",
    //                 "location": "Vatikán, Vatikán Város",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Tokyo Skytree",
    //                 "location": "Japán, Tokió",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Vajdahunyad vára",
    //                 "location": "Magyarország, Budapest",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Wat Phra Kaew",
    //                 "location": "Thaiföld, Bangkok",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Westminsteri apátság",
    //                 "location": "Egyesült Királyság, London",
    //                 "answer": 0,
    //                 "correct": false
    //             },
    //             {
    //                 "name": "Új Hattyúkő kastély",
    //                 "location": "Németország, Schwangau",
    //                 "answer": 0,
    //                 "correct": false
    //             }
    //         ]
    //     }
    // }

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
                if (!loading && answerData) {
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


            return <Quiz data={quizData} setWantToPlay={setWantToPlay} />;
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