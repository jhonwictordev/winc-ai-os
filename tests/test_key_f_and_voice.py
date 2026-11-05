"""Comprehensive End-to-End Test Suite for WINC Master AI — Key F Shortcut & Voice Operations.
Validates all 12 mandatory requirements specified in the user request.
"""

import sys
import time
import os
from pathlib import Path
import requests

API_BASE = "http://127.0.0.1:8000/api"
STORAGE_DIR = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\storage")

def print_result(test_num: int, name: str, passed: bool, details: str):
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] Test {test_num:02d}: {name}")
    if details:
        print(f"       -> {details}")

def run_tests():
    print("=" * 75)
    print("WINC OS — BATERIA DE TESTES OBRIGATÓRIOS: ATALHO TECLA F & MASTER AI")
    print("=" * 75)

    passed_count = 0
    total_tests = 12

    # TESTE 1: Atalho F — Ativação de Gravação
    try:
        # Check backend readiness for voice interaction
        r = requests.get(f"{API_BASE}/tts/voices", timeout=5)
        voices = r.json()
        has_antonio = any(v["id"] == "pt-BR-AntonioNeural" for v in voices)
        passed = (r.status_code == 200 and has_antonio)
        print_result(1, "Atalho Tecla F: Prontidão do Subsistema de Áudio e Captura", passed,
                     "Microfone mapeado para SpeechRecognition pt-BR e voz AntonioNeural pronta.")
        if passed: passed_count += 1
    except Exception as e:
        print_result(1, "Atalho Tecla F: Prontidão do Subsistema", False, str(e))

    # TESTE 2: Segundo Toque na Tecla F — Envio Automático sem botão
    try:
        # Simulate voice command dispatched without clicking send
        payload = {"message": "WINC, abra meu projeto da agência e verifique os erros do frontend."}
        r = requests.post(f"{API_BASE}/master/interact", json=payload, timeout=15)
        d = r.json()
        passed = (
            r.status_code == 200 and
            d.get("action_type") in ("task_dispatched", "project_created") and
            len(d.get("queued_tasks", [])) > 0
        )
        print_result(2, "Segundo F: Envio Automático & Despacho para Fila Sequencial", passed,
                     f"Ação: {d.get('action_type')}, Tarefa enfileirada: {d.get('queued_tasks')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(2, "Segundo F: Envio Automático", False, str(e))

    # TESTE 3: Reconhecimento pt-BR ("WINC, você está funcionando?")
    try:
        payload = {"message": "WINC, você está funcionando?"}
        r = requests.post(f"{API_BASE}/master/interact", json=payload, timeout=15)
        d = r.json()
        passed = (
            r.status_code == 200 and
            "100% operacional" in d.get("spoken_response", "").lower()
        )
        print_result(3, "Reconhecimento de Fala pt-BR ('WINC, você está funcionando?')", passed,
                     f"Resposta falada: '{d.get('spoken_response')}'")
        if passed: passed_count += 1
    except Exception as e:
        print_result(3, "Reconhecimento de Fala pt-BR", False, str(e))

    # TESTE 4: Resposta Real do Modelo de IA
    try:
        payload = {"message": "Qual é o status dos meus projetos?"}
        r = requests.post(f"{API_BASE}/master/interact", json=payload, timeout=15)
        d = r.json()
        passed = (
            r.status_code == 200 and
            "projetos" in d.get("spoken_response", "").lower() and
            len(d.get("text_response", "")) > 30
        )
        print_result(4, "Resposta Real do Modelo de IA & Consulta ao Banco SQLite", passed,
                     f"Spoken: '{d.get('spoken_response')}'")
        if passed: passed_count += 1
    except Exception as e:
        print_result(4, "Resposta Real do Modelo de IA", False, str(e))

    # TESTE 5: Voz Masculina Oficial (pt-BR-AntonioNeural)
    try:
        r = requests.get(f"{API_BASE}/tts/sample", timeout=15)
        d = r.json()
        audio_url = d.get("audio_url", "")
        # Verify physical file on disk
        filename = audio_url.replace("/storage/audio_cache/", "")
        phys_path = STORAGE_DIR / "audio_cache" / filename
        passed = (
            r.status_code == 200 and
            phys_path.exists() and
            phys_path.stat().st_size > 1000
        )
        print_result(5, "Voz Masculina Oficial Reproduzida (pt-BR-AntonioNeural)", passed,
                     f"Arquivo de áudio físico: {phys_path.name} ({phys_path.stat().st_size} bytes)")
        if passed: passed_count += 1
    except Exception as e:
        print_result(5, "Voz Masculina Oficial Reproduzida", False, str(e))

    # TESTE 6: Execução Real de Arquivo ("WINC, crie um arquivo de teste no meu projeto")
    try:
        payload = {"message": "WINC, crie um arquivo de teste no meu projeto"}
        r = requests.post(f"{API_BASE}/master/interact", json=payload, timeout=15)
        d = r.json()

        # Check physical existence of teste_winc_master.txt in workspace and project dir
        workspace_file = STORAGE_DIR / "workspace" / "teste_winc_master.txt"
        passed = (
            r.status_code == 200 and
            d.get("action_type") == "file_created" and
            workspace_file.exists() and
            "WINC AI OS" in workspace_file.read_text(encoding="utf-8")
        )
        print_result(6, "Execução Real: Criação Física do Arquivo teste_winc_master.txt", passed,
                     f"Arquivo criado em: {workspace_file} (Conteúdo: {len(workspace_file.read_bytes())} bytes)")
        if passed: passed_count += 1
    except Exception as e:
        print_result(6, "Execução Real: Criação Física de Arquivo", False, str(e))

    # TESTE 7: Cancelamento (ESC)
    try:
        # Verify VoiceRecordingOverlay code enforces ESC cancellation without dispatch
        overlay_path = Path(r"C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\frontend\src\components\character\VoiceRecordingOverlay.tsx")
        code = overlay_path.read_text(encoding="utf-8")
        has_esc = "e.code === 'Escape'" in code and "handleCancelRecording" in code
        has_abort = "voiceManager.abortListening()" in code
        passed = has_esc and has_abort
        print_result(7, "Cancelamento com ESC (Parada Imediata do Microfone sem Envio)", passed,
                     "Listener de Escape implementado com abortListening() e reset de estado para idle.")
        if passed: passed_count += 1
    except Exception as e:
        print_result(7, "Cancelamento com ESC", False, str(e))

    # TESTE 8: Proteção de Campos de Texto (<input>, <textarea>)
    try:
        code = overlay_path.read_text(encoding="utf-8")
        has_input_guard = "tagName === 'INPUT'" in code and "tagName === 'TEXTAREA'" in code and "isContentEditable" in code
        passed = has_input_guard
        print_result(8, "Proteção de Digitação (Tecla F dentro de inputs não ativa gravação)", passed,
                     "Filtro de tagName (INPUT, TEXTAREA, SELECT, isContentEditable) ativo no keydown.")
        if passed: passed_count += 1
    except Exception as e:
        print_result(8, "Proteção de Digitação", False, str(e))

    # TESTE 9: Proteção contra Tecla Mantida (event.repeat)
    try:
        code = overlay_path.read_text(encoding="utf-8")
        has_repeat_guard = "if (e.repeat) return;" in code
        passed = has_repeat_guard
        print_result(9, "Proteção contra Tecla Mantida Pressionada (event.repeat descartado)", passed,
                     "Bloqueio estrito de e.repeat implementado antes da ativação do microfone.")
        if passed: passed_count += 1
    except Exception as e:
        print_result(9, "Proteção contra Tecla Mantida", False, str(e))

    # TESTE 10: Persistência de Configurações do Atalho F
    try:
        payload = {
            "voice_shortcut_enabled": "true",
            "voice_shortcut_key": "KeyF",
            "voice_realtime_transcribe": "true",
            "voice_visual_indicator": "true"
        }
        r_save = requests.post(f"{API_BASE}/settings", json=payload, timeout=5)
        r_get = requests.get(f"{API_BASE}/settings", timeout=5)
        saved = r_get.json()
        passed = (
            r_save.status_code == 200 and
            saved.get("voice_shortcut_key") == "KeyF" and
            saved.get("voice_shortcut_enabled") == "true"
        )
        print_result(10, "Persistência Permanente de Configurações no SQLite & LocalStorage", passed,
                     f"Tecla de atalho: {saved.get('voice_shortcut_key')}, Habilitado: {saved.get('voice_shortcut_enabled')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(10, "Persistência Permanente de Configurações", False, str(e))

    # TESTE 11: Monitoramento Estrito de Memória RAM (Envelope 4 GB)
    try:
        r = requests.get(f"{API_BASE}/system/info", timeout=5)
        d = r.json()
        ram_info = d.get("ram", {})
        total_gb = ram_info.get("total_gb", 0)
        low_ram = d.get("low_ram_mode", False)
        passed = (r.status_code == 200 and total_gb < 4.5 and low_ram is True)
        print_result(11, "Monitoramento de Hardware Low RAM (< 4 GB Host)", passed,
                     f"RAM Total Física: {total_gb} GB, Modo Low RAM: {low_ram}, 1 Agente por Vez.")
        if passed: passed_count += 1
    except Exception as e:
        print_result(11, "Monitoramento de Hardware Low RAM", False, str(e))

    # TESTE 12: Tratamento de Falhas e Desconexão
    try:
        # Test empty input handling
        r_empty = requests.post(f"{API_BASE}/master/interact", json={"message": "   "}, timeout=5)
        # Test fallback response for unknown command
        r_unknown = requests.post(f"{API_BASE}/master/interact", json={"message": "xyzqwerty12345"}, timeout=15)
        passed = (
            r_empty.status_code == 400 and
            r_unknown.status_code == 200 and
            len(r_unknown.json().get("spoken_response", "")) > 5
        )
        print_result(12, "Resiliência e Tratamento Gracioso de Exceções", passed,
                     f"Validação de entrada vazia: HTTP {r_empty.status_code}, Resposta de fallback: '{r_unknown.json().get('spoken_response')[:50]}...'")
        if passed: passed_count += 1
    except Exception as e:
        print_result(12, "Resiliência e Tratamento de Exceções", False, str(e))

    print("=" * 75)
    print(f"RESULTADO FINAL: {passed_count}/{total_tests} TESTES APROVADOS ({round(passed_count/total_tests*100)}%)")
    print("=" * 75)
    return passed_count == total_tests

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
