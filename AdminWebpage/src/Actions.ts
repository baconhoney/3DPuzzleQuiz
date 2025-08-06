import App from "./App";
import { getISOStringFromDate, type QuizPhase, type QuizSize, type QuizLanguage } from "./utils";


export function getNextPhase(phase: QuizPhase) {
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase];
}

export function sendNextPhase(theApp: App) {
    const obj = { "currentPhase": theApp.state.phase, "nextPhase": getNextPhase(theApp.state.phase), "timeTillNextPhase": getISOStringFromDate(theApp.state.nextEventAt) };
    //fetch("/api/admin/nextPhase", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending next phase:", obj);
}

export function queuePrint(copyCount: number, lang: QuizLanguage, quizSize: QuizSize) {
    const obj = { "copyCount": copyCount, "lang": lang, "quizSize": quizSize };
    //fetch("/api/admin/queuePrint", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending queue print:", obj);
}

export function setTimeTill(time: Date) {
    const obj = { "timeTill": getISOStringFromDate(time) };
    //fetch("/api/admin/setTimeTill", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending set time till:", obj);
}


