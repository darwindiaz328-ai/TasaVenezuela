#!/usr/bin/env python3
"""
setup_cloud_cron.py
Crea/actualiza en cron-job.org los disparadores en la nube que ejecutan el
workflow de GitHub Actions (auto_update.yml) a la hora exacta, sin depender
de que el computador local este encendido.

Uso:
  python setup_cloud_cron.py            -> crea o actualiza los trabajos
  python setup_cloud_cron.py --list     -> lista trabajos y proximas ejecuciones
  python setup_cloud_cron.py --test     -> crea un trabajo de prueba que se ejecuta
                                           en ~2 minutos, verifica y lo elimina

Secretos (no se suben al repositorio, ver .gitignore):
  .cronjob_api_key        -> API key de cron-job.org
  .github_dispatch_token  -> token fine-grained de GitHub (Actions: read/write)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

VET_TZ = timezone(timedelta(hours=-4))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CRON_API = "https://api.cron-job.org"
TZ = "America/Caracas"
DISPATCH_URL = ("https://api.github.com/repos/darwindiaz328-ai/TasaVenezuela"
                "/actions/workflows/auto_update.yml/dispatches")

JOBS = [
    {
        "title": "TasaVenezuela - Medianoche (12:01, 12:10, 12:30 AM VET)",
        "hours": [0],
        "minutes": [1, 10, 30],
    },
    {
        "title": "TasaVenezuela - Monitoreo diurno cada 3 horas (VET)",
        "hours": [3, 6, 9, 12, 15, 18, 21],
        "minutes": [17],
    },
]


def leer_secreto(nombre):
    ruta = os.path.join(BASE_DIR, nombre)
    if not os.path.exists(ruta):
        sys.exit(f"Falta el archivo de secreto: {nombre}")
    with open(ruta, encoding="utf-8") as f:
        return f.read().strip()


API_KEY = leer_secreto(".cronjob_api_key")
GH_TOKEN = leer_secreto(".github_dispatch_token")


def cron(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        CRON_API + path, data=data, method=method,
        headers={"Authorization": f"Bearer {API_KEY}",
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace")


def definicion_job(title, hours, minutes, expires_at=0):
    return {
        "title": title,
        "enabled": True,
        "url": DISPATCH_URL,
        "requestMethod": 1,  # POST
        "requestTimeout": 30,
        "saveResponses": True,
        "schedule": {
            "timezone": TZ,
            "expiresAt": expires_at,
            "hours": hours,
            "minutes": minutes,
            "mdays": [-1],
            "months": [-1],
            "wdays": [-1],
        },
        "extendedData": {
            "headers": {
                "Authorization": f"Bearer {GH_TOKEN}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
                "User-Agent": "TasaVenezuela-CloudCron",
            },
            "body": json.dumps({"ref": "main", "inputs": {"force": "true"}}),
        },
        "notification": {
            "onFailure": True,
            "onFailureCount": 1,
            "onSuccess": True,
            "onDisable": True,
        },
    }


def fmt(ts):
    if not ts:
        return "-"
    return datetime.fromtimestamp(ts, VET_TZ).strftime("%Y-%m-%d %I:%M:%S %p VET")


def listar():
    s, d = cron("GET", "/jobs")
    if s != 200:
        sys.exit(f"Error listando trabajos: {s} {d}")
    return d.get("jobs", [])


def crear_o_actualizar():
    existentes = {j["title"]: j for j in listar()}
    for job in JOBS:
        cuerpo = {"job": definicion_job(job["title"], job["hours"], job["minutes"])}
        if job["title"] in existentes:
            jid = existentes[job["title"]]["jobId"]
            s, d = cron("PATCH", f"/jobs/{jid}", cuerpo)
            print(f"Actualizado #{jid}: {job['title']} -> HTTP {s}")
        else:
            s, d = cron("PUT", "/jobs", cuerpo)
            print(f"Creado: {job['title']} -> HTTP {s} {d}")
        time.sleep(1.5)


def mostrar():
    for j in listar():
        jid = j["jobId"]
        s, h = cron("GET", f"/jobs/{jid}/history")
        preds = h.get("predictions", []) if isinstance(h, dict) else []
        print(f"#{jid} | {j['title']} | activo={j['enabled']}")
        print(f"   Ultima ejecucion: {fmt(j.get('lastExecution'))} (estado {j.get('lastStatus')})")
        print("   Proximas: " + ", ".join(fmt(p) for p in preds))
        time.sleep(0.3)


def prueba():
    objetivo = datetime.now(VET_TZ) + timedelta(minutes=2)
    objetivo = objetivo.replace(second=0, microsecond=0)
    expira = (objetivo + timedelta(minutes=3)).strftime("%Y%m%d%H%M%S")
    cuerpo = {"job": definicion_job("TasaVenezuela - PRUEBA temporal",
                                    [objetivo.hour], [objetivo.minute], int(expira))}
    cuerpo["job"]["notification"] = {"onFailure": False, "onSuccess": False, "onDisable": False}
    s, d = cron("PUT", "/jobs", cuerpo)
    if s != 200:
        sys.exit(f"No se pudo crear el trabajo de prueba: {s} {d}")
    jid = d["jobId"]
    print(f"Trabajo de prueba #{jid} programado para {objetivo.strftime('%I:%M %p VET')}")
    try:
        limite = time.time() + 300
        while time.time() < limite:
            time.sleep(15)
            s, h = cron("GET", f"/jobs/{jid}/history")
            hist = h.get("history", []) if isinstance(h, dict) else []
            if hist:
                it = hist[0]
                print(f"Ejecutado: planificado {fmt(it['datePlanned'])}, real {fmt(it['date'])}")
                print(f"Respuesta de GitHub: HTTP {it.get('httpStatus')} ({it.get('statusText')})")
                return it.get("httpStatus") == 204
        print("No se registro ejecucion dentro del tiempo de espera.")
        return False
    finally:
        cron("DELETE", f"/jobs/{jid}")
        print(f"Trabajo de prueba #{jid} eliminado.")


if __name__ == "__main__":
    if "--list" in sys.argv:
        mostrar()
    elif "--test" in sys.argv:
        ok = prueba()
        sys.exit(0 if ok else 1)
    else:
        crear_o_actualizar()
        mostrar()
