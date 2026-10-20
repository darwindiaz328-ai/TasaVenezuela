#!/usr/bin/env python3
"""
trigger_webhook.py
Disparador de Webhook Externo para TasaVenezuela.
Ejecuta la actualización inmediata en GitHub Actions mediante repository_dispatch o workflow_dispatch.
Diseñado para ejecutarse puntualmente a la medianoche o bajo demanda para simulaciones en tiempo real.
"""

import sys
import os
import json
import time
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.error

OWNER = "darwindiaz328-ai"
REPO = "TasaVenezuela"

def get_token():
    # 1. Parámetro de línea de comandos
    for arg in sys.argv:
        if arg.startswith("ghp_"):
            return arg
            
    # 2. Variable de entorno
    env_token = os.environ.get("GITHUB_TOKEN")
    if env_token:
        return env_token.strip()
        
    # 3. Archivo local seguro .github_token
    base_dir = os.path.dirname(os.path.abspath(__file__))
    token_file = os.path.join(base_dir, ".github_token")
    if os.path.exists(token_file):
        with open(token_file, "r", encoding="utf-8") as f:
            return f.read().strip()
            
    print("❌ Error: No se encontró token de GitHub. Configure GITHUB_TOKEN o el archivo .github_token.")
    sys.exit(1)

def disparar_webhook(event_type="medianoche_trigger", payload=None, esperar=False):
    token = get_token()
    vet_tz = timezone(timedelta(hours=-4))
    ahora_vet = datetime.now(vet_tz).strftime("%Y-%m-%d %I:%M:%S %p VET")
    
    print("=" * 65)
    print("🚀 DISPARADOR DE WEBHOOK EXTERNO - TASAVENEZUELA")
    print(f"🕒 Timestamp: {ahora_vet}")
    print(f"🎯 Repositorio: {OWNER}/{REPO}")
    print(f"📡 Evento: {event_type}")
    print("=" * 65)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "TasaVenezuela-WebhookTrigger/1.0",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    # 1. Intentar repository_dispatch
    url_dispatch = f"https://api.github.com/repos/{OWNER}/{REPO}/dispatches"
    body_dispatch = {
        "event_type": event_type,
        "client_payload": payload or {
            "origen": "webhook_externo_medianoche",
            "ejecutado_en": ahora_vet,
            "force": True
        }
    }
    
    req_dispatch = urllib.request.Request(
        url_dispatch,
        data=json.dumps(body_dispatch).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    exito = False
    try:
        print("\n[1/2] Enviando señal HTTP POST a repository_dispatch...")
        with urllib.request.urlopen(req_dispatch, timeout=15) as resp:
            status = resp.status
            print(f"✅ Respuesta recibida de GitHub: HTTP {status} (Accepted / No Content)")
            exito = True
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"⚠️ Aviso en repository_dispatch (HTTP {e.code}): {err}")
    except Exception as e:
        print(f"⚠️ Error de conexión: {e}")

    # Fallback o refuerzo con workflow_dispatch para garantizar ejecución inmediata
    url_wf = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/auto_update.yml/dispatches"
    body_wf = {
        "ref": "main",
        "inputs": {
            "force": True
        }
    }
    req_wf = urllib.request.Request(
        url_wf,
        data=json.dumps(body_wf).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    print("\n[2/2] Enviando señal directa a workflow_dispatch...")
    try:
        with urllib.request.urlopen(req_wf, timeout=15) as resp:
            print(f"✅ Respuesta recibida de GitHub: HTTP {resp.status} (Dispatched)")
            exito = True
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"ℹ️ Respuesta workflow_dispatch (HTTP {e.code}): {err}")
    except Exception as e:
        print(f"ℹ️ workflow_dispatch: {e}")

    if not exito:
        print("\n❌ No se pudo disparar el webhook.")
        return False

    print("\n🎉 ¡Disparo de Webhook completado con ÉXITO!")
    print("GitHub Actions ha recibido la orden de ejecución inmediata.")

    if esperar:
        print("\n⏳ Monitoreando la ejecución en tiempo real en GitHub Actions...")
        return monitorear_ejecucion(headers)

    return True

def monitorear_ejecucion(headers, max_segundos=180):
    url_runs = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/runs?per_page=5"
    inicio = time.time()
    run_identificado = None

    time.sleep(4) # Pausa breve para que GitHub cree el objeto de ejecución

    while time.time() - inicio < max_segundos:
        try:
            req = urllib.request.Request(url_runs, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                runs = data.get("workflow_runs", [])
                
                if runs:
                    latest = runs[0]
                    run_id = latest["id"]
                    status = latest["status"]
                    conclusion = latest.get("conclusion")
                    event = latest["event"]
                    created = latest["created_at"]
                    
                    if not run_identificado:
                        run_identificado = run_id
                        print(f"📌 Workflow Run detectado: ID #{run_id} | Evento: {event} | Creado: {created}")

                    if run_id == run_identificado:
                        print(f"   Estado actual: {status.upper()} | Conclusión: {str(conclusion).upper()}")
                        if status == "completed":
                            print(f"\n🏁 Ejecución finalizada con conclusión: {conclusion.upper()}!")
                            return latest

        except Exception as e:
            print(f"Aviso consultando estado: {e}")

        time.sleep(5)

    print("⚠️ Tiempo de espera para monitoreo alcanzado.")
    return None

if __name__ == "__main__":
    esperar_flag = "--watch" in sys.argv or "--wait" in sys.argv
    evento = "medianoche_trigger"
    if "--simular" in sys.argv or "--simulacion" in sys.argv:
        evento = "simulacion_medianoche"
    
    disparar_webhook(event_type=evento, esperar=esperar_flag)
