"""Empaqueta únicamente los archivos públicos de ejecución del gestor."""
from pathlib import Path
import hashlib
import json
import zipfile

RAIZ = Path(__file__).resolve().parent
ARCHIVOS = (
    "manifest.json", "comun.js", "fondo.js", "gestor.js", "gestor.html",
    "gestor.css", "iconos/icono-16.png", "iconos/icono-48.png",
    "iconos/icono-128.png", "LICENSE",
)


def empaquetar():
    manifiesto = json.loads((RAIZ / "manifest.json").read_text(encoding="utf-8"))
    version = manifiesto["version"]
    destino = RAIZ / "dist"
    destino.mkdir(exist_ok=True)
    paquete = destino / f"mis-scripts-locales-{version}.zip"
    with zipfile.ZipFile(paquete, "w", compression=zipfile.ZIP_DEFLATED) as archivo:
        for nombre in ARCHIVOS:
            ruta = RAIZ / nombre
            if not ruta.is_file() or ruta.is_symlink():
                raise ValueError(f"Archivo ausente o enlace no permitido: {nombre}")
            entrada = zipfile.ZipInfo(nombre, date_time=(2026, 1, 1, 0, 0, 0))
            entrada.compress_type = zipfile.ZIP_DEFLATED
            entrada.external_attr = 0o100644 << 16
            archivo.writestr(entrada, ruta.read_bytes())
    with zipfile.ZipFile(paquete) as archivo:
        if archivo.namelist() != list(ARCHIVOS) or archivo.testzip():
            raise ValueError("El ZIP no coincide con el contenido permitido.")
    resumen = hashlib.sha256(paquete.read_bytes()).hexdigest()
    (destino / f"{paquete.name}.sha256").write_text(
        f"{resumen}  {paquete.name}\n", encoding="utf-8")
    print(f"Paquete: {paquete}")
    print(f"SHA-256: {resumen}")


if __name__ == "__main__":
    empaquetar()
