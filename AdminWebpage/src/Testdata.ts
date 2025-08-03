const datastring = `{
    "0": {
        "teamID": 1847629345,
        "name": "Alpha Sparks",
        "score": 15,
        "timestamp": "2025-07-10T14:23:45.000Z"
    },
    "1": {
        "teamID": 9873459382,
        "name": "Quantum Ninjas",
        "score": 18,
        "timestamp": "2025-07-12T09:55:12.000Z"
    },
    "2": {
        "teamID": 1023948573,
        "name": "Neon Eagles",
        "score": 12,
        "timestamp": "2025-07-11T17:40:00.000Z"
    },
    "3": {
        "teamID": 5738291047,
        "name": "Crimson Coders",
        "score": 20,
        "timestamp": "2025-07-13T08:22:01.000Z"
    },
    "4": {
        "teamID": 8374629184,
        "name": "Binary Bandits",
        "score": 6,
        "timestamp": "2025-07-10T13:15:33.000Z"
    },
    "5": {
        "teamID": 6392018473,
        "name": "Pixel Panthers",
        "score": 17,
        "timestamp": "2025-07-12T18:10:45.000Z"
    },
    "6": {
        "teamID": 9283746501,
        "name": "Tech Tornadoes",
        "score": 13,
        "timestamp": "2025-07-13T12:34:21.000Z"
    },
    "7": {
        "teamID": 1983745603,
        "name": "Cyber Knights",
        "score": 10,
        "timestamp": "2025-07-14T07:19:00.000Z"
    },
    "8": {
        "teamID": 7638291045,
        "name": "Robo Rangers",
        "score": 8,
        "timestamp": "2025-07-11T11:45:10.000Z"
    },
    "9": {
        "teamID": 1827364502,
        "name": "Code Commandos",
        "score": 14,
        "timestamp": "2025-07-10T16:50:30.000Z"
    },
    "10": {
        "teamID": 2983746590,
        "name": "Data Dynamos",
        "score": 19,
        "timestamp": "2025-07-12T10:05:00.000Z"
    },
    "11": {
        "teamID": 3482901763,
        "name": "Debugging Ducks",
        "score": 7,
        "timestamp": "2025-07-13T15:45:20.000Z"
    },
    "12": {
        "teamID": 4567839201,
        "name": "Syntax Serpents",
        "score": 11,
        "timestamp": "2025-07-14T14:00:00.000Z"
    },
    "13": {
        "teamID": 6728391045,
        "name": "Script Spartans",
        "score": 16,
        "timestamp": "2025-07-11T13:20:15.000Z"
    },
    "14": {
        "teamID": 1234987650,
        "name": "Bit Brawlers",
        "score": 5,
        "timestamp": "2025-07-12T19:00:45.000Z"
    },
    "15": {
        "teamID": 8392017465,
        "name": "Function Foxes",
        "score": 9,
        "timestamp": "2025-07-13T16:50:10.000Z"
    },
    "16": {
        "teamID": 1847623456,
        "name": "Loop Legends",
        "score": 4,
        "timestamp": "2025-07-10T11:10:00.000Z"
    },
    "17": {
        "teamID": 2948576132,
        "name": "Hex Hackers",
        "score": 3,
        "timestamp": "2025-07-11T18:30:25.000Z"
    },
    "18": {
        "teamID": 9473629183,
        "name": "Compile Crew",
        "score": 20,
        "timestamp": "2025-07-12T20:05:55.000Z"
    },
    "19": {
        "teamID": 5071928374,
        "name": "Object Oracles",
        "score": 2,
        "timestamp": "2025-07-13T09:25:00.000Z"
    },
    "20": {
        "teamID": 1938475620,
        "name": "Stack Storm",
        "score": 0,
        "timestamp": "2025-07-14T21:15:40.000Z"
    },
    "21": {
        "teamID": 8374562019,
        "name": "Token Titans",
        "score": 1,
        "timestamp": "2025-07-10T08:30:45.000Z"
    },
    "22": {
        "teamID": 9182736450,
        "name": "Runtime Rebels",
        "score": 13,
        "timestamp": "2025-07-11T22:40:50.000Z"
    },
    "23": {
        "teamID": 2847561938,
        "name": "Kernel Kings",
        "score": 16,
        "timestamp": "2025-07-12T17:10:00.000Z"
    },
    "24": {
        "teamID": 6748291057,
        "name": "Bug Busters",
        "score": 11,
        "timestamp": "2025-07-13T06:00:00.000Z"
    }
}`




import type { QuizResults } from "./Components/QuizResultsComponent"

interface jsonItem {
    teamID: number,
    name: string,
    score: number,
    timestamp: string
}

export function loaddata() {
    const json = JSON.parse(datastring) as {[index: string]: jsonItem};
    const result: QuizResults = {};
    for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
            const item = json[key];
            result[key] = {
                ...item,
                timestamp: new Date(item.timestamp)
            }
        }
    }
    return result;
}
