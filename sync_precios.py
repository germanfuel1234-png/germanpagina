#!/usr/bin/env python3
"""
sync_precios.py - Lee precios.xlsx y estampa esos valores en index.html,
en/index.html y javascript.js.

Cada reemplazo se ancla en texto FIJO de alrededor (el nombre del servicio
en el JSON-LD, la clave del simulador, la frase completa de la FAQ), nunca
en el valor numerico anterior -- por eso da lo mismo que precios.xlsx traiga
el mismo valor de siempre o uno nuevo: el resultado converge igual. Si un
ancla no aparece (alguien reescribio esa parte del HTML a mano y ya no
matchea), el script frena con un error en vez de escribir a medias.

Uso:
    ./.venv-scripts/bin/python sync_precios.py            # aplica los cambios
    ./.venv-scripts/bin/python sync_precios.py --check     # solo reporta diffs, no escribe
"""
import re
import sys
import pathlib
import difflib
import openpyxl

ROOT = pathlib.Path(__file__).parent
XLSX = ROOT / "precios.xlsx"

ARS_NUM = r"\$\d{1,3}(?:\.\d{3})*"   # $200.000
USD_NUM = r"\$\d+"                    # $150


def fmt_ars(n):
    return f"{n:,}".replace(",", ".")


def load_precios():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active
    precios = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or row[0] is None:
            continue
        key, value = row[0], row[1]
        if value is None:
            raise SystemExit(f"precios.xlsx: la fila '{key}' no tiene valor")
        precios[str(key).strip()] = int(value)
    return precios


def sub_required(pattern, repl, text, label, flags=re.DOTALL):
    new_text, n = re.subn(pattern, repl, text, flags=flags)
    if n == 0:
        raise SystemExit(f"[FALLO] no encontre nada para: {label}\n  patron: {pattern}")
    if n > 1:
        raise SystemExit(f"[FALLO] '{label}' matcheo {n} veces (deberia ser 1, no es un ancla unica)")
    return new_text


def offer_block(text, service_type, price_int, price_fmt, currency, label):
    pattern = (
        rf'("serviceType": "{re.escape(service_type)}".*?"price": ")[^"]*'
        rf'(",\s*"description": "(?:Desde|From) \$)[^"]*( {currency}")'
    )
    repl = lambda m: f"{m.group(1)}{price_int}{m.group(2)}{price_fmt}{m.group(3)}"
    return sub_required(pattern, repl, text, label)


def sentence(text, parts, values, label):
    """parts: fragmentos fijos de texto; entre cada par va un $<numero>.
    values: los numeros ya formateados (con o sin puntos), len(values) == len(parts)-1.
    El patron matchea la frase actual (sea cual sea el numero viejo) usando
    un comodin numerico entre los fragmentos fijos; el reemplazo es la frase
    entera ya renderizada con los valores nuevos."""
    num_wildcard = r"\$\d[\d.]*"
    pattern = num_wildcard.join(re.escape(p) for p in parts)
    new_full = parts[0] + "".join(f"${v}{parts[i + 1]}" for i, v in enumerate(values))
    return sub_required(pattern, lambda m: new_full, text, label)


def calc_block(text, category, kv_pairs, label):
    block_pattern = rf"({re.escape(category)}:\s*\{{)(.*?)(\n\s*\}})"
    m = re.search(block_pattern, text, re.DOTALL)
    if not m:
        raise SystemExit(f"[FALLO] no encontre el bloque '{category}' ({label})")
    block = m.group(2)
    for key, val in kv_pairs:
        block, n = re.subn(rf"('{re.escape(key)}':\s*)\d+", rf"\g<1>{val}", block)
        if n != 1:
            raise SystemExit(
                f"[FALLO] clave '{key}' matcheo {n} veces dentro de '{category}' ({label}), deberia ser 1"
            )
    return text[: m.start()] + m.group(1) + block + m.group(3) + text[m.end():]


