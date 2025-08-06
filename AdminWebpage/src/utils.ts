/* --------------------- */
/* ----- FUNCTIONS ----- */
/* --------------------- */
export function getISOStringFromDate(date: Date) {
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const y = date.getFullYear();
    const m = f(date.getMonth() + 1);
    const d = f(date.getDate());
    const hour = f(date.getHours());
    const min = f(date.getMinutes());
    const sec = f(date.getSeconds());
    return `${y}-${m}-${d}T${hour}:${min}:${sec}Z`;
}

export function getTimeFromDate(date: Date) {
    const z = (n: number) => (n > 9 ? "" : "0") + n;
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds();
    return z(hh) + ":" + z(mm) + ":" + z(ss);
}

export function getHHMMFromDate(date: Date) {
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const hh = date.getHours();
    const mm = date.getMinutes();
    return f(hh) + ":" + f(mm);
}


/* -------------------------------- */
/* ----- TYPES and INTERFACES ----- */
/* -------------------------------- */
export type QuizLanguage = "hu" | "en";

export type QuizSize = 20 | 100;

export type QuizPhase = "idle" | "running" | "scoring";


export interface Question {
    name: string;
    country: string;
    city: string;
    buildingID: number;
    answer: number;
    correct: boolean;
}

export interface Quiz {
    name: string;
    language: string;
    score: number;
    timestamp: Date;
    questions: {
        [index: string]: Question;
    };
}

export interface QuizResult {
    teamID: number;
    name: string;
    score: number;
    timestamp: Date;
}

export interface QuizResults {
    [index: string]: QuizResult;
}

export interface JSONQuizResults {
    [index: string]: {
        teamID: number;
        name: string;
        score: number;
        timestamp: string;
    };
}

export interface JSONQuizDetails {
    name: string;
    language: string;
    score: number;
    timestamp: string;
    questions: {
        [index: string]: Question;
    };
}
