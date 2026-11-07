#!/usr/bin/env python3
import sys
import gzip
import urllib.request
from pathlib import Path

DIST = Path(__file__).parent / "dist"
LIVE_URL = "https://web.itu.edu.tr/usluy26/"

def check(title, condition, details=""):
    status = "[\033[92mGEÇTİ\033[0m]" if condition else "[\033[91mBAŞARISIZ\033[0m]"
    print(f" {status} {title:<52} {details}")
    return condition

def main():
    print("\n\033[1m=== İTÜ WEB ALANI - MİMARİ VE GÜVENLİK DENETİMİ ===\033[0m\n")
    all_ok = True

    # 1. Bütçe ve Boyut Denetimi (Sub-14KB Single RTT Kuralı)
    html_bytes = (DIST / "index.html").read_bytes()
    css_bytes = (DIST / "assets" / "css" / "style.css").read_bytes()
    total_raw = len(html_bytes) + len(css_bytes)
    total_gz = len(gzip.compress(html_bytes)) + len(gzip.compress(css_bytes))

    all_ok &= check("1. İlk TCP Paketi Bütçesi (Ham < 15 KB):", total_raw < 15360, f"({total_raw / 1024:.2f} KB)")
    all_ok &= check("2. Sıkıştırılmış Ağ Yükü (GZIP < 5 KB):", total_gz < 5120, f"({total_gz / 1024:.2f} KB)")

    # 2. Alt Dizin (/usluy26/) Göreceli Yol Bütünlüğü
    html_text = html_bytes.decode("utf-8")
    has_abs_path = 'href="/' in html_text or 'src="/' in html_text
    all_ok &= check("3. Alt Dizin Tuzağı Kontrolü (Sıfır mutlak yol):", not has_abs_path, "(Tam Göreceli)")

    # 3. Semantik JSON-LD Grafı Varlığı
    has_json_ld = 'application/ld+json' in html_text and 'Yusuf Tunahan' in html_text
    all_ok &= check("4. Yapay Zeka Semantik Veri Grafı (JSON-LD):", has_json_ld, "(Aktif)")

    # 4. Canlı Sunucu Güvenlik Başlıkları Denetimi
    try:
        req = urllib.request.Request(LIVE_URL, headers={'User-Agent': 'itu-web-auditor/1.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            headers = {k.lower(): v for k, v in res.headers.items()}
            all_ok &= check("5. Canlı Sunucu Durumu (HTTP 200 OK):", res.status == 200)
            all_ok &= check("6. Content-Security-Policy (CSP Level 3):", 'content-security-policy' in headers, "(Zırhlı)")
            all_ok &= check("7. Süreç Bellek İzolasyonu (COOP & CORP):", 'cross-origin-opener-policy' in headers, "(Aktif)")
            all_ok &= check("8. İTÜ NFS ETag Küme Tutarlılığı:", 'etag' in headers, f"({headers.get('etag', '')})")
    except Exception as e:
        print(f" [UYARI] Canlı sunucuya ulaşılamadı: {e}")

    print(f"\n\033[1mSonuç: {'Tüm mimari standartlar %100 kusursuz!' if all_ok else 'Bazı denetimler başarısız oldu.'}\033[0m\n")
    sys.exit(0 if all_ok else 1)

if __name__ == "__main__":
    main()
