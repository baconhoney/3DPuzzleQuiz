import App from "./App";
import { getISOStringFromDate, type QuizPhase, type QuizSize, type QuizLanguage } from "./utils";


function sendData(url: string, data: any) {
    if (import.meta.env.MODE == "production") {
        // prod-mode, do actual fetch
        fetch(url, { method: "POST", body: JSON.stringify(data) });
    } else {
        // dev-mode, print to console
        console.log(`Sending data to ${url}:`, data);
    }
}


export function getNextPhase(phase: QuizPhase) {
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase] as QuizPhase;
}

export function sendNextPhase(theApp: App) {
    sendData("/api/admin/nextPhase",
        {
            "currentPhase": theApp.state.phase,
            "nextPhase": getNextPhase(theApp.state.phase),
            "nextPhaseChangeAt": getISOStringFromDate(theApp.state.nextPhaseChangeAt),
        });
}

export function queuePrint(copyCount: number, lang: QuizLanguage, quizSize: QuizSize) {
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
    sendData("/api/admin/uploadAnswers",
        {
            name: name,
            answers: answers
        });
}