def sync_index_html(text, p):
    # meta description (ES)
    text = sentence(
        text,
        ['content="Programador freelance en Buenos Aires, Argentina. Desarrollo web a medida: '
         'landing pages, sitios corporativos, e-commerce y apps. Precios desde ',
         '. Presupuestá tu proyecto hoy." />'],
        [fmt_ars(p["landing_ars"])],
        "index.html meta description ES",
    )

    # JSON-LD: 4 ofertas ARS
    offers = [
        ("Landing Page", "landing_ars"),
        ("Sitio Web Corporativo", "corp_ars"),
        ("E-Commerce", "ecommerce_ars"),
        ("Apps y Sistemas Internos", "apps_ars"),
    ]
    for service_type, key in offers:
        text = offer_block(text, service_type, p[key], fmt_ars(p[key]), "ARS", f"index.html JSON-LD {service_type}")

    # JSON-LD FAQ (ES, ARS x4)
    text = sentence(
        text,
        ['"text": "Depende del tipo de proyecto. Una landing page arranca desde ',
         ' ARS, un sitio web corporativo desde ', ' ARS, un e-commerce desde ',
         ' ARS y una app o sistema interno desde ',
         ' ARS. Podés simular tu presupuesto en la sección de Presupuestos."'],
        [fmt_ars(p["landing_ars"]), fmt_ars(p["corp_ars"]), fmt_ars(p["ecommerce_ars"]), fmt_ars(p["apps_ars"])],
        "index.html JSON-LD FAQ ES",
    )

    # tarjetas de servicio visibles (ES, ARS)
    for i18n_key, key in [("price.landing", "landing_ars"), ("price.corp", "corp_ars"),
                            ("price.ecommerce", "ecommerce_ars"), ("price.apps", "apps_ars")]:
        text = sentence(
            text,
            [f'data-i18n="{i18n_key}">Desde <span>', ' ARS</span></p>'],
            [fmt_ars(p[key])],
            f"index.html tarjeta {i18n_key}",
        )

    # simulador subtitle (ES)
    text = sentence(
        text,
        ['data-i18n="sim.subtitle">¿Cuánto cuesta una página web? Depende del tipo de proyecto: '
         'los precios arrancan desde ', ' ARS. Seleccioná el tipo de servicio y obtené un presupuesto al instante.</p>'],
        [fmt_ars(p["landing_ars"])],
        "index.html sim.subtitle ES",
    )

    # faq.precio.a visible (ES)
    text = sentence(
        text,
        ['data-i18n="faq.precio.a">Depende del tipo de proyecto. Una landing page arranca desde ',
         ' ARS, un sitio web corporativo desde ', ' ARS, un e-commerce desde ', ' ARS y una app o '
         'sistema interno desde ', ' ARS. Podés simular tu presupuesto más arriba.</p>'],
        [fmt_ars(p["landing_ars"]), fmt_ars(p["corp_ars"]), fmt_ars(p["ecommerce_ars"]), fmt_ars(p["apps_ars"])],
        "index.html faq.precio.a ES",
    )

    # diccionario EN embebido (comillas simples)
    for i18n_key, key in [("price.landing", "landing_usd"), ("price.corp", "corp_usd"),
                            ("price.ecommerce", "ecommerce_usd"), ("price.apps", "apps_usd")]:
        text = sentence(
            text,
            [f"\"{i18n_key}\": 'From <span>", " USD</span>',"],
            [str(p[key])],
            f"index.html EN dict {i18n_key}",
        )

    text = sentence(
        text,
        ['"sim.subtitle": "How much does a website cost? It depends on the project type: prices start from ',
         ' USD. Select the service type and get an instant estimate.",'],
        [str(p["landing_usd"])],
        "index.html EN sim.subtitle",
    )

    text = sentence(
        text,
        ['"faq.precio.a": "It depends on the project type. A landing page starts from ',
         ' USD, a corporate website from ', ' USD, an e-commerce store from ', ' USD, and an app '
         'or internal system from ', ' USD. You can run the simulator above.",'],
        [str(p["landing_usd"]), str(p["corp_usd"]), str(p["ecommerce_usd"]), str(p["apps_usd"])],
        "index.html EN faq.precio.a",
    )

    return text


