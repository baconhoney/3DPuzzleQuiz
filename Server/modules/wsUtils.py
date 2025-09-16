import logging

_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


from aiohttp.web import WebSocketResponse
from typing import Callable
import asyncio
import json


clientCons: list[WebSocketResponse] = []
adminCons: list[WebSocketResponse] = []

_clientMsgEventListeners: dict[str, list[Callable]] = {}
_adminMsgEventListeners: dict[str, list[Callable]] = {}


async def broadcastToClients(eventType: str, data: dict[str, any]):
    """
    EventTypes: "quizStarted", "quizEnded", "resultsReady"
    """
    if eventType not in ["quizStarted", "quizEnded", "resultsReady", "nextPhaseChangeAtChanged"]:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data}, ensure_ascii=False, separators=(",", ":"))
    _logger.debug(f"Broadcasting to clients: eventType={eventType}, numClients={len(clientCons)}, dataKeys={list(data.keys()) if isinstance(data, dict) else None}")
    await asyncio.gather(*[client.send_str(jsonStr) for client in clientCons])
    _logger.info(f"Broadcasted event {eventType} to {len(clientCons)} clients")


async def broadcastToAdmins(eventType: str, data: dict[str, any]):
    """
    EventTypes: "leaderboardUpdated", "stateChanged", "showQuiz"
    """
    if eventType not in ["leaderboardUpdated", "stateChanged", "showQuiz"]:
        raise ValueError(f"Invalid event type: {eventType}")
    jsonStr = json.dumps({"event": eventType, "data": data}, ensure_ascii=False, separators=(",", ":"))
    _logger.debug(f"Broadcasting to admins: eventType={eventType}, numAdmins={len(adminCons)}, dataKeys={list(data.keys()) if isinstance(data, dict) else None}")
    await asyncio.gather(*[client.send_str(jsonStr) for client in adminCons])
    _logger.info(f"Broadcasted event {eventType} to {len(adminCons)} admins")


def addClientMsgEventListener(eventType: str, listener: Callable):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _clientMsgEventListeners:
        _clientMsgEventListeners[eventType] = []
    _clientMsgEventListeners[eventType].append(listener)
    _logger.debug(f"Added client message event listener for eventType={eventType}, totalListeners={len(_clientMsgEventListeners[eventType])}")


def addAdminMsgEventListener(eventType: str, listener: Callable):
    if eventType not in []:
        raise ValueError(f"Invalid event type: {eventType}")
    if eventType not in _adminMsgEventListeners:
        _adminMsgEventListeners[eventType] = []
    _adminMsgEventListeners[eventType].append(listener)
    _logger.debug(f"Added admin message event listener for eventType={eventType}, totalListeners={len(_adminMsgEventListeners[eventType])}")
