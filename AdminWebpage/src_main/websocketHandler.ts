import { ArrayQueue, ConstantBackoff, Websocket, WebsocketBuilder, WebsocketEvent } from "websocket-ts";


declare global {
    function sendLeaderboardUpdated(data: unknown): void;
    function sendStateChanged(data: unknown): void;
    function sendShowQuiz(data: number): void;
}


type eventType = "leaderboardUpdated" | "stateChanged" | "showQuiz";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type listenerFunction = (data: any) => void;

const listeners: Map<eventType, Map<number, (data: unknown) => void>> = new Map();
const idSet = new Set<number>();

/**
 * Add a new listener-function to the Websocket Handler. Remove it with `removeListener`.
 * @param event - the event to call back on
 * @param func - the listener function to add
 * @returns the id of the function just added for later removal
 */
export function addListener(event: eventType, func: listenerFunction): number {
    console.log("Adding listener for", event);
    let id = null;
    do {
        id = Math.floor(Math.random() * 1000000);
        console.log("Generated listener id:", id);
    } while (idSet.has(id));
    idSet.add(id);
    console.log("Listener id added to idSet:", id);
    if (!listeners.has(event)) {
        listeners.set(event, new Map());
        console.log("Created new map for event listeners:", event);
    }
    listeners.get(event)!.set(id, func);
    console.log("Listener function added for event:", event, id);
    return id;
}

/**
 * Removes a previously added listener-function from the Websocket Handler.
 * If the function is not found, nothing happens.
 * @param id - the id of the listener function to remove
 */
export function removeListener(id: number | null): void {
    if (id) {
        console.log("Removing listener with id:", id);
        let removed = false;
        for (const elem of listeners.values()) {
            if (elem.delete(id)) {
                removed = true;
                console.log("Listener removed:", id);
                break;
            }
        }
        if (!removed) {
            console.error(`Failed to remove listener id ${id}`);
        }
    }
}

function handleMessage(_: Websocket | null, msgEvent: MessageEvent | { data: string }) {
    console.log("handleMessage called with data:", msgEvent.data);
    let eventData: { event: eventType, data: object };
    try {
        eventData = JSON.parse(msgEvent.data as string) as { event: eventType, data: object };
    } catch (err) {
        console.error("JSON parse failed for data:", msgEvent.data, err);
        return;
    }
    if (!eventData || !eventData.event || !eventData.data) {
        console.error("Invalid eventData object:", eventData);
        return;
    }
    console.log("Event received:", eventData.event, eventData.data);
    if (listeners.has(eventData.event)) {
        for (const listener of listeners.get(eventData.event)!.values()) {
            console.log("Calling listener for event:", eventData.event);
            listener(eventData.data);
        }
    }
}

if (import.meta.env.MODE === "production") {
    console.log("Prod mode: connecting to websocket");
    const ws = new WebsocketBuilder(`ws://${window.location.host}/api/admin/events`)
        .withBuffer(new ArrayQueue())           // buffer messages when disconnected
        .withBackoff(new ConstantBackoff(5000)) // retry every 5s
        .build();
    ws.addEventListener(WebsocketEvent.open, () => {
        console.log("WS connection opened");
    });
    ws.addEventListener(WebsocketEvent.close, () => {
        console.log("WS connection closed");
    });
    ws.addEventListener(WebsocketEvent.message, handleMessage);
} else {
    console.log("Dev mode: setting global test functions");
    window.sendLeaderboardUpdated = () => handleMessage(null, { data: JSON.stringify({ event: "leaderboardUpdated", data: {} }) });
    window.sendStateChanged = (data: unknown) => handleMessage(null, { data: JSON.stringify({ event: "stateChanged", data: { data } }) });
    window.sendShowQuiz = (data: number) => handleMessage(null, { data: JSON.stringify({ event: "showQuiz", data: { "teamID": data } }) });
}
