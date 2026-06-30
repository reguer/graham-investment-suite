from __future__ import annotations

import os
import subprocess
from pathlib import Path


CREATE_NO_WINDOW = 0x08000000
DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
REQUIRED_NODE_VERSION = "22.22.3"


def resolve_bootstrap_node() -> str:
    appdata = os.environ.get("APPDATA", "")
    local_appdata = os.environ.get("LOCALAPPDATA", "")
    program_files = os.environ.get("ProgramFiles", "")
    program_files_x86 = os.environ.get("ProgramFiles(x86)", "")

    candidates = [
        Path(appdata) / "nvm" / f"v{REQUIRED_NODE_VERSION}" / "node.exe",
        Path(program_files) / "nodejs" / "node.exe",
        Path(program_files_x86) / "nodejs" / "node.exe",
        Path(local_appdata) / "Programs" / "nodejs" / "node.exe",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)

    return "node"


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    start_dashboard = repo_root / "scripts" / "start-dashboard.js"
    node = resolve_bootstrap_node()

    subprocess.Popen(
        [node, str(start_dashboard)],
        cwd=str(repo_root),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
        close_fds=True,
    )


if __name__ == "__main__":
    main()
