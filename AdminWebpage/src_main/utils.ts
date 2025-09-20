/* --------------------- */
/* ----- FUNCTIONS ----- */
/* --------------------- */

/**
 * Formats a Date object to ISO timestring format.
 * @param date - the Date object to format
 * @returns ISO timestring
 */
export function getISOStringFromDate(date: Date) {
    console.log("getISOStringFromDate called with date:", date);
    const f = (n: number) => (n > 9 ? "" : "0") + n;
    const y = date.getFullYear();
    const m = f(date.getMonth() + 1);
    const d = f(date.getDate());
    const hour = f(date.getHours());
    const min = f(date.getMinutes());
    const sec = f(date.getSeconds());
    const isoString = `${y}-${m}-${d}T${hour}:${min}:${sec}`;
    console.log("ISO string generated:", isoString);
    return isoString;
}

/**
 * Formats a Date object for HH:MM:SS
 * @param date - the Date object to format
 * @returns string - The formatted time as HH:MM:SS
 */
export function getTimeFromDate(date: Date) {
    console.log("getTimeFromDate called with date:", date);
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();
    const timeString = (n: number) => (n > 9 ? "" : "0") + n;
    const formatted = timeString(hh) + ":" + timeString(mm) + ":" + timeString(ss);
    console.log("Time formatted to HH:MM:SS:", formatted);
    return formatted;
}

/**
 * Formats a Date object for HH:MM
 * @param date - the Date object to format
 * @returns string - The formatted time as HH:MM
 */
export function getHHMMFromDate(date: Date) {
    console.log("getHHMMFromDate called with date:", date);
    const hh = date.getHours();
    const mm = date.getMinutes();
    const timeString = (n: number) => (n > 9 ? "" : "0") + n;
    const formatted = timeString(hh) + ":" + timeString(mm);
    console.log("Time formatted to HH:MM:", formatted);
    return formatted;
}

/**
 * Fetches some data from `url` in GET mode, then calls the `callback` function with the data.
 * @param url - the url to fetch from
 * @param callback - the function to call with the data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchData(url: string, callback: (data: any) => void) {
    console.log("fetchData called for URL:", url);
    void fetch(url).then((response) => {
        console.log("Fetch response received for URL:", url, response.status);
        if (response.status === 200) {
            response.json().then(
                (json: unknown) => {
                    console.log("JSON parsed successfully for URL:", url);
                    callback(json);
                },
                (error: string) => {
                    console.error("JSON parse failed for URL:", url, error);
                }
            );
        } else {
            console.error("Fetch failed for URL:", url, response.status);
        }
    },
        (error: string) => console.error("Fetch failed for URL:", url, "error:", error)
    );
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
