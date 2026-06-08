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
        # Desactivamos verificación SSL temporalmente si el BCV tiene problemas de certificados
        response = requests.get(url, headers=headers, verify=False, timeout=15)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Buscamos los contenedores específicos del BCV para Euro y Dólar
        div_usd = soup.find("div", id="dolar")
        div_eur = soup.find("div", id="euro")
        
        # Limpieza de texto y conversión de comas a puntos decimales
        usd_text = div_usd.find("strong").text.strip().replace(",", ".") if div_usd else None
        eur_text = div_eur.find("strong").text.strip().replace(",", ".") if div_eur else None
        
        return {
            "usd": round(float(usd_text), 2) if usd_text else None,
            "eur": round(float(eur_text), 2) if eur_text else None
        }
    except Exception as e:
        print(f"Error extrayendo del BCV: {e}")
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
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()
        
        # Sacamos un promedio de los primeros 5 comerciantes principales para mayor estabilidad
        precios = [float(adv["adv"]["price"]) for adv in data["data"]]
        if precios:
            return round(sum(precios) / len(precios), 2)
        return None
    except Exception as e:
        print(f"Error extrayendo de Binance P2P: {e}")
        return None

def main():
    print("Iniciando actualización de tasas...")
    
    # 1. Obtener los datos frescos de internet
    tasas_bcv = obtener_tasas_bcv()
    tasa_binance = obtener_tasa_binance()
    
    # 2. Leer los datos anteriores por si alguna página falla (No perder el histórico)
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    # Asegurar que la carpeta Datos exista (Previene el FileNotFoundError)
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    datos_actuales = {"dolar_bcv": 0.0, "euro_bcv": 0.0, "binance_p2p": 0.0, "actualizado": ""}
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                datos_actuales = json.load(f)
        except:
            pass

    # 3. Guardar solo si se obtuvieron datos nuevos, sino mantener el anterior conocido
    tasas_finales = {
        "dolar_bcv": tasas_bcv["usd"] if tasas_bcv["usd"] else datos_actuales.get("dolar_bcv", 563.29),
        "euro_bcv": tasas_bcv["eur"] if tasas_bcv["eur"] else datos_actuales.get("euro_bcv", 654.86),
        "binance_p2p": tasa_binance if tasa_binance else datos_actuales.get("binance_p2p", 565.00),
        "actualizado": datetime.now().strftime("%d/%m/%Y %I:%M %p")
    }
    
    # 4. Escribir el nuevo JSON que consume tu app móvil
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(tasas_finales, f, indent=4, ensure_ascii=False)
        
    print("¡Tasas actualizadas con éxito en Datos/rates.json!")
    print(tasas_finales)

if __name__ == "__main__":
    main()
