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
        # Forzamos bancos venezolanos para que la API no se confunda desde el extranjero
        "payTypes": ["PagoMovil", "Banesco"], 
        # Cambiamos "merchant" a None para capturar el promedio real de toda la comunidad
        "publisherType": None, 
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
    print("Iniciando actualización de tasas...")
    
    bcv = obtener_tasas_bcv()
    binance = obtener_tasa_binance()
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    datos_actuales = {"dolar_bcv": 567.68, "euro_bcv": 655.38, "binance_p2p": 762.78}
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                datos_actuales = json.load(f)
        except:
            pass
            
    dolar_final = bcv["usd"] if bcv["usd"] else datos_actuales.get("dolar_bcv", 567.68)
    euro_final = bcv["eur"] if bcv["eur"] else datos_actuales.get("euro_bcv", 655.38)
    binance_final = binance if binance else datos_actuales.get("binance_p2p", 762.78)
    
    fecha_actualizacion = datetime.now().strftime("%d/%m/%Y %I:%M %p")
    
    json_final = {
        "dolar_bcv": dolar_final,
        "euro_bcv": euro_final,
        "binance_p2p": binance_final,
        "actualizado": fecha_actualizacion
    }
    
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_final, f, indent=4, ensure_ascii=False)
        
    print("¡Proceso completado exitosamente!")
    print(json.dumps(json_final, indent=4))

if __name__ == "__main__":
    main()
