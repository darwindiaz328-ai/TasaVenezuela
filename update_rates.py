import requests
import json
from datetime import datetime
import os

def get_binance_p2p(bcv_usd):
    """Obtiene el valor de Binance P2P usando espejos tolerantes o un estimado inteligente"""
    # Proveedores alternativos que no bloquean los servidores de GitHub
    urls = [
        "https://ve.dolarapi.com/v1/dolares/paralelo",
        "https://pydolarvenezuela-api.vercel.app/api/v1/dollar"
    ]
    
    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                res = response.json()
                
                # Caso 1: DolarApi Paralelo
                if isinstance(res, dict) and ("valor" in res or "promedio" in res):
                    val = res.get("valor") or res.get("promedio")
                    if val and float(val) > 10:
                        return round(float(val), 2)
                        
                # Caso 2: PyDolar (Busca claves dinámicas de paralelo o binance)
                if isinstance(res, dict):
                    monedas = res.get('monedas', {}) or res
                    for k, v in monedas.items():
                        if isinstance(v, dict) and ('binance' in k.lower() or 'paralelo' in k.lower()):
                            price = v.get('price')
                            if price and float(price) > 10:
                                return round(float(price), 2)
        except Exception as e:
            print(f"Aviso buscando precio alternativo en {url}: {e}")

    # Intento directo a Binance (Suele dar 403 por bloqueo de Cloudflare en GitHub Actions)
    url_binance = "https://p2p.binance.com/bapi/c2c/v1/friendly/c2c/adv/search"
    payload = {
        "asset": "USDT", "fiat": "VES", "merchantCheck": False,
        "page": 1, "payTypes": [], "publisherType": None, "rows": 5, "tradeType": "BUY"
    }
    try:
        response = requests.post(url_binance, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            prices = [float(adv['adv']['price']) for adv in data.get('data', []) if 'adv' in adv and 'price' in adv['adv']]
            if prices:
                return round(sum(prices) / len(prices), 2)
    except Exception as e:
        print(f"Binance directo inaccesible: {e}")

    # PLAN B INTELIGENTE DINÁMICO: Si todo lo anterior falla, calcula un 2.5% encima del BCV actual
    print("Calculando Binance de forma dinámica basada en BCV.")
    return round(bcv_usd * 1.025, 2)

def get_bcv_rates():
    url = "https://pydolarvenezuela-api.vercel.app/api/v1/dollar"
    fallback = {"USD": 563.29, "EUR": 619.62, "CNY": 7.80, "TRY": 1.60, "RUB": 0.60, "fecha": datetime.now().strftime("%d/%m/%Y")}
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            res = response.json()
            monedas = res.get('monedas', {})
            
            def ext(obj, d):
                if isinstance(obj, dict): return obj.get('price', d)
                return obj if obj is not None else d

            return {
                "USD": round(float(ext(monedas.get('usd'), 563.29)), 2),
                "EUR": round(float(ext(monedas.get('eur'), 619.62)), 2),
                "CNY": round(float(ext(monedas.get('cny'), 5.12)), 4),
                "TRY": round(float(ext(monedas.get('try'), 1.15)), 4),
                "RUB": round(float(ext(monedas.get('rub'), 0.41)), 4),
                "fecha": res.get('fecha', datetime.now().strftime("%d/%m/%Y"))
            }
    except Exception as e:
        print(f"Aviso BCV: {e}")
        
    try:
        res = requests.get("https://ve.dolarapi.com/v1/dolares/oficial", timeout=10).json()
        if isinstance(res, dict) and "valor" in res:
            v = float(res["valor"])
            return {"USD": round(v, 2), "EUR": round(v * 1.1, 2), "CNY": 5.12, "TRY": 1.15, "RUB": 0.41, "fecha": datetime.now().strftime("%d/%m/%Y")}
    except:
        pass
        
    return fallback

def main():
    print("Iniciando recolección inteligente...")
    bcv = get_bcv_rates()
    
    # Le pasamos el valor real del BCV para el cálculo de respaldo dinámico
    binance_usdt = get_binance_p2p(bcv["USD"])
    
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
    
    os.makedirs("Datos", exist_ok=True)
    with open("Datos/rates.json", "w", encoding="utf-8") as f:
        json.dump(updated_json, f, indent=2, ensure_ascii=False)
    print("¡Base de datos sincronizada con éxito!")

if __name__ == "__main__":
    main()
