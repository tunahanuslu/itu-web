#!/usr/bin/env python3
import json
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
SRC_DIR = ROOT / "src"
DIST_DIR = ROOT / "dist"

def render_projects(projects, featured_only=False):
    html = ['<div class="grid">']
    items = projects[:2] if featured_only else projects
    for p in items:
        tags = "".join(f'<span class="tag-item">{t}</span>' for t in p.get("tags", []))
        html.append(f'''
        <div class="card">
            <div class="card-title">{p["title"]}</div>
            <div class="card-desc">{p["description"]}</div>
            <div class="tags">{tags}</div>
        </div>
        ''')
    html.append('</div>')
    return "\n".join(html)

def main():
    print(">>> [BUILD] Derleme süreci başladı...")
    start_time = datetime.now()

    # 1. Verileri Oku
    with open(DATA_DIR / "profile.json", "r", encoding="utf-8") as f:
        profile = json.load(f)
    with open(DATA_DIR / "projects.json", "r", encoding="utf-8") as f:
        projects = json.load(f)
    with open(SRC_DIR / "templates" / "base.html", "r", encoding="utf-8") as f:
        base_template = f.read()

    # 2. Temizle & Çıktı Dizinlerini Hazırla
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)
    (DIST_DIR / "projeler").mkdir()
    (DIST_DIR / "notlar").mkdir()
    (DIST_DIR / "kimlik").mkdir()

    # 3. Statik Kaynakları (CSS / IMG) Taşı
    shutil.copytree(SRC_DIR / "assets", DIST_DIR / "assets")

    # 4. Sayfaları Derle (Strict Relative Paths)
    pages = [
        {"file": "index.html", "out": DIST_DIR / "index.html", "title": "Karargâh", "base": "./", "nav": "NAV_HOME"},
        {"file": "projeler.html", "out": DIST_DIR / "projeler" / "index.html", "title": "Projeler", "base": "../", "nav": "NAV_PROJ"},
        {"file": "notlar.html", "out": DIST_DIR / "notlar" / "index.html", "title": "Notlar", "base": "../", "nav": "NAV_NOTLAR"},
        {"file": "kimlik.html", "out": DIST_DIR / "kimlik" / "index.html", "title": "Kimlik", "base": "../", "nav": "NAV_KIMLIK"},
    ]

    for p in pages:
        with open(SRC_DIR / "pages" / p["file"], "r", encoding="utf-8") as f:
            content = f.read()

        # İçerik Alanlarını Değiştir
        content = content.replace("{{FEATURED_PROJECTS}}", render_projects(projects, featured_only=True))
        content = content.replace("{{PROJECTS_LIST}}", render_projects(projects, featured_only=False))
        content = content.replace("{{EMAIL}}", profile["links"]["email"])
        content = content.replace("{{OS}}", profile["os"])
        content = content.replace("{{INSTITUTION}}", profile["institution"])
        content = content.replace("{{STATUS}}", profile["status"])
        content = content.replace("{{BASE_PATH}}", p["base"])

        # Base Şablonu Giydir
        rendered = base_template
        for key, val in profile.items():
            if isinstance(val, str):
                rendered = rendered.replace(f"{{{{{key.upper()}}}}}", val)
        
        rendered = rendered.replace("{{TITLE}}", p["title"])
        rendered = rendered.replace("{{CONTENT}}", content)
        rendered = rendered.replace("{{BASE_PATH}}", p["base"])
        rendered = rendered.replace("{{YEAR}}", str(datetime.now().year))
        
        # Aktif Navigasyon Sınıfı
        for nav_key in ["NAV_HOME", "NAV_PROJ", "NAV_NOTLAR", "NAV_KIMLIK"]:
            rendered = rendered.replace(f"{{{{{nav_key}}}}}", "active" if nav_key == p["nav"] else "")

        with open(p["out"], "w", encoding="utf-8") as f:
            f.write(rendered)

    duration = (datetime.now() - start_time).total_seconds() * 1000
    print(f">>> [BUILD] Başarılı! Tüm sayfalar {duration:.2f} ms içinde derlendi -> dist/")

if __name__ == "__main__":
    main()
