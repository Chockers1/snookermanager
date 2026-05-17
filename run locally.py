from __future__ import annotations

import shutil
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEV_URL = 'http://localhost:5173'


def fail(message: str, code: int = 1) -> None:
    print(message)
    raise SystemExit(code)


def ensure_command(name: str) -> str:
    executable = shutil.which(name)
    if executable is None:
        fail(f'Could not find "{name}" on PATH. Install Node.js and npm first.')
    return executable


def run_checked(args: list[str]) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def install_dependencies(npm_executable: str) -> None:
    node_modules = ROOT / 'node_modules'
    if node_modules.exists():
        return

    print('node_modules not found. Running npm install...')
    run_checked([npm_executable, 'install'])


def start_dev_server(npm_executable: str) -> int:
    print('Starting Vite dev server...')
    print(f'App URL: {DEV_URL}')
    print('Press Ctrl+C to stop the server.')

    process = subprocess.Popen([npm_executable, 'run', 'dev'], cwd=ROOT)

    try:
        time.sleep(2)
        webbrowser.open(DEV_URL)
        return process.wait()
    except KeyboardInterrupt:
        print('\nStopping dev server...')
        process.terminate()
        try:
            return process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            return process.wait()


def main() -> None:
    ensure_command('node')
    npm_executable = ensure_command('npm')

    try:
        install_dependencies(npm_executable)
        exit_code = start_dev_server(npm_executable)
    except subprocess.CalledProcessError as error:
        fail(f'Command failed with exit code {error.returncode}: {" ".join(error.cmd)}', error.returncode)

    if exit_code != 0:
        fail(f'Dev server exited with code {exit_code}', exit_code)


if __name__ == '__main__':
    main()