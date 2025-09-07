import { getISOStringFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "./utils";


function sendData(url: string, data: unknown) {
    console.log(`Sending data to ${url}:\n`, data);
    if (import.meta.env.MODE == "production") {
        // prod-mode, do actual fetch
        fetch(url, { method: "POST", body: JSON.stringify(data) }).then(() => { }, error => console.error(error));
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

export function queuePrint(copyCount: number, language: QuizLanguage, quizSize: QuizSize) {
    sendData("/api/admin/queuePrint",
        {
            "copyCount": copyCount,
            "language": language,
            "quizSize": quizSize
        });
}

export function sendNewNextPhaseChangeAt(time: Date) {
    sendData("/api/admin/setNextPhaseChangeAt",
        {
            "nextPhaseChangeAt": getISOStringFromDate(time)
        });
}

export function uploadAnswers(teamID: number, name: string, answers: { id: number, answer: number }[]) {
    sendData("/api/admin/uploadQuiz",
        {
            teamID: teamID,
            name: name,
            answers: answers
        });
}

