# Server root-module
This is the Server root-module of the 3DPuzzleQuiz system. It is responsible for serving all the files for the browser-based interfaces, and for managing/handling the internal states and tasks of the backend.

# Usage
**Follow the install instructions from the main [README.md](../README.md).**

# Developing
## Modules
**Top-level .py files needs to the the following lines at the very top of the file:**
```python
import pathlib
import sys

# add local modules to pythonpath (each top level file needs this)
sys.path.insert(1, str(pathlib.Path("./modules").resolve()))
```
*The modules do not need this, they can be run as main from anywhere (will use the file's folder as cwd, because python).*

**Notice:** To supress VSCode falsely whining about the modules being not available in the main files, add the below to your VSCode settings file.
`3DPuzzleQuiz/.vscode/settings.json`:
```json
{
    "python.analysis.extraPaths": [
        "./Server/modules"
    ]
}
```

### Adding modules via poetry
Run `poetry add <module_name>` while you have the virtual environment active (see the main [README.md](../README.md) for activating the venv).
