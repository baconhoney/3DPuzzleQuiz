import asyncio
from evdev import InputDevice, ecodes, categorize

scanner = InputDevice("/dev/input/event13")
codeToNum = {41: "0", 2: "1", 3: "2", 4: "3", 5: "4", 6: "5", 7: "6", 8: "7", 9: "8", 10: "9"}

async def main(dev: InputDevice):
    with dev.grab_context():
        presses = ""
        async for ev in dev.async_read_loop():
            if ev.type == 1 and ev.value == 0:
                if ev.code in codeToNum:
                    presses += codeToNum[ev.code]
                elif ev.code == 28:
                    print(presses)
                    presses = ""
                else:
                    print(f"unknown code from {ev}")

print("Starting loop")
asyncio.run(main(scanner))

