import { useEffect } from 'react';
import { useGlobalContext } from './App';
import Input from './Input';

const Quiz = ({ data }) => {

    const { t } = useGlobalContext();
    const formattedTime = data.endTime.split(':').slice(0, 2).join(':');

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

    const sendQuiz = (e) => {
        e.preventDefault();
        const form = document.getElementById('quiz-form');
        const inputs = form.querySelectorAll('input[type="number"]');
        const answers = {};

        inputs.forEach((input, index) => {
            const value = input.value ? parseInt(input.value, 10) : 0;
            answers[index.toString()] = {
                id: parseInt(input.id, 10),
                num: value
            };
        });

        const formattedAnswers = {
            name: localStorage.getItem("teamName"),
            lang: localStorage.getItem("language") || "hu",
            answers
        };

        console.log(formattedAnswers);
    };

    return (
        <>
            <form id="quiz-form">
                <div className="grid grid-cols-1 gap-1 p-3">
                    {Object.entries(data.quizdata).map(([key, value]) => (
                        <div key={key} className="card bg-base-100 shadow-2xl h-22">
                            <div className="flex flex-row justify-between items-center px-3 py-0 card-body gap-4">
                                <div>
                                    <h2 className="card-title">{value.name}</h2>
                                    <p>{value.city === "-" ? value.country : `${value.city}, ${value.country}`}</p>
                                </div>
                                <Input
                                    id={value.id}
                                    type={"number"}
                                    className={"w-18 text-xl text-center border-2 rounded-full h-10 cursor-text touch-manipulation"}
                                    min={1}
                                    max={100}
                                    defaultValue={
                                        localStorage.getItem("quizAnswers")
                                            ? JSON.parse(localStorage.getItem("quizAnswers"))[key]?.num || ""
                                            : ""
                                    }
                                    onInput={(e) => {
                                        if (e.target.value.length > 3) {
                                            e.target.value = e.target.value.slice(0, 3);
                                        }
                                        const stored = JSON.parse(localStorage.getItem("quizAnswers") || "{}");
                                        stored[key] = {
                                            id: parseInt(e.target.id),
                                            num: parseInt(e.target.value || "0")
                                        };
                                        localStorage.setItem("quizAnswers", JSON.stringify(stored));
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 justify-center sticky bottom-0">
                    <div className="flex justify-center gap-3">
                        <button className="btn btn-primary w-60" onClick={openModal}>
                            {t("finish")}
                        </button>
                        {/* <div className="btn btn-info w-20">
                                    {isQuizActive ? formattedTime : ''}
                                </div> */}
                    </div>
                    <progress className="progress progress-primary w-full" value="40" max="100"></progress>
                </div>
            </form>

            <dialog id="quiz_finish_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{t("finish")}</h3>
                    <p className="py-4">{t("finish_modal_message")}</p>
                    <form method="dialog" className="modal-action justify-around">
                        <button className="btn btn-soft btn-error">{t("cancel")}</button>
                        <button className="btn btn-success" onClick={sendQuiz}>{t("continue")}</button>
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
