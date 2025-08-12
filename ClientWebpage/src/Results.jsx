import React from 'react'
import { useGlobalContext } from './App';

const Results = ({ data }) => {

    const { t } = useGlobalContext();

    const formatTime = (timestamp) => {
        return timestamp.split('T')[1].split('.')[0];
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-3 p-3">
                {Object.entries(data.answers.quizdata).map(([key, value]) => (
                    <div key={key} className="card bg-base-100 shadow-2xl h-22">
                        <div className="flex flex-row justify-between items-center px-3 py-0 card-body gap-4">
                            <div>
                                <h2 className="card-title">{value.name}</h2>
                                <p>{value.location}</p>
                            </div>
                            <p className={"badge badge-xl max-w-16 min-w-16 font-medium text-black " + (value.correct ? "bg-success" : "bg-error")}>{value.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="navbar bottom-0 bg-base-200 shadow-sm px-8 sticky z-50">
                <p className="navbar-start">{t("uploaded_at")}: {formatTime(data.answers.submittedAt)}</p>
                <p className="navbar-end">{t("score")}: <span className="font-bold text-xl mx-1">{data.answers.score}</span> / {Object.keys(data.answers.quizdata).length}</p>
            </div>
        </>
    )
}

export default Results