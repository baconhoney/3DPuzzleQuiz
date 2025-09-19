// Use relative URLs in development to work with Vite proxy
// In production, we might need to set this to the full domain
const DOMAIN = ""

export async function getQuizPhase() {
    const url = `${DOMAIN}/api/client/getQuizPhase`
    console.log("Fetching quiz phase from:", url)

    const response = await fetch(url, {
        method: "GET",
    })

    if (!response.ok) {
        throw new Error("Failed to fetch quiz phase")
    }
    return response.json()
}

export async function getQuestions(lang, size) {
    const url = `${DOMAIN}/api/client/getQuestions?lang=${lang}&size=${size}`
    console.log("Fetching questions from:", url)

    const response = await fetch(url, {
        method: "GET",
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(
            "API Error:",
            response.status,
            response.statusText,
            errorText
        )
        throw new Error(
            `Failed to fetch questions: ${response.status} ${response.statusText}`
        )
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error(
            "Expected JSON but received:",
            contentType,
            responseText.substring(0, 200)
        )
        throw new Error("Server returned non-JSON response")
    }

    return response.json()
}

export async function uploadAnswers(body) {
    const response = await fetch(`${DOMAIN}/api/client/uploadAnswers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
    if (!response.ok) {
        throw new Error("Failed to upload answers")
    }
    return response.json()
}

export async function getAnswers(teamID) {
    const response = await fetch(
        `${DOMAIN}/api/client/getAnswers?teamID=${teamID}`,
        {
            method: "GET",
        }
    )
    if (!response.ok) {
        throw new Error("Failed to fetch answers")
    }
    return response.json()
}

export async function downloadResults(teamID) {
    const response = await fetch(
        `${DOMAIN}/api/client/getPDF?teamID=${teamID}`,
        {
            method: "GET",
        }
    )
    if (!response.ok) {
        throw new Error("Failed to download results")
    }
    return response.blob()
}
