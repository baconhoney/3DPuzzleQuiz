import { ArrayQueue, ConstantBackoff, Websocket, WebsocketBuilder, WebsocketEvent } from "websocket-ts";


declare global {
    function sendWSMessage(data: string): void;
}

export type eventType = "leaderboardUpdated" | "stateChanged";
export type listenerFunction = (data: any) => void;

const listeners: Map<eventType, Set<(data: any) => void>> = new Map();

export default function addListener(event: eventType, func: listenerFunction) {
    console.log("Adding listener for", event);
    if (!listeners.has(event)) {
        listeners.set(event, new Set());
    }
    listeners.get(event)!.add(func);
    return func;
}

export function removeListener(func: listenerFunction | null) {
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
    window.sendWSMessage = (data: Object) => handleMessage(null, { data: JSON.stringify(data) });
}

