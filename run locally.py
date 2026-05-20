from __future__ import annotations

import argparse
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEFAULT_HOST = '127.0.0.1'
DEFAULT_DEV_PORT = 5173
DEFAULT_PREVIEW_PORT = 4173


def fail(message: str, code: int = 1) -> None:
    print(message)
    raise SystemExit(code)


def ensure_command(name: str) -> str:
    executable = shutil.which(name)
    if executable is None:
        fail(f'Could not find "{name}" on PATH. Install Node.js and npm first.')
    return executable


def run_checked(args: list[str]) -> None:
    print(f'Running: {" ".join(args)}')
    subprocess.run(args, cwd=ROOT, check=True)


def is_port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(0.25)
        return probe.connect_ex((host, port)) != 0


def choose_port(host: str, preferred_port: int) -> int:
    for port in range(preferred_port, preferred_port + 25):
        if is_port_available(host, port):
            return port
    fail(f'Could not find a free port from {preferred_port} to {preferred_port + 24}.')
    return preferred_port


def wait_for_server(url: str, timeout_seconds: int = 45) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1):
                return True
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.5)
    return False


def install_dependencies(npm_executable: str, skip_install: bool) -> None:
    if skip_install:
        return

    if (ROOT / 'node_modules').exists():
        return

    install_command = 'ci' if (ROOT / 'package-lock.json').exists() else 'install'
    print(f'node_modules not found. Running npm {install_command}...')
    run_checked([npm_executable, install_command])


def build_app(npm_executable: str) -> None:
    run_checked([npm_executable, 'run', 'build'])


def start_vite_server(npm_executable: str, script: str, host: str, port: int, open_browser: bool) -> int:
    url = f'http://{host}:{port}/'
    print(f'Starting Vite {script} server...')
    print(f'App URL: {url}')
    print('Press Ctrl+C to stop the server.')

    process = subprocess.Popen(
        [npm_executable, 'run', script, '--', '--host', host, '--port', str(port), '--strictPort'],
        cwd=ROOT,
    )

    try:
        if wait_for_server(url):
            print('Server is ready.')
            if open_browser:
                webbrowser.open(url)
        else:
            print('Server is still starting; open the URL above when Vite finishes.')

        return process.wait()
    except KeyboardInterrupt:
        print('\nStopping Vite server...')
        process.terminate()
        try:
            return process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            return process.wait()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Run Snooker Career Manager locally.')
    parser.add_argument(
        'mode',
        nargs='?',
        choices=['dev', 'preview', 'build'],
        default='dev',
        help='dev starts Vite, preview builds then serves dist, build only creates dist. Default: dev.',
    )
    parser.add_argument('--host', default=DEFAULT_HOST, help=f'Host to bind Vite to. Default: {DEFAULT_HOST}.')
    parser.add_argument('--port', type=int, help='Preferred port. Defaults to 5173 for dev and 4173 for preview.')
    parser.add_argument('--no-open', action='store_true', help='Do not open the browser automatically.')
    parser.add_argument('--skip-install', action='store_true', help='Skip automatic npm install/npm ci when node_modules is missing.')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_command('node')
    npm_executable = ensure_command('npm')

    try:
        install_dependencies(npm_executable, args.skip_install)

        if args.mode == 'build':
            build_app(npm_executable)
            print('Production build complete. Output folder: dist')
            return

        preferred_port = args.port if args.port is not None else (DEFAULT_DEV_PORT if args.mode == 'dev' else DEFAULT_PREVIEW_PORT)
        port = choose_port(args.host, preferred_port)

        if args.mode == 'preview':
            build_app(npm_executable)

        exit_code = start_vite_server(npm_executable, args.mode, args.host, port, not args.no_open)
    except subprocess.CalledProcessError as error:
        command = ' '.join(str(part) for part in error.cmd)
        fail(f'Command failed with exit code {error.returncode}: {command}', error.returncode)

    if exit_code != 0:
        fail(f'Vite server exited with code {exit_code}', exit_code)


if __name__ == '__main__':
    main()