import sys, json, random, copy, datetime
from tkinter import Tk, ttk, font


if sys.platform == "win32":
    # we are on windows, loading replacement code for the scanner monitoring
    pass
elif sys.platform == "linux":
    # we are on linux, loading real code for the scanner monitoring
    pass

# ---------------- DATA ----------------

rawTestData: list[dict[list, int|str|dict[str, int|str]]] = []
with open("test_sheets.json", encoding="utf-8") as f:
    raw: list[list[dict]] = json.load(f)
    for test in raw:
        for entry in test:
            entry["id"] = random.randint(2000, 9999)
            entry["correct"] = random.random() > 0.5
        d = {"testdata": copy.deepcopy(test)}
        d["score"] = sum(int(c["correct"]) for c in test)
        d["timestamp"] = (datetime.datetime.now() - datetime.timedelta(microseconds=(random.random() * 600 * 1e6))).isoformat(timespec="milliseconds")
        rawTestData.append(d)
rawTestData.sort(key=lambda i: (-i["score"], i["timestamp"]))

# ---------------- EVENT HANDLER FUNCTIONS ----------------

def onTestResultsRowClick(event):
    region = testResultsData.identify("region", event.x, event.y)
    if region != "cell":
        testResultsData.selection_remove(testResultsData.selection())
        for child in testData.get_children(): testData.delete(child)
    else:
        test = rawTestData[int(testResultsData.focus())]
        for child in testData.get_children(): testData.delete(child)
        for data in test["testdata"]:
            testData.insert("", "end",
                values=(
                    f"{data["id"]}",
                    f"{data["name"]}",
                    f"{data["country"]}",
                    f"{data["city"]}",
                    f"{data["number"]}",
                    f"{data["correct"]}"
                )
            )


# ---------------- OTHER FUNCTIONS ----------------

def setTreeviewHeadings(treeview: ttk.Treeview, columnData: dict[str, dict[str, str|dict[str, str]]]):
    """Applies the name and kw options in `columnData` to each column in `treeview`, and sets its name.
    Data is `internalName: {"name": "<display name>", "opts": {<kw options>}}` for each column"""
    treeview["columns"] = tuple(columnData.keys())
    for name, colData in columnData.items():
        if "name" in colData:
            treeview.heading(name, text=colData["name"])
        if "opts" in colData:
            treeview.column(name, **colData["opts"])


# ---------------- MAIN CODE ----------------
if __name__ == "__main__":
    rootWindow = Tk()
    # rootWindow.state('zoomed')
    rootWindow.minsize(1300, 850)
    rootWindow.geometry("1600x900")
    rootWindow.title("3D Quiz Manager")
    font.nametofont("TkDefaultFont").configure(size=14)
    font.nametofont("TkTextFont").configure(size=14)
    style = ttk.Style()
    style.configure("TFrame", relief="solid", borderwidth=1)
    style.configure("Treeview", rowheight=30)

    # --- Root ---
    (rootFrame := ttk.Frame(rootWindow, padding=10)).pack(expand=True, fill="both")
    rootFrame.columnconfigure(0, minsize=700, weight=1)
    rootFrame.rowconfigure(0, minsize=300, weight=1)

    # --- Main frames ---
    (testDisplayFrame := ttk.Frame(rootFrame)).grid(row=0, column=0, rowspan=2, sticky="ns", padx=5, pady=5)
    (testResultsFrame := ttk.Frame(rootFrame)).grid(row=0, column=1, sticky="nesw", padx=5, pady=5)
    (controlsFrame := ttk.Frame(rootFrame, width=500, height=500)).grid(row=1, column=1, sticky="nesw", padx=5, pady=5)
    controlsFrame.grid_propagate(False)

    # --- Test widgets ---
    (testHeader := ttk.Frame(testDisplayFrame)).pack(side="top", fill="x")
    (testDataFrame := ttk.Frame(testDisplayFrame)).pack(side="top", fill="y", expand=True)
    (testName := ttk.Label(testHeader, text="Nagyon hosszú nevű csapat hello world lorem ipsum", width="50", relief="solid")).pack(side="left", anchor="n")
    (testLang := ttk.Label(testHeader, text="HU", relief="solid")).pack(side="right", anchor="n")
    (closeTestButton := ttk.Button(testDisplayFrame, text="Bezár", padding=5)).pack(side="bottom", anchor="se")
    #(newTestButton := ttk.Button(testDataFrame, text="Új teszt", padding=5)).pack(fill="both", side="top")
    testDataScrollbar = ttk.Scrollbar(testDataFrame, orient="vertical") #.pack(side="right", fill="y")
    testData = ttk.Treeview(testDataFrame, show="headings", yscrollcommand=testDataScrollbar.set) # .pack(side="right", fill="both", expand=True)
    testData.pack(fill="both", expand=True)
    testDataScrollbar.configure(command=testData.yview)
    setTreeviewHeadings(testData,{
        "buildingId": {"name": "Azon",   "opts": {"width": 80, "stretch": False, "anchor": "center"}},
        "name":       {"name": "Név",    "opts": {"width": 400, "anchor": "w"}},
        "country":    {"name": "Ország", "opts": {"width": 250, "anchor": "w"}},
        "city":       {"name": "Város",  "opts": {"width": 250, "anchor": "w"}},
        "number":     {"name": "Szám",   "opts": {"width": 40, "stretch": False, "anchor": "center"}},
        "correct":    {"name": "Helyes", "opts": {"width": 60, "stretch": False, "anchor": "center"}}
        })

    # --- Results widgets
    (testResultsScrollbar := ttk.Scrollbar(testResultsFrame, orient="vertical")).pack(side="right", fill="y")
    (testResultsData := ttk.Treeview(testResultsFrame, show="headings", yscrollcommand=testResultsScrollbar.set)).pack(side="right", fill="both", expand=True)
    testResultsScrollbar.configure(command=testResultsData.yview)
    setTreeviewHeadings(testResultsData, {
            "name":  {"name": "Csapatnév",    "opts": {"width": 150, "anchor": "w"}},
            "score": {"name": "Pontszám",     "opts": {"width": 70, "stretch": False, "anchor": "center"}},
            "time":  {"name": "Leadás ideje", "opts": {"width": 100, "stretch": False, "anchor": "center"}}})

    # --- Controls widgets
    (remainingTime := ttk.Entry(controlsFrame, justify="center", width=8)).grid(row=0, column=0, rowspan=2) # , ipadx=10, ipady=10, padx=10, pady=10
    remainingTime.insert(0, "HH:mm")
    (addTime := ttk.Button(controlsFrame, text="+", padding=10)).grid(row=0, column=1)
    (subTime := ttk.Button(controlsFrame, text="-", padding=10)).grid(row=1, column=1)
    (sendButton := ttk.Button(controlsFrame, text="Send", padding=10)).grid(row=0, column=2, rowspan=2)
    (nextPhaseButton := ttk.Button(controlsFrame, text="<Next phase>", padding=10)).grid(row=2, column=0, columnspan=3)

    # --- setup phase done ---
    for i, test in enumerate(rawTestData):
        testResultsData.insert("", "end", id=i,
            values=(
                f"{i+1}. test result",
                f"{test["score"]}",
                f"{datetime.datetime.fromisoformat(test["timestamp"]).strftime("%H:%M:%S")}"
            )
        )
    testResultsData.bind("<ButtonRelease-1>", onTestResultsRowClick)

    rootWindow.mainloop()
