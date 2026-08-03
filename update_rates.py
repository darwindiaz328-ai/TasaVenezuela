import os
import json
from datetime import datetime
import urllib.request
import urllib.error

def obtener_tasa_binance_p2p():
    """
    Realiza una petición web para obtener el promedio del precio P2P de USDT/VES en vivo.
    Retorna el promedio calculado o None si ocurre algún fallo de conexión.
    """
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "asset": "USDT",
        "fiat": "VES",
        "merchantCheck": False,
        "page": 1,
        "rows": 5,
        "tradeType": "BUY",
        "transAmount": "",
        "payTypes": []
    }
    
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=data_bytes, 
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            if "data" in res_json and len(res_json["data"]) > 0:
                precios = [float(item["adv"]["unitPrice"]) for item in res_json["data"]]
                promedio = sum(precios) / len(precios)
                return round(promedio, 2)
    except Exception as e:
        print(f"No se pudo conectar a la API de Binance P2P en vivo: {e}")
    
    return None

def main():
    print("Actualizando valores y consultando Binance P2P en vivo...")
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Cargar datos anteriores como respaldo si la red falla
    datos_anteriores = {}
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                datos_anteriores = json.load(f).get("rates", {})
        except:
            pass

    # Mantener valores anteriores o predeterminados para BCV
    dolar_bcv_cierre = datos_anteriores.get("USD_BCV", 748.78)
    euro_bcv_cierre = datos_anteriores.get("EUR_BCV", 861.18)

    # Intentar obtener la tasa de Binance en vivo mediante petición web
    tasa_binance_en_vivo = obtener_tasa_binance_p2p()
    
    if tasa_binance_en_vivo:
        tasa_binance_real = tasa_binance_en_vivo
        print(f"¡Tasa Binance P2P obtenida en vivo con éxito: {tasa_binance_real}!")
    else:
        tasa_binance_real = datos_anteriores.get("USDT_BINANCE", 846.0)
        print(f"Aviso: Usando valor de respaldo para Binance: {tasa_binance_real}")

    ahora_local = datetime.now()
    fecha_hoy_str = ahora_local.strftime("%Y-%m-%d")
    fecha_iso_actualizacion = ahora_local.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_bcv_cierre,
            "EUR_BCV": euro_bcv_cierre,
            "USDT_BINANCE": tasa_binance_real,
            "CNY_BCV": 110.53,
            "TRY_BCV": 15.75,
            "RUB_BCV": 9.33
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_hoy_str}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # Sobrescribir rates.json con los datos limpios y correctos
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # Actualizar el historial usando la fecha de HOY dinámicamente
    ruta_historial = "historial.json"
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except:
                pass

    # Asigna los valores al día actual en el diccionario del historial
    historial[fecha_hoy_str] = {
        "USD": dolar_bcv_cierre,
        "EUR": euro_bcv_cierre,
        "USDT": tasa_binance_real
    }

    # Ordenar el historial de forma descendente (las fechas más recientes primero)
    historial_ordenado = dict(sorted(historial.items(), reverse=True))

    with open(ruta_historial, "w", encoding="utf-8") as f:
        json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        
    print(f"¡Archivos actualizados con éxito para la fecha {fecha_hoy_str}!")

if __name__ == "__main__":
    main()
