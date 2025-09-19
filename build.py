import shutil
import subprocess
from pathlib import Path

# Define root directories using pathlib
cwd = Path.cwd()
client_root = cwd / "ClientWebpage"
search_root = cwd / "SearchWebpage"
admin_root = cwd / "AdminWebpage"
server_root = cwd / "Server"
build_root = cwd / "Build"

# Build flags
build_client = True
build_search = True
build_admin =  True
build_server = True


def log(msg):
    print(f"[INFO]  {msg}")


def run_cmd(command, working_dir):
    log(f"Running: {command}")
    result = subprocess.run(command, cwd=working_dir, shell=True)
    if result.returncode != 0:
        print(f"[ERROR] Command failed: {command}")


# --- Clean build folder ---
log("Cleaning build folder...")
build_root.mkdir(exist_ok=True)

# Remove all contents inside build/
for item in build_root.iterdir():
    if item.is_file():
        item.unlink()
    elif item.is_dir():
        shutil.rmtree(item)
    else:
        print(f"Unknown file type: {item}")
log("Cleaning build folder done")

# --- Build Client ---
if build_client:
    log("Building Client webpage...")
    run_cmd("npm i", client_root)
    run_cmd("npm run build", client_root)
    shutil.copytree(client_root / "dist", build_root / "webpages" / "client", dirs_exist_ok=True)
    log("Building Client webpage done")

# --- Build Search ---
if build_search:
    log("Building Search webpage...")
    run_cmd("npm i", search_root)
    run_cmd("npm run build", search_root)
    shutil.copytree(search_root / "dist", build_root / "webpages" / "search", dirs_exist_ok=True)
    log("Building Search webpage done")

# --- Build Admin ---
if build_admin:
    log("Building Admin webpage...")
    run_cmd("npm i", admin_root)
    run_cmd("npm run build", admin_root)
    shutil.copytree(admin_root / "dist", build_root / "webpages" / "admin", dirs_exist_ok=True)
    log("Building Admin webpage done")

# --- Server Files ---
if build_server:
    log("Copying server files...")
    (build_root / "modules").mkdir(parents=True, exist_ok=True)
    # Copy build.env to .env
    shutil.copy(server_root / "build.env", build_root / ".env")
    # Copy main.py and manageQuizdata.py
    shutil.copy(server_root / "main.py", build_root)
    shutil.copy(server_root / "manageQuizdata.py", build_root)
    shutil.copy(server_root / "generateTestdata.py", build_root)
    # Copy only .py files in modules (non-recursive)
    for file in (server_root / "modules").glob("*.py"):
        shutil.copy(file, build_root / "modules" / file.name)
    # Copy cfg and data folders
    shutil.copytree(server_root / "cfg", build_root / "cfg", dirs_exist_ok=True)
    shutil.copytree(server_root / "data", build_root / "data", dirs_exist_ok=True)
    log("Copying server files done")

log("--- Build done ---")
input("Press Enter to exit...")
