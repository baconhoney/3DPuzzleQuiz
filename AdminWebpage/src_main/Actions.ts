import { logger } from "./Logger";
import { getISOStringFromDate, type QuizLanguage, type QuizPhase, type QuizSize } from "./utils";

function sendData(url: string, data: unknown) {
    console.log("sendData called for URL:", url, "data:", data);
    if (import.meta.env.MODE == "production") {
        fetch(url, { method: "POST", body: JSON.stringify(data) }).then(
            () => logger.log("info", `Data sent successfully to ${url}`),
            (error: string) => logger.log("error", `Failed to send data to ${url}: ${error}`)
        );
    } else {
        console.log("Dev mode: skipping actual sending");
    }
}

export function getNextPhase(phase: QuizPhase) {
    console.log("getNextPhase called with phase:", phase);
    return { "idle": "running", "running": "scoring", "scoring": "idle" }[phase] as QuizPhase;
}

export function sendNextPhase(phase: QuizPhase, nextPhase: QuizPhase, nextPhaseChangeAt: Date) {
    console.log("sendNextPhase called with current:", phase, "next:", nextPhase);
    sendData("/api/admin/nextPhase",
        {
            "currentPhase": phase,
            "nextPhase": nextPhase,
            "nextPhaseChangeAt": getISOStringFromDate(nextPhaseChangeAt),
        });
}

export function setQuizRound(round: number) {
    console.log("setQuizRound called with round:", round);
    sendData("/api/admin/setQuizRound",
        {
            "newQuizRound": round
        });
}

export function printQuiz(teamID: number) {
    console.log("printQuiz called for teamID:", teamID);
    sendData("/api/admin/queuePrint",
        {
            "teamID": teamID
        });
}

export function queuePrint(copyCount: number, language: QuizLanguage, quizSize: QuizSize) {
    console.log("queuePrint called with count:", copyCount, "lang:", language, "size:", quizSize);
    sendData("/api/admin/queuePrint",
        {
            "copyCount": copyCount,
            "language": language,
            "quizSize": quizSize
        });
}

export function sendNewNextPhaseChangeAt(time: Date) {
    console.log("sendNewNextPhaseChangeAt called with time:", time);
    sendData("/api/admin/setNextPhaseChangeAt",
        {
            "nextPhaseChangeAt": getISOStringFromDate(time)
        });
}

export function uploadAnswers(teamID: number, name: string, answers: { id: number, answer: number }[]) {
    console.log("uploadAnswers called for team:", teamID, "name:", name, "answers:", answers);
    sendData("/api/admin/uploadQuiz",
        {
            teamID: teamID,
            name: name,
            answers: answers
        });
}
