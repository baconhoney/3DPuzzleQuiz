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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchData(url: string, callback: (data: any) => void) {
    void fetch(url).then((response) => {
        if (response.status === 200) {
            response.json().then((json: unknown) => {
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
export const QuizLanguages = { "hu": "Magyar", "en": "Angol" } as const;
export type QuizLanguage = keyof typeof QuizLanguages;
export const QuizSizes = [20, 100] as const;
export type QuizSize = typeof QuizSizes[number];
export const QuizPhases = { "idle": "Készenlét", "running": "Fut", "scoring": "Pontozás" } as const;
export type QuizPhase = keyof typeof QuizPhases;


export type QuizDetailQuestion = {
    id: number,
    name: string,
    location: string,
    answer: number | null,
    correct: boolean | null,
}

export type QuizDetails = {
    teamname: string | null,
    codeword: string | null,
    language: QuizLanguage,
    score: number | null,
    submittedAt: Date | null,
    questions: QuizDetailQuestion[],
}

export type JsonQuizDetails = {
    teamname: string | null,
    codeword: string | null,
    language: string,
    score: number | null,
    submittedAt: string | null,
    questions: {
        id: number,
        name: string,
        location: string,
        answer: number | null,
        correct: boolean | null,
    }[],
}

export type LeaderboardItem = {
    teamID: number,
    teamname: string | null,
    codeword: string | null,
    language: QuizLanguage,
    size: QuizSize,
    score: number | null,
    submittedAt: Date | null,
}

export type LeaderboardItems = LeaderboardItem[]

export type JsonLeaderboardItems = {
    teamID: number,
    teamname: string | null,
    codeword: string | null,
    language: string,
    size: number,
    score: number | null,
    submittedAt: string | null,
}[]

