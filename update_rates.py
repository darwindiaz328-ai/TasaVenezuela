import os
import sys
import json
from datetime import datetime, timedelta
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

def rellenar_dias_faltantes(historial, fecha_hoy_iso, ultimo_usd, ultimo_eur, ultimo_usdt):
    """
    Garantiza que no existan huecos de fechas en el historial entre el último día registrado y hoy.
    Si faltan días intermedios (fines de semana, feriados o fallas de red), se rellenan
    automáticamente con el valor de cierre anterior para garantizar continuidad perfecta.
    """
    if not historial:
        return
        
    fechas_existentes = sorted([k for k in historial.keys() if len(k) == 10 and k.count('-') == 2])
    if not fechas_existentes:
        return
        
    ultima_fecha_str = fechas_existentes[-1]
    
    try:
        f_inicio = datetime.strptime(ultima_fecha_str, "%Y-%m-%d").date()
        f_fin = datetime.strptime(fecha_hoy_iso, "%Y-%m-%d").date()
        
        un_dia = timedelta(days=1)
        curr = f_inicio + un_dia
        
        while curr < f_fin:
            curr_str = curr.strftime("%Y-%m-%d")
            if curr_str not in historial:
                tasa_ref = historial.get(ultima_fecha_str, {})
                usd_ref = tasa_ref.get("USD", ultimo_usd)
                eur_ref = tasa_ref.get("EUR", ultimo_eur)
                usdt_ref = tasa_ref.get("USDT", ultimo_usdt)
                
                historial[curr_str] = {
                    "USD": round(float(usd_ref), 2),
                    "EUR": round(float(eur_ref), 2),
                    "USDT": round(float(usdt_ref), 2)
                }
                print(f">> Continuidad garantizada: fecha intermedia completada {curr_str}")
            curr += un_dia
    except Exception as e:
        print(f"Aviso en rellenar_dias_faltantes: {e}")

def escritura_atomica_json(ruta_destino, datos, indent=2):
    """
    Escribe el archivo JSON de manera atómica para evitar archivos corruptos o incompletos.
    """
    directorio = os.path.dirname(ruta_destino)
    if directorio and not os.path.exists(directorio):
        os.makedirs(directorio, exist_ok=True)
        
    ruta_tmp = ruta_destino + ".tmp"
    with open(ruta_tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=indent, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
        
    if os.path.exists(ruta_destino):
        os.replace(ruta_tmp, ruta_destino)
    else:
        os.rename(ruta_tmp, ruta_destino)

def main():
    print("Actualizando valores y consultando tasas en vivo...")
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta, exist_ok=True)
        
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
    dolar_bcv_cierre = bcv_en_vivo if bcv_en_vivo else datos_anteriores.get("USD_BCV", 881.88)
    if bcv_en_vivo:
        print(f"¡Dólar BCV obtenido con éxito: {dolar_bcv_cierre}!")
    else:
        print(f"Aviso: Usando valor de respaldo para BCV: {dolar_bcv_cierre}")

    euro_bcv_cierre = euro_en_vivo if euro_en_vivo else datos_anteriores.get("EUR_BCV", 988.97)
    if euro_en_vivo:
        print(f"¡Euro obtenido con éxito: {euro_bcv_cierre}!")
    else:
        print(f"Aviso: Usando valor de respaldo para Euro: {euro_bcv_cierre}")

    tasa_binance_real = binance_en_vivo if binance_en_vivo else datos_anteriores.get("USDT_BINANCE", 1002.83)
    if binance_en_vivo:
        print(f"¡Tasa USDT obtenida con éxito: {tasa_binance_real}!")
    else:
        print(f"Aviso: Usando valor de respaldo para Binance: {tasa_binance_real}")

    # Cargar historial existente
    ruta_historial = "historial.json"
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except Exception:
                pass

    # Obtener la fecha y hora basada estrictamente en la zona horaria de Venezuela (UTC-4)
    try:
        venezuela_tz = ZoneInfo("America/Caracas")
        ahora_venezuela = datetime.now(venezuela_tz)
    except Exception:
        from datetime import timezone
        venezuela_tz = timezone(timedelta(hours=-4))
        ahora_venezuela = datetime.now(venezuela_tz)
    
    fecha_hoy_iso = ahora_venezuela.strftime("%Y-%m-%d")
    fecha_hoy_display = ahora_venezuela.strftime("%d-%m-%Y")
    fecha_iso_actualizacion = ahora_venezuela.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Asegurar continuidad histórica sin huecos
    rellenar_dias_faltantes(historial, fecha_hoy_iso, dolar_bcv_cierre, euro_bcv_cierre, tasa_binance_real)

    # Verificar si hubo variación real en las tasas o si es un nuevo día
    cambio_en_tasas = (
        dolar_bcv_cierre != datos_anteriores.get("USD_BCV") or
        euro_bcv_cierre != datos_anteriores.get("EUR_BCV") or
        tasa_binance_real != datos_anteriores.get("USDT_BINANCE")
    )
    es_nuevo_dia = fecha_hoy_iso not in historial
    
    # Soporte para forzar actualización (disparo de Webhook externo o simulación)
    forzar_actualizacion = (
        "--force" in sys.argv or 
        os.environ.get("FORCE_UPDATE", "").lower() in ("true", "1", "yes")
    )

    if not cambio_en_tasas and not es_nuevo_dia and not forzar_actualizacion:
        print(f">> Tasas sin variación ({fecha_hoy_display}).")
        print(">> Omitiendo escritura para evitar commits innecesarios y despliegues redundantes de Pages.")
        return

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
    
    # Sobrescribir rates.json con los datos de forma atómica
    escritura_atomica_json(ruta_archivo, json_estructurado, indent=4)

    # Asigna los valores al día actual en el diccionario del historial usando la clave ISO
    historial[fecha_hoy_iso] = {
        "USD": dolar_bcv_cierre,
        "EUR": euro_bcv_cierre,
        "USDT": tasa_binance_real
    }

    # Ordenar el historial de forma descendente estándar por fecha ISO
    historial_ordenado = dict(sorted(historial.items(), key=lambda x: x[0], reverse=True))

    # Guardar historial con escritura atómica
    escritura_atomica_json(ruta_historial, historial_ordenado, indent=2)
        
    print(f"¡Archivos actualizados con éxito para la fecha {fecha_hoy_display}!")

if __name__ == "__main__":
    main()
