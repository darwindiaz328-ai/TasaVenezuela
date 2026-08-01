import os
import json
from datetime import datetime

def main():
    print("Forzando valores oficiales exactos del cierre del BCV...")
    
    ruta_carpeta = "Datos"
    ruta_archivo = os.path.join(ruta_carpeta, "rates.json")
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        
    # Valores exactos oficiales de la lámina del BCV (Viernes 31/07/2026)
    dolar_bcv_cierre = 746.63
    euro_bcv_cierre = 858.98
    tasa_binance_real = 762.78
    
    ahora_local = datetime.now()
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
            "bcv_date": "BCV: Viernes, 31 de Julio 2026",
            "last_updated": fecha_iso_actualizacion
        }
    }
    
    # Sobrescribir rates.json con los datos limpios y correctos
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(json_estructurado, f, indent=4, ensure_ascii=False)

    # Actualizar también el historial del 31 de julio por seguridad
    ruta_historial = "historial.json"
    historial = {}
    if os.path.exists(ruta_historial):
        with open(ruta_historial, "r", encoding="utf-8") as f:
            try:
                historial = json.load(f)
            except:
                pass

    historial["2026-07-31"] = {
        "USD": dolar_bcv_cierre,
        "EUR": euro_bcv_cierre,
        "USDT": tasa_binance_real
    }

    historial_ordenado = dict(sorted(historial.items(), reverse=True))

    with open(ruta_historial, "w", encoding="utf-8") as f:
        json.dump(historial_ordenado, f, indent=2, ensure_ascii=False)
        
    print("¡Archivo rates.json actualizado con éxito a los valores correctos!")

if __name__ == "__main__":
    main()
