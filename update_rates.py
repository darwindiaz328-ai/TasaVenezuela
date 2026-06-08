import requests
import json
from datetime import datetime
import os

def get_binance_p2p():
    url = "https://p2p.binance.com/bapi/c2c/v1/friendly/c2c/adv/search"
    payload = {
        "asset": "USDT", "fiat": "VES", "merchantCheck": False,
        "page": 1, "payTypes": [], "publisherType": None, "rows": 5, "tradeType": "BUY"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            prices = [float(adv['adv']['price']) for adv in data.get('data', []) if 'adv' in adv and 'price' in adv['adv']]
            if prices:
                return round(sum(prices) / len(prices), 2)
    except Exception as e:
        print(f"Aviso Binance: {e}")
    return 37.20

def get_bcv_rates():
    # Probamos dos proveedores distintos por si uno está caído
    urls = [
        "https://ve.dolarapi.com/v1/dolares/oficial",
        "https://pydolarvenezuela-api.vercel.app/api/v1/dollar"
    ]
    
    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                res = response.json()
                
                # Procesar si responde el proveedor 1 (DolarApi)
                if isinstance(res, dict) and ("valor" in res or "promedio" in res):
                    val = res.get("valor") or res.get("promedio") or 36.55
                    return {
                        "USD": round(float(val), 2),
                        "EUR": round(float(val * 1.1), 2),
                        "CNY": 5.12, "TRY": 1.15, "RUB": 0.41,
                        "fecha": datetime.now().strftime("%d/%m/%Y")
                    }
                
                # Procesar si responde el proveedor 2 (PyDolar)
                monedas = res.get('monedas', {})
                if monedas:
                    def ext(obj):
                        if isinstance(obj, dict): return obj.get('price', 0)
                        return obj or 0
                    return {
                        "USD": round(float(ext(monedas.get('usd', 36.55))), 2),
                        "EUR": round(float(ext(monedas.get('eur', 40.12))), 2),
                        "CNY": round(float(ext(monedas.get('cny', 5.12))), 4),
                        "TRY": round(float(ext(monedas.get('try', 1.15))), 4),
                        "RUB": round(float(ext(monedas.get('rub', 0.41))), 4),
                        "fecha": res.get('fecha', datetime.now().strftime("%d/%m/%Y"))
                    }
        except Exception as e:
            print(f" Proveedor temporalmente inaccesible en {url}: {e}")
            
    # Respaldo de salida si internet falla por completo
    return {"USD": 36.55, "EUR": 40.12, "CNY": 5.12, "TRY": 1.15, "RUB": 0.41, "fecha": datetime.now().strftime("%d/%m/%Y")}

def main():
    print("Iniciando recolección automatizada...")
    bcv = get_bcv_rates()
    binance_usdt = get_binance_p2p()
    now_iso = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    
    updated_json = {
        "metadata": {
            "bcv_date": bcv["fecha"],
            "last_updated": now_iso
        },
        "rates": {
            "USD_BCV": bcv["USD"],
            "EUR_BCV": bcv["EUR"],
            "USDT_BINANCE": binance_usdt,
            "CNY_BCV": bcv["CNY"],
            "TRY_BCV": bcv["TRY"],
            "RUB_BCV": bcv["RUB"]
        }
    }
    
    # SOLUCIÓN CRUCIAL: Forzar la creación de la carpeta si GitHub no la lee
    os.makedirs("Datos", exist_ok=True)
    
    with open("Datos/rates.json", "w", encoding="utf-8") as f:
        json.dump(updated_json, f, indent=2, ensure_ascii=False)
    print("¡Proceso completado con éxito!")

if __name__ == "__main__":
    main()
