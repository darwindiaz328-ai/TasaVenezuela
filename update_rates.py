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
    print("Iniciando actualización inteligente y validación de cambios...")
    
    bcv = obtener_tasas_bcv()
    binance = obtener_tasa_binance()
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores base de respaldo por si falla la red
    tasa_binance_real = 762.78
    dolar_bcv_base = 567.68
    euro_bcv_base = 655.38
    
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
            
    dolar_final = bcv["usd"] if bcv["usd"] else dolar_bcv_base
    euro_final = bcv["eur"] if bcv["eur"] else euro_bcv_base
    binance_final = binance if (binance and binance > 650) else tasa_binance_real
    
    fecha_bcv = datetime.now().strftime("%d/%m/%Y")
    fecha_iso_actualizacion = datetime.now().utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_final,
            "EUR_BCV": euro_final,
            "USDT_BINANCE": binance_final,
            "CNY_BCV": 0.0,
            "TRY_BCV": 0.0,
            "RUB_BCV": 0.0
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_bcv}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # 1. Guardar rates.json actual
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # 2. GESTIÓN BLINDADA DEL HISTORIAL.JSON CON VALIDACIÓN DE CAMBIOS
    ruta_historial = "historial.json"
    hoy_str = datetime.now().strftime("%Y-%m-%d")
    ayer_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except:
                pass

    # Asegurarnos de tener el día de ayer registrado para poder comparar de forma limpia
    ultimos_valores = None
    if historial:
        ultima_fecha_key = list(historial.keys())[0]
        ultimos_valores = historial[ultima_fecha_key]

    if ayer_str not in historial:
        if ultimos_valores:
            historial[ayer_str] = ultimos_valores.copy()
        else:
            historial[ayer_str] = {
                "USD": float(dolar_final),
                "EUR": float(euro_final),
                "USDT": float(binance_final)
            }

    # Validar si el valor de hoy es idéntico al de ayer para asegurar consistencia neta
    usd_a_guardar = float(dolar_final)
    eur_a_guardar = float(euro_final)
    usdt_a_guardar = float(binance_final)

    # Si el script corre hoy y el BCV no ha cambiado respecto a ayer, se registran idénticos
    # para que la diferencia matemática sea exactamente 0.0
    if hoy_str not in historial:
        historial[hoy_str] = {
            "USD": usd_a_guardar,
            "EUR": eur_a_guardar,
            "USDT": usdt_a_guardar
        }
    else:
        historial[hoy_str]["USD"] = usd_a_guardar
        historial[hoy_str]["EUR"] = eur_a_guardar
        historial[hoy_str]["USDT"] = usdt_a_guardar

    # Ordenar estrictamente de forma descendente
    historial_ordenado = dict(sorted(historial.items(), reverse=True))

    with open(ruta_historial, "w", encoding="utf-8") as f:
        json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        
    print("¡Historial actualizado con control de ceros y estabilidad!")

if __name__ == "__main__":
    main()
