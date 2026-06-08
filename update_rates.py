import requests
import json
from datetime import datetime

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
            prices = [float(adv['adv']['price']) for adv in data.get('data', [])]
            if prices:
                return round(sum(prices) / len(prices), 2)
    except Exception as e:
        print(f"Error Binance: {e}")
    return 37.20

def get_bcv_rates():
    # Conexión directa a la API del mercado venezolano
    url = "https://pydolarvenezuela-api.vercel.app/api/v1/dollar"
    try:
        res = requests.get(url, timeout=10).json()
        monedas = res.get('monedas', {})
        return {
            "USD": round(float(monedas.get('usd', {}).get('price', 36.55)), 2),
            "EUR": round(float(monedas.get('eur', {}).get('price', 40.12)), 2),
            "CNY": round(float(monedas.get('cny', {}).get('price', 5.12)), 4),
            "TRY": round(float(monedas.get('try', {}).get('price', 1.15)), 4),
            "RUB": round(float(monedas.get('rub', {}).get('price', 0.41)), 4),
            "fecha": res.get('fecha', datetime.now().strftime("%d/%m/%Y"))
        }
    except Exception as e:
        print(f"Error BCV: {e}")
        return {"USD": 36.55, "EUR": 40.12, "CNY": 5.12, "TRY": 1.15, "RUB": 0.41, "fecha": datetime.now().strftime("%d/%m/%Y")}

def main():
    print("Buscando tasas reales del mercado...")
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
    
    # Guarda los precios reales directamente reemplazando la plantilla
    with open("Datos/rates.json", "w", encoding="utf-8") as f:
        json.dump(updated_json, f, indent=2, ensure_ascii=False)
    print("¡Precios reales guardados exitosamente!")

if __name__ == "__main__":
    main()
