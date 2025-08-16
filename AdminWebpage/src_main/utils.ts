/* --------------------- */
/* ----- FUNCTIONS ----- */
/* --------------------- */

/**
 * Formats a Date object to ISO timestring format.
 * @param date - the Date object to format
 * @returns ISO timestring
 */
export function getISOStringFromDate(date: Date) {
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const y = date.getFullYear();
    const m = f(date.getMonth() + 1);
    const d = f(date.getDate());
    const hour = f(date.getHours());
    const min = f(date.getMinutes());
    const sec = f(date.getSeconds());
    return `${y}-${m}-${d}T${hour}:${min}:${sec}`;
}

/**
 * Formats a Date object for HH:MM:SS
 * @param date - the Date object to format
 * @returns string - The formatted time as HH:MM:SS
 */
export function getTimeFromDate(date: Date) {
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();
    return f(hh) + ":" + f(mm) + ":" + f(ss);
}

/**
 * Formats a Date object for HH:MM
 * @param date - the Date object to format
 * @returns string - The formatted time as HH:MM
 */
export function getHHMMFromDate(date: Date) {
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const hh = date.getHours();
    const mm = date.getMinutes();
    return f(hh) + ":" + f(mm);
}

/**
 * Fetches some data from `url` in GET mode, then calls the `callback` function with the data.
 * @param url - the url to fetch from
 * @param callback - the function to call with the data
 */
export function fetchData(url: string, callback: (data: any) => void) {
    fetch(url).then((response) => {
        if (response.status === 200) {
            response.json().then((json: any) => {
                callback(json);
            }, (error: string) => console.error(`Failed to parse JSON from ${url}: ${error}`));
        } else {
            console.error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}`);
        }
    });
}


/* ------------------------------- */
/* ----- TYPES and CONSTANTS ----- */
/* ------------------------------- */
export type QuizLanguage = "hu" | "en";
export type QuizSize = 20 | 100;
export type QuizPhase = "idle" | "running" | "scoring";
export const QuizPhases = { "idle": "Készenlét", "running": "Fut", "scoring": "Pontozás" };


export type QuizDetailEntry = {
    id: number;
    name: string;
    location: string;
    answer: number;
    correct: boolean;
}

export type QuizDetails = {
    teamname: string;
    language: QuizLanguage;
    score: number;
    entries: QuizDetailEntry[];
}

export type JsonQuizDetails = {
    teamname: string;
    language: string;
    score: number;
    entries: {
        id: number;
        name: string;
        location: string;
        answer: number;
        correct: boolean;
    }[]
};

export type LeaderboardItem = {
    teamID: number,
    language: QuizLanguage,
    name: string,
    score: number,
    submittedAt: Date
}

export type LeaderboardItems = LeaderboardItem[]

export type JsonLeaderboardItems = {
    teamID: number,
    language: string,
    name: string,
    score: number,
    submittedAt: string
}[];

