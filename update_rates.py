import os
import json
from datetime import datetime

def main():
    print("Actualizando valores oficiales y registrando la fecha de hoy...")
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores actuales de las tasas (puedes ajustarlos o conectarlos a tu lógica de scraping/API)
    dolar_bcv_cierre = 748.78
    euro_bcv_cierre = 861.18
    tasa_binance_real = 846.0
    
    ahora_local = datetime.now()
    fecha_hoy_str = ahora_local.strftime("%Y-%m-%d") # Ej: "2026-08-03"
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
