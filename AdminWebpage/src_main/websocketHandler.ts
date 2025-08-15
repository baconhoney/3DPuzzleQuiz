import { ArrayQueue, ConstantBackoff, Websocket, WebsocketBuilder, WebsocketEvent } from "websocket-ts";


declare global {
    function sendLeaderboardUpdated(data: any): void;
    function sendStateChanged(data: any): void;
    function sendPaperQuizScanned(data: number): void;
}


export type eventType = "leaderboardUpdated" | "stateChanged" | "paperQuizScanned";
export type listenerFunction = (data: any) => void;

const listeners: Map<eventType, Set<(data: any) => void>> = new Map();


/**
 * Add a new listener-function to the Websocket Handler. Remove it with `removeListener`.
 * @param event - the event to call back on
 * @param func - the listener function to add
 * @returns the fucntion itself for removal
 */
export function addListener(event: eventType, func: listenerFunction): listenerFunction {
    console.log("Adding listener for", event);
    if (!listeners.has(event)) {
        listeners.set(event, new Set());
    }
    listeners.get(event)!.add(func);
    return func;
}


/**
 * Removes a previously added listener-function from the Websocket Handler.
 * If the function is not found, nothing happens.
 * @param func - the listener function to remove
 */
export function removeListener(func: listenerFunction | null): void {
    console.log("Removing listener");
    if (func) {
        for (const elem of listeners.values()) {
            if (elem.delete(func)) return;
        }
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
        for (const listener of listeners.get(event)!) {
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
    window.sendPaperQuizScanned = (data: number) => handleMessage(null, { data: JSON.stringify({ event: "leaderboardUpdated", data: { "teamID": data } }) });
}

