import { getISOStringFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "./utils";


function sendData(url: string, data: any) {
    console.log(`Sending data to ${url}:\n`, data);
    if (import.meta.env.MODE == "production") {
        // prod-mode, do actual fetch
        fetch(url, { method: "POST", body: JSON.stringify(data) });
    } else {
        // dev-mode, doing nothing else
    }
}


export function getNextPhase(phase: QuizPhase) {
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase] as QuizPhase;
}

export function sendNextPhase(phase: QuizPhase, nextPhaseChangeAt: Date) {
    sendData("/api/admin/nextPhase",
        {
            "currentPhase": phase,
            "nextPhaseChangeAt": getISOStringFromDate(nextPhaseChangeAt),
        });
}

export function printQuiz(teamID: number) {
    sendData("/api/admin/queuePrint",
        {
            "teamID": teamID
        });
}

export function printEmptyQuiz(copyCount: number, lang: QuizLanguage, quizSize: QuizSize) {
    sendData("/api/admin/queuePrint",
        {
            "copyCount": copyCount,
            "lang": lang,
            "quizSize": quizSize
        });
}

export function sendNewNextPhaseChangeAt(time: Date) {
    sendData("/api/admin/setNextPhaseChangeAt",
        {
            "nextPhaseChangeAt": getISOStringFromDate(time)
        });
}

export function uploadAnswers(name: string, answers: { id: number, answer: number }[]) {
    sendData("/api/admin/uploadQuiz",
        {
            name: name,
            answers: answers
        });
}