def sync_en_index_html(text, p):
    # meta description (EN)
    text = sentence(
        text,
        ['content="Freelance web developer based in Buenos Aires, Argentina, working remotely with '
         'clients in the US. Custom landing pages, corporate websites, e-commerce and apps. Prices from ',
         '. Get an instant quote." />'],
        [str(p["landing_usd"])],
        "en/index.html meta description EN",
    )

    offers = [
        ("Landing Page", "landing_usd"),
        ("Corporate Website", "corp_usd"),
        ("E-Commerce", "ecommerce_usd"),
        ("Apps & Internal Systems", "apps_usd"),
    ]
    for service_type, key in offers:
        text = offer_block(text, service_type, p[key], str(p[key]), "USD", f"en/index.html JSON-LD {service_type}")

    text = sentence(
        text,
        ['"text": "It depends on the project type. A landing page starts from ',
         ' USD, a corporate website from ', ' USD, an e-commerce store from ', ' USD, and an app '
         'or internal system from ', ' USD. You can run the simulator further down the page."'],
        [str(p["landing_usd"]), str(p["corp_usd"]), str(p["ecommerce_usd"]), str(p["apps_usd"])],
        "en/index.html JSON-LD FAQ EN",
    )

    for i18n_key, key in [("price.landing", "landing_usd"), ("price.corp", "corp_usd"),
                            ("price.ecommerce", "ecommerce_usd"), ("price.apps", "apps_usd")]:
        text = sentence(
            text,
            [f'data-i18n="{i18n_key}">From <span>', ' USD</span></p>'],
            [str(p[key])],
            f"en/index.html tarjeta EN {i18n_key}",
        )

    text = sentence(
        text,
        ['data-i18n="sim.subtitle">How much does a website cost? It depends on the project type: '
         'prices start from ', ' USD. Select the service type and get an instant estimate.</p>'],
        [str(p["landing_usd"])],
        "en/index.html sim.subtitle EN",
    )

    text = sentence(
        text,
        ['data-i18n="faq.precio.a">It depends on the project type. A landing page starts from ',
         ' USD, a corporate website from ', ' USD, an e-commerce store from ', ' USD, and an app '
         'or internal system from ', ' USD. You can run the simulator above.</p>'],
        [str(p["landing_usd"]), str(p["corp_usd"]), str(p["ecommerce_usd"]), str(p["apps_usd"])],
        "en/index.html faq.precio.a EN",
    )

    # diccionario ES embebido (comillas dobles) -- version que se ve al togglear a ES desde /en
    for i18n_key, key in [("price.landing", "landing_ars"), ("price.corp", "corp_ars"),
                            ("price.ecommerce", "ecommerce_ars"), ("price.apps", "apps_ars")]:
        text = sentence(
            text,
            [f'"{i18n_key}": "Desde <span>', ' ARS</span>",'],
            [fmt_ars(p[key])],
            f"en/index.html ES dict {i18n_key}",
        )

    text = sentence(
        text,
        ['"sim.subtitle": "¿Cuánto cuesta una página web? Depende del tipo de proyecto: los precios '
         'arrancan desde ', ' ARS. Seleccioná el tipo de servicio y obtené un presupuesto al instante.",'],
        [fmt_ars(p["landing_ars"])],
        "en/index.html ES sim.subtitle",
    )

    text = sentence(
        text,
        ['"faq.precio.a": "Depende del tipo de proyecto. Una landing page arranca desde ',
         ' ARS, un sitio web corporativo desde ', ' ARS, un e-commerce desde ', ' ARS y una app o '
         'sistema interno desde ', ' ARS. Podés simular tu presupuesto más arriba.",'],
        [fmt_ars(p["landing_ars"]), fmt_ars(p["corp_ars"]), fmt_ars(p["ecommerce_ars"]), fmt_ars(p["apps_ars"])],
        "en/index.html ES faq.precio.a",
    )

    text = sentence(
        text,
        ['var DESC_ES = "Programador freelance en Buenos Aires, Argentina. Desarrollo web a medida: '
         'landing pages, sitios corporativos, e-commerce y apps. Precios desde ',
         '. Presupuestá tu proyecto hoy.";'],
        [fmt_ars(p["landing_ars"])],
        "en/index.html DESC_ES",
    )

    text = sentence(
        text,
        ['var DESC_EN = "Freelance web developer based in Buenos Aires, Argentina, working remotely '
         'with clients in the US. Custom landing pages, corporate websites, e-commerce and apps. '
         'Prices from ', '. Get an instant quote.";'],
        [str(p["landing_usd"])],
        "en/index.html DESC_EN",
    )

    return text


