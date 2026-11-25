#!/usr/bin/env python3
"""
minify_js.py - Genera javascript.min.js a partir de javascript.js.

javascript.js sigue siendo la fuente editable (con comentarios, indentado).
javascript.min.js es lo que referencia el HTML en produccion. Correr este
script despues de cualquier cambio a javascript.js, antes de pushear.

Minificado conservador: solo saca comentarios de linea (//) fuera de
strings y colapsa espacios en blanco. No renombra variables ni junta
sentencias, para no arriesgar romper el script.

Uso:
    python3 minify_js.py
"""
import pathlib

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "javascript.js"
OUT = ROOT / "javascript.min.js"


def strip_line_comment(line):
    quote = None
    i = 0
    while i < len(line) - 1:
        c = line[i]
        if quote:
            if c == '\\':
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ("'", '"', '`'):
            quote = c
        elif c == '/' and line[i + 1] == '/':
            return line[:i].rstrip()
        i += 1
    return line


def minify(js):
    out_lines = []
    for raw in js.splitlines():
        line = strip_line_comment(raw).strip()
        if line:
            out_lines.append(line)
    return "\n".join(out_lines) + "\n"


def main():
    src = SRC.read_text(encoding="utf-8")
    out = minify(src)
    OUT.write_text(out, encoding="utf-8")
    before, after = len(src.encode()), len(out.encode())
    print(f"javascript.js: {before} bytes -> javascript.min.js: {after} bytes "
          f"({100 * (1 - after / before):.0f}% menos)")


if __name__ == "__main__":
    main()
