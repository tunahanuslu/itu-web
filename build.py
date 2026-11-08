#!/usr/bin/env python3
import json
import re
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
SRC_DIR = ROOT / "src"
DIST_DIR = ROOT / "dist"

def main():
    start_time = datetime.now()

    # 1. dist/ Dizinini Sıfırla
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    # 2. Statik Kaynakları Kopyala
    if (SRC_DIR / "assets").exists():
        shutil.copytree(SRC_DIR / "assets", DIST_DIR / "assets")

    # 3. İleri Düzey CSS Minifier
    css_dist = DIST_DIR / "assets" / "css" / "style.css"
    if css_dist.exists():
        raw_css = css_dist.read_text(encoding="utf-8")
        min_css = re.sub(r"/\*.*?\*/", "", raw_css, flags=re.DOTALL)
        min_css = re.sub(r"\s+", " ", min_css)
        min_css = re.sub(r"\s*([\{\}\:\;\,])\s*", r"\1", min_css)
        min_css = re.sub(r";\}", "}", min_css)
        min_css = re.sub(r"(?<=[\s:(,-])0\.(\d+)", r".\1", min_css)
        min_css = re.sub(r"\b0(px|rem|em|pt|%)\b", "0", min_css)
        css_dist.write_text(min_css.strip(), encoding="utf-8")

    # 4. Kök Dosyaları Kopyala
    for conf in [".htaccess", "robots.txt", "sw.js", "manifest.webmanifest"]:
        if (SRC_DIR / conf).exists():
            shutil.copy(SRC_DIR / conf, DIST_DIR / conf)

    # 5. Sayfaları Derle & Minify Et
    with open(SRC_DIR / "templates" / "base.html", "r", encoding="utf-8") as f:
        base_template = f.read()

    pages = [
        {"file": "index.html", "out": DIST_DIR / "index.html", "title": "Yusuf Tunahan", "base": "./"},
        {"file": "404.html", "out": DIST_DIR / "404.html", "title": "404 — Yusuf Tunahan", "base": "./"},
    ]

    def min_json(m, tag):
        try:
            d = json.loads(m.group(1))
            return f'<script type="{tag}">{json.dumps(d, separators=(",", ":"))}</script>'
        except Exception:
            return m.group(0)

    for p in pages:
        with open(SRC_DIR / "pages" / p["file"], "r", encoding="utf-8") as f:
            content = f.read()

        rendered = base_template
        rendered = rendered.replace("{{PAGE_TITLE}}", p["title"])
        rendered = rendered.replace("{{CONTENT}}", content)
        rendered = rendered.replace("{{BASE_PATH}}", p["base"])
        rendered = rendered.replace("{{YEAR}}", str(datetime.now().year))

        rendered = re.sub(r'<script type="application/ld\+json">(.*?)</script>', lambda m: min_json(m, 'application/ld+json'), rendered, flags=re.DOTALL)
        rendered = re.sub(r'<script type="speculationrules">(.*?)</script>', lambda m: min_json(m, 'speculationrules'), rendered, flags=re.DOTALL)
        rendered = re.sub(r"<!--(?!\s*\[if).*?-->", "", rendered, flags=re.DOTALL)
        rendered = re.sub(r">\s+<", "><", rendered)
        rendered = re.sub(r"[ \t]+", " ", rendered)

        with open(p["out"], "w", encoding="utf-8") as f:
            f.write(rendered.strip())

    duration = (datetime.now() - start_time).total_seconds() * 1000
    print(f">>> [BUILD] Tamamlandı! Varlıklar ve sayfalar {duration:.2f} ms içinde derlendi -> dist/")

if __name__ == "__main__":
    main()
