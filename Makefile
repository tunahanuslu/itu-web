.PHONY: help build serve preview deploy clean

help:
	@echo "İTÜ Web Karargâhı - Operasyon Yönetimi:"
	@echo "  make build    : Verileri ve şablonları dist/ klasörüne derler"
	@echo "  make serve    : Yerelde (localhost:8000) canlı test sunucusu başlatır"
	@echo "  make preview  : Sunucuya aktarılacak dosyaların simülasyonunu yapar (dry-run)"
	@echo "  make deploy   : dist/ klasörünü İTÜ sunucusuna senkronize eder"
	@echo "  make clean    : Derlenen dist/ klasörünü temizler"

build:
	@python3 build.py

serve: build
	@echo ">>> Canlı önizleme: http://localhost:8000"
	@python3 -m http.server 8000 --directory dist

preview: build
	@echo ">>> [DRY-RUN] Sunucuya gidecek dosyalar simüle ediliyor:"
	@rsync -avzn --delete -e ssh dist/ usluy26@ssh.itu.edu.tr:web.itu.edu.tr/public_html/

deploy: build
	@echo ">>> [DEPLOY] İTÜ sunucusuna canlıya aktarılıyor..."
	@rsync -avz --delete -e ssh dist/ usluy26@ssh.itu.edu.tr:web.itu.edu.tr/public_html/
	@echo ">>> [BAŞARILI] Siteniz güncellendi!"

clean:
	@rm -rf dist
	@echo ">>> dist/ temizlendi."

audit: build
	@python3 audit.py
