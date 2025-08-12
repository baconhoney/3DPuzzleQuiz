from typing import Callable
from aiohttp.web import WebSocketResponse
import asyncio
import json

clientCons: list[WebSocketResponse] = []
adminCons: list[WebSocketResponse] = []

_clientMsgEventListeners: dict[str, list[Callable]] = {}
_adminMsgEventListeners: dict[str, list[Callable]] = {}


async def broadcastToClients(eventType: str, data: dict[str, any] = None):
    """
    EventTypes: "quizStarted", "quizEnded", "resultsReady"
    """
    if eventType not in ["quizStarted", "quizEnded", "resultsReady"]:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data}, ensure_ascii=False, separators=(",", ":"))
    await asyncio.gather(*[client.send_str(jsonStr) for client in clientCons])


async def broadcastToAdmins(eventType: str, data: dict[str, any] = None):
    """
    EventTypes: "leaderboardUpdated", "statusChanged"
    """
    if eventType not in ["leaderboardUpdated", "statusChanged"]:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data}, ensure_ascii=False, separators=(",", ":"))
    await asyncio.gather(*[client.send_str(jsonStr) for client in adminCons])


def addClientMsgEventListener(eventType: str, listener: Callable):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _clientMsgEventListeners:
        _clientMsgEventListeners[eventType] = []
    _clientMsgEventListeners[eventType].add(listener)


def addAdminMsgEventListener(eventType: str, listener: Callable):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _adminMsgEventListeners:
        _adminMsgEventListeners[eventType] = []
    _adminMsgEventListeners[eventType].add(listener)
