import { useEffect, useState } from 'react';
import { useGlobalContext } from './App';
import Input from './Input';
import { uploadAnswers } from './apiHandler';

const Quiz = ({ data, setWantToPlay }) => {

    const { t } = useGlobalContext();
    const [answerCount, setAnswerCount] = useState(0);
    const [teamID, setTeamID] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryState, setRetryState] = useState(null); // 'failed' when showing retry page
    const [retryAttempts, setRetryAttempts] = useState(0);
    // const formattedTime = data.endTime.split(':').slice(0, 2).join(':');

    const MAX_RETRY_ATTEMPTS = 3;
    const RETRY_DELAY = 1000; // 1 second delay between retries

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const openModal = (e) => {
        e.preventDefault();
        document.getElementById('quiz_finish_modal').showModal();
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const attemptUpload = async (formattedAnswers, attemptNumber = 1) => {
        try {
            console.log(`Upload attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS + 1}`);
            setRetryAttempts(attemptNumber);
            const data = await uploadAnswers(formattedAnswers);
            return data;
        } catch (error) {
            console.error(`Upload attempt ${attemptNumber} failed:`, error);

            if (attemptNumber <= MAX_RETRY_ATTEMPTS) {
                console.log(`Retrying in ${RETRY_DELAY}ms...`);
                await sleep(RETRY_DELAY);
                return attemptUpload(formattedAnswers, attemptNumber + 1);
            } else {
                throw error;
            }
        }
    };

    const sendQuiz = async (e) => {
        e.preventDefault();
        const form = document.getElementById('quiz-form');
        const inputs = form.querySelectorAll('input[type="number"]');
        const answers = [];

        inputs.forEach((input, index) => {
            const value = input.value ? parseInt(input.value, 10) : 0;
            answers[index] = {
                id: parseInt(input.id, 10),
                answer: value
            };
        });

        const formattedAnswers = {
            name: localStorage.getItem("teamName"),
            lang: localStorage.getItem("language") || "hu",
            answers
        };

        console.log(formattedAnswers);

        try {
            setLoading(true);
            setError(null);
            setRetryState(null);
            setRetryAttempts(0);

            const data = await attemptUpload(formattedAnswers);

            setTeamID(data.teamID);
            localStorage.setItem("teamID", data.teamID);
            localStorage.setItem("codeword", data.codeword);
            localStorage.removeItem("quizAnswers");
            setWantToPlay("N");
        } catch (error) {
            console.error("All upload attempts failed:", error);
            setError(error.message);
            setRetryState('failed');
            setRetryAttempts(MAX_RETRY_ATTEMPTS + 1);
        } finally {
            setLoading(false);
        }
    };

    // const handleRetry = () => {
    //     setRetryState(null);
    //     setError(null);
    //     setRetryAttempts(0);
    //     // Re-open the modal to try again
    //     document.getElementById('quiz_finish_modal').showModal();
    // };

    return (
        <>
            <form id="quiz-form">
                <div className="grid grid-cols-1 gap-1 p-3">
                    {Object.entries(data.questions).map(([key, value]) => (
                        <div key={key} className="card bg-base-100 shadow-2xl h-22">
                            <div className="flex flex-row justify-between items-center px-3 py-0 card-body gap-4">
                                <div>
                                    <h2 className="card-title">{value.name}</h2>
                                    <p>{value.location}</p>
                                </div>
                                <Input
                                    id={value.id}
                                    type={"number"}
                                    className={"w-18 text-xl text-center border-2 rounded-full h-10 cursor-text touch-manipulation"}
                                    defaultValue={
                                        localStorage.getItem("quizAnswers")
                                            ? JSON.parse(localStorage.getItem("quizAnswers"))[key]?.num || ""
                                            : ""
                                    }
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/[^0-9]/g, "");

                                        if (e.target.value.length > 3) {
                                            e.target.value = e.target.value.slice(0, 3);
                                        }
                                        const stored = JSON.parse(localStorage.getItem("quizAnswers") || "{}");
                                        stored[key] = {
                                            id: parseInt(e.target.id),
                                            num: parseInt(e.target.value || "0")
                                        };
                                        setAnswerCount(Object.keys(stored).filter(key => stored[key].num > 0).length);
                                        localStorage.setItem("quizAnswers", JSON.stringify(stored));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 justify-center sticky bottom-0">
                    <div className="flex justify-center gap-3">
                        <button className="btn btn-primary w-2/6" onClick={openModal}>
                            {t("finish")}
                        </button>
                        {/* <div className="btn btn-info w-20">
                                    {isQuizActive ? formattedTime : ''}
                                </div> */}
                    </div>
                    {error && retryState !== 'failed' && (
                        <div className="alert alert-error">
                            <span>Error: {error}</span>
                        </div>
                    )}
                    <progress className="progress progress-primary w-full" value={100 / Object.keys(data.questions).length * answerCount} max="100"></progress>
                </div>
            </form>

            <dialog id="quiz_finish_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{t("finish")}</h3>
                    {retryState === 'failed' ? (
                        <>
                            <p className="py-4 text-error">{t("upload_failed")}</p>
                            <p className="py-4 text-error">{t("check_connection")}</p>
                            <br />
                            <small>Error: {error}</small>
                        </>
                    ) : (
                        <p className="py-4">{t("finish_modal_message")}</p>
                    )}
                    <form method="dialog" className="modal-action justify-around">
                        <button className="btn btn-soft btn-error" disabled={loading}>{t("cancel")}</button>
                        <button
                            className={`btn btn-success ${loading ? 'loading' : ''}`}
                            onClick={sendQuiz}
                            disabled={loading}
                        >
                            {loading ? '' : t("submit")}
                        </button>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};

export default Quiz;
