import { ArrayQueue, ConstantBackoff, Websocket, WebsocketBuilder, WebsocketEvent } from "websocket-ts";

// Initialize WebSocket with buffering and 1s reconnection delay
const ws = new WebsocketBuilder(`ws://${window.location.host}/api/admin/events`)
    .withBuffer(new ArrayQueue())           // buffer messages when disconnected
    .withBackoff(new ConstantBackoff(5000)) // retry every 1s
    .build();

// Function to output & echo received messages
const echoOnMessage = (_: Websocket, msgEvent: MessageEvent) => {
    console.log(`received message: ${msgEvent.data}`);
};

export default function addWSListener(event: "leaderboard-update" | "state-change", func: () => void) {
    console.log("Adding listener for", event, "function:", func);
}

// Add event listeners
ws.addEventListener(WebsocketEvent.open, () => console.log("WS opened!"));
ws.addEventListener(WebsocketEvent.close, () => console.log("WS closed!"));
ws.addEventListener(WebsocketEvent.message, echoOnMessage);

