import json
from aiohttp.web import WebSocketResponse
import asyncio

clientCons: list[WebSocketResponse] = []
adminCons: list[WebSocketResponse] = []

_clientMsgEventListeners: dict[str, list[function]] = {}
_adminMsgEventListeners: dict[str, list[function]] = {}


async def broadcastToClients(eventType: str, data: dict[str, any] = None):
    if eventType not in ["quizStarted", "quizEnded", "resultsReady"]:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data})
    await asyncio.gather(*[client.send_str(jsonStr) for client in clientCons])


async def broadcastToAdmins(eventType: str, data: dict[str, any] = None):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data})
    await asyncio.gather(*[client.send_str(jsonStr) for client in adminCons])


def addClientMsgEventListener(eventType: str, listener: function):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _clientMsgEventListeners:
        _clientMsgEventListeners[eventType] = []
    _clientMsgEventListeners[eventType].add(listener)


def addAdminMsgEventListener(eventType: str, listener: function):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _adminMsgEventListeners:
        _adminMsgEventListeners[eventType] = []
    _adminMsgEventListeners[eventType].add(listener)
