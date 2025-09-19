import React, { useState, useEffect, useRef } from 'react'
import Quiz from './Quiz'
import { useGlobalContext } from './App';
import WantToStart from './WantToStart';
import Waiting from './Waiting';
import Navbar from './Navbar';
import Results from './Results';
import { getAnswers, getQuestions, getQuizPhase } from './apiHandler';

const Manager = () => {

    // running,     scoring,   idle
    // quizStarted, quizEnded, resultsReady
    const [gameState, setGameState] = useState("idle");
    const [wantToPlay, setWantToPlay] = useState("NA"); // NA, Y, N
    const [teamID, setTeamID] = useState(localStorage.getItem("teamID"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [quizData, setQuizData] = useState(null);
    const [answerData, setAnswerData] = useState(null);

    // WebSocket reference
    const wsRef = useRef(null);

    const { t } = useGlobalContext();

    // Initialize quiz phase and WebSocket connection on component mount
    useEffect(() => {
        const initializeManager = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch initial quiz phase
                const phaseData = await getQuizPhase();
                console.log("Initial quiz phase:", phaseData);

                // Update game state based on API response
                if (phaseData && phaseData.phase) {
                    setGameState(phaseData.phase);
                }

            } catch (error) {
                console.error("Error fetching initial quiz phase:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const initializeWebSocket = () => {
            // Determine WebSocket URL (adjust based on your backend configuration)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/api/client/events`;

            console.log("Connecting to WebSocket:", wsUrl);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("WebSocket connected");
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("WebSocket message received:", data);

                    // Handle different message types
                    switch (data.event) {
                        case "quizStarted":
                            localStorage.removeItem("quizAnswers");
                            setGameState("running");
                            break;
                        case "quizEnded":
                            setGameState("scoring");
                            setWantToPlay("NA");
                            break;
                        case "resultsReady":
                            setGameState("idle");
                            break;
                        default:
                            console.warn("Unknown WebSocket event:", data.event);
                    }
                    console.log("Game state updated via WebSocket:", data.event);

                    // Add more message type handlers as needed

                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            ws.onclose = (event) => {
                console.log("WebSocket disconnected:", event.code, event.reason);

                // Reconnect after 3 seconds if not intentionally closed
                if (event.code !== 1000) {
                    setTimeout(() => {
                        console.log("Attempting to reconnect WebSocket...");
                        initializeWebSocket();
                    }, 3000);
                }
            };

            wsRef.current = ws;
        };

        // Initialize both quiz phase and WebSocket
        initializeManager();
        initializeWebSocket();

        // Cleanup function
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounting");
            }
        };
    }, []); // Empty dependency array - run only on mount

    // Separate useEffect for fetching questions and answers based on game state
    React.useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getQuestions(localStorage.getItem("language") || "hu", localStorage.getItem("quizSize") || 20);
                setQuizData(data);
            } catch (error) {
                console.error("Error fetching questions:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchAnswers = async () => {
            if (!teamID) {
                console.warn("No teamID available, skipping fetchAnswers");
                return;
            }
            try {
                console.log("Fetching answers for teamID:", teamID);
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
    }, [gameState, wantToPlay, teamID]);

    function getComponent() {
        console.log("Game state:", gameState, "Want to play:", wantToPlay, "Team ID:", teamID);
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
                    localStorage.removeItem("quizAnswers")
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
                if (localStorage.getItem("teamID")) {
                    setTeamID(localStorage.getItem("teamID"));
                }
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
            if (localStorage.getItem("teamID") !== null && wantToPlay === "NA") {
                return <WantToStart setWantToPlay={setWantToPlay} />;
            }

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