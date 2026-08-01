import os
import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta

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
    print("Iniciando actualización con valores oficiales de cierre del BCV...")
    
    bcv = obtener_tasas_bcv()
    binance = obtener_tasa_binance()
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores exactos de cierre del Viernes 31/07/2026 basados en la fuente oficial del BCV
    dolar_bcv_cierre = 746.63
    euro_bcv_cierre = 858.98
    tasa_binance_real = 841.33  # Ajustado al promedio P2P real o último conocido
    
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                archivo_guardado = json.load(f)
                if "rates" in archivo_guardado:
                    r_guardado = archivo_guardado["rates"]
                    if r_guardado.get("USDT_BINANCE", 0) > 650:
                        tasa_binance_real = r_guardado["USDT_BINANCE"]
        except:
            pass
            
    dolar_final = bcv["usd"] if bcv["usd"] else dolar_bcv_cierre
    euro_final = bcv["eur"] if bcv["eur"] else euro_bcv_cierre
    binance_final = binance if (binance and binance > 650) else tasa_binance_real
    
    ahora_local = datetime.now()
    hoy_str = ahora_local.strftime("%Y-%m-%d")
    fecha_bcv = "Viernes, 31 de Julio 2026"
    fecha_iso_actualizacion = ahora_local.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_final,
            "EUR_BCV": euro_final,
            "USDT_BINANCE": binance_final,
            "CNY_BCV": 110.53,
            "TRY_BCV": 15.75,
            "RUB_BCV": 9.33
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_bcv}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # 1. Guardar rates.json
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # 2. GESTIÓN DEL HISTORIAL.JSON CON LOS VALORES REALES DEL CIERRE
    ruta_historial = "historial.json"
    
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except:
                pass

    # Limpiar cualquier fecha futura errónea
    fechas_a_borrar = [f for f in historial.keys() if f > hoy_str]
    for f_mala in fechas_a_borrar:
        del historial[f_mala]

    # Forzar el registro exacto del 31 de julio de 2026 con los números oficiales de la imagen
    historial["2026-07-31"] = {
        "USD": 746.63,
        "EUR": 858.98,
        "USDT": float(binance_final)
    }

    # Ordenar de forma descendente
    historial_ordenado = dict(sorted(historial.items(), reverse=True))

    with open(ruta_historial, "w", encoding="utf-8") as f:
        json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        
    print("¡Historial corregido con las tasas exactas del cierre del BCV!")

if __name__ == "__main__":
    main()
