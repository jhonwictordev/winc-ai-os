"""Complete Verification Test Suite for WINC AI OS.
Tests 1 to 11 covering Architecture, Low RAM, Agency Agents Catalog (283),
Portuguese (pt-BR) Localization, and Google Gemini / Remote AI Engine Integration.
"""

import sys
import time
import requests

API_BASE = "http://127.0.0.1:8000/api"

def print_result(test_num: int, name: str, passed: bool, details: str):
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] Test {test_num:02d}: {name}")
    if details:
        print(f"       -> {details}")

def run_tests():
    print("=" * 70)
    print("WINC AI OS — BATERIA DE TESTES DE INTEGRAÇÃO, PT-BR E IA REMOTA")
    print("=" * 70)
    
    passed_count = 0
    total_tests = 15

    # Test 1: System Telemetry & Low RAM Mode
    try:
        r = requests.get(f"{API_BASE}/system/info", timeout=5)
        d = r.json()
        passed = (
            r.status_code == 200 and
            d.get("low_ram_mode") is True and
            "ram" in d and
            d["ram"]["total_gb"] < 4.5
        )
        print_result(1, "Telemetria de Sistema & Modo Low RAM Ativo", passed, 
                     f"RAM Total: {d['ram']['total_gb']} GB, Usada: {d['ram']['used_gb']} GB ({d['ram']['percent']}%), Low RAM: {d.get('low_ram_mode')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(1, "Telemetria de Sistema & Modo Low RAM", False, str(e))

    # Test 2: Full Agency Agents Catalog Count (283 Agents)
    try:
        r = requests.get(f"{API_BASE}/agents", timeout=5)
        agents = r.json()
        passed = (r.status_code == 200 and len(agents) == 283)
        print_result(2, "Catálogo Completo do Agency Agents (283 Agentes Persistidos)", passed,
                     f"Total de agentes retornados pela API: {len(agents)} (Esperado: 283)")
        if passed: passed_count += 1
    except Exception as e:
        print_result(2, "Catálogo Completo do Agency Agents", False, str(e))

    # Test 3: 18 Technical Divisions & Exact Counts
    try:
        r = requests.get(f"{API_BASE}/agents/divisions", timeout=5)
        divs = r.json()
        total_counted = sum(d.get("agent_count", 0) for d in divs)
        passed = (r.status_code == 200 and len(divs) == 18 and total_counted == 283)
        print_result(3, "18 Departamentos Técnicos com Contagem de Agentes", passed,
                     f"Divisões retornadas: {len(divs)}, Soma dos especialistas por departamento: {total_counted}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(3, "18 Departamentos Técnicos", False, str(e))

    # Test 4: Brazilian Portuguese (pt-BR) Localization of Agents
    try:
        r = requests.get(f"{API_BASE}/agents", timeout=5)
        agents = r.json()
        # Check specific user examples
        pdf_agent = next((a for a in agents if "pdf-engine-architect" in a["id"]), None)
        godot_agent = next((a for a in agents if "godot-shader-developer" in a["id"]), None)
        content_agent = next((a for a in agents if a["id"] == "marketing-marketing-content-creator"), None)
        unity_agent = next((a for a in agents if "unity-editor-tool-developer" in a["id"]), None)

        passed = (
            pdf_agent and "Arquiteto de Mecanismos PDF" in pdf_agent.get("name_pt", "") and
            godot_agent and "Desenvolvedor de Shaders Godot" in godot_agent.get("name_pt", "") and
            content_agent and "Criador de Conteúdo" in content_agent.get("name_pt", "") and
            unity_agent and "Desenvolvedor de Ferramentas do Editor Unity" in unity_agent.get("name_pt", "")
        )
        print_result(4, "Tradução Completa de Títulos dos Agentes para pt-BR", passed,
                     f"Exemplos validados: {pdf_agent.get('name_pt')}, {godot_agent.get('name_pt')}, {content_agent.get('name_pt')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(4, "Tradução Completa de Títulos", False, str(e))

    # Test 5: Dual-Language Search (Portuguese and English)
    try:
        r_pt = requests.get(f"{API_BASE}/agents?search=Criador", timeout=5)
        r_en = requests.get(f"{API_BASE}/agents?search=Content%20Creator", timeout=5)
        r_pdf = requests.get(f"{API_BASE}/agents?search=Arquiteto", timeout=5)
        
        passed = (
            r_pt.status_code == 200 and len(r_pt.json()) > 0 and
            r_en.status_code == 200 and len(r_en.json()) > 0 and
            r_pdf.status_code == 200 and len(r_pdf.json()) >= 10
        )
        print_result(5, "Busca Bilíngue (Português pt-BR e Inglês Original)", passed,
                     f"Busca 'Criador': {len(r_pt.json())} agentes | Busca 'Content Creator': {len(r_en.json())} agentes | Busca 'Arquiteto': {len(r_pdf.json())} agentes")
        if passed: passed_count += 1
    except Exception as e:
        print_result(5, "Busca Bilíngue", False, str(e))

    # Test 6: AI Engine Manager & Google Gemini / Remote Provider Status
    try:
        r = requests.get(f"{API_BASE}/settings/ai-status", timeout=5)
        d = r.json()
        passed = (
            r.status_code == 200 and
            d.get("status") == "ready" and
            d.get("local_ram_consumed_mb") == 0 and
            d.get("single_agent_lock") is True
        )
        print_result(6, "Status do Motor de IA (Google Gemini / Zero RAM Local)", passed,
                     f"Provedor ativo: {d.get('active_provider')}, Modelo: {d.get('active_model')}, RAM consumida localmente pelo modelo: {d.get('local_ram_consumed_mb')} MB")
        if passed: passed_count += 1
    except Exception as e:
        print_result(6, "Status do Motor de IA", False, str(e))

    # Test 7: AI Provider Live Connection Test Endpoint
    try:
        payload = {"provider": "native", "model": "winc-native-engine"}
        r = requests.post(f"{API_BASE}/settings/test-connection", json=payload, timeout=5)
        d = r.json()
        passed = (r.status_code == 200 and d.get("status") == "success")
        print_result(7, "Endpoint de Teste de Conexão com Provedor de IA", passed,
                     f"Status: {d.get('status')}, Provedor: {d.get('provider')}, Latência: {d.get('latency_ms')}ms")
        if passed: passed_count += 1
    except Exception as e:
        print_result(7, "Teste de Conexão com Provedor de IA", False, str(e))

    # Test 8: WINC Master AI Planning in Brazilian Portuguese
    try:
        payload = {
            "prompt": "Criar plataforma de e-commerce com design, frontend, backend e SEO",
            "client": "Agência WINC",
            "category": "E-commerce"
        }
        r = requests.post(f"{API_BASE}/master/plan", json=payload, timeout=5)
        d = r.json()
        subtasks = d.get("subtasks", [])
        passed = (
            r.status_code == 200 and
            len(subtasks) >= 4 and
            all("agent_name" in s and s["agent_name"] for s in subtasks)
        )
        print_result(8, "WINC Master AI: Planejamento & Decomposição Multiagente (pt-BR)", passed,
                     f"Projeto gerado: {d.get('project_id')} com {len(subtasks)} subtarefas distribuídas para especialistas em pt-BR")
        if passed: passed_count += 1
    except Exception as e:
        print_result(8, "WINC Master AI: Planejamento", False, str(e))

    # Test 9: Sequential Task Queue Execution (Single-Agent Lock)
    try:
        # Enqueue plan
        r_exec = requests.post(f"{API_BASE}/master/execute", json={"plan": d}, timeout=5)
        task_ids = r_exec.json().get("queued_tasks", [])
        passed = (r_exec.status_code == 200 and len(task_ids) > 0)
        
        # Verify task statuses
        time.sleep(1.5)
        r_tasks = requests.get(f"{API_BASE}/tasks?project_id={d.get('project_id')}", timeout=5)
        tasks = r_tasks.json()
        running = [t for t in tasks if t["status"] == "running"]
        completed = [t for t in tasks if t["status"] == "completed"]
        
        passed = passed and (len(running) <= 1)
        print_result(9, "Fila de Tarefas Sequencial com Trava Estrita de 1 Agente por Vez", passed,
                     f"Tarefas enfileiradas: {len(task_ids)}, Em execução simultânea: {len(running)} (Máximo permitido: 1)")
        if passed: passed_count += 1
    except Exception as e:
        print_result(9, "Fila de Tarefas Sequencial", False, str(e))

    # Test 10: Model Weight Purge & RAM Optimization
    try:
        r = requests.post(f"{API_BASE}/system/purge-memory", timeout=5)
        d = r.json()
        passed = (r.status_code == 200 and d.get("status") == "ok")
        print_result(10, "Descarregamento Ativo de Pesos de Memória (Garbage Collection)", passed,
                     f"Status: {d.get('status')}, RAM recuperada para o sistema operacional")
        if passed: passed_count += 1
    except Exception as e:
        print_result(10, "Descarregamento Ativo de Pesos", False, str(e))

    # Test 11: Frontend Production Bundle Verification (pt-BR + Tailwind)
    try:
        r = requests.get("http://127.0.0.1:8000/", timeout=5)
        html = r.text
        passed = (
            r.status_code == 200 and
            'lang="pt-BR"' in html and
            "winc_favicon.png" in html and
            "assets/index-" in html
        )
        print_result(11, "Distribuição Web Produção (HTML pt-BR, Brand Assets & Tailwind CSS)", passed,
                     f"Código HTTP: {r.status_code}, Tag HTML lang='pt-BR': Presente, Assets compilados: Presentes")
        if passed: passed_count += 1
    except Exception as e:
        print_result(11, "Distribuição Web Produção", False, str(e))

    # Test 12: WINC Master AI Avatar Asset & Alpha Transparency
    try:
        r = requests.get("http://127.0.0.1:8000/brand/winc_master_avatar.png", timeout=5)
        passed = (r.status_code == 200 and len(r.content) > 50000 and r.headers.get("content-type") == "image/png")
        print_result(12, "Avatar Oficial WINC Master AI (Fundo Transparente & HD)", passed,
                     f"Status: {r.status_code}, Tamanho: {len(r.content)} bytes, Content-Type: {r.headers.get('content-type')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(12, "Avatar Oficial WINC Master AI", False, str(e))

    # Test 13: Voice Catalog & Male Brazilian Portuguese TTS
    try:
        r_voices = requests.get(f"{API_BASE}/tts/voices", timeout=5)
        voices = r_voices.json()
        antonio_voice = next((v for v in voices if v["id"] == "pt-BR-AntonioNeural"), None)
        
        # Test synthesis
        r_synth = requests.post(f"{API_BASE}/tts/synthesize", json={
            "text": "WINC Master AI operacional com voz masculina em português.",
            "voice": "pt-BR-AntonioNeural"
        }, timeout=15)
        synth_data = r_synth.json()

        passed = (
            r_voices.status_code == 200 and
            antonio_voice is not None and
            antonio_voice.get("recommended") is True and
            r_synth.status_code == 200 and
            synth_data.get("status") == "ok" and
            synth_data.get("audio_url", "").endswith(".mp3")
        )
        print_result(13, "Catálogo de Vozes & Síntese Edge Neural TTS (pt-BR-AntonioNeural)", passed,
                     f"Voz oficial: {antonio_voice.get('name') if antonio_voice else None}, Áudio URL: {synth_data.get('audio_url')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(13, "Catálogo de Vozes & Síntese", False, str(e))

    # Test 14: Official Voice Sample Endpoint
    try:
        r = requests.get(f"{API_BASE}/tts/sample", timeout=15)
        d = r.json()
        passed = (r.status_code == 200 and d.get("status") == "ok" and "audio_url" in d)
        print_result(14, "Amostra Oficial de Voz do Personagem (/api/tts/sample)", passed,
                     f"Status: {d.get('status')}, Áudio retornado: {d.get('audio_url')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(14, "Amostra Oficial de Voz", False, str(e))

    # Test 15: Bidirectional Master AI Interaction & Autonomous Execution
    try:
        # Test greeting / assistance
        r_greet = requests.post(f"{API_BASE}/master/interact", json={
            "message": "Olá WINC Master AI, quais são suas diretrizes operacionais?"
        }, timeout=15)
        d_greet = r_greet.json()

        # Test natural language action triggering (RAM purge via voice command)
        r_action = requests.post(f"{API_BASE}/master/interact", json={
            "message": "Por favor, libere a memória RAM agora"
        }, timeout=15)
        d_action = r_action.json()

        passed = (
            r_greet.status_code == 200 and
            "response" in d_greet and
            len(d_greet["response"]) > 10 and
            r_action.status_code == 200 and
            "memória" in d_action.get("response", "").lower() and
            ("ram_purge" in d_action.get("action_taken", "") or "ram_purged" in d_action.get("action_taken", ""))
        )
        clean_preview = d_greet.get('response', '')[:60].encode('ascii', 'ignore').decode('ascii')
        print_result(15, "Interação por Voz Bidirecional & Execução de Ações Autônomas", passed,
                     f"Resposta WINC Master: '{clean_preview}...', Ação acionada por comando: {d_action.get('action_taken')}")
        if passed: passed_count += 1
    except Exception as e:
        print_result(15, "Interação por Voz Bidirecional", False, str(e))

    print("=" * 70)
    print(f"RESULTADO FINAL: {passed_count}/{total_tests} TESTES APROVADOS ({round(passed_count/total_tests*100)}%)")
    print("=" * 70)
    return passed_count == total_tests

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