def sync_javascript_js(text, p):
    text = calc_block(text, "programacion", [
        ("landing-replica", p["calc_prog_landing_replica"]),
        ("landing-nueva", p["calc_prog_landing_nueva"]),
        ("one-page", p["calc_prog_one_page"]),
        ("web-institucional", p["calc_prog_web_institucional"]),
        ("web-woocommerce", p["calc_prog_web_woocommerce"]),
    ], "javascript.js")

    text = calc_block(text, "diseno", [
        ("landing-replica", p["calc_diseno_landing_replica"]),
        ("landing-nueva", p["calc_diseno_landing_nueva"]),
        ("one-page-funnel", p["calc_diseno_one_page_funnel"]),
        ("web-institucional", p["calc_diseno_web_institucional"]),
        ("web-compleja", p["calc_diseno_web_compleja"]),
    ], "javascript.js")

    text = calc_block(text, "plantilla", [
        ("landing-plantilla", p["calc_plantilla_landing"]),
        ("one-page-plantilla", p["calc_plantilla_one_page"]),
        ("web-institucional-plantilla", p["calc_plantilla_web_institucional"]),
        ("web-woocommerce-plantilla", p["calc_plantilla_web_woocommerce"]),
    ], "javascript.js")

    text = calc_block(text, "apps", [
        ("movil-basico", p["calc_apps_movil_basico"]),
        ("movil-database", p["calc_apps_movil_database"]),
        ("movil-compleja", p["calc_apps_movil_compleja"]),
        ("escritorio-basico", p["calc_apps_escritorio_basico"]),
        ("escritorio-profesional", p["calc_apps_escritorio_profesional"]),
    ], "javascript.js")

    return text


FILES = [
    ("index.html", sync_index_html),
    ("en/index.html", sync_en_index_html),
    ("javascript.js", sync_javascript_js),
]


def main():
    check_only = "--check" in sys.argv
    precios = load_precios()
    any_change = False

    for rel_path, sync_fn in FILES:
        path = ROOT / rel_path
        before = path.read_text(encoding="utf-8")
        after = sync_fn(before, precios)
        if before == after:
            print(f"[sin cambios] {rel_path}")
            continue
        any_change = True
        diff = list(difflib.unified_diff(
            before.splitlines(), after.splitlines(),
            fromfile=rel_path, tofile=rel_path, lineterm="",
        ))
        print(f"[cambios] {rel_path} ({sum(1 for l in diff if l.startswith('+') and not l.startswith('+++'))} lineas)")
        for line in diff:
            print("  " + line)
        if not check_only:
            path.write_text(after, encoding="utf-8")

    if not any_change:
        print("\nprecios.xlsx ya coincide con los archivos -- nada para actualizar.")
    elif check_only:
        print("\n--check: no se escribio nada.")
    else:
        print("\nArchivos actualizados.")


if __name__ == "__main__":
    main()
