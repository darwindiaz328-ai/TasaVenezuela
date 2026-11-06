import os
import sys
import json
import ssl
import re
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

MESES_ES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
    'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
    'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

def parse_spanish_number(s):
    """
    Parsea cadenas numéricas en formato hispano/venezolano.
    Maneja separador de miles con punto y decimales con coma: '1.006,03263992' -> 1006.03263992
    """
    if not s:
        return 0.0
    s = s.strip()
    if "." in s and "," in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    elif s.count(".") > 1:
        parts = s.split(".")
        s = "".join(parts[:-1]) + "." + parts[-1]
    return float(s)

def parse_bcv_fecha_valor(html):
    """
    Extrae y convierte la 'Fecha Valor' publicada por el BCV a formato ISO (YYYY-MM-DD).
    Ejemplo: 'Fecha Valor: Viernes, 06 Noviembre  2026' -> '2026-11-06'
    """
    m = re.search(r'Fecha Valor:.*?<span[^>]*>(.*?)</span>', html, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    raw = m.group(1).strip().lower()
    dm = re.search(r'(\d{1,2})\s+([a-záéíóú]+)\s+(\d{4})', raw)
    if dm:
        dia = int(dm.group(1))
        mes_str = dm.group(2)
        anio = int(dm.group(3))
        mes = MESES_ES.get(mes_str)
        if mes:
            return f"{anio:04d}-{mes:02d}-{dia:02d}"
    return None

def obtener_tasas_bcv_directo():
    """
    Fuente Primaria: Consulta directamente el portal oficial del Banco Central de Venezuela (BCV).
    Extrae la cotización oficial de Dólar (USD), Euro (EUR) y la 'Fecha Valor' oficial.
    """
    url = "https://www.bcv.org.ve/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
        usd = None
        eur = None
        fecha_valor = parse_bcv_fecha_valor(html)
        
        # Extraer Dólar BCV
        m_usd = re.search(r"""id=["']dolar["'].*?<strong[^>]*>\s*([\d,.]+)\s*</strong>""", html, re.DOTALL | re.IGNORECASE)
        if m_usd:
            usd = round(parse_spanish_number(m_usd.group(1)), 2)
            
        # Extraer Euro BCV
        m_eur = re.search(r"""id=["']euro["'].*?<strong[^>]*>\s*([\d,.]+)\s*</strong>""", html, re.DOTALL | re.IGNORECASE)
        if m_eur:
            eur = round(parse_spanish_number(m_eur.group(1)), 2)
            
        # Validar que los valores extraídos sean coherentes
        if usd and eur:
            if not (0.7 * usd <= eur <= 1.6 * usd):
                print(f"Aviso BCV directo: Paridad extraída anómala (USD: {usd}, EUR: {eur})")
                eur = None
        return usd, eur, fecha_valor
    except Exception as e:
        print(f"Aviso al consultar BCV directo: {e}")
        return None, None, None

def obtener_tasas_en_vivo():
    """
    Estrategia Híbrida Multi-Fuente:
    1. Consulta BCV oficial directo para USD, EUR y Fecha Valor.
    2. Consulta DolarAPI para USDT Binance / Mercado P2P.
    3. Si BCV directo falla, usa DolarAPI como fallback con blindaje anti-truncamiento.
    """
    bcv_directo_usd, bcv_directo_eur, fecha_valor_bcv = obtener_tasas_bcv_directo()
    
    bcv = bcv_directo_usd
    euro = bcv_directo_eur
    binance = None
    
    # Consultar DolarAPI para Binance / P2P y fallback de divisas
    url_dolares = "https://ve.dolarapi.com/v1/dolares"
    req = urllib.request.Request(
        url_dolares, 
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        method="GET"
    )
    
    dolarapi_usd = None
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
                        if fuente == "oficial" or "bcv" in nombre or "bcv" in fuente:
                            dolarapi_usd = precio_val
                        elif "binance" in fuente or "binance" in nombre or "usdt" in fuente or "paralelo" in fuente or "paralelo" in nombre:
                            binance = precio_val
    except Exception as e:
        print(f"Error al conectar con DolarAPI (dólares): {e}")
        
    # Si BCV no dio USD, usar fallback de DolarAPI
    if not bcv and dolarapi_usd:
        bcv = dolarapi_usd
        
    # Si BCV no dio EUR, consultar DolarAPI euros
    if not euro:
        try:
            url_euro = "https://ve.dolarapi.com/v1/euros"
            req_euro = urllib.request.Request(
                url_euro, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, 
                method="GET"
            )
            with urllib.request.urlopen(req_euro, timeout=5) as resp_e:
                res_e = json.loads(resp_e.read().decode("utf-8"))
                p_e = None
                if isinstance(res_e, dict):
                    p_e = res_e.get("promedio") or res_e.get("venta") or res_e.get("compra")
                elif isinstance(res_e, list) and len(res_e) > 0:
                    p_e = res_e[0].get("promedio") or res_e[0].get("venta") or res_e[0].get("compra")
                    
                if p_e:
                    val_e = float(p_e)
                    # Blindaje contra truncamiento de miles
                    if bcv and bcv > 500 and val_e < 100:
                        print(f"⚠️ Detectado truncamiento en DolarAPI Euro: {val_e}. Corrigiendo escala de miles.")
                        val_e = val_e * 1000
                    euro = round(val_e, 2)
        except Exception as e:
            print(f"Aviso al consultar la API de euros: {e}")
            
    # Validación final de paridad
    if bcv and euro:
        if not (0.7 * bcv <= euro <= 1.6 * bcv):
            print(f"❌ Tasa de euro anómala descartada ({euro}). No cumple paridad con dólar ({bcv}).")
            euro = None

    return bcv, binance, euro, fecha_valor_bcv

def rellenar_dias_faltantes(historial, fecha_hoy_iso, ultimo_usd, ultimo_eur, ultimo_usdt):
    """
    Garantiza que no existan huecos de fechas en el historial entre el último día registrado y hoy.
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
    Escribe el archivo JSON de manera atómica para evitar corrupción.
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
    print("Iniciando monitor de tasas (Control Horario Estricto de Medianoche)...")
    
    # Obtener fecha y hora basada estrictamente en la zona horaria de Venezuela (UTC-4)
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
    hora_str = ahora_venezuela.strftime("%I:%M %p")

    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    ruta_historial = "historial.json"
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta, exist_ok=True)
        
    # Cargar datos anteriores y respaldo
    datos_anteriores = {}
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, "r", encoding="utf-8") as f:
                datos_anteriores = json.load(f).get("rates", {})
        except:
            pass

    # Cargar historial existente
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except Exception:
                pass

    # Extraer tasas en vivo y Fecha Valor de BCV
    bcv_en_vivo, binance_en_vivo, euro_en_vivo, fecha_valor_bcv = obtener_tasas_en_vivo()
    
    print(f"Estado en vivo: Hora VE={hora_str} | Fecha Hoy={fecha_hoy_iso} | BCV Fecha Valor={fecha_valor_bcv}")
    print(f"Tasas leídas: USD={bcv_en_vivo}, EUR={euro_en_vivo}, USDT={binance_en_vivo}")

    # =========================================================================
    # REGLA DE MEDIANOCHE Y ALINEACIÓN DE FECHA VALOR BCV:
    # Si el BCV publica en la tarde/noche una tasa con Fecha Valor del día siguiente
    # (ej. a las 5:00 PM del jueves publica para el viernes), la aplicación
    # NO debe actualizar el dólar ni el euro de hoy con los valores de mañana.
    # Debe esperar a que pase la medianoche (00:00:00) para aplicar la nueva tasa
    # en el día correspondiente.
    # =========================================================================
    tasa_es_futura = bool(fecha_valor_bcv and fecha_valor_bcv > fecha_hoy_iso)
    
    dolar_bcv_cierre = None
    euro_bcv_cierre = None
    proxima_tasa_meta = None

    if tasa_es_futura:
        print(f">> AVISO: El BCV ya publicó la tasa adelantada para el {fecha_valor_bcv}.")
        print(f">> Hora actual en Venezuela: {hora_str}. Aún no ha pasado la medianoche.")
        print(f">> MANTENIENDO tasas oficiales activas del día actual ({fecha_hoy_iso}).")
        
        # Recuperar tasas válidas de hoy desde el historial o respaldo
        tasa_hoy_registrada = historial.get(fecha_hoy_iso, {})
        dolar_bcv_cierre = tasa_hoy_registrada.get("USD") or datos_anteriores.get("USD_BCV", 894.89)
        euro_bcv_cierre = tasa_hoy_registrada.get("EUR") or datos_anteriores.get("EUR_BCV", 1006.03)
        
        # Guardar en metadatos la tasa de mañana para trazabilidad
        proxima_tasa_meta = {
            "fecha_valor": fecha_valor_bcv,
            "USD_BCV": bcv_en_vivo,
            "EUR_BCV": euro_en_vivo
        }
    else:
        # Ya es el día correspondiente (o pasó la medianoche)
        dolar_bcv_cierre = bcv_en_vivo if bcv_en_vivo else datos_anteriores.get("USD_BCV", 894.89)
        euro_bcv_cierre = euro_en_vivo if euro_en_vivo else datos_anteriores.get("EUR_BCV", 1006.03)

    # La tasa Binance P2P siempre se actualiza con el mercado en vivo
    tasa_binance_real = binance_en_vivo if binance_en_vivo else datos_anteriores.get("USDT_BINANCE", 1008.99)

    # Rellenar días intermedios si hubiera huecos
    rellenar_dias_faltantes(historial, fecha_hoy_iso, dolar_bcv_cierre, euro_bcv_cierre, tasa_binance_real)

    # Determinar si hay variación
    cambio_en_tasas = (
        dolar_bcv_cierre != datos_anteriores.get("USD_BCV") or
        euro_bcv_cierre != datos_anteriores.get("EUR_BCV") or
        tasa_binance_real != datos_anteriores.get("USDT_BINANCE")
    )
    es_nuevo_dia = fecha_hoy_iso not in historial
    
    forzar_actualizacion = (
        "--force" in sys.argv or 
        os.environ.get("FORCE_UPDATE", "").lower() in ("true", "1", "yes")
    )

    if not cambio_en_tasas and not es_nuevo_dia and not forzar_actualizacion:
        print(f">> Tasas sin variación ({fecha_hoy_display}). Omitiendo escritura.")
        return

    metadata_dict = {
        "bcv_date": f"BCV: {fecha_hoy_display}",
        "last_updated": fecha_iso_actualizacion
    }
    if proxima_tasa_meta:
        metadata_dict["next_day_rate"] = proxima_tasa_meta

    json_estructurado = {
        "rates": {
            "USD_BCV": dolar_bcv_cierre,
            "EUR_BCV": euro_bcv_cierre,
            "USDT_BINANCE": tasa_binance_real,
        },
        "metadata": metadata_dict
    }
    
    # Sobrescribir rates.json de forma atómica
    escritura_atomica_json(ruta_archivo, json_estructurado, indent=4)

    # Asignar los valores correctos de hoy en el historial
    historial[fecha_hoy_iso] = {
        "USD": dolar_bcv_cierre,
        "EUR": euro_bcv_cierre,
        "USDT": tasa_binance_real
    }

    # Ordenar historial de forma descendente por fecha ISO
    historial_ordenado = dict(sorted(historial.items(), key=lambda x: x[0], reverse=True))
    escritura_atomica_json(ruta_historial, historial_ordenado, indent=2)
        
    print(f"¡Archivos actualizados con éxito para la fecha {fecha_hoy_display}!")
    print(f"Activo Hoy ({fecha_hoy_display}): USD={dolar_bcv_cierre} | EUR={euro_bcv_cierre} | USDT={tasa_binance_real}")
    if proxima_tasa_meta:
        print(f"En espera de medianoche: Mañana ({proxima_tasa_meta['fecha_valor']}) -> USD={proxima_tasa_meta['USD_BCV']}, EUR={proxima_tasa_meta['EUR_BCV']}")

if __name__ == "__main__":
    main()
