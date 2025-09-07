import re
from typing import Any, Callable
import asyncio
import logging
import sys
import threading
import time


_logger = logging.getLogger(__name__)
_logger.info(f"Importing {__name__}...")


######################################################################
############################ WINDOWS CODE ############################
######################################################################
if sys.platform == "win32":
    _logger.info("Scanner running on windows, using Tk dummy code for testing")

    class Scanner:
        """
        Dummy scanner class for testing with Tk as async input.

        Usage:
        - `await Scanner(callbackFunction).run_forever(stopEvent)` or
        - `asyncio.create_task(Scanner(callbackFunction).run_forever(stopEvent))`
        """

        def __init__(self, callbackFn: Callable[[str], Any] = None, loop=None):
            self._callbackFunction = callbackFn or (lambda x: None)
            self._loop = loop

        def _callback(self):
            value = self._inputVar.get()
            if value:
                _logger.debug(f"Calling cbf from scanner.py with value: {value}")
                asyncio.run_coroutine_threadsafe(self._callbackFunction(value), self._loop)
            self._inputVar.set("")
            self._inputbox.focus()

        def _innerLoop(self, stopEvent: threading.Event):
            import tkinter as tk

            _logger.info("Starting the Tk loop")
            if stopEvent is None:
                raise ValueError("stopEvent is required")
            # set up basic tk interface
            self._root = tk.Tk()
            self._root.title("Dummy Scanner Input")
            self._root.geometry("400x150")
            self._root.resizable(False, False)

            self._inputVar = tk.StringVar(self._root, "")
            self._frame = tk.Frame(self._root)
            self._frame.pack()

            self._label = tk.Label(self._frame, text="Enter the scanned code:", font=("Arial", 14))
            self._label.pack(padx=5, pady=5)

            self._inputbox = tk.Entry(self._frame, width=20, font=("Arial", 20), textvariable=self._inputVar)
            self._inputbox.pack(padx=5, pady=5)
            self._inputbox.bind("<Return>", lambda _: self._callback())
            self._inputbox.focus()

            self._submitBtn = tk.Button(self._frame, text="Submit", font=("Arial", 14), command=lambda: self._callback())
            self._submitBtn.pack(padx=5, pady=5)

            self._root.protocol("WM_DELETE_WINDOW", lambda: stopEvent.set())

            try:
                while not stopEvent.is_set():
                    self._root.update()
                    time.sleep(0.1)
                _logger.info("Closing window...")
                self._root.after(0, self._root.destroy())
            except tk.TclError:
                stopEvent.set()
                _logger.info("Tcl error caught")
            _logger.info("Window closed")

        async def run_forever(self, stopEvent: threading.Event):
            await asyncio.to_thread(self._innerLoop, stopEvent)


######################################################################
############################# LINUX CODE #############################
######################################################################
elif sys.platform == "linux":
    _logger.info("Scanner running on linux, using real code")

    import evdev

    class Scanner:
        """
        Real scanner class for using the barcode-scanner.

        Usage:
        - `await Scanner(callbackFunction).run_forever(stopEvent)` or
        - `asyncio.create_task(Scanner(callbackFunction).run_forever(stopEvent))`
        """

        codeToNum = {41: "0", 2: "1", 3: "2", 4: "3", 5: "4", 6: "5", 7: "6", 8: "7", 9: "8", 10: "9"}

        def __init__(self, callbackFn: Callable[[str], Any] = None, loop: asyncio.AbstractEventLoop = None):
            self._callbackFunction = callbackFn or (lambda x: None)
            self._loop = loop

        async def innerLoop(self, dev: evdev.InputDevice):
            with dev.grab_context():
                presses = ""
                ev: evdev.InputEvent
                async for ev in dev.async_read_loop():
                    if ev.type == 1 and ev.value == 0:
                        if ev.code == 28:  # enter key
                            await self._callbackFunction(presses)
                            presses = ""
                        elif ev.code in self.codeToNum:
                            presses += self.codeToNum[ev.code]
                        else:
                            _logger.debug(f"unknown code from {ev.code}, {ev.code in evdev.ecodes.KEY and evdev.ecodes.KEY[ev.code] or "<unknown>"}")

        async def run_forever(self, stopEvent: threading.Event):
            _logger.info("Starting the 'evdev' loop")
            devs: list[evdev.InputDevice] = []
            preselected = -1
            for i, path in enumerate(evdev.list_devices()):
                dev = evdev.InputDevice(path)
                devs.append(dev)
                print(f"{i:02}: {dev.path}\t, {dev.name:50} ({dev.phys})")
                if re.match(r"\bBarCode\b", dev.name):
                    preselected = i

            print("-----------------\nAvailable input devices:")
            while True:
                if preselected > -1:
                    inp = input(f"Select device (0-{i}): use {preselected}?")
                else:
                    inp = input(f"Select device (0-{i}): ")
                try:
                    device = devs[int(inp or str(preselected))]
                    break
                except:
                    print(f"Invalid input: {inp}, try again.")
            try:
                task = self._loop.create_task(self.innerLoop(device))
                while not task.done():
                    await asyncio.sleep(1)
                    if stopEvent.is_set():
                        task.cancel()
                        _logger.info("Scanner Task is cancelled")
                _logger.info("Scanner stopped, quitting")
                stopEvent.set()
            except Exception as e:
                _logger.error("in run_forever:", str(e))

# Throw error on unsupported platforms
else:
    raise RuntimeError(f"Unsupported platform: {sys.platform}")

######################################################################
############################## MAIN ##################################
######################################################################
async def _exiterFn(stopEvent: threading.Event):
    _logger.info("To exit, type 'exit' and press enter")
    while not stopEvent.is_set():
        i = await asyncio.get_event_loop().run_in_executor(None, input)
        if i.strip().lower() == "exit":
            _logger.info("Exiting...")
            stopEvent.set()
        else:
            print("Input:  ", i)
    _logger.info("Inputloop exited")


async def _main(stopEvent: threading.Event):
    async with asyncio.TaskGroup() as tg:
        loop = asyncio.get_event_loop()
        tg.create_task(Scanner(lambda x: print(f"Scanner: {x}"), loop).run_forever(stopEvent))
        tg.create_task(_exiterFn(stopEvent))


if __name__ == "__main__":
    if globals().get("Scanner") is None:
        print("No Scanner class is defined")
        sys.exit(1)

    loggingLevel = "DEBUG"
    logging.basicConfig(
        level=loggingLevel.upper(),
        stream=sys.stdout,
        format="%(asctime)s %(name)-20s %(levelname)-7s> %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    print("scanner.py is starter as the main module, running test code")
    _logger.info("Starting async loop")
    stopEvent = threading.Event()
    try:
        asyncio.run(_main(stopEvent))
    except KeyboardInterrupt:
        stopEvent.set()
    _logger.info("Loop ended")
