import subprocess
from pathlib import Path

# Define root directories using pathlib
cwd = Path.cwd()
client_root = cwd / "ClientWebpage"
search_root = cwd / "SearchWebpage"
admin_root = cwd / "AdminWebpage"

# Build flags
build_client = True
build_search = True
build_admin =  True


def log(msg):
    print(f"[INFO]  {msg}")


def run_cmd(command, working_dir):
    log(f"Running: {command}")
    result = subprocess.run(command, cwd=working_dir, shell=True)
    if result.returncode != 0:
        print(f"[ERROR] Command failed: {command}")


# --- Build Client ---
if build_client:
    log("Building Client webpage...")
    run_cmd("npm i", client_root)
    run_cmd("npm run build", client_root)
    log("Building Client webpage done")


# --- Build Search ---
if build_search:
    log("Building Search webpage...")
    run_cmd("npm i", search_root)
    run_cmd("npm run build", search_root)
    log("Building Search webpage done")


# --- Build Admin ---
if build_admin:
    log("Building Admin webpage...")
    run_cmd("npm i", admin_root)
    run_cmd("npm run build", admin_root)
    log("Building Admin webpage done")


log("--- Build done ---")
input("Press Enter to exit...")
