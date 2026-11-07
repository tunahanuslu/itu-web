#!/usr/bin/env python3
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
SRC_DIR = ROOT / "src"
DIST_DIR = ROOT / "dist"

def main():
    start_time = datetime.now()

    # 1. dist/ Dizinini Sıfırdan Hazırla
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)

    # 2. Statik Kaynakları (CSS, Varlıklar) Kopyala
    if (SRC_DIR / "assets").exists():
        shutil.copytree(SRC_DIR / "assets", DIST_DIR / "assets")

    # 3. Kök Yapılandırmalarını Kopyala (.htaccess ve robots.txt)
    for conf in [".htaccess", "robots.txt"]:
        if (SRC_DIR / conf).exists():
            shutil.copy(SRC_DIR / conf, DIST_DIR / conf)

    # 4. Şablonu Oku
    with open(SRC_DIR / "templates" / "base.html", "r", encoding="utf-8") as f:
        base_template = f.read()

    # 5. Sayfaları Derle
    pages = [
        {"file": "index.html", "out": DIST_DIR / "index.html", "title": "Yusuf Tunahan", "base": "./"},
        {"file": "404.html", "out": DIST_DIR / "404.html", "title": "404 — Yusuf Tunahan", "base": "./"},
    ]

    for p in pages:
        with open(SRC_DIR / "pages" / p["file"], "r", encoding="utf-8") as f:
            content = f.read()

        rendered = base_template
        rendered = rendered.replace("{{PAGE_TITLE}}", p["title"])
        rendered = rendered.replace("{{CONTENT}}", content)
        rendered = rendered.replace("{{BASE_PATH}}", p["base"])
        rendered = rendered.replace("{{YEAR}}", str(datetime.now().year))

        with open(p["out"], "w", encoding="utf-8") as f:
            f.write(rendered)

    duration = (datetime.now() - start_time).total_seconds() * 1000
    print(f">>> [BUILD] Tamamlandı! Sayfalar {duration:.2f} ms içinde derlendi -> dist/")

if __name__ == "__main__":
    main()
