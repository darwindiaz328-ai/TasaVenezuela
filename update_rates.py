import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import urllib.request
import urllib.error

def obtener_tasa_binance_p2p():
    """
    Consulta la API pública para obtener la tasa de USDT de forma segura 
    y compatible con múltiples estructuras de respuesta.
    """
    url = "https://api.yadio.io/json/USDT"
    
    req = urllib.request.Request(
        url, 
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        method="GET"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            
            # Imprimir la estructura en los logs para referencia
            print("Estructura recibida de la API:", res_json)
            
            if isinstance(res_json, dict):
                # Caso 1: Si la tasa viene anidada dentro del objeto principal (ej. {"USDT": {"rate": ...}})
                if "USDT" in res_json and isinstance(res_json["USDT"], dict):
                    sub = res_json["USDT"]
                    for k in ["rate", "price", "VES", "value"]:
                        if k in sub:
                            return round(float(sub[k]), 2)
                
                # Caso 2: Si viene directamente en el primer nivel del JSON
                for posible_clave in ["VES", "rate", "price", "value", "bcv"]:
                    if posible_clave in res_json:
                        return round(float(res_json[posible_clave]), 2)
                        
            print("Aviso: No se encontró una clave de conversión válida en la respuesta.")
            return None
                
    except Exception as e:
        print(f"Error al conectar con la API pública de tasas: {e}")
    
    return None

def main():
    print("Actualizando valores y consultando tasas en vivo...")
    
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

    # Tasas BCV
    dolar_bcv_cierre = datos_anteriores.get("USD_BCV", 748.78)
    euro_bcv_cierre = datos_anteriores.get("EUR_BCV", 861.18)

    # Intentar obtener la tasa mediante la API pública
    tasa_binance_en_vivo = obtener_tasa_binance_p2p()
    
    if tasa_binance_en_vivo:
        tasa_binance_real = tasa_binance_en_vivo
        print(f"¡Tasa USDT obtenida desde API pública con éxito: {tasa_binance_real}!")
    else:
        tasa_binance_real = datos_anteriores.get("USDT_BINANCE", 846.0)
        print(f"Aviso: Usando valor de respaldo para Binance: {tasa_binance_real}")

    # Obtener la fecha y hora basada estrictamente en la zona horaria de Venezuela
    venezuela_tz = ZoneInfo("America/Caracas")
    ahora_venezuela = datetime.now(venezuela_tz)
    fecha_hoy_str = ahora_venezuela.strftime("%Y-%m-%d")
    fecha_iso_actualizacion = ahora_venezuela.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_bcv_cierre,
            "EUR_BCV": euro_bcv_cierre,
            "USDT_BINANCE": tasa_binance_real,
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_hoy_str}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # Sobrescribir rates.json con los datos
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # Actualizar el historial usando la fecha correcta de Venezuela
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
