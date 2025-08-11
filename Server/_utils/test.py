import asyncio
import random


async def dosomething(id):
    time = random.randint(2, 5)
    print(f"Started task  {id} {time}")
    await asyncio.sleep(time)
    print(f"Finished task {id}")


if __name__ == "__main__":
    eventLoop = asyncio.new_event_loop()
    run = True
    print("start")
    while run:
        if input("Press enter to start") == "stop":
            run = False
        tasks = []
        for data in range(1, 6):
            task = eventLoop.create_task(dosomething(data))
            task.add_done_callback(lambda task: tasks.remove(task))
            tasks.append(task)
        eventLoop.run_until_complete(asyncio.gather(*tasks))
    print("end")
