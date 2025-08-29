import { ArrayQueue, ConstantBackoff, Websocket, WebsocketBuilder, WebsocketEvent } from "websocket-ts";


declare global {
    function sendLeaderboardUpdated(data: any): void;
    function sendStateChanged(data: any): void;
    function sendShowQuiz(data: number): void;
}


type eventType = "leaderboardUpdated" | "stateChanged" | "showQuiz";
type listenerFunction = (data: any) => void;

const listeners: Map<eventType, Map<number, (data: any) => void>> = new Map();
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
    } while (idSet.has(id));
    idSet.add(id);
    if (!listeners.has(event)) {
        listeners.set(event, new Map);
    }
    listeners.get(event)!.set(id, func);
    return id;
}


/**
 * Removes a previously added listener-function from the Websocket Handler.
 * If the function is not found, nothing happens.
 * @param id - the id of the listener function to remove
 */
export function removeListener(id: number | null): void {
    if (id) {
        console.log("Removing listener");
        for (const elem of listeners.values()) {
            if (elem.delete(id)) return;
        }
        console.error("Could not remove listener with id", id);
    }
}


function handleMessage(_: Websocket | null, msgEvent: MessageEvent | { data: string }) {
    // callback function for handling incoming messages and calling the registered listeners
    const eventData: { event: eventType, data: Object } = JSON.parse(msgEvent.data);
    if (!eventData || !eventData.event || !eventData.data) {
        console.error("Failed to parse JSON:", msgEvent.data);
        return;
    }
    const event = eventData.event as eventType;
    if (listeners.has(event)) {
        for (const listener of listeners.get(event)!.values()) {
            listener(eventData.data);
        }
    }
}



if (import.meta.env.MODE == "production") {
    // prod-mode, connect and initialize websockets
    const ws = new WebsocketBuilder(`ws://${window.location.host}/api/admin/events`)
        .withBuffer(new ArrayQueue())           // buffer messages when disconnected
        .withBackoff(new ConstantBackoff(5000)) // retry every 5s
        .build();
    ws.addEventListener(WebsocketEvent.open, () => console.log("WS opened"));
    ws.addEventListener(WebsocketEvent.close, () => console.log("WS closed"));
    ws.addEventListener(WebsocketEvent.message, handleMessage);
} else {
    // dev-mode, set global functions for testing
    window.sendLeaderboardUpdated = () => handleMessage(null, { data: JSON.stringify({ event: "leaderboardUpdated", data: {} }) });
    window.sendStateChanged = (data: any) => handleMessage(null, { data: JSON.stringify({ event: "stateChanged", data: { data } }) });
    window.sendShowQuiz = (data: number) => handleMessage(null, { data: JSON.stringify({ event: "showQuiz", data: { "teamID": data } }) });
}

