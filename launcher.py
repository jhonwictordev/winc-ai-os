"""WINC AI OS — One-Click Windows Launcher."""

import sys
import os
import time
import subprocess
import webbrowser
import signal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

def print_banner():
    banner = r"""
======================================================================
     __          _______ _   _  _____              _____ ____  _____ 
     \ \        / /_   _| \ | |/ ____|     /\     |_   _/ __ \/ ____|
      \ \  /\  / /  | | |  \| | |         /  \      | || |  | | (___  
       \ \/  \/ /   | | | . ` | |        / /\ \     | || |  | |\___ \ 
        \  /\  /   _| |_| |\  | |____   / ____ \   _| || |__| |____) |
         \/  \/   |_____|_| \_|\_____| /_/    \_\ |_____\____/|_____/ 
                                                                     
               SISTEMA OPERACIONAL DE AGENTES INTELIGENTES
                     Agência WINC — Edição Low RAM
======================================================================
"""
    print(banner)

def check_environment():
    print("[1/4] Verificando ambiente e telemetria de hardware...")
    try:
        import psutil
        mem = psutil.virtual_memory()
        print(f"      RAM Física Total: {mem.total / (1024**3):.2f} GB")
        print(f"      RAM Disponível:   {mem.available / (1024**3):.2f} GB ({mem.percent}% em uso)")
        if mem.total / (1024**3) <= 4.5:
            print("      [AVISO] Ambiente com 4 GB detectado -> Modo LOW RAM ativado com segurança.")
    except Exception as e:
        print(f"      Telemetria psutil: {e}")

def start_backend():
    print("\n[2/4] Iniciando Servidor Backend WINC AI OS (FastAPI + OpenJarvis)...")
    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR) + os.pathsep + str(BASE_DIR / "openjarvis" / "src")

    cmd = [
        sys.executable, "-m", "uvicorn", "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--log-level", "warning"
    ]
    
    proc = subprocess.Popen(cmd, cwd=str(BACKEND_DIR), env=env)
    return proc

def wait_for_health():
    print("[3/4] Aguardando inicialização dos serviços...")
    import urllib.request
    url = "http://127.0.0.1:8000/"
    for _ in range(30):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status == 200:
                    print("      [OK] Backend WINC AI OS está ONLINE e saudável!")
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def open_interface():
    print("\n[4/4] Abrindo interface gráfica da Agência WINC no navegador padrão...")
    target_url = "http://127.0.0.1:8000"
    webbrowser.open(target_url)
    print(f"\n>> WINC AI OS pronto em: {target_url}")
    print(">> Pressione CTRL+C nesta janela para desligar todos os serviços de forma limpa.\n")

def main():
    print_banner()
    check_environment()
    backend_proc = start_backend()

    if not wait_for_health():
        print("[ERRO] Falha ao iniciar backend no prazo limite. Encerrando.")
        backend_proc.terminate()
        sys.exit(1)

    open_interface()

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Desligando serviços do WINC AI OS de forma controlada...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
        print("[SHUTDOWN] Processos finalizados. Até logo!")

if __name__ == "__main__":
    main()
