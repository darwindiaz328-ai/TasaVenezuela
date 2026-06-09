import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def obtener_tasas_bcv():
    url = "https://www.bcv.org.ve/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=20)
        soup = BeautifulSoup(response.text, "html.parser")
        
        div_usd = soup.find("div", id="dolar")
        div_eur = soup.find("div", id="euro")
        
        usd_val = None
        eur_val = None
        
        if div_usd and div_usd.find("strong"):
            usd_val = div_usd.find("strong").text.strip().replace(",", ".")
        if div_eur and div_eur.find("strong"):
            eur_val = div_eur.find("strong").text.strip().replace(",", ".")
            
        return {
            "usd": round(float(usd_val), 2) if usd_val else None,
            "eur": round(float(eur_val), 2) if eur_val else None
        }
    except Exception as e:
        print(f"Aviso: No se pudo extraer datos frescos del BCV: {e}")
        return {"usd": None, "eur": None}

def obtener_tasa_binance():
    url = "https://p2p.binance.com/bapi/c2c/v2/public/c2c/adv/search"
    payload = {
        "asset": "USDT",
        "fiat": "VES",
        "merchantCheck": False,
        "page": 1,
        "payTypes": ["PagoMovil", "Banesco"], 
        "publisherType": "all",
        "rows": 5,
        "tradeType": "BUY"
    }
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        data = response.json()
        precios = [float(adv["adv"]["price"]) for adv in data.get("data", [])]
        if precios:
            return round(sum(precios) / len(precios), 2)
        return None
    except Exception as e:
        print(f"Aviso: No se pudo extraer datos frescos de Binance: {e}")
        return None

def main():
    print("Iniciando actualización de tasas estructuradas...")
    
    bcv = obtener_tasas_bcv()
    binance = obtener_tasa_binance()
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores base por si todo lo demás falla
    tasa_binance_real = 762.78
    dolar_bcv_base = 567.68
    euro_bcv_base = 655.38
    
    # Intentar rescatar datos anteriores para no perder el historial si falla la red
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                archivo_guardado = json.load(f)
                if "rates" in archivo_guardado:
                    r_guardado = archivo_guardado["rates"]
                    if r_guardado.get("USDT_BINANCE", 0) > 650:
                        tasa_binance_real = r_guardado["USDT_BINANCE"]
                    dolar_bcv_base = r_guardado.get("USD_BCV", dolar_bcv_base)
                    euro_bcv_base = r_guardado.get("EUR_BCV", euro_bcv_base)
        except:
            pass
            
    # Procesar las respuestas frescas con filtros antibloqueo
    dolar_final = bcv["usd"] if bcv["usd"] else dolar_bcv_base
    euro_final = bcv["eur"] if bcv["eur"] else euro_bcv_base
    binance_final = binance if (binance and binance > 650) else tasa_binance_real
    
    # Tiempos en los formatos exactos que requiere tu JS
    fecha_bcv = datetime.now().strftime("%d/%m/%Y")
    fecha_iso_actualizacion = datetime.now().utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # ESTRUCTURA EXACTA QUE REFIERE TU JAVASCRIPT (¡No tocar las llaves!)
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_final,
            "EUR_BCV": euro_final,
            "USDT_BINANCE": binance_final,
            "CNY_BCV": 0.0,  # Valores complementarios requeridos por tu DOM
            "TRY_BCV": 0.0,
            "RUB_BCV": 0.0
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_bcv}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)
        
    print("¡Estructura de tasas actualizada para la aplicación!")
    print(json.dumps(json_estructurado, indent=4))

if __name__ == "__main__":
    main()
