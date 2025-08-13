from typing import Callable
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

        def __init__(self, callbackFn: Callable[[str], None] = None):
            self._callbackFunction = callbackFn or (lambda x: None)

        def _callback(self):
            value = self._inputVar.get()
            if value:
                self._callbackFunction(value)
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
                    time.sleep(0.01)
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

    class Scanner:
        """
        Real scanner class for using the barcode-scanner.

        Usage:
        - `await Scanner(callbackFunction).run_forever(stopEvent)` or
        - `asyncio.create_task(Scanner(callbackFunction).run_forever(stopEvent))`
        """

        def __init__(self, callbackFn: Callable[[str], None] = None):
            self._callbackFunction = callbackFn or (lambda x: None)

        async def run_forever(self, stopEvent: threading.Event):
            # Placeholder: later will use evdev or similar async code
            _logger.info("Starting the 'evdev' loop")
            while not stopEvent.is_set():
                await asyncio.sleep(10)
                self._callbackFunction("linux scanner placeholder")


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
        tg.create_task(Scanner(lambda x: print(f"Scanner: {x}")).run_forever(stopEvent))
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
