import App from "./App";
import { getISOStringFromDate, type QuizPhase, type QuizSize, type QuizLanguage } from "./utils";

export function getNextPhase(phase: QuizPhase) {
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase] as QuizPhase;
}

export let sendNextPhase: (theApp: App) => void;
export let queuePrint: (copyCount: number, lang: QuizLanguage, quizSize: QuizSize) => void;
export let setTimeTill: (time: Date) => void;

if (import.meta.env.MODE == "production") {
    // prod-mode, define actual functions
    sendNextPhase = function sendNextPhase(theApp: App) {
        const obj = { "currentPhase": theApp.state.phase, "nextPhase": getNextPhase(theApp.state.phase), "timeTillNextPhase": getISOStringFromDate(theApp.state.nextEventAt) };
        fetch("/api/admin/nextPhase", { method: "POST", body: JSON.stringify(obj) });
    }

    queuePrint = function queuePrint(copyCount: number, lang: QuizLanguage, quizSize: QuizSize) {
        const obj = { "copyCount": copyCount, "lang": lang, "quizSize": quizSize };
        fetch("/api/admin/queuePrint", { method: "POST", body: JSON.stringify(obj) });
    }

    setTimeTill = function setTimeTill(time: Date) {
        const obj = { "timeTill": getISOStringFromDate(time) };
        fetch("/api/admin/setTimeTill", { method: "POST", body: JSON.stringify(obj) });
    }
} else {
    // dev-mode, define console-printers
    sendNextPhase = function sendNextPhase(theApp: App) {
        const obj = { "currentPhase": theApp.state.phase, "nextPhase": getNextPhase(theApp.state.phase), "timeTillNextPhase": getISOStringFromDate(theApp.state.nextEventAt) };
        console.log("Sending next phase:", obj);
    }

    queuePrint = function queuePrint(copyCount: number, lang: QuizLanguage, quizSize: QuizSize) {
        const obj = { "copyCount": copyCount, "lang": lang, "quizSize": quizSize };
        console.log("Sending queue print:", obj);
    }

    setTimeTill = function setTimeTill(time: Date) {
        const obj = { "timeTill": getISOStringFromDate(time) };
        console.log("Sending set time till:", obj);
    }
}
