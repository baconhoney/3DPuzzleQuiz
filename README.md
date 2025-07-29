# 3D Puzzle Quiz – Exhibition Web Platform
This repository powers the **3D Puzzle Quiz**, a digital quiz game designed for use at exhibitions. It includes multiple frontend interfaces, a backend server, a searchable interface, and developer documentation via a Git submodule. The system is designed to be modular, multilingual, and easy to deploy.


## Project Structure
```
./
├─ ClientWebpage/         # Participant-facing client interface
├─ SearchWebpage/         # Search utility interface
├─ AdminWebpage/          # Admin interface
├─ Server/                # aiohttp backend server
├─ Build/                 # Output folder for the built app
├─ cfg/                   # Configuration for the server
├─ data/                  # Data storage
│   └─ quizData.sqlite    # SQLite database containing quiz data
├─ Wiki/                  # Developer documentation (Git submodule)
├─ build.sh               # Linux build script
├─ build.bat              # Windows build script
├─ manageQuizdata.py      # Utility for managing quiz content
├─ .env                   # Defines relative paths to components
├─ .gitignore
└─ .gitmodules
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
    poetry env activate
    <run the command printed out by the above line>
    cd ..
    ```

### 3. Build the Project

#### On Linux:

```bash
./build.sh
```

#### On Windows:

```cmd
build.bat
```

This compiles the Frontends and places them in the `Build/` folder, which the server will serve, and also copies the necessary server files into the `Build/` folder.

### 4. Run the Application

```bash
cd Build
python main.py
```

After starting the server:
* **Participant Link:** Share the computer's public URL (e.g., `http://<server-ip>:<port>/`) with the quiz participants.
* **Admin Dashboard:** Accessible at `http://<server-ip>:<port>/admin/`.
* **Search Webpage:** Accessible at `http://<server-ip>:<port>/search/`.

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
