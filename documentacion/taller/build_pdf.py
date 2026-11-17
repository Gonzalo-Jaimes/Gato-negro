"""Genera el informe del taller en PDF a partir de los .md numerados de esta carpeta.

Uso:  python -I documentacion/taller/build_pdf.py
Requiere: markdown-it-py y Google Chrome o Microsoft Edge instalado.
Salida:  documentacion/taller/Informe_Taller_SaaS.pdf  (y build/informe.html intermedio)
"""
import html
import re
import subprocess
import sys
from pathlib import Path

from markdown_it import MarkdownIt

AQUI = Path(__file__).resolve().parent
BUILD = AQUI / "build"
SALIDA = AQUI / "Informe_Taller_SaaS.pdf"
TITULO = "Taller de Mejoramiento SaaS — Gato Negro ERP"
SUBTITULO = "Tecnologías de la Industria 4.0 · 2026-II"

NAVEGADORES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #2a2018; }
h1 { font-size: 20pt; color: #8a3d12; border-bottom: 2px solid #b4541a; padding-bottom: 4px; margin-top: 0; page-break-before: always; }
h1.primero { page-break-before: avoid; }
h2 { font-size: 14pt; color: #6b4f2a; margin-top: 18px; }
h3 { font-size: 11.5pt; color: #2a2018; margin-top: 14px; }
blockquote { margin: 8px 0; padding: 6px 12px; background: #f6f1e7; border-left: 3px solid #b4541a; color: #4a3d2e; }
code { font-family: Consolas, monospace; font-size: 9pt; background: #f1e8d8; padding: 1px 3px; border-radius: 3px; }
pre { background: #f6f1e7; padding: 8px; border-radius: 4px; font-size: 8.5pt; white-space: pre-wrap; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 8.8pt; }
th, td { border: 1px solid #d9cdb8; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #f1e8d8; }
tr { page-break-inside: avoid; }
a { color: #8a3d12; word-break: break-all; }
figure { margin: 10px 0; page-break-inside: avoid; text-align: center; }
figure img { max-width: 100%; max-height: 135mm; border: 1px solid #d9cdb8; }
figcaption { font-size: 8.5pt; color: #6b5a45; margin-top: 3px; }
.grid { display: flex; gap: 8px; align-items: flex-start; justify-content: center; }
.grid figure { flex: 1; margin: 0; }
.grid img { max-height: 120mm; }
.portada { height: 240mm; display: flex; flex-direction: column; justify-content: center; }
.portada h1 { border: none; page-break-before: avoid; font-size: 28pt; }
.portada p { font-size: 13pt; color: #6b4f2a; margin: 4px 0; }
"""


def encontrar_navegador() -> str:
    for ruta in NAVEGADORES:
        if Path(ruta).exists():
            return ruta
    sys.exit("No se encontró Chrome ni Edge. Instala uno o ajusta NAVEGADORES.")


def md_a_html(md: MarkdownIt, ruta: Path, primero: bool) -> str:
    cuerpo = md.render(ruta.read_text(encoding="utf-8"))
    if primero:
        cuerpo = cuerpo.replace("<h1>", '<h1 class="primero">', 1)
    return cuerpo


def anexo_capturas() -> str:
    """Anexo con todas las capturas de capturas/<etapa>/<tamaño>/*.jpg agrupadas por pantalla."""
    raiz = AQUI / "capturas"
    if not raiz.exists():
        return ""
    partes = ["<h1>Anexo · Evidencia visual</h1>"]
    for etapa in sorted(p for p in raiz.iterdir() if p.is_dir()):
        partes.append(f"<h2>{html.escape(etapa.name.capitalize())}</h2>")
        subcarpetas = sorted(p for p in etapa.iterdir() if p.is_dir())
        if subcarpetas:  # antes/despues -> escritorio, tableta, movil
            nombres = sorted({f.name for s in subcarpetas for f in s.glob("*.jpg")})
            for nombre in nombres:
                etiqueta = re.sub(r"^\d+_", "", nombre[:-4]).replace("_", " ")
                partes.append(f"<h3>{html.escape(etiqueta)}</h3><div class='grid'>")
                for s in subcarpetas:
                    f = s / nombre
                    if f.exists():
                        partes.append(
                            f"<figure><img src='{f.as_uri()}'><figcaption>{html.escape(s.name)}</figcaption></figure>"
                        )
                partes.append("</div>")
        else:  # benchmarking: carpeta plana
            for f in sorted(etapa.glob("*.jpg")):
                etiqueta = re.sub(r"^\d+_", "", f.stem).replace("_", " ")
                partes.append(
                    f"<figure><img src='{f.as_uri()}'><figcaption>{html.escape(etiqueta)}</figcaption></figure>"
                )
    return "\n".join(partes)


def main() -> None:
    md = MarkdownIt("commonmark", {"html": False}).enable("table")
    fuentes = sorted(p for p in AQUI.glob("[0-9][0-9]_*.md"))
    if not fuentes:
        sys.exit("No hay archivos NN_*.md en la carpeta.")

    portada = (
        f"<div class='portada'><h1>{html.escape(TITULO)}</h1>"
        f"<p>{html.escape(SUBTITULO)}</p>"
        f"<p>Informe técnico y evidencia de validación</p></div>"
    )
    secciones = [md_a_html(md, f, primero=False) for f in fuentes]
    documento = (
        f"<!doctype html><html lang='es'><head><meta charset='utf-8'><title>{html.escape(TITULO)}</title>"
        f"<style>{CSS}</style></head><body>{portada}{''.join(secciones)}{anexo_capturas()}</body></html>"
    )

    BUILD.mkdir(exist_ok=True)
    destino_html = BUILD / "informe.html"
    destino_html.write_text(documento, encoding="utf-8")

    subprocess.run(
        [
            encontrar_navegador(),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={SALIDA}",
            destino_html.as_uri(),
        ],
        check=True,
        capture_output=True,
        timeout=180,
    )
    print(f"PDF generado: {SALIDA} ({SALIDA.stat().st_size // 1024} KB) desde {len(fuentes)} archivo(s) .md")


if __name__ == "__main__":
    main()
