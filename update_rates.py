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
        "publisherType": "all", # "all" en lugar de None corrige el formato de la API
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
        
    # Tasa real del mercado paralelo actual como base de seguridad
    tasa_binance_real = 762.78
    
    datos_actuales = {"dolar_bcv": 567.68, "euro_bcv": 655.38, "binance_p2p": tasa_binance_real}
    
    # Leer archivo existente para rescatar datos previos si es necesario
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                archivo_guardado = json.load(f)
                # Si el archivo guardado tiene el error de los 565, lo ignoramos y usamos la real
                if archivo_guardado.get("binance_p2p", 0) > 650:
                    datos_actuales["binance_p2p"] = archivo_guardado["binance_p2p"]
                datos_actuales["dolar_bcv"] = archivo_guardado.get("dolar_bcv", 567.68)
                datos_actuales["euro_bcv"] = archivo_guardado.get("euro_bcv", 655.38)
        except:
            pass
            
    # Asignación final con filtro inteligente antibloqueo geográfico
    dolar_final = bcv["usd"] if bcv["usd"] else datos_actuales.get("dolar_bcv", 567.68)
    euro_final = bcv["eur"] if bcv["eur"] else datos_actuales.get("euro_bcv", 655.38)
    
    # Si Binance devuelve una tasa ilógica (menor a 650) por bloqueo de IP, se activa el escudo
    if binance and binance > 650:
        binance_final = binance
    else:
        print("Filtro activado: Binance entregó un valor falso o nulo. Preservando tasa real.")
        binance_final = datos_actuales.get("binance_p2p", tasa_binance_real)
    
    fecha_actualizacion = datetime.now().strftime("%d/%m/%Y %I:%M %p")
    
    json_final = {
        "dolar_bcv": dolar_final,
        "euro_bcv": euro_final,
        "binance_p2p": binance_final,
        "actualizado": fecha_actualizacion
    }
    
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_final, f, indent=4, ensure_ascii=False)
        
    print("¡Proceso completado con éxito!")
    print(json.dumps(json_final, indent=4))

if __name__ == "__main__":
    main()
