import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import urllib.request
import urllib.error

def obtener_tasas_en_vivo():
    """
    Consulta la API pública de DolarAPI Venezuela para extraer 
    el Dólar Oficial (BCV), el Dólar Paralelo/Binance y el Euro en vivo.
    """
    url_dolares = "https://ve.dolarapi.com/v1/dolares"
    
    req = urllib.request.Request(
        url_dolares, 
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        method="GET"
    )
    
    bcv = None
    binance = None
    euro = None
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            
            if isinstance(res_json, list):
                for item in res_json:
                    fuente = item.get("fuente", "").lower()
                    nombre = item.get("nombre", "").lower()
                    precio = item.get("promedio") or item.get("venta") or item.get("compra")
                    
                    if precio:
                        precio_val = round(float(precio), 2)
                        
                        # Identificar Dólar Oficial (BCV)
                        if fuente == "oficial" or "bcv" in nombre or "bcv" in fuente:
                            bcv = precio_val
                        # Identificar Binance / Paralelo
                        elif "binance" in fuente or "binance" in nombre or "usdt" in fuente or "paralelo" in fuente or "paralelo" in nombre:
                            binance = precio_val
                            
    except Exception as e:
        print(f"Error al conectar con DolarAPI (dólares): {e}")
        
    # Consultar el endpoint específico del euro en plural (/v1/euros)
    try:
        url_euro = "https://ve.dolarapi.com/v1/euros"
        req_euro = urllib.request.Request(
            url_euro, 
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, 
            method="GET"
        )
        with urllib.request.urlopen(req_euro, timeout=5) as resp_e:
            res_e = json.loads(resp_e.read().decode("utf-8"))
            
            # DolarAPI puede devolver un diccionario o una lista para euros
            if isinstance(res_e, dict):
                p_e = res_e.get("promedio") or res_e.get("venta") or res_e.get("compra")
                if p_e:
                    euro = round(float(p_e), 2)
            elif isinstance(res_e, list) and len(res_e) > 0:
                p_e = res_e[0].get("promedio") or res_e[0].get("venta") or res_e[0].get("compra")
                if p_e:
                    euro = round(float(p_e), 2)
    except Exception as e:
        print(f"Aviso al consultar la API de euros: {e}")
            
    return bcv, binance, euro

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

    # Obtener todas las tasas en vivo desde la API
    bcv_en_vivo, binance_en_vivo, euro_en_vivo = obtener_tasas_en_vivo()

    # Asignar valores en vivo o usar respaldo anterior
    dolar_bcv_cierre = bcv_en_vivo if bcv_en_vivo else datos_anteriores.get("USD_BCV", 748.78)
    if bcv_en_vivo:
        print(f"¡Dólar BCV obtenido con éxito: {dolar_bcv_cierre}!")
    else:
        print(f"Aviso: Usando valor de respaldo para BCV: {dolar_bcv_cierre}")

    euro_bcv_cierre = euro_en_vivo if euro_en_vivo else datos_anteriores.get("EUR_BCV", 861.18)
    if euro_en_vivo:
        print(f"¡Euro obtenido con éxito: {euro_bcv_cierre}!")
    else:
        print(f"Aviso: Usando valor de respaldo para Euro: {euro_bcv_cierre}")

    tasa_binance_real = binance_en_vivo if binance_en_vivo else datos_anteriores.get("USDT_BINANCE", 846.0)
    if binance_en_vivo:
        print(f"¡Tasa USDT obtenida con éxito: {tasa_binance_real}!")
    else:
        print(f"Aviso: Usando valor de respaldo para Binance: {tasa_binance_real}")

    # Obtener la fecha y hora basada estrictamente en la zona horaria de Venezuela
    venezuela_tz = ZoneInfo("America/Caracas")
    ahora_venezuela = datetime.now(venezuela_tz)
    
    # Formatos necesarios: ISO para la app/historial y Display (DD-MM-YYYY) para la vista visual
    fecha_hoy_iso = ahora_venezuela.strftime("%Y-%m-%d")
    fecha_hoy_display = ahora_venezuela.strftime("%d-%m-%Y")
    fecha_iso_actualizacion = ahora_venezuela.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_bcv_cierre,
            "EUR_BCV": euro_bcv_cierre,
            "USDT_BINANCE": tasa_binance_real,
        },
        "metadata": {
            "bcv_date": f"BCV: {fecha_hoy_display}",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # Sobrescribir rates.json con los datos
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # Actualizar el historial usando la clave estándar de fecha ISO
    ruta_historial = "historial.json"
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except:
                pass

    # Asigna los valores al día actual en el diccionario del historial usando la clave ISO
    historial[fecha_hoy_iso] = {
        "USD": dolar_bcv_cierre,
        "EUR": euro_bcv_cierre,
        "USDT": tasa_binance_real
    }

    # Ordenar el historial de forma descendente estándar
    historial_ordenado = dict(sorted(historial.items(), reverse=True))

    with open(ruta_historial, "w", encoding="utf-8") as f:
        json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        
    print(f"¡Archivos actualizados con éxito para la fecha {fecha_hoy_display}!")

if __name__ == "__main__":
    main()
