import App, { getISOString} from "./App";

export type SupportedLanguages = "hu" | "en";

export type QuizSize = 20 | 100;

export type Phase = "idle" | "running" | "scoring";


function getNextPhase(phase: Phase) {
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase];
}

export function sendNextPhase(theApp: App) {
    const obj = { "currentPhase": theApp.state.phase, "nextPhase": getNextPhase(theApp.state.phase), "timeTillNextPhase": getISOString(theApp.state.nextEventAt) };
    //fetch("/api/admin/nextPhase", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending next phase:", obj);
}

export function queuePrint(copyCount: number, lang: SupportedLanguages, quizSize: QuizSize) {
    const obj = { "copyCount": copyCount, "lang": lang, "quizSize": quizSize };
    //fetch("/api/admin/queuePrint", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending queue print:", obj);
}

export function setTimeTill(time: Date) {
    const obj = { "timeTill": getISOString(time) };
    //fetch("/api/admin/setTimeTill", { method: "POST", body: JSON.stringify(obj) });
    console.log("Sending set time till:", obj);
}


