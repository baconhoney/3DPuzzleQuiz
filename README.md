# 3D Puzzle Quiz – Exhibition Web Platform
This repository powers the **3D Puzzle Quiz**, an analog and digital quiz game designed for use at exhibitions. It includes multiple frontend interfaces, a backend server, a searchable interface, and developer documentation via a Git submodule. The system is designed to be modular, multilingual, and easy to deploy.


## Project Structure
**For demonstration purposes only**
```
ClientWebpage/         # Participant-facing client interface
SearchWebpage/         # Search utility interface
AdminWebpage/          # Admin interface
Server/                # aiohttp backend server
    cfg/                   # Configuration for the server
    data/                  # Data storage
        quizData.sqlite    # SQLite database containing quiz data
    .env                   # Defines relative paths to components
    main.py                # The entry point of the Server root-module
    manageQuizdata.py      # Utility for managing quiz content
    generateTestdata.py    # Utility for generating fake quizzes
Wiki/                  # Developer documentation (Git submodule)
build.bat              # Launcher for windows
build.sh               # Launcher for linux
build.py               # Build script
start.bat              # Starter script for Windows
start.sh               # Starter script for Linux
```

## Requirements

- **Python** 3.12.x
- **Node.js** (latest LTS recommended)
- **Git**

## Setup Instructions

### 1. Clone the Repository with Submodules

```bash
git clone --recurse-submodules https://github.com/baconhoney/3DPuzzleQuiz.git
cd 3DPuzzleQuiz
```

### 2. Install python dependencies

1. The project uses [poetry](https://python-poetry.org/) for managing the dependencies.
Download `poetry` from https://python-poetry.org/docs/#installing-with-the-official-installer and install it.
2. Run the recommended PS script (by the installer) for adding `poetry` to your path.
3. Run
   ```bash
    cd Server
    poetry config virtualenvs.in-project true
    poetry install --no-root
    cd ..
    ```

#### For developing the Server, run the below code too

```bash
cd Server
poetry env activate
<run the command printed out by the above line>
cd ..
```

This will activate the virtual environment, which is necessary for the server to run.

You can freely add this venv (located at `.venv`) in your IDE for convinience.

### 3. Build the Project

#### On Windows:

```cmd
build.bat
```

#### On Linux:

```bash
./build.sh
```

This compiles the Frontends and places them in the `<page>/Dist` folder, which the server will serve.

### 4. Run the Application

#### On Windows:

```cmd
start.bat
```

#### On Linux:

```bash
./start.sh
```

After starting the server:
* **Participant Link:** Share the computer's public URL (e.g., `http://<server-ip>:<port>/`) with the quiz participants.
* **Search Webpage:** Accessible at https://baconhoney.github.io/3DPuzzleQuiz/ (static version) or `http://<server-ip>:<port>/search/` (live version with the live data; requires running the Server).
* **Admin Dashboard:** Accessible at `http://<server-ip>:<port>/admin/`.

## Database Management
Quiz data is stored in an SQLite database at: `/data/quizData.sqlite`.
To update or manage quiz content, use:

```bash
python manageQuizdata.py <task>
```

## Tech Stack

### Frontend:

* **React**
* **Tailwind CSS**
* **DaisyUI**
* Multilingual support via language selector and API integration

### Backend:

* **aiohttp** (asynchronous web server)
* **python-dotenv** (env config loading)
* **sqlite3** (database engine)
* **WebSocket** support for real-time quiz state communication

---

## Developer Documentation

Developer-oriented documentation is maintained in the `Wiki/` submodule.
It is not exposed to end users and is version-controlled separately.

To update the wiki:

```bash
cd Wiki
git pull origin master
```
