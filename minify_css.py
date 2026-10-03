#!/usr/bin/env python3
"""
minify_css.py - Genera styles.min.css a partir de styles.css.

styles.css sigue siendo la fuente editable (con comentarios, indentado).
styles.min.css es lo que referencia el HTML en produccion. Correr este
script despues de cualquier cambio a styles.css, antes de pushear.

Uso:
    python3 minify_css.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "styles.css"
OUT = ROOT / "styles.min.css"


def minify(css):
    # saca comentarios /* ... */
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    # colapsa espacios/saltos de linea a un solo espacio
    css = re.sub(r"\s+", " ", css)
    # saca espacios alrededor de { } : ; ,
    css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)
    # saca el ; final antes de } (no hace falta)
    css = re.sub(r";}", "}", css)
    return css.strip()


def main():
    src = SRC.read_text(encoding="utf-8")
    out = minify(src)
    OUT.write_text(out, encoding="utf-8")
    before, after = len(src.encode()), len(out.encode())
    print(f"styles.css: {before} bytes -> styles.min.css: {after} bytes "
          f"({100 * (1 - after / before):.0f}% menos)")


if __name__ == "__main__":
    main()
