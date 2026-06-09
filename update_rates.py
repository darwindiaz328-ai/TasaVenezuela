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
        # Desactivamos la verificación SSL estricta (verify=False) porque el servidor del BCV a veces falla en la nube
        response = requests.get(url, headers=headers, verify=False, timeout=20)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Intentar extracción por IDs oficiales del BCV
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
        "payTypes": [],
        "publisherType": "merchant",
        "rows": 5,
        "tradeType": "BUY"
    }
    try:
        response = requests.post(url, json=payload, timeout=15)
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
    
    # Intentar capturar los precios actuales de internet
    bcv = obtener_tasas_bcv()
    binance = obtener_tasa_binance()
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    # Forzar la creación de la carpeta si GitHub la requiere
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores de respaldo por si las páginas se caen momentáneamente
    datos_actuales = {"dolar_bcv": 563.29, "euro_bcv": 654.87, "binance_p2p": 762.78}
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                datos_actuales = json.load(f)
        except:
            pass
            
    # Consolidar información: Prioriza lo nuevo, si falla usa el último registro guardado
    dolar_final = bcv["usd"] if bcv["usd"] else datos_actuales.get("dolar_bcv", 563.29)
    euro_final = bcv["eur"] if bcv["eur"] else datos_actuales.get("euro_bcv", 654.87)
    binance_final = binance if binance else datos_actuales.get("binance_p2p", 762.78)
    
    # Forzar la fecha y hora de la ejecución actual de hoy
    fecha_actualizacion = datetime.now().strftime("%d/%m/%Y %I:%M %p")
    
    json_final = {
        "dolar_bcv": dolar_final,
        "euro_bcv": euro_final,
        "binance_p2p": binance_final,
        "actualizado": fecha_actualizacion
    }
    
    # Guardar el resultado final en la ruta exacta exigida
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_final, f, indent=4, ensure_ascii=False)
        
    print("¡Proceso completado exitosamente!")
    print(json.dumps(json_final, indent=4))

if __name__ == "__main__":
    main()
