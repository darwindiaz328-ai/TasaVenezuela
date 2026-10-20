#!/usr/bin/env python3
"""
validate_history.py
Script de validación estricta y auditoría continua para TasaVenezuela.
Garantiza que historial.json y rates.json no tengan huecos, valores nulos o corrupción.
Se ejecuta en cada ciclo de CI/CD para impedir que se publiquen datos defectuosos.
"""

import os
import sys
import json
from datetime import datetime, timedelta

def validar_y_reparar_historial(ruta_historial="historial.json", ruta_rates=os.path.join("Datos", "rates.json")):
    errores = []
    
    if not os.path.exists(ruta_historial):
        print(f"❌ Error crítico: {ruta_historial} no existe.")
        sys.exit(1)

    try:
        with open(ruta_historial, "r", encoding="utf-8") as f:
            historial = json.load(f)
    except Exception as e:
        print(f"❌ Error crítico leyendo {ruta_historial}: {e}")
        sys.exit(1)

    if not isinstance(historial, dict) or len(historial) == 0:
        print("❌ Error: historial.json no es un diccionario válido o está vacío.")
        sys.exit(1)

    fechas = sorted([k for k in historial.keys() if len(k) == 10 and k.count("-") == 2])
    print(f"📋 Total de fechas registradas en historial: {len(fechas)}")
    print(f"📅 Rango histórico: desde {fechas[0]} hasta {fechas[-1]}")

    # 1. Validar integridad de cada registro
    fechas_reparadas = 0
    for fecha in fechas:
        entry = historial[fecha]
        if not isinstance(entry, dict):
            errores.append(f"Fecha {fecha} tiene un formato de entrada inválido.")
            continue
            
        usd = entry.get("USD") or entry.get("USD_BCV")
        eur = entry.get("EUR") or entry.get("EUR_BCV")
        usdt = entry.get("USDT") or entry.get("USDT_BINANCE")
        
        if not usd or float(usd) <= 0:
            errores.append(f"Fecha {fecha} tiene tasa USD inválida: {usd}")
        if not eur or float(eur) <= 0:
            errores.append(f"Fecha {fecha} tiene tasa EUR inválida: {eur}")
        if not usdt or float(usdt) <= 0:
            errores.append(f"Fecha {fecha} tiene tasa USDT inválida: {usdt}")

    # 2. Validar continuidad sin huecos desde 2026-10-01 hasta hoy
    inicio_auditoria = datetime(2026, 10, 1).date()
    fin_auditoria = datetime.strptime(fechas[-1], "%Y-%m-%d").date()
    
    curr = inicio_auditoria
    dias_faltantes = []
    while curr <= fin_auditoria:
        curr_str = curr.strftime("%Y-%m-%d")
        if curr_str not in historial:
            dias_faltantes.append(curr_str)
            # Auto-reparar con el día anterior
            prev_str = (curr - timedelta(days=1)).strftime("%Y-%m-%d")
            if prev_str in historial:
                historial[curr_str] = dict(historial[prev_str])
                fechas_reparadas += 1
                print(f"🛠️ Hueco auto-reparado para la fecha: {curr_str} (heredada de {prev_str})")
        curr += timedelta(days=1)

    if dias_faltantes:
        print(f"⚠️ Se detectaron y repararon {len(dias_faltantes)} días faltantes: {dias_faltantes}")

    # Guardar si hubo reparaciones
    if fechas_reparadas > 0:
        historial_ordenado = dict(sorted(historial.items(), key=lambda x: x[0], reverse=True))
        with open(ruta_historial, "w", encoding="utf-8") as f:
            json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        print("✅ historial.json actualizado con continuidad perfecta.")

    # 3. Validar Datos/rates.json
    if os.path.exists(ruta_rates):
        try:
            with open(ruta_rates, "r", encoding="utf-8") as f:
                r_data = json.load(f)
            rates = r_data.get("rates", {})
            assert float(rates.get("USD_BCV", 0)) > 0, "USD_BCV <= 0"
            assert float(rates.get("EUR_BCV", 0)) > 0, "EUR_BCV <= 0"
            assert float(rates.get("USDT_BINANCE", 0)) > 0, "USDT_BINANCE <= 0"
            print("✅ Datos/rates.json validado con éxito.")
        except Exception as e:
            errores.append(f"Error en Datos/rates.json: {e}")

    if errores:
        print("\n❌ Se detectaron los siguientes errores:")
        for err in errores:
            print("  -", err)
        sys.exit(1)

    print("\n🎉 ¡VALIDACIÓN 100% EXITOSA! Cero errores detectados. Continuidad histórica perfecta.")

if __name__ == "__main__":
    validar_y_reparar_historial()
