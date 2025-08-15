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

export function fetchData(url: string, callback: (data: any) => void) {
    fetch(url).then((response) => {
        response.json().then((json: any) => {
            callback(json);
        })
    });
}


/* -------------------------------- */
/* ----- TYPES and INTERFACES ----- */
/* -------------------------------- */
export type QuizLanguage = "hu" | "en";

export type QuizSize = 20 | 100;

export type QuizPhase = "idle" | "running" | "scoring";


export type Question = {
    id: number;
    name: string;
    location: string;
    answer: number;
    correct: boolean;
}

export type QuizDetails = {
    name: string;
    language: QuizLanguage;
    score: number;
    timestamp: Date;
    questions: Question[];
}

export type QuizResult = {
    teamID: number,
    name: string,
    language: QuizLanguage,
    quizSize: QuizSize,
    score: number,
    submittedAt: Date
}

export type QuizResults = QuizResult[]

export type RawQuizResults = {
    teamID: number,
    name: string,
    language: string,
    size: number,
    score: number,
    submittedAt: string
}[];

export type RawQuizDetails = {
    name: string,
    language: string,
    score: number,
    timestamp: string,
    questions: {
        id: number,
        name: string,
        location: string,
        answer: number,
        correct: boolean
    }[]
};

